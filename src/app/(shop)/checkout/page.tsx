"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Icon } from "@/components/ui/icon";
import { cn, formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/cart-store";
import { useToast } from "@/components/ui/use-toast";

interface Address {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  detail: string | null;
  district?: string;
  city: string;
  province: string;
  postalCode: string;
  isDefault: boolean;
}

interface ShippingOption {
  courier: string;
  courierName?: string;
  service: string;
  cost: number;
  etd: string;
}

const paymentMethods = [
  { id: "qris", name: "QRIS", desc: "GoPay, OVO, ShopeePay, DANA", badge: "Verifikasi Otomatis", icon: "qr_code" },
  { id: "bank_transfer", name: "Transfer Virtual Account (VA)", desc: "BCA, Mandiri, BRI, BNI", badge: null, icon: "account_balance" },
  { id: "credit_card", name: "Kartu Kredit / Debit Online", desc: "Visa • Mastercard • JCB", badge: null, icon: "credit_card" },
  { id: "cicilan", name: "Cicilan / PayLater", desc: "Bunga 0% s.d 3 Bulan", badge: "Promo", icon: "payments" },
];

/** Ubah error API (string / fieldErrors zod) jadi pesan yang bisa dibaca user. */
function errorMessage(error: unknown): string {
  if (typeof error === "string" && error.trim()) return error;
  if (error && typeof error === "object") {
    const parts = Object.values(error as Record<string, unknown>)
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .filter((value): value is string => typeof value === "string");
    if (parts.length > 0) return parts.join(", ");
  }
  return "Terjadi kesalahan. Silakan coba lagi.";
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, totalWeight, clearCart, hydrate, serverCart, isSyncing } = useCartStore();
  const { toast } = useToast();

  const [ready, setReady] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [step, setStep] = useState(1);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShipping, setSelectedShipping] = useState(0);
  const [selectedPayment, setSelectedPayment] = useState("qris");
  const [notes, setNotes] = useState("");
  const [loadingAddr, setLoadingAddr] = useState(true);
  const [loadingShip, setLoadingShip] = useState(false);
  const [shippingError, setShippingError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [insuranceChecked, setInsuranceChecked] = useState(true);

  const fetchAddresses = useCallback(async () => {
    setLoadingAddr(true);
    setError("");
    try {
      const res = await fetch("/api/user/addresses", { cache: "no-store" });
      if (res.status === 401) { setNeedsLogin(true); return; }
      if (!res.ok) throw new Error("Gagal memuat alamat pengiriman.");
      const data = await res.json();
      const list: Address[] = data?.addresses ?? [];
      setAddresses(list);
      const preferred = list.find((a) => a.isDefault) ?? list[0];
      if (preferred) setSelectedAddress(preferred.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat alamat pengiriman.");
    } finally {
      setLoadingAddr(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void hydrate().then(() => {
      if (!cancelled) setReady(true);
    });
    // Cart dan alamat independen; ambil bersamaan agar alamat tidak menunggu cart.
    void fetchAddresses();
    return () => { cancelled = true; };
  }, [hydrate, fetchAddresses]);


  useEffect(() => {
    if (ready && items.length === 0) router.replace("/cart");
  }, [ready, items.length, router]);

  const fetchShipping = useCallback(
    async (address: Address) => {
      setLoadingShip(true);
      setShippingError("");
      try {
        const weight = totalWeight() > 0 ? Math.round(totalWeight()) : 1000;
        const res = await fetch("/api/shipping/cost", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ destinationCity: address.city, weight }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(errorMessage(data?.error));
        const raw: ShippingOption[] = data?.results ?? data?.costs ?? [];
        const options = raw.filter((opt) => opt && typeof opt.cost === "number");
        setShippingOptions(options);
        setSelectedShipping(0);
        if (options.length === 0) setShippingError("Tidak ada opsi pengiriman untuk kota ini.");
      } catch (e) {
        setShippingOptions([]);
        setShippingError(e instanceof Error ? e.message : "Gagal memuat ongkos kirim.");
      } finally {
        setLoadingShip(false);
      }
    },
    [totalWeight]
  );

  useEffect(() => {
    if (step !== 2) return;
    const address = addresses.find((a) => a.id === selectedAddress);
    if (!address) return;
    void fetchShipping(address);
  }, [step, selectedAddress, addresses, fetchShipping]);

  async function submitOrder() {
    const option = shippingOptions[selectedShipping];
    if (!selectedAddress) { toast({ variant: "destructive", title: "Alamat belum dipilih" }); setStep(1); return; }
    if (!option) { toast({ variant: "destructive", title: "Kurir belum dipilih" }); setStep(2); return; }
    if (!selectedPayment) { toast({ variant: "destructive", title: "Metode pembayaran belum dipilih" }); return; }

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingAddressId: selectedAddress,
          shippingCourier: option.courier,
          shippingService: option.service,
          shippingCost: Number(option.cost) || 0,
          shippingEtd: option.etd || undefined,
          paymentMethod: selectedPayment,
          couponCode: serverCart?.coupon && !serverCart.couponError ? serverCart.coupon.code : "",
          notes: notes.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const message = errorMessage(data?.error);
        setError(message);
        toast({ variant: "destructive", title: "Gagal membuat pesanan", description: message });
        return;
      }
      const orderNumber: string | undefined = data?.orderNumber ?? data?.order?.orderNumber;
      if (!orderNumber) {
        throw new Error("Nomor pesanan tidak diterima dari server.");
      }

      clearCart();
      if (data?.couponWarning) {
        toast({ title: "Pesanan dibuat tanpa diskon", description: String(data.couponWarning) });
      } else {
        toast({ title: "Pesanan berhasil dibuat", description: `Nomor pesanan ${orderNumber}` });
      }

      // Buat invoice gateway segera setelah order tersimpan.
      // Untuk Mayar, buka hosted checkout langsung; jangan berhenti di halaman
      // "pesanan selesai" tanpa halaman pembayaran.
      const paymentResponse = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber }),
      });
      const paymentData = await paymentResponse.json().catch(() => null) as {
        provider?: string;
        paymentUrl?: string;
        redirectUrl?: string;
      } | null;

      const paymentUrl = paymentData?.paymentUrl ?? paymentData?.redirectUrl;
      if (paymentResponse.ok && paymentUrl) {
        if (paymentData?.provider === "mayar") {
          router.push(`/orders/${orderNumber}?payment=embed`);
        } else {
          window.location.assign(paymentUrl);
        }
        return;
      }

      // Fallback aman: order tetap bisa dibayar dari halaman detail pesanan.
      if (!paymentResponse.ok) {
        toast({
          variant: "destructive",
          title: "Order dibuat, pembayaran belum dimulai",
          description: "Buka detail pesanan untuk mencoba pembayaran lagi.",
        });
      }
      router.push(`/orders/${orderNumber}`);
    } catch {
      const message = "Gagal membuat pesanan. Periksa koneksi internet Anda.";
      setError(message);
      toast({ variant: "destructive", title: "Gagal membuat pesanan", description: message });
    } finally {
      setSubmitting(false);
    }
  }

  if (needsLogin) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Silakan Login</h1>
        <p className="mt-2 text-muted-foreground">Anda perlu login untuk checkout.</p>
        <Link href="/login"><Button className="mt-4">Login</Button></Link>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="h-8 w-48 animate-pulse rounded bg-secondary" />
        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          <div className="h-64 animate-pulse rounded-xl bg-secondary lg:col-span-8" />
          <div className="h-64 animate-pulse rounded-xl bg-secondary lg:col-span-4" />
        </div>
      </div>
    );
  }

  if (items.length === 0) return null;

  const selectedOption = shippingOptions[selectedShipping];
  const subtotal = serverCart ? serverCart.subtotal : totalPrice();
  const discount = serverCart ? serverCart.discount : 0;
  const shippingCost = selectedOption?.cost ?? 0;
  const insuranceCost = insuranceChecked ? 10000 : 0;
  const total = Math.max(0, subtotal - discount) + shippingCost + insuranceCost;
  const addr = addresses.find((a) => a.id === selectedAddress);
  const canSubmit = Boolean(selectedAddress) && Boolean(selectedOption) && !submitting;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* 3-Step Progress Bar */}
      <div className="mb-6 flex items-center justify-between">
        {/* Step 1: Done */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon name="check" size={16} className="font-bold" />
          </div>
          <span className="text-xs font-semibold text-foreground sm:text-sm">1. Keranjang</span>
        </div>
        <div className="mx-4 h-0.5 flex-1 bg-primary" />
        {/* Step 2: Active */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground shadow-md ring-4 ring-primary/10">
            2
          </div>
          <span className="text-xs font-bold text-primary sm:text-sm">2. Pengiriman &amp; Bayar</span>
        </div>
        <div className="mx-4 h-0.5 flex-1 bg-border" />
        {/* Step 3: Pending */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary font-bold text-muted-foreground">
            3
          </div>
          <span className="text-xs font-medium text-muted-foreground sm:text-sm">3. Pesanan Selesai</span>
        </div>
      </div>

      {isSyncing && (
        <div className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Icon name="progress_activity" size={12} className="animate-spin" /> Menyinkronkan keranjang...
        </div>
      )}

      {error && (
        <p className="mb-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <Icon name="info" size={16} className="mt-0.5 shrink-0" /> {error}
        </p>
      )}

      {/* Main Grid */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Column */}
        <div className="space-y-6 lg:col-span-8">
          {/* Step 1: Address */}
          {step === 1 && (
            <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon name="location_on" size={16} />
                  </div>
                  <h2 className="text-base font-bold tracking-tight">Alamat Pengiriman</h2>
                </div>
                <div className="flex items-center gap-2">
                  <Link href="/account/addresses/new">
                    <Button variant="secondary" size="sm" className="text-xs font-bold">
                      + Tambah Baru
                    </Button>
                  </Link>
                </div>
              </div>

              {loadingAddr ? (
                <div className="h-32 animate-pulse rounded-xl bg-secondary" />
              ) : addresses.length === 0 ? (
                <div className="rounded-xl border border-dashed p-8 text-center">
                  <p className="text-muted-foreground">Belum ada alamat tersimpan.</p>
                  <Link href="/account/addresses/new">
                    <Button variant="secondary" size="sm" className="mt-3">+ Tambah Alamat</Button>
                  </Link>
                </div>
              ) : (
                <>
                  {addresses.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => setSelectedAddress(a.id)}
                      className={cn(
                        "mb-3 w-full rounded-xl border-2 p-4 text-left transition-colors",
                        selectedAddress === a.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                      )}
                    >
                      <div className="mb-1.5 flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold">{a.recipientName}</span>
                        <span className="text-xs font-medium text-muted-foreground">({a.phone})</span>
                        {a.isDefault && (
                          <span className="rounded-md bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                            Utama
                          </span>
                        )}
                        <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                          {a.label}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {a.detail ? `${a.detail}, ` : ""}{a.city}, {a.province} {a.postalCode}
                      </p>
                      {selectedAddress === a.id && (
                        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                          <span className="flex items-center gap-1.5 text-xs text-primary">
                            <Icon name="check_circle" size={14} className="text-primary" />
                            Alamat terpilih
                          </span>
                        </div>
                      )}
                    </button>
                  ))}

                  {/* Notes */}
                  <div className="mt-4">
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-foreground">
                      Catatan untuk Kurir (Opsional)
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Misal: Taruh di dekat tandon nutrisi, hubungi sebelum sampai..."
                      className="w-full rounded-lg border border-border bg-secondary/70 px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="pt-4">
                    <Button onClick={() => setStep(2)} disabled={!selectedAddress}>
                      Lanjut ke Pengiriman <Icon name="chevron_right" size={16} className="ml-1" />
                    </Button>
                  </div>
                </>
              )}
            </section>
          )}

          {/* Step 2: Shipping */}
          {step === 2 && (
            <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon name="local_shipping" size={16} />
                  </div>
                  <h2 className="text-base font-bold tracking-tight">Pilih Ekspedisi / Kurir</h2>
                </div>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">Proteksi Pengiriman</span>
              </div>

              <p className="mb-4 text-sm text-muted-foreground">
                Ongkir ke {addr?.city ?? "-"} — {totalWeight() > 0 ? `${Math.round(totalWeight())}g` : "1kg (default)"}
              </p>

              {loadingShip ? (
                <div className="grid gap-3 md:grid-cols-3">
                  {[1, 2, 3].map((i) => <div key={i} className="h-32 animate-pulse rounded-xl bg-secondary" />)}
                </div>
              ) : shippingOptions.length === 0 ? (
                <div className="flex items-center justify-between rounded-xl border border-dashed p-4">
                  <p className="text-sm text-muted-foreground">{shippingError || "Tidak ada opsi pengiriman tersedia."}</p>
                  {addr && <Button variant="secondary" size="sm" onClick={() => fetchShipping(addr)}>Coba lagi</Button>}
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-3">
                  {shippingOptions.slice(0, 6).map((opt, i) => (
                    <button
                      key={`${opt.courier}-${opt.service}-${i}`}
                      onClick={() => setSelectedShipping(i)}
                      className={cn(
                        "flex flex-col rounded-xl border-2 p-4 text-left transition",
                        selectedShipping === i
                          ? "border-primary bg-primary/5 shadow-xs"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-bold">{(opt.courierName || opt.courier).toUpperCase()}</span>
                        <span
                          className={cn(
                            "flex h-4 w-4 items-center justify-center rounded-full border-2",
                            selectedShipping === i ? "border-primary" : "border-border"
                          )}
                        >
                          {selectedShipping === i && <span className="h-2 w-2 rounded-full bg-primary" />}
                        </span>
                      </div>
                      <div className="mb-2 text-xs text-muted-foreground">
                        {opt.service} — Estimasi <strong>{opt.etd || "-"}</strong>
                      </div>
                      <p className="mt-auto text-sm font-extrabold">{formatPrice(opt.cost)}</p>
                    </button>
                  ))}
                </div>
              )}

              {/* Insurance */}
              <div className="mt-4 rounded-xl border border-border bg-secondary/80 p-3.5">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={insuranceChecked}
                    onChange={(e) => setInsuranceChecked(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-xs text-foreground">
                    <span className="font-bold">Asuransi Kerusakan &amp; Proteksi Barang (Rp 10.000)</span>
                    <span className="mt-0.5 block leading-normal text-muted-foreground">
                      Garansi 100% penggantian barang baru atau pengembalian dana jika barang rusak dalam perjalanan.
                    </span>
                  </span>
                </label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="secondary" onClick={() => setStep(1)}>Kembali</Button>
                <Button onClick={() => setStep(3)} disabled={shippingOptions.length === 0 || !selectedOption}>
                  Lanjut ke Pembayaran <Icon name="chevron_right" size={16} className="ml-1" />
                </Button>
              </div>
            </section>
          )}

          {/* Step 3: Payment */}
          {step === 3 && (
            <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon name="credit_card" size={16} />
                  </div>
                  <h2 className="text-base font-bold tracking-tight">Pilih Metode Pembayaran</h2>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Icon name="verified_user" size={14} className="text-primary" />
                  <span>Aman &amp; Terenkripsi</span>
                </div>
              </div>

              <div className="space-y-3">
                {paymentMethods.map((m) => (
                  <label
                    key={m.id}
                    className={cn(
                      "block cursor-pointer rounded-xl border-2 p-4 transition",
                      selectedPayment === m.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="payment"
                          checked={selectedPayment === m.id}
                          onChange={() => setSelectedPayment(m.id)}
                          className="h-4 w-4 border-border text-primary focus:ring-primary"
                        />
                        <span className="text-sm font-bold">{m.name}</span>
                      </div>
                      {m.badge ? (
                        <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">{m.badge}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">{m.desc}</span>
                      )}
                    </div>
                    {m.badge && (
                      <div className="mt-2 pl-7 text-xs text-muted-foreground">{m.desc}</div>
                    )}
                  </label>
                ))}
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="secondary" onClick={() => setStep(2)}>Kembali</Button>
                <Button size="lg" className="flex-1 sm:flex-none" onClick={submitOrder} disabled={!canSubmit}>
                  <Icon name="lock" size={16} className="mr-2" />
                  {submitting ? "Memproses..." : `Bayar Sekarang (${formatPrice(total)})`}
                </Button>
              </div>
              <p className="mt-3.5 text-center text-[11px] leading-relaxed text-muted-foreground">
                Dengan mengklik &quot;Bayar Sekarang&quot;, Anda menyetujui{" "}
                <Link href="/terms" className="underline hover:text-primary">Syarat &amp; Ketentuan</Link> serta{" "}
                <Link href="/privacy" className="underline hover:text-primary">Kebijakan Privasi</Link> JagoFarm.
              </p>
            </section>
          )}
        </div>

        {/* Right Column: Order Summary */}
        <aside className="space-y-5 lg:col-span-4 lg:sticky lg:top-28">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="border-b border-border pb-3 text-base font-bold tracking-tight">
              Ringkasan Belanja
            </h2>

            {/* Coupon */}
            <div className="mb-5 mt-4">
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider">Kupon / Voucher Diskon</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Masukkan kode"
                    className="w-full rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                  {serverCart?.coupon && !serverCart.couponError && (
                    <div className="absolute right-2.5 top-3 text-primary">
                      <Icon name="check_circle" size={14} />
                    </div>
                  )}
                </div>
                <Button variant="secondary" size="sm" className="rounded-lg px-3.5">Terapkan</Button>
              </div>
              {serverCart?.coupon && !serverCart.couponError && discount > 0 && (
                <p className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-primary">
                  <Icon name="check_circle" size={14} className="shrink-0" />
                  Kupon aktif: Hemat {formatPrice(discount)}
                </p>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Harga ({items.length} Produk)</span>
                <span className="font-semibold">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Biaya Pengiriman{selectedOption ? ` (${(selectedOption.courierName || selectedOption.courier).toUpperCase()})` : ""}</span>
                <span className="font-semibold">{selectedOption ? formatPrice(shippingCost) : "-"}</span>
              </div>
              {insuranceChecked && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Asuransi Proteksi Barang</span>
                  <span className="font-semibold">{formatPrice(insuranceCost)}</span>
                </div>
              )}
              {discount > 0 && (
                <div className="flex justify-between font-semibold text-primary">
                  <span>Potongan Voucher{serverCart?.coupon ? ` (${serverCart.coupon.code})` : ""}</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
              <div className="border-t border-border pt-3" />
              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <span className="block text-sm font-bold">Total Tagihan</span>
                </div>
                <div className="text-right">
                  <span className="text-xl font-extrabold tracking-tight text-primary">{formatPrice(total)}</span>
                </div>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="mt-6 space-y-2.5 border-t border-border pt-5">
              <div className="flex items-center gap-2.5 text-xs">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon name="check" size={12} className="font-bold" />
                </div>
                <span className="font-medium">100% Garansi Barang Tiba Aman</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                  <Icon name="check" size={12} className="font-bold" />
                </div>
                <span className="font-medium">Garansi Resmi Produk</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon name="check" size={12} className="font-bold" />
                </div>
                <span className="font-medium">Konsultasi Gratis via Chat</span>
              </div>
            </div>
          </div>

          {/* Help Desk */}
          <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
                <Icon name="support_agent" size={18} />
              </div>
              <div>
                <p className="text-xs font-bold">Butuh Bantuan Checkout?</p>
                <p className="text-[11px] text-muted-foreground">Hubungi Tim JagoFarm</p>
              </div>
            </div>
            <span className="text-xs font-bold text-primary hover:underline">Chat WA</span>
          </div>
        </aside>
      </div>
    </div>
  );
}