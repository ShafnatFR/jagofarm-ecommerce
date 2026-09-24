"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin, Truck, CreditCard, ChevronRight, Check, Banknote, Wallet, QrCode,
  Loader2, AlertCircle,
} from "lucide-react";
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
  { id: "bank_transfer", name: "Transfer Bank", icon: Banknote, desc: "BCA, Mandiri, BNI, BRI" },
  { id: "ewallet", name: "E-Wallet", icon: Wallet, desc: "GoPay, OVO, Dana, ShopeePay" },
  { id: "qris", name: "QRIS", icon: QrCode, desc: "Bayar dengan scan QR" },
];

const steps = [
  { num: 1, label: "Alamat", icon: MapPin },
  { num: 2, label: "Pengiriman", icon: Truck },
  { num: 3, label: "Pembayaran", icon: CreditCard },
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
  const {
    items,
    totalPrice,
    totalWeight,
    clearCart,
    hydrate,
    serverCart,
    isSyncing,
  } = useCartStore();
  const { toast } = useToast();

  const [ready, setReady] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [step, setStep] = useState(1);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShipping, setSelectedShipping] = useState(0);
  const [selectedPayment, setSelectedPayment] = useState("bank_transfer");
  const [notes, setNotes] = useState("");
  const [loadingAddr, setLoadingAddr] = useState(true);
  const [loadingShip, setLoadingShip] = useState(false);
  const [shippingError, setShippingError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Cart server sebagai source of truth (untuk user login)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await hydrate();
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrate]);

  const fetchAddresses = useCallback(async () => {
    setLoadingAddr(true);
    setError("");
    try {
      const res = await fetch("/api/user/addresses", { cache: "no-store" });
      if (res.status === 401) {
        setNeedsLogin(true);
        return;
      }
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
    if (!ready) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- pola fetch alamat saat siap; setState ada di dalam fetchAddresses (bukan turunan render)
    void fetchAddresses();
  }, [ready, fetchAddresses]);

  // Keranjang kosong setelah hydrate -> kembali ke halaman cart
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
          // Kirim NAMA kota. RajaOngkir butuh city_id numerik — jangan kirim UUID alamat.
          body: JSON.stringify({ destinationCity: address.city, weight }),
        });

        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(errorMessage(data?.error));

        // Toleran terhadap dua bentuk respons: { results } (baru) dan { costs } (lama)
        const raw: ShippingOption[] = data?.results ?? data?.costs ?? [];
        const options = raw.filter((opt) => opt && typeof opt.cost === "number");

        setShippingOptions(options);
        setSelectedShipping(0);
        if (options.length === 0) {
          setShippingError("Tidak ada opsi pengiriman untuk kota ini.");
        }
      } catch (e) {
        setShippingOptions([]);
        setShippingError(
          e instanceof Error ? e.message : "Gagal memuat ongkos kirim."
        );
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- pola fetch ongkir saat alamat/step berubah; setState ada di dalam fetchShipping
    void fetchShipping(address);
  }, [step, selectedAddress, addresses, fetchShipping]);

  async function submitOrder() {
    const option = shippingOptions[selectedShipping];

    // Blokir submit kalau alamat / kurir / metode pembayaran belum dipilih
    if (!selectedAddress) {
      toast({
        variant: "destructive",
        title: "Alamat belum dipilih",
        description: "Pilih alamat pengiriman terlebih dahulu.",
      });
      setStep(1);
      return;
    }
    if (!option) {
      toast({
        variant: "destructive",
        title: "Kurir belum dipilih",
        description: "Pilih layanan pengiriman terlebih dahulu.",
      });
      setStep(2);
      return;
    }
    if (!selectedPayment) {
      toast({
        variant: "destructive",
        title: "Metode pembayaran belum dipilih",
        description: "Pilih metode pembayaran terlebih dahulu.",
      });
      setStep(3);
      return;
    }

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
          // WAJIB: nominal ongkir dari opsi yang dipilih (sebelumnya tidak dikirim -> 400)
          shippingCost: Number(option.cost) || 0,
          shippingEtd: option.etd || undefined,
          paymentMethod: selectedPayment,
          couponCode:
            serverCart?.coupon && !serverCart.couponError
              ? serverCart.coupon.code
              : "",
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const message = errorMessage(data?.error);
        setError(message);
        toast({
          variant: "destructive",
          title: "Gagal membuat pesanan",
          description: message,
        });
        return;
      }

      const orderNumber: string | undefined =
        data?.orderNumber ?? data?.order?.orderNumber;
      clearCart();

      if (data?.couponWarning) {
        toast({
          title: "Pesanan dibuat tanpa diskon",
          description: String(data.couponWarning),
        });
      } else {
        toast({
          title: "Pesanan berhasil dibuat",
          description: orderNumber ? `Nomor pesanan ${orderNumber}` : undefined,
        });
      }

      router.push(orderNumber ? `/orders/${orderNumber}` : "/orders");
    } catch {
      const message = "Gagal membuat pesanan. Periksa koneksi internet Anda.";
      setError(message);
      toast({
        variant: "destructive",
        title: "Gagal membuat pesanan",
        description: message,
      });
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
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="h-64 animate-pulse rounded-xl bg-secondary lg:col-span-2" />
          <div className="h-64 animate-pulse rounded-xl bg-secondary" />
        </div>
      </div>
    );
  }

  if (items.length === 0) return null;

  const selectedOption = shippingOptions[selectedShipping];
  const subtotal = serverCart ? serverCart.subtotal : totalPrice();
  const discount = serverCart ? serverCart.discount : 0;
  const shippingCost = selectedOption?.cost ?? 0;
  const total = Math.max(0, subtotal - discount) + shippingCost;
  const addr = addresses.find((a) => a.id === selectedAddress);
  const canSubmit =
    Boolean(selectedAddress) && Boolean(selectedOption) && !submitting;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Checkout</h1>
        {isSyncing && (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Menyinkronkan keranjang...
          </span>
        )}
      </div>

      <div className="mt-6 flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center gap-2">
            <button
              onClick={() => s.num < step && setStep(s.num)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                step === s.num ? "bg-primary text-primary-foreground"
                  : step > s.num ? "bg-primary/10 text-primary"
                  : "bg-secondary text-muted-foreground"
              )}
            >
              {step > s.num ? <Check className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {i < steps.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {error && (
        <p className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </p>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {/* Step 1: Address */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Pilih Alamat Pengiriman</h2>
              {loadingAddr ? (
                <div className="h-32 animate-pulse rounded-xl bg-secondary" />
              ) : addresses.length === 0 ? (
                <div className="rounded-xl border border-dashed p-8 text-center">
                  <p className="text-muted-foreground">Belum ada alamat tersimpan.</p>
                  <Link href="/account/addresses/new"><Button variant="secondary" size="sm" className="mt-3">+ Tambah Alamat</Button></Link>
                </div>
              ) : (
                <>
                  {addresses.map((a) => (
                    <button key={a.id} onClick={() => setSelectedAddress(a.id)}
                      className={cn("w-full rounded-xl border-2 p-4 text-left transition-colors",
                        selectedAddress === a.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                      )}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">{a.label}</span>
                        {a.isDefault && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Utama</span>}
                      </div>
                      <p className="mt-1 text-sm font-medium">{a.recipientName}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {a.detail ? `${a.detail}, ` : ""}{a.city}, {a.province} {a.postalCode}
                      </p>
                      <p className="text-sm text-muted-foreground">{a.phone}</p>
                    </button>
                  ))}
                  <Link href="/account/addresses/new"><Button variant="secondary" size="sm">+ Tambah Alamat Baru</Button></Link>
                </>
              )}
              {addresses.length > 0 && (
                <div className="pt-2">
                  <Button onClick={() => setStep(2)} disabled={!selectedAddress}>
                    Lanjut ke Pengiriman <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Shipping */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Pilih Pengiriman</h2>
              <p className="text-sm text-muted-foreground">
                Ongkir ke {addr?.city ?? "-"} — {totalWeight() > 0 ? `${Math.round(totalWeight())}g` : "1kg (default)"}
              </p>
              {loadingShip ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-secondary" />)}
                </div>
              ) : shippingOptions.length === 0 ? (
                <div className="flex items-center justify-between rounded-xl border border-dashed p-4">
                  <p className="text-sm text-muted-foreground">
                    {shippingError || "Tidak ada opsi pengiriman tersedia."}
                  </p>
                  {addr && (
                    <Button variant="secondary" size="sm" onClick={() => fetchShipping(addr)}>
                      Coba lagi
                    </Button>
                  )}
                </div>
              ) : (
                shippingOptions.map((opt, i) => (
                  <button key={`${opt.courier}-${opt.service}-${i}`} onClick={() => setSelectedShipping(i)}
                    className={cn("flex w-full items-center justify-between rounded-xl border-2 p-4 text-left transition-colors",
                      selectedShipping === i ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    )}>
                    <div>
                      <p className="text-sm font-semibold">
                        {(opt.courierName || opt.courier).toUpperCase()} — {opt.service}
                      </p>
                      <p className="text-xs text-muted-foreground">Estimasi {opt.etd || "-"}</p>
                    </div>
                    <p className="text-sm font-bold text-primary">{formatPrice(opt.cost)}</p>
                  </button>
                ))
              )}
              <div className="flex gap-2 pt-2">
                <Button variant="secondary" onClick={() => setStep(1)}>Kembali</Button>
                <Button onClick={() => setStep(3)} disabled={shippingOptions.length === 0 || !selectedOption}>
                  Lanjut ke Pembayaran <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Pilih Pembayaran</h2>
              {paymentMethods.map((m) => (
                <button key={m.id} onClick={() => setSelectedPayment(m.id)}
                  className={cn("flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-colors",
                    selectedPayment === m.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  )}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                    <m.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.desc}</p>
                  </div>
                </button>
              ))}

              <div>
                <label htmlFor="notes" className="block text-sm font-medium mb-1">
                  Catatan (opsional)
                </label>
                <textarea id="notes" rows={2} value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: titip ke resepsionis"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="secondary" onClick={() => setStep(2)}>Kembali</Button>
                <Button size="lg" className="flex-1 sm:flex-none" onClick={submitOrder} disabled={!canSubmit}>
                  {submitting ? "Memproses..." : `Buat Pesanan — ${formatPrice(total)}`}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div>
          <div className="sticky top-20 rounded-xl border border-border bg-card p-5">
            <h2 className="text-lg font-semibold">Ringkasan Pesanan</h2>
            <div className="mt-4 space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-start gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-secondary">
                    {item.image && <Image src={item.image} alt={item.name} fill className="object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">× {item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold">{formatPrice(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2 border-t border-border pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-primary">
                  <span>Diskon{serverCart?.coupon ? ` (${serverCart.coupon.code})` : ""}</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pengiriman</span>
                <span>{selectedOption ? formatPrice(shippingCost) : "-"}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
                <span>Total</span>
                <span className="text-primary">{formatPrice(total)}</span>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Total akhir dihitung ulang di server saat pesanan dibuat.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
