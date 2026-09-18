"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Trash2, Minus, Plus, ShoppingBag, Tag, ArrowRight } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/cart-store";

export default function CartPage() {
  const { items, updateQuantity, removeItem, totalItems, totalPrice, totalWeight } = useCartStore();
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);

  function applyCoupon() {
    if (couponCode.toUpperCase() === "JAGOFARM10") {
      const subtotal = totalPrice();
      setCouponDiscount(Math.min(subtotal * 0.1, 100000));
      setCouponApplied(true);
    }
  }

  const subtotal = totalPrice();
  const shippingCost = subtotal >= 500000 ? 0 : 25000;
  const total = subtotal - couponDiscount + shippingCost;

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
      <h1 className="text-2xl font-bold tracking-tight">Keranjang Belanja</h1>
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
                  <Link href={`/products/${item.productId}`}
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
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)}
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

            {/* Coupon */}
            <div className="mt-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input type="text" placeholder="Kode kupon" value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)} disabled={couponApplied}
                    className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-primary disabled:opacity-50" />
                </div>
                <Button variant="secondary" size="sm" onClick={applyCoupon}
                  disabled={couponApplied || !couponCode}>
                  {couponApplied ? "Diterapkan" : "Pakai"}
                </Button>
              </div>
              {couponApplied && (
                <p className="mt-1 text-xs text-primary">Kupon berhasil! Diskon {formatPrice(couponDiscount)}</p>
              )}
            </div>

            {/* Totals */}
            <div className="mt-4 space-y-2 border-t border-border pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-sm text-primary">
                  <span>Diskon Kupon</span>
                  <span>-{formatPrice(couponDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pengiriman</span>
                <span>{shippingCost === 0 ? "Gratis" : formatPrice(shippingCost)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
                <span>Total</span>
                <span className="text-primary">{formatPrice(total)}</span>
              </div>
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
