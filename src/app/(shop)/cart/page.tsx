"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { cn, formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/cart-store";
import { useToast } from "@/components/ui/use-toast";

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

const FREE_SHIPPING_THRESHOLD = 200000;

export default function CartPage() {
  const {
    items,
    updateQuantity,
    removeItem,
    totalItems,
    totalPrice,
    hydrate,
    serverCart,
    isSyncing,
    cartLoaded,
    isLoggedIn,
  } = useCartStore();
  const { toast } = useToast();

  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [selectAll, setSelectAll] = useState(true);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const subtotal = serverCart ? serverCart.subtotal : totalPrice();
  const discount = serverCart ? serverCart.discount : 0;
  const total = serverCart ? serverCart.total : subtotal;
  const appliedCoupon = serverCart?.coupon ?? null;
  const couponError = serverCart?.couponError ?? null;

  const shippingProgress = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  async function applyCoupon() {
    const code = couponCode.trim();
    if (!code) return;
    setCouponLoading(true);
    try {
      const res = await fetch("/api/cart/coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast({ variant: "destructive", title: "Kupon gagal dipakai", description: errorMessage(data?.error) });
        return;
      }
      await hydrate();
      setCouponCode("");
      toast({ title: "Kupon diterapkan", description: `Kode ${data?.coupon?.code ?? code.toUpperCase()} berhasil dipakai.` });
    } catch {
      toast({ variant: "destructive", title: "Kupon gagal dipakai", description: "Periksa koneksi internet Anda." });
    } finally {
      setCouponLoading(false);
    }
  }

  async function removeCoupon() {
    setCouponLoading(true);
    try {
      const res = await fetch("/api/cart/coupon", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast({ variant: "destructive", title: "Gagal menghapus kupon", description: errorMessage(data?.error) });
        return;
      }
      await hydrate();
      setCouponCode("");
      toast({ title: "Kupon dihapus" });
    } catch {
      toast({ variant: "destructive", title: "Gagal menghapus kupon", description: "Periksa koneksi internet Anda." });
    } finally {
      setCouponLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <div className="relative mx-auto mb-6 flex h-32 w-32 items-center justify-center">
          <div className="absolute inset-0 animate-ping rounded-full bg-primary/10 opacity-25" />
          <div className="flex h-28 w-28 items-center justify-center rounded-3xl border border-primary/20 bg-gradient-to-tr from-primary/5 to-primary/10 shadow-inner">
            <Icon name="shopping_bag" size={48} className="text-primary/80" />
          </div>
        </div>
        <span className="mb-3 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
          Keranjang Belum Terisi
        </span>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Keranjang Anda Masih Kosong</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Yuk, mulai belanja paket tambak modern, hidroponik hemat lahan, dan perangkat IoT pintar untuk melipatgandakan hasil panen Anda!
        </p>
        <Link href="/products" className="mt-6 inline-block">
          <Button size="lg" className="gap-2 rounded-2xl px-8 shadow-lg">
            Belanja Sekarang <Icon name="arrow_forward" size={16} />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* 4-Step Progress Bar */}
      <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-1 sm:gap-4">
        {[
          { num: 1, label: "Keranjang", active: true },
          { num: 2, label: "Pengiriman", active: false },
          { num: 3, label: "Pembayaran", active: false },
          { num: 4, label: "Selesai", active: false },
        ].map((step, i) => (
          <div key={step.num} className="flex items-center gap-2 shrink-0">
            <span
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                step.active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-secondary text-muted-foreground"
              )}
            >
              {step.num}
            </span>
            <span className={cn("text-xs font-medium", step.active ? "font-bold text-foreground" : "text-muted-foreground")}>
              {step.label}
            </span>
            {i < 3 && <div className="h-0.5 w-6 bg-border" />}
          </div>
        ))}
      </div>

      {/* Free Shipping Progress Bar */}
      <div className="mb-6 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between text-xs font-semibold text-foreground">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Icon name="local_shipping" size={14} />
            </div>
            {shippingProgress >= 100 ? (
              <span>
                Selamat! Pesanan Anda memenuhi syarat <strong className="underline decoration-primary">Bebas Ongkir</strong>
              </span>
            ) : (
              <span>
                Belanja <strong className="text-primary">{formatPrice(remainingForFreeShipping)}</strong> lagi untuk <strong>Bebas Ongkir</strong>
              </span>
            )}
          </div>
          <span className="hidden font-bold text-primary sm:inline">
            {shippingProgress >= 100 ? "100% Tercapai" : `${shippingProgress}%`}
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-primary/20">
          <div
            className="h-2.5 rounded-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500"
            style={{ width: `${shippingProgress}%` }}
          />
        </div>
      </div>

      {isSyncing && (
        <div className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Icon name="progress_activity" size={12} className="animate-spin" /> Menyinkronkan...
        </div>
      )}

      {/* Main Grid */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Column */}
        <div className="space-y-4 lg:col-span-8">
          {/* Select All Header */}
          <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-xs">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={(e) => setSelectAll(e.target.checked)}
                className="h-5 w-5 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-sm font-bold">Pilih Semua ({totalItems()} Produk)</span>
            </label>
            <button className="flex items-center gap-1 text-xs font-semibold text-destructive transition hover:text-destructive/80">
              <Icon name="delete" size={14} />
              <span className="hidden sm:inline">Hapus Terpilih</span>
            </button>
          </div>

          {/* Product Cards */}
          {items.map((item) => (
            <article
              key={item.id}
              className="group rounded-2xl border border-border bg-card p-4 shadow-xs transition hover:border-border/80 sm:p-5"
            >
              <div className="flex items-start gap-3 sm:gap-4">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={() => {}}
                  className="mt-2 h-5 w-5 shrink-0 rounded border-border text-primary focus:ring-primary"
                />
                {/* Product Image */}
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border bg-secondary sm:h-24 sm:w-24">
                  <Image
                    src={item.image || "/placeholder-product.png"}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                </div>
                {/* Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <Link
                        href={`/products/${item.slug || item.productId}`}
                        className="text-sm font-bold text-foreground transition hover:text-primary sm:text-base"
                      >
                        {item.name}
                      </Link>
                      {item.weightGram > 0 && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Berat: {((item.weightGram ?? 0) / 1000).toFixed(1)} kg
                        </p>
                      )}
                    </div>
                    <div className="text-right sm:mt-0">
                      <p className="text-base font-extrabold text-foreground sm:text-lg">{formatPrice(item.price * item.quantity)}</p>
                      {item.quantity > 1 && (
                        <p className="text-[11px] text-muted-foreground">
                          {formatPrice(item.price)} × {item.quantity}
                        </p>
                      )}
                    </div>
                  </div>
                  {/* Footer Actions */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                    <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
                      <button className="flex items-center gap-1 transition hover:text-primary">
                        <Icon name="favorite" size={16} />
                        <span className="hidden sm:inline">Pindahkan ke Wishlist</span>
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="flex items-center gap-1 transition hover:text-destructive"
                      >
                        <Icon name="delete" size={16} />
                        <span>Hapus</span>
                      </button>
                    </div>
                    {/* Quantity Stepper */}
                    <div className="flex items-center rounded-xl border border-border bg-secondary/70 p-1">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                      >
                        <Icon name="remove" size={12} />
                      </button>
                      <span className="min-w-[2.5rem] text-center text-xs font-bold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, Math.min(99, item.quantity + 1))}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                      >
                        <Icon name="add" size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Right Column: Summary Sidebar */}
        <aside className="space-y-4 lg:col-span-4 lg:sticky lg:top-28">
          {/* Promo Voucher Card */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
            <label className="mb-2 block text-xs font-bold">Punya Kode Promo / Voucher?</label>
            {!isLoggedIn && cartLoaded ? (
              <p className="rounded-lg bg-secondary px-3 py-2 text-xs text-muted-foreground">
                <Link href="/login" className="font-medium text-primary hover:underline">Login</Link> dulu untuk memakai kode kupon.
              </p>
            ) : appliedCoupon ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">Terpakai</span>
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-primary">{appliedCoupon.code}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={removeCoupon} disabled={couponLoading}>
                    Ganti
                  </Button>
                </div>
                {discount > 0 && (
                  <p className="flex items-center gap-1 text-[11px] font-medium text-primary">
                    <Icon name="check_circle" size={14} className="text-primary" />
                    Kupon berhasil diaplikasikan — Hemat {formatPrice(discount)}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Masukkan kode kupon"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="w-full rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider text-foreground outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                    disabled={couponLoading}
                  />
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={applyCoupon}
                  disabled={couponLoading || !couponCode.trim()}
                  className="rounded-xl"
                >
                  {couponLoading ? "Memeriksa..." : "Pakai"}
                </Button>
              </div>
            )}
            {couponError && (
              <p className="mt-2 flex items-start gap-1.5 text-xs text-destructive">
                <Icon name="info" size={12} className="mt-0.5 shrink-0" /> {couponError}
              </p>
            )}
          </div>

          {/* Order Summary Card */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-md">
            <h2 className="border-b border-border pb-3 text-lg font-bold">Ringkasan Belanja</h2>
            <div className="space-y-3 border-b border-border py-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Harga ({totalItems()} barang)</span>
                <span className="font-semibold">{formatPrice(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex items-center justify-between text-primary">
                  <span className="flex items-center gap-1">
                    Diskon Voucher
                    {appliedCoupon && (
                      <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold">{appliedCoupon.code}</span>
                    )}
                  </span>
                  <span className="font-semibold">-{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Estimasi Biaya Kirim</span>
                <span className="text-xs text-muted-foreground">Dihitung di checkout</span>
              </div>
            </div>
            {/* Grand Total */}
            <div className="pb-6 pt-4">
              <div className="mb-1 flex items-baseline justify-between">
                <span className="text-sm font-bold">Total Tagihan</span>
                <span className="text-2xl font-black tracking-tight text-primary">{formatPrice(total)}</span>
              </div>
            </div>
            {/* CTA Button */}
            <Link href="/checkout" className="block">
              <Button
                size="lg"
                className="group w-full gap-2 rounded-2xl py-4 text-base font-bold shadow-lg transition-all hover:shadow-xl"
              >
                <span>Lanjut ke Pembayaran</span>
                <Icon name="arrow_forward" size={20} className="transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            {/* Security Badge */}
            <div className="mt-4 flex items-center justify-center gap-2 border-t border-border pt-4 text-[11px] text-muted-foreground">
              <Icon name="verified_user" size={16} className="text-primary" />
              <span>100% Pembayaran Aman &amp; Terenkripsi</span>
            </div>
            {/* Value Props */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 rounded-xl bg-secondary p-2.5 text-[11px]">
                <Icon name="verified" size={16} className="shrink-0 text-primary" />
                <span>Garansi Resmi Pabrik</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-secondary p-2.5 text-[11px]">
                <Icon name="support_agent" size={16} className="shrink-0 text-primary" />
                <span>Konsultasi CS 24/7</span>
              </div>
            </div>
            <Link href="/products" className="mt-3 block text-center text-sm text-primary hover:underline">
              ← Lanjut Belanja
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}