"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Grid3X3, List, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductFilters } from "@/components/product/product-filters";

interface ApiProduct {
  id: string; name: string; slug: string; basePrice: number;
  discountPrice?: number | null; isFeatured?: boolean;
  images: { url: string; altText?: string | null; isPrimary?: boolean }[];
  category: { id: string; name: string; slug: string };
  _count?: { reviews?: number };
}

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const category = searchParams.get("category") || "";
  const sort = searchParams.get("sort") || "newest";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const view = searchParams.get("view") || "grid";

  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (category) params.set("category", category);
        if (sort) params.set("sort", sort);
        params.set("page", String(page));
        params.set("limit", "12");
        const res = await fetch(`/api/products?${params.toString()}`);
        if (!res.ok) throw new Error("Gagal memuat produk");
        const data = await res.json();
        setProducts(data.products ?? []);
        setTotal(data.total ?? data.products?.length ?? 0);
        setTotalPages(data.totalPages ?? 1);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [category, sort, page]);

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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Semua Produk</h1>
          {!loading && (
            <p className="mt-1 text-sm text-muted-foreground">{total} produk ditemukan</p>
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
            <div className="py-20 text-center">
              <p className="text-lg text-muted-foreground">Tidak ada produk ditemukan untuk filter ini.</p>
              <Link href="/products" className="mt-4 inline-block">
                <Button variant="secondary" size="sm">Hapus Filter</Button>
              </Link>
            </div>
          ) : (
            <div className={cn(
              view === "grid"
                ? "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
                : "space-y-4"
            )}>
              {products.map((p, i) => (
                <ProductCard key={p.id} index={i} product={{
                  id: p.id, name: p.name, slug: p.slug,
                  price: p.basePrice, discountPrice: p.discountPrice,
                  image: p.images?.[0]?.url || "/placeholder-product.jpg",
                  category: p.category.name, isFeatured: p.isFeatured,
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
