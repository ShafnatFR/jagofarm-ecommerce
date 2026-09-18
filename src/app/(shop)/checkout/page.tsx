"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin, Truck, CreditCard, ChevronRight, Check, Banknote, Wallet, QrCode,
} from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useCartStore, type CartItem } from "@/lib/cart-store";

interface Address {
  id: string; label: string; name: string; phone: string;
  detail: string; city: string; province: string; postalCode: string; isDefault: boolean;
}

interface ShippingOption {
  courier: string; service: string; cost: number; etd: string;
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

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, totalWeight, clearCart } = useCartStore();
  const [step, setStep] = useState(1);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShipping, setSelectedShipping] = useState(0);
  const [selectedPayment, setSelectedPayment] = useState("bank_transfer");
  const [loadingAddr, setLoadingAddr] = useState(true);
  const [loadingShip, setLoadingShip] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (items.length === 0) { router.replace("/cart"); return; }
    fetchAddresses();
  }, []);

  useEffect(() => {
    if (step === 2 && selectedAddress) fetchShipping();
  }, [step, selectedAddress]);

  async function fetchAddresses() {
    setLoadingAddr(true); setError("");
    try {
      const res = await fetch("/api/user/addresses");
      if (res.status === 401) { setError("login_required"); return; }
      if (!res.ok) throw new Error("Gagal memuat alamat");
      const data = await res.json();
      setAddresses(data.addresses ?? []);
      const def = data.addresses?.find((a: Address) => a.isDefault);
      if (def) setSelectedAddress(def.id);
      else if (data.addresses?.length) setSelectedAddress(data.addresses[0].id);
    } catch (e: any) { setError(e.message); }
    finally { setLoadingAddr(false); }
  }

  async function fetchShipping() {
    setLoadingShip(true);
    try {
      const res = await fetch("/api/shipping/cost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination: selectedAddress, weight: totalWeight() }),
      });
      if (!res.ok) throw new Error("Gagal memuat ongkir");
      const data = await res.json();
      setShippingOptions(data.results ?? []);
      if (data.results?.length) setSelectedShipping(0);
    } catch { setShippingOptions([]); }
    finally { setLoadingShip(false); }
  }

  async function submitOrder() {
    setSubmitting(true); setError("");
    try {
      const opt = shippingOptions[selectedShipping];
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingAddressId: selectedAddress,
          shippingCourier: opt?.courier,
          shippingService: opt?.service,
          paymentMethod: selectedPayment,
        }),
      });
      if (!res.ok) throw new Error("Gagal membuat pesanan");
      const data = await res.json();
      clearCart();
      router.push(`/orders/${data.orderNumber}`);
    } catch (e: any) { setError(e.message); }
    finally { setSubmitting(false); }
  }

  const subtotal = totalPrice();
  const shippingCost = shippingOptions[selectedShipping]?.cost ?? 0;
  const total = subtotal + shippingCost;

  if (error === "login_required") {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Silakan Login</h1>
        <p className="mt-2 text-muted-foreground">Anda perlu login untuk checkout.</p>
        <Link href="/login"><Button className="mt-4">Login</Button></Link>
      </div>
    );
  }

  if (items.length === 0) return null;

  const addr = addresses.find((a) => a.id === selectedAddress);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">Checkout</h1>

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

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {/* Step 1: Address */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Pilih Alamat Pengiriman</h2>
              {loadingAddr ? (
                <div className="h-32 animate-pulse rounded-xl bg-secondary" />
              ) : error ? (
                <p className="text-sm text-destructive">{error}</p>
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
                      <p className="mt-1 text-sm font-medium">{a.name}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">{a.detail}, {a.city}, {a.province} {a.postalCode}</p>
                      <p className="text-sm text-muted-foreground">{a.phone}</p>
                    </button>
                  ))}
                  <Link href="/account/addresses/new"><Button variant="secondary" size="sm">+ Tambah Alamat Baru</Button></Link>
                </>
              )}
              {addresses.length > 0 && (
                <div className="pt-2">
                  <Button onClick={() => setStep(2)}>Lanjut ke Pengiriman <ChevronRight className="ml-1 h-4 w-4" /></Button>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Shipping */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Pilih Pengiriman</h2>
              <p className="text-sm text-muted-foreground">Ongkir ke {addr?.city} — {Math.round(totalWeight())}g</p>
              {loadingShip ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-secondary" />)}
                </div>
              ) : shippingOptions.length === 0 ? (
                <p className="text-sm text-muted-foreground">Tidak ada opsi pengiriman tersedia.</p>
              ) : (
                shippingOptions.map((opt, i) => (
                  <button key={i} onClick={() => setSelectedShipping(i)}
                    className={cn("flex w-full items-center justify-between rounded-xl border-2 p-4 text-left transition-colors",
                      selectedShipping === i ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    )}>
                    <div>
                      <p className="text-sm font-semibold">{opt.courier} — {opt.service}</p>
                      <p className="text-xs text-muted-foreground">Estimasi {opt.etd}</p>
                    </div>
                    <p className="text-sm font-bold text-primary">{formatPrice(opt.cost)}</p>
                  </button>
                ))
              )}
              <div className="flex gap-2 pt-2">
                <Button variant="secondary" onClick={() => setStep(1)}>Kembali</Button>
                <Button onClick={() => setStep(3)} disabled={shippingOptions.length === 0}>
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
              <div className="flex gap-2 pt-2">
                <Button variant="secondary" onClick={() => setStep(2)}>Kembali</Button>
                <Button size="lg" className="flex-1 sm:flex-none" onClick={submitOrder} disabled={submitting}>
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
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pengiriman</span>
                <span>{formatPrice(shippingCost)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
                <span>Total</span>
                <span className="text-primary">{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
