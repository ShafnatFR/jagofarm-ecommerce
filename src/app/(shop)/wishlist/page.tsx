"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/product/product-card";
import { toast } from "@/components/ui/use-toast";
import { useCartStore } from "@/lib/cart-store";

interface WishlistProduct {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  discountPrice?: number | null;
  isFeatured?: boolean;
  weightGram?: number;
  images?: { url: string }[] | null;
  category?: { name: string; slug: string } | null;
}

interface WishlistEntry {
  id: string;
  productId: string;
  product: WishlistProduct;
}

type LoadResult =
  | { status: "ok"; entries: WishlistEntry[] }
  | { status: "unauthorized" }
  | { status: "error"; message: string };

async function fetchWishlist(): Promise<LoadResult> {
  try {
    const res = await fetch("/api/wishlist", { cache: "no-store" });
    if (res.status === 401) return { status: "unauthorized" };
    if (!res.ok) {
      return { status: "error", message: `Gagal memuat wishlist (${res.status}).` };
    }
    const data = await res.json();
    return { status: "ok", entries: (data.wishlists ?? []) as WishlistEntry[] };
  } catch {
    return {
      status: "error",
      message: "Gagal memuat wishlist. Periksa koneksi internet Anda.",
    };
  }
}

export default function WishlistPage() {
  const addItem = useCartStore((s) => s.addItem);
  const hydrate = useCartStore((s) => s.hydrate);

  const [entries, setEntries] = useState<WishlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  // Pastikan ringkasan cart server siap supaya addItem ikut tersinkron.
  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchWishlist();
    if (result.status === "ok") {
      setEntries(result.entries);
      setUnauthorized(false);
    } else if (result.status === "unauthorized") {
      setUnauthorized(true);
      setEntries([]);
    } else {
      setError(result.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- pola fetch-saat-mount wishlist; setState ada di dalam helper load()
    void load();
  }, [load]);

  /** Hapus dari wishlist: optimistic + rollback saat gagal. */
  async function removeFromWishlist(entry: WishlistEntry) {
    if (pendingId) return;
    setPendingId(entry.productId);
    const snapshot = entries;
    setEntries((prev) => prev.filter((item) => item.productId !== entry.productId));

    try {
      const res = await fetch("/api/wishlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: entry.productId }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast({
        title: "Dihapus dari wishlist",
        description: entry.product.name,
      });
    } catch {
      setEntries(snapshot);
      toast({
        variant: "destructive",
        title: "Gagal menghapus dari wishlist",
        description: "Periksa koneksi internet Anda lalu coba lagi.",
      });
    } finally {
      setPendingId(null);
    }
  }

  function addToCart(entry: WishlistEntry) {
    const product = entry.product;
    const displayPrice = product.discountPrice ?? product.basePrice;
    addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      price: displayPrice,
      quantity: 1,
      image: product.images?.[0]?.url,
      weightGram: product.weightGram ?? 0,
      slug: product.slug,
    });
    toast({
      title: "Ditambahkan ke keranjang",
      description: product.name,
    });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Wishlist Saya</h1>
          {!loading && !unauthorized && (
            <p className="mt-1 text-sm text-muted-foreground">
              {entries.length} produk tersimpan
            </p>
          )}
        </div>
        <Link
          href="/products"
          className="text-sm font-medium text-primary underline-offset-2 hover:underline"
        >
          Jelajahi produk lain
        </Link>
      </div>

      {loading ? (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-3">
              <Skeleton className="aspect-square rounded-lg" />
              <Skeleton className="mt-3 h-3 w-16" />
              <Skeleton className="mt-1 h-4 w-full" />
              <Skeleton className="mt-2 h-5 w-20" />
            </div>
          ))}
        </div>
      ) : unauthorized ? (
        <div className="mt-10 rounded-xl border border-border bg-card px-6 py-12 text-center">
          <Icon name="favorite" size={40} className="mx-auto text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold">Masuk untuk melihat wishlist</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Simpan produk favorit Anda dan temukan kembali dengan mudah setelah masuk
            ke akun JagoFarm.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button asChild variant="primary" size="md">
              <Link href="/login?next=%2Fwishlist">Masuk Sekarang</Link>
            </Button>
            <Button asChild variant="secondary" size="md">
              <Link href="/register">Daftar Akun</Link>
            </Button>
          </div>
        </div>
      ) : error ? (
        <div className="mt-10 rounded-xl border border-border bg-card px-6 py-12 text-center">
          <Icon name="info" size={40} className="mx-auto text-destructive" />
          <p className="mt-4 text-sm text-muted-foreground">{error}</p>
          <Button variant="secondary" size="sm" className="mt-5" onClick={() => void load()}>
            Coba Lagi
          </Button>
        </div>
      ) : entries.length === 0 ? (
        <div className="mt-10 rounded-xl border border-border bg-card px-6 py-12 text-center">
          <Icon name="favorite" size={40} className="mx-auto text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold">Wishlist kamu masih kosong</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Tekan ikon hati pada kartu produk untuk menyimpannya di sini.
          </p>
          <Button asChild variant="primary" size="md" className="mt-6">
            <Link href="/products">Mulai Belanja</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {entries.map((entry, index) => {
            const product = entry.product;
            return (
              <div key={entry.id} className="flex flex-col">
                <ProductCard
                  index={index}
                  isWishlisted
                  onWishlistChange={(productId, wishlisted) => {
                    // DELETE sudah dikirim ProductCard; sinkronkan daftar lokal saja.
                    if (!wishlisted) {
                      setEntries((prev) =>
                        prev.filter((item) => item.productId !== productId)
                      );
                    }
                  }}
                  product={{
                    id: product.id,
                    name: product.name,
                    slug: product.slug,
                    price: product.basePrice,
                    discountPrice: product.discountPrice,
                    image: product.images?.[0]?.url || "/placeholder-product.png",
                    category: product.category?.name ?? "Produk",
                    isFeatured: product.isFeatured,
                    weightGram: product.weightGram,
                  }}
                />
                <div className="mt-2 space-y-2">
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                    onClick={() => addToCart(entry)}
                  >
                    <Icon name="shopping_cart" size={12} className="mr-1.5" />
                    Tambah ke Keranjang
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    disabled={pendingId === entry.productId}
                    onClick={() => void removeFromWishlist(entry)}
                  >
                    {pendingId === entry.productId ? (
                      <Icon name="progress_activity" size={12} className="mr-1.5 animate-spin" />
                    ) : (
                      <Icon name="delete" size={12} className="mr-1.5" />
                    )}
                    Hapus
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
