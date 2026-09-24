"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Trash2, Minus, Plus, ShoppingBag, Tag, ArrowRight, Loader2, AlertCircle,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
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

  // Muat cart server saat halaman dibuka (source of truth untuk user login)
  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  // Nilai dari server (user login); fallback ke perhitungan lokal kalau belum ada
  const subtotal = serverCart ? serverCart.subtotal : totalPrice();
  const discount = serverCart ? serverCart.discount : 0;
  const total = serverCart ? serverCart.total : subtotal;
  const appliedCoupon = serverCart?.coupon ?? null;
  const couponError = serverCart?.couponError ?? null;

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
        toast({
          variant: "destructive",
          title: "Kupon gagal dipakai",
          description: errorMessage(data?.error),
        });
        return;
      }

      await hydrate();
      setCouponCode("");
      toast({
        title: "Kupon diterapkan",
        description: `Kode ${data?.coupon?.code ?? code.toUpperCase()} berhasil dipakai.`,
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Kupon gagal dipakai",
        description: "Periksa koneksi internet Anda.",
      });
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
        toast({
          variant: "destructive",
          title: "Gagal menghapus kupon",
          description: errorMessage(data?.error),
        });
        return;
      }

      await hydrate();
      setCouponCode("");
      toast({ title: "Kupon dihapus" });
    } catch {
      toast({
        variant: "destructive",
        title: "Gagal menghapus kupon",
        description: "Periksa koneksi internet Anda.",
      });
    } finally {
      setCouponLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground" />
        <h1 className="mt-4 text-2xl font-bold">Keranjang Kosong</h1>
        <p className="mt-2 text-muted-foreground">Yuk, mulai belanja produk pertanian modern!</p>
        <Link href="/products" className="mt-6 inline-block">
          <Button size="lg">Belanja Sekarang <ArrowRight className="ml-2 h-4 w-4" /></Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Keranjang Belanja</h1>
        {isSyncing && (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Menyinkronkan...
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{totalItems()} produk di keranjang</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex gap-4 rounded-xl border border-border bg-card p-4">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-secondary">
                <Image src={item.image || "/placeholder-product.jpg"} alt={item.name}
                  fill className="object-cover" />
              </div>
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <Link href={`/products/${item.slug || item.productId}`}
                    className="text-sm font-semibold hover:text-primary transition-colors">
                    {item.name}
                  </Link>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Berat: {((item.weightGram ?? 0) / 1000).toFixed(1)} kg
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center rounded-lg border border-input">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="px-2 py-1 hover:bg-secondary transition-colors">
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="min-w-[2.5rem] text-center text-sm font-medium">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, Math.min(99, item.quantity + 1))}
                      className="px-2 py-1 hover:bg-secondary transition-colors">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-bold text-primary">{formatPrice(item.price * item.quantity)}</p>
                    <button onClick={() => removeItem(item.id)}
                      className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div>
          <div className="sticky top-20 rounded-xl border border-border bg-card p-5">
            <h2 className="text-lg font-semibold">Ringkasan Belanja</h2>

            {/* Coupon — divalidasi server via /api/cart/coupon */}
            <div className="mt-4">
              {!isLoggedIn && cartLoaded ? (
                <p className="rounded-lg bg-secondary px-3 py-2 text-xs text-muted-foreground">
                  <Link href="/login" className="font-medium text-primary hover:underline">Login</Link> dulu
                  untuk memakai kode kupon.
                </p>
              ) : appliedCoupon ? (
                <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
                  <div>
                    <p className="flex items-center gap-1.5 text-sm font-semibold text-primary">
                      <Tag className="h-3.5 w-3.5" /> {appliedCoupon.code}
                    </p>
                    {discount > 0 && (
                      <p className="text-xs text-muted-foreground">Hemat {formatPrice(discount)}</p>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" onClick={removeCoupon} disabled={couponLoading}>
                    Hapus
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input type="text" placeholder="Kode kupon" value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-primary disabled:opacity-50"
                      disabled={couponLoading} />
                  </div>
                  <Button variant="secondary" size="sm" onClick={applyCoupon}
                    disabled={couponLoading || !couponCode.trim()}>
                    {couponLoading ? "Memeriksa..." : "Pakai"}
                  </Button>
                </div>
              )}

              {couponError && (
                <p className="mt-2 flex items-start gap-1.5 text-xs text-destructive">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {couponError}
                </p>
              )}
            </div>

            {/* Totals */}
            <div className="mt-4 space-y-2 border-t border-border pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-primary">
                  <span>Diskon Kupon</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
                <span>Total</span>
                <span className="text-primary">{formatPrice(total)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Ongkos kirim dihitung pada langkah checkout.
              </p>
            </div>

            <Link href="/checkout" className="mt-4 block">
              <Button size="lg" className="w-full">Checkout <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </Link>
            <Link href="/products" className="mt-3 block text-center text-sm text-primary hover:underline">
              ← Lanjut Belanja
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
