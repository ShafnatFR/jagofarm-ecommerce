"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
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
        /* wishlist opsional */
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
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb & Header */}
      <section className="bg-card border-b border-border pb-5 mb-6 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-3">
          <ol className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <li><Link href="/" className="hover:text-primary transition-colors flex items-center gap-1"><Icon name="home" size={14} /> Beranda</Link></li>
            <li><Icon name="chevron_right" size={12} className="text-slate-400" /></li>
            {search ? (
              <li className="text-slate-800 font-semibold text-primary">Hasil Pencarian &quot;{search}&quot;</li>
            ) : (
              <li className="text-slate-800 font-semibold text-primary">Semua Produk</li>
            )}
          </ol>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {search ? (
                  <>Hasil pencarian untuk <span className="text-primary italic">&quot;{search}&quot;</span></>
                ) : "Semua Produk"}
              </h1>
              {!loading && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-surface-container-low text-primary border border-outline-variant">
                  {total} produk ditemukan
                </span>
              )}
            </div>
            {search && (
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <div className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200 transition-colors">
                  <Icon name="search" size={12} className="text-slate-400" />
                  <span>{search}</span>
                  <button type="button" onClick={clearSearch} className="ml-1 text-slate-400 hover:text-rose-500" aria-label="Hapus filter">
                    <Icon name="close" size={14} />
                  </button>
                </div>
                <button type="button" onClick={clearSearch} className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline transition underline-offset-4 decoration-slate-300 hover:decoration-rose-500">
                  Hapus semua filter
                </button>
              </div>
            )}
          </div>

          {/* View toggler */}
          <div className="flex items-center gap-2 self-start sm:self-end">
            <span className="text-xs font-medium text-slate-500 mr-1 hidden sm:inline">Tampilan:</span>
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => updateView("grid")}
                title="Tampilan Grid"
                className={cn("p-1.5 rounded-md transition", view === "grid" ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-700")}
              >
                <Icon name="grid_view" size={16} />
              </button>
              <button
                type="button"
                onClick={() => updateView("list")}
                title="Tampilan Daftar"
                className={cn("p-1.5 rounded-md transition", view === "list" ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-700")}
              >
                <Icon name="view_list" size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="flex gap-6">
        <Suspense>
          <ProductFilters className="w-64 shrink-0" />
        </Suspense>

        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-border bg-card p-3">
                  <Skeleton className="aspect-square rounded-xl" />
                  <Skeleton className="mt-3 h-3 w-16" />
                  <Skeleton className="mt-1 h-4 w-full" />
                  <Skeleton className="mt-2 h-5 w-20" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="py-20 text-center">
              <Icon name="error" size={32} className="mx-auto text-destructive" />
              <p className="mt-2 text-sm text-muted-foreground">{error}</p>
            </div>
          ) : products.length === 0 ? (
            <div className="py-16 text-center">
              <Icon name="search_off" size={32} className="mx-auto text-muted-foreground" />
              <p className="mt-3 text-lg font-medium text-foreground">
                {search
                  ? `Tidak ada produk yang cocok dengan "${search}"`
                  : "Tidak ada produk ditemukan untuk filter ini."}
              </p>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                {search
                  ? "Coba kata kunci lain yang lebih umum, periksa ejaan, atau jelajahi kategori di bawah ini."
                  : "Coba longgarkan filter yang sedang aktif untuk melihat lebih banyak produk."}
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                {hasFilterOrSearch && (
                  <button onClick={clearSearch} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-secondary text-foreground font-semibold text-sm hover:bg-slate-200 transition">
                    <Icon name="refresh" size={14} />
                    Hapus pencarian & filter
                  </button>
                )}
                <Link href="/products">
                  <span className="inline-flex items-center px-4 py-2 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-container transition">
                    Lihat semua produk
                  </span>
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
                        className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-surface-container-low hover:text-primary text-slate-700 font-medium transition-colors text-xs"
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
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5"
                : "space-y-4"
            )}>
              {products.map((p, i) => (
                <ProductCard key={p.id} index={i}
                  isWishlisted={wishlistIds.has(p.id)}
                  onWishlistChange={handleWishlistChange}
                  product={{
                  id: p.id, name: p.name, slug: p.slug,
                  price: p.basePrice, discountPrice: p.discountPrice,
                  image: p.images?.[0]?.url || "/placeholder-product.png",
                  category: p.category.name, isFeatured: p.isFeatured,
                  weightGram: p.weightGram,
                }} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="bg-card rounded-2xl border border-border p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
              <p className="text-xs text-slate-500 font-medium">
                Menampilkan <span className="font-bold text-slate-800">{(page - 1) * 12 + 1} - {Math.min(page * 12, total)}</span> dari <span className="font-bold text-slate-800">{total}</span> produk
              </p>
              <nav aria-label="Pagination" className="flex items-center gap-1">
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1}
                  className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <Icon name="chevron_left" size={16} />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const p = i + 1;
                  return (
                    <button key={p} onClick={() => goToPage(p)}
                      className={cn("w-9 h-9 rounded-lg text-xs font-bold transition",
                        p === page ? "bg-primary text-white shadow-sm" : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                      )}>
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= totalPages}
                  className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <Icon name="chevron_right" size={16} />
                </button>
              </nav>
            </div>
          )}

          {/* Consultation Banner */}
          {!loading && products.length > 0 && (
            <div className="mt-8 rounded-2xl bg-gradient-to-r from-primary to-primary-fixed-800 p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
              <div className="absolute -right-12 -bottom-12 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
              <div className="space-y-2 text-center md:text-left z-10">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-semibold">
                  <Icon name="auto_awesome" size={14} />
                  <span>Layanan Konsultasi Custom</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight">Tidak menemukan spesifikasi yang pas?</h3>
                <p className="text-emerald-100 text-xs sm:text-sm max-w-xl">
                  Tim akuakultur JagoFarm siap mendesain kolam, instalasi aerasi, atau sistem filtrasi sesuai ukuran lahan Anda.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 z-10 w-full md:w-auto">
                <a href="https://wa.me/6281234567890" rel="noopener noreferrer" target="_blank"
                  className="px-5 py-3 rounded-xl bg-white text-primary font-bold text-xs hover:bg-surface-container-low transition-colors flex items-center justify-center gap-2 shadow-md">
                  <Icon name="chat" size={16} className="text-primary" />
                  <span>Tanya Tim Ahli via WhatsApp</span>
                </a>
              </div>
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
            <div key={i} className="rounded-2xl border border-border bg-card p-3">
              <Skeleton className="aspect-square rounded-xl" />
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