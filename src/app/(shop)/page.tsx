"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { ProductCard } from "@/components/product/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { BundleHighlight, pickBundleProduct } from "@/components/home/bundle-highlight";

interface ApiCategory {
  id: string; name: string; slug: string; description?: string | null;
  imageUrl?: string | null; sortOrder?: number;
}
interface ApiProduct {
  id: string; name: string; slug: string; basePrice: number;
  discountPrice?: number | null; isFeatured?: boolean;
  shortDesc?: string | null; description?: string | null;
  tags?: string[] | null;
  weightGram?: number;
  images: { url: string; altText?: string | null; isPrimary?: boolean }[];
  category: { id: string; name: string; slug: string };
  _count?: { reviews?: number };
}

const categoryIcons: Record<string, string> = {
  "set-tambak": "water_drop",
  "set-hidroponik": "grass",
  "set-aquaponik": "phishing",
  "iot-smart-farming": "memory",
  benih: "eco",
  "anakan-ikan": "egg",
};

const features = [
  { icon: "local_shipping", title: "Pengiriman Cepat", desc: "Kirim ke seluruh Indonesia" },
  { icon: "verified_user", title: "Garansi Produk", desc: "Jaminan kualitas 100%" },
  { icon: "support_agent", title: "Konsultasi Gratis", desc: "Tim ahli siap membantu" },
  { icon: "credit_card", title: "Pembayaran Aman", desc: "Midtrans & transfer bank" },
];

export default function HomePage() {
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [catRes, prodRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/products/featured"),
        ]);
        if (!catRes.ok || !prodRes.ok) throw new Error("Gagal memuat data");
        const catData = await catRes.json();
        const prodData = await prodRes.json();
        setCategories(catData.categories ?? []);
        setProducts(prodData.products ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const bundleProduct = pickBundleProduct(products);

  return (
    <>
      {/* Hero carousel */}
      <HeroCarousel />

      {/* Features bar */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {features.map((f) => (
              <div key={f.title} className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                  <Icon name={f.icon} size={20} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{f.title}</p>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Kategori Produk</h2>
            <p className="mt-1 text-muted-foreground">Temukan kebutuhan pertanian modern Anda</p>
          </div>
          <Link href="/products" className="hidden text-sm font-medium text-primary hover:underline sm:flex items-center gap-1">
            Lihat Semua <Icon name="arrow_forward" size={16} />
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center rounded-xl border border-border bg-card p-5">
                <Skeleton className="h-14 w-14 rounded-full" />
                <Skeleton className="mt-3 h-4 w-20" />
                <Skeleton className="mt-1 h-3 w-16" />
              </div>
            ))
          ) : error ? (
            <div className="col-span-full py-8 text-center">
              <Icon name="error" size={32} className="mx-auto text-destructive" />
              <p className="mt-2 text-sm text-muted-foreground">{error}</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="col-span-full py-8 text-center text-muted-foreground">Belum ada kategori.</div>
          ) : (
            categories.map((cat) => {
              const iconName = categoryIcons[cat.slug] || "eco";
              return (
                <Link key={cat.slug} href={`/products?category=${cat.slug}`}
                  className="group flex flex-col items-center rounded-2xl border border-border bg-card p-5 text-center transition-all hover:border-primary hover:shadow-md">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary transition-colors group-hover:bg-primary/10">
                    <Icon name={iconName} size={28} className="text-primary" />
                  </div>
                  <h3 className="mt-3 text-sm font-semibold">{cat.name}</h3>
                  {cat.description && (
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{cat.description}</p>
                  )}
                </Link>
              );
            })
          )}
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-secondary/50">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Produk Unggulan</h2>
              <p className="mt-1 text-muted-foreground">Pilihan terbaik petani modern Indonesia</p>
            </div>
            <Link href="/products" className="hidden text-sm font-medium text-primary hover:underline sm:flex items-center gap-1">
              Lihat Semua <Icon name="arrow_forward" size={16} />
            </Link>
          </div>
          <div className="mt-6">
            {loading ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
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
              <div className="py-12 text-center">
                <Icon name="error" size={32} className="mx-auto text-destructive" />
                <p className="mt-2 text-sm text-muted-foreground">{error}</p>
              </div>
            ) : products.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">Belum ada produk unggulan.</div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {products.map((p, i) => (
                  <ProductCard key={p.id} index={i} product={{
                    id: p.id, name: p.name, slug: p.slug,
                    price: p.basePrice, discountPrice: p.discountPrice,
                    image: p.images?.[0]?.url || "/placeholder-product.png",
                    category: p.category.name, isFeatured: p.isFeatured,
                  }} />
                ))}
              </div>
            )}
          </div>
          <div className="mt-8 text-center sm:hidden">
            <Link href="/products" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-secondary text-foreground font-semibold text-sm hover:bg-slate-200 transition-colors">
              Lihat Semua Produk <Icon name="arrow_forward" size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Set Bundle Terlaris */}
      <BundleHighlight product={bundleProduct} />

      {/* CTA / Consultation */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="rounded-2xl bg-gradient-to-r from-primary to-emerald-800 p-8 text-center text-primary-foreground sm:p-12 relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -left-10 -top-10 w-64 h-64 bg-emerald-300/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-2xl font-bold sm:text-3xl">Butuh Konsultasi untuk Proyek Pertanian Anda?</h2>
            <p className="mx-auto mt-3 max-w-xl text-primary-foreground/80">
              Tim ahli JagoFarm siap membantu merancang sistem pertanian modern
              yang sesuai dengan kebutuhan dan budget Anda.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/products">
                <span className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-slate-900 font-bold text-sm hover:bg-amber-400 transition-colors shadow-lg">
                  Mulai Belanja
                </span>
              </Link>
              <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer">
                <span className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 border border-white/30 text-white font-bold text-sm hover:bg-white/20 transition-colors">
                  <Icon name="chat" size={18} />
                  Chat via WhatsApp
                </span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}