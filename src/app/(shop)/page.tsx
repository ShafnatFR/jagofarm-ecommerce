"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight, Droplets, Sprout, Fish, Cpu, Leaf, Egg,
  Truck, Shield, Headphones, CreditCard, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

const categoryIcons: Record<string, React.ElementType> = {
  "set-tambak": Droplets, "set-hidroponik": Sprout,
  "set-aquaponik": Fish, "iot-smart-farming": Cpu,
  benih: Leaf, "anakan-ikan": Egg,
};

const features = [
  { icon: Truck, title: "Pengiriman Cepat", desc: "Kirim ke seluruh Indonesia" },
  { icon: Shield, title: "Garansi Produk", desc: "Jaminan kualitas 100%" },
  { icon: Headphones, title: "Konsultasi Gratis", desc: "Tim ahli siap membantu" },
  { icon: CreditCard, title: "Pembayaran Aman", desc: "Midtrans & transfer bank" },
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

  // Set bundle terlaris diambil dari katalog unggulan yang sudah di-fetch
  // (tag "bestseller" kalau ada, kalau tidak produk dengan harga tertinggi).
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
                  <f.icon className="h-5 w-5 text-primary" />
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
            Lihat Semua <ArrowRight className="h-4 w-4" />
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
              <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
              <p className="mt-2 text-sm text-muted-foreground">{error}</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="col-span-full py-8 text-center text-muted-foreground">Belum ada kategori.</div>
          ) : (
            categories.map((cat) => {
              const Icon = categoryIcons[cat.slug] || Leaf;
              return (
                <Link key={cat.slug} href={`/products?category=${cat.slug}`}
                  className="group flex flex-col items-center rounded-xl border border-border bg-card p-5 text-center transition-all hover:border-primary hover:shadow-md">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary transition-colors group-hover:bg-primary/10">
                    <Icon className="h-7 w-7 text-primary" />
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
              Lihat Semua <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-6">
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
              <div className="py-12 text-center">
                <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
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
            <Link href="/products">
              <Button variant="secondary">Lihat Semua Produk <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Set Bundle Terlaris */}
      <BundleHighlight product={bundleProduct} />

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="rounded-2xl bg-primary p-8 text-center text-primary-foreground sm:p-12">
          <h2 className="text-2xl font-bold sm:text-3xl">Butuh Konsultasi untuk Proyek Pertanian Anda?</h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/80">
            Tim ahli JagoFarm siap membantu merancang sistem pertanian modern
            yang sesuai dengan kebutuhan dan budget Anda.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/products"><Button size="lg" variant="accent">Mulai Belanja</Button></Link>
            <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="secondary" className="border-white/30 text-white hover:bg-white/10">
                Chat via WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
