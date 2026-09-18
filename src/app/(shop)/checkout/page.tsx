"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  Truck,
  CreditCard,
  ChevronRight,
  Check,
  Banknote,
  Wallet,
} from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const addresses = [
  {
    id: "a1",
    label: "Rumah",
    name: "Budi Santoso",
    phone: "081234567890",
    detail: "Jl. Kenanga No. 12, RT 03/RW 05",
    city: "Surabaya",
    province: "Jawa Timur",
    postalCode: "60234",
    isDefault: true,
  },
  {
    id: "a2",
    label: "Kantor",
    name: "Budi Santoso",
    phone: "081234567890",
    detail: "Graha Pena Lt. 5, Jl. Ahmad Yani 88",
    city: "Surabaya",
    province: "Jawa Timur",
    postalCode: "60235",
    isDefault: false,
  },
];

const shippingOptions = [
  { id: "s1", courier: "JNE", service: "REG", etd: "2-3 hari", cost: 25000 },
  { id: "s2", courier: "JNE", service: "YES", etd: "1-2 hari", cost: 42000 },
  { id: "s3", courier: "J&T", service: "Regular", etd: "2-4 hari", cost: 22000 },
  { id: "s4", courier: "SiCepat", service: "REG", etd: "2-3 hari", cost: 23000 },
];

const paymentMethods = [
  { id: "bank_transfer", name: "Transfer Bank", icon: Banknote, desc: "BCA, Mandiri, BNI, BRI" },
  { id: "ewallet", name: "E-Wallet", icon: Wallet, desc: "GoPay, OVO, Dana, ShopeePay" },
  { id: "cod", name: "Bayar di Tempat (COD)", icon: CreditCard, desc: "Bayar saat barang diterima" },
];

const orderItems = [
  { name: "Set Hidroponik NFT 6 Lubang", variant: "6 Lubang", price: 699000, qty: 1 },
  { name: "Nutrisi AB Mix Hidroponik", variant: "Default", price: 45000, qty: 2 },
];

export default function CheckoutPage() {
  const [step, setStep] = useState(1);
  const [selectedAddress, setSelectedAddress] = useState("a1");
  const [selectedShipping, setSelectedShipping] = useState("s1");
  const [selectedPayment, setSelectedPayment] = useState("bank_transfer");

  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const shippingCost =
    shippingOptions.find((s) => s.id === selectedShipping)?.cost ?? 0;
  const total = subtotal + shippingCost;

  const steps = [
    { num: 1, label: "Alamat", icon: MapPin },
    { num: 2, label: "Pengiriman", icon: Truck },
    { num: 3, label: "Pembayaran", icon: CreditCard },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">Checkout</h1>

      {/* Stepper */}
      <div className="mt-6 flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center gap-2">
            <button
              onClick={() => setStep(s.num)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                step === s.num
                  ? "bg-primary text-primary-foreground"
                  : step > s.num
                  ? "bg-primary/10 text-primary"
                  : "bg-secondary text-muted-foreground"
              )}
            >
              {step > s.num ? (
                <Check className="h-4 w-4" />
              ) : (
                <s.icon className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {i < steps.length - 1 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2">
          {/* Step 1: Address */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Pilih Alamat Pengiriman</h2>
              {addresses.map((addr) => (
                <button
                  key={addr.id}
                  onClick={() => setSelectedAddress(addr.id)}
                  className={cn(
                    "w-full rounded-xl border-2 p-4 text-left transition-colors",
                    selectedAddress === addr.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{addr.label}</span>
                    {addr.isDefault && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        Utama
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm font-medium">{addr.name}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {addr.detail}, {addr.city}, {addr.province} {addr.postalCode}
                  </p>
                  <p className="text-sm text-muted-foreground">{addr.phone}</p>
                </button>
              ))}
              <Button variant="secondary" size="sm">
                + Tambah Alamat Baru
              </Button>
              <div className="pt-2">
                <Button onClick={() => setStep(2)}>
                  Lanjut ke Pengiriman <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Shipping */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Pilih Pengiriman</h2>
              <p className="text-sm text-muted-foreground">
                Ongkir dari RajaOngkir — {addresses.find((a) => a.id === selectedAddress)?.city}
              </p>
              {shippingOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSelectedShipping(opt.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl border-2 p-4 text-left transition-colors",
                    selectedShipping === opt.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div>
                    <p className="text-sm font-semibold">
                      {opt.courier} — {opt.service}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Estimasi {opt.etd}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-primary">
                    {formatPrice(opt.cost)}
                  </p>
                </button>
              ))}
              <div className="flex gap-2 pt-2">
                <Button variant="secondary" onClick={() => setStep(1)}>
                  Kembali
                </Button>
                <Button onClick={() => setStep(3)}>
                  Lanjut ke Pembayaran <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Pilih Pembayaran</h2>
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedPayment(method.id)}
                  className={cn(
                    "flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-colors",
                    selectedPayment === method.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                    <method.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{method.name}</p>
                    <p className="text-xs text-muted-foreground">{method.desc}</p>
                  </div>
                </button>
              ))}
              <div className="flex gap-2 pt-2">
                <Button variant="secondary" onClick={() => setStep(2)}>
                  Kembali
                </Button>
                <Button size="lg" className="flex-1 sm:flex-none">
                  Buat Pesanan — {formatPrice(total)}
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
              {orderItems.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-secondary">
                    <Image
                      src="/products/placeholder.jpg"
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.variant} × {item.qty}</p>
                  </div>
                  <p className="text-sm font-semibold">{formatPrice(item.price * item.qty)}</p>
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
