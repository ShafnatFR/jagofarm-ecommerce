"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Grid3X3, List, AlertCircle, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductFilters } from "@/components/product/product-filters";
import { useCategories } from "@/hooks/use-categories";

interface ApiProduct {
  id: string; name: string; slug: string; basePrice: number;
  discountPrice?: number | null; isFeatured?: boolean; weightGram?: number;
  images: { url: string; altText?: string | null; isPrimary?: boolean }[];
  category: { id: string; name: string; slug: string };
  _count?: { reviews?: number };
}

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { categories } = useCategories();

  const search = searchParams.get("search")?.trim() || "";
  const category = searchParams.get("category") || "";
  const sort = searchParams.get("sort") || "newest";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const view = searchParams.get("view") || "grid";

  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (category) params.set("category", category);
        if (sort) params.set("sort", sort);
        params.set("page", String(page));
        params.set("limit", "12");
        const res = await fetch(`/api/products?${params.toString()}`);
        if (!res.ok) throw new Error("Gagal memuat produk");
        const data = await res.json();
        setProducts(data.products ?? []);
        setTotal(data.pagination?.total ?? data.total ?? data.products?.length ?? 0);
        setTotalPages(data.pagination?.totalPages ?? data.totalPages ?? 1);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [search, category, sort, page]);

  // Tandai kartu yang sudah ada di wishlist (401 = belum login, diabaikan).
  useEffect(() => {
    let active = true;
    async function fetchWishlistIds() {
      try {
        const res = await fetch("/api/wishlist", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        const ids: string[] = (data.wishlists ?? []).map(
          (w: { productId: string }) => w.productId
        );
        if (active) setWishlistIds(new Set(ids));
      } catch {
        /* wishlist opsional: biarkan tombol hati kosong */
      }
    }
    fetchWishlistIds();
    return () => { active = false; };
  }, []);

  function updateView(v: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", v);
    router.push(`/products?${params.toString()}`);
  }

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`/products?${params.toString()}`);
  }

  /** Lepas filter pencarian tanpa menghapus filter lain (kategori/sort). */
  function clearSearch() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("search");
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `/products?${qs}` : "/products");
  }

  function handleWishlistChange(productId: string, wishlisted: boolean) {
    setWishlistIds((prev) => {
      const next = new Set(prev);
      if (wishlisted) next.add(productId);
      else next.delete(productId);
      return next;
    });
  }

  const hasFilterOrSearch = Boolean(search || category || sort !== "newest");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {search ? `Hasil pencarian untuk “${search}”` : "Semua Produk"}
          </h1>
          {!loading && (
            <p className="mt-1 text-sm text-muted-foreground">
              {total} produk ditemukan
            </p>
          )}
          {search && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
                <Search className="h-3.5 w-3.5" />
                Hasil pencarian untuk “{search}”
                <button
                  type="button"
                  onClick={clearSearch}
                  aria-label="Hapus pencarian"
                  className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-primary/20"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
              <Link
                href="/products"
                className="text-sm font-medium text-muted-foreground underline-offset-2 hover:text-primary hover:underline"
              >
                Hapus filter
              </Link>
            </div>
          )}
        </div>
        <div className="hidden items-center gap-1 sm:flex">
          <Button variant={view === "grid" ? "primary" : "ghost"} size="icon" className="h-8 w-8"
            onClick={() => updateView("grid")}>
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button variant={view === "list" ? "primary" : "ghost"} size="icon" className="h-8 w-8"
            onClick={() => updateView("list")}>
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="mt-6 flex gap-6">
        <Suspense>
          <ProductFilters className="w-64 shrink-0" />
        </Suspense>

        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-3">
                  <Skeleton className="aspect-square rounded-lg" />
                  <Skeleton className="mt-3 h-3 w-16" />
                  <Skeleton className="mt-1 h-4 w-full" />
                  <Skeleton className="mt-2 h-5 w-20" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="py-20 text-center">
              <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
              <p className="mt-2 text-sm text-muted-foreground">{error}</p>
            </div>
          ) : products.length === 0 ? (
            <div className="py-16 text-center">
              <Search className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-lg font-medium text-foreground">
                {search
                  ? `Tidak ada produk yang cocok dengan “${search}”`
                  : "Tidak ada produk ditemukan untuk filter ini."}
              </p>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                {search
                  ? "Coba kata kunci lain yang lebih umum, periksa ejaan, atau jelajahi kategori di bawah ini."
                  : "Coba longgarkan filter yang sedang aktif untuk melihat lebih banyak produk."}
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                {hasFilterOrSearch ? (
                  <Button variant="secondary" size="sm" onClick={clearSearch}>
                    Hapus pencarian &amp; filter
                  </Button>
                ) : null}
                <Link href="/products">
                  <Button variant="primary" size="sm">Lihat semua produk</Button>
                </Link>
              </div>
              {categories.length > 0 && (
                <div className="mt-8">
                  <p className="text-sm font-medium text-foreground">Saran kategori</p>
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                    {categories.slice(0, 8).map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/products?category=${encodeURIComponent(cat.slug)}`}
                        className="rounded-full border border-border px-3 py-1 text-sm transition-colors hover:border-primary hover:text-primary"
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className={cn(
              view === "grid"
                ? "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
                : "space-y-4"
            )}>
              {products.map((p, i) => (
                <ProductCard key={p.id} index={i}
                  isWishlisted={wishlistIds.has(p.id)}
                  onWishlistChange={handleWishlistChange}
                  product={{
                  id: p.id, name: p.name, slug: p.slug,
                  price: p.basePrice, discountPrice: p.discountPrice,
                  image: p.images?.[0]?.url || "/placeholder-product.jpg",
                  category: p.category.name, isFeatured: p.isFeatured,
                  weightGram: p.weightGram,
                }} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <Button variant="secondary" size="sm" disabled={page <= 1}
                onClick={() => goToPage(page - 1)}>Sebelumnya</Button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const p = i + 1;
                return (
                  <Button key={p} variant={p === page ? "primary" : "secondary"} size="sm"
                    onClick={() => goToPage(p)}>{p}</Button>
                );
              })}
              <Button variant="secondary" size="sm" disabled={page >= totalPages}
                onClick={() => goToPage(page + 1)}>Selanjutnya</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-7xl px-4 py-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-32" />
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-3">
              <Skeleton className="aspect-square rounded-lg" />
              <Skeleton className="mt-3 h-4 w-full" />
              <Skeleton className="mt-2 h-5 w-20" />
            </div>
          ))}
        </div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
