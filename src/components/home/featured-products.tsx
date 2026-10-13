"use client";

import { useState } from "react";
import { ProductCard } from "@/components/product/product-card";
import { cn } from "@/lib/utils";

/** Satu produk unggulan untuk grid (data sudah di-serialisasi dari server). */
export interface FeaturedProductItem {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  discountPrice: number | null;
  image: string;
  categoryName: string;
  categorySlug: string;
  isFeatured: boolean;
  weightGram: number | null;
  /** Rata-rata rating dari review approved; undefined kalau belum ada review. */
  rating?: number;
  reviewCount: number;
}

interface FeaturedProductsProps {
  products: FeaturedProductItem[];
}

/** Chip filter kategori — slug menyesuaikan kategori katalog homepage. */
const FILTERS = [
  { label: "Semua", slug: null },
  { label: "IoT & Smart Sensor", slug: "iot-smart-farming" },
  { label: "Set Kolam Tambak", slug: "set-tambak" },
  { label: "Hidroponik & Nutrisi", slug: "set-hidroponik" },
] as const;

/**
 * Section "Produk Unggulan" dengan chip filter kategori yang berfungsi:
 * state aktif disimpan di client dan menyaring grid di bawahnya tanpa
 * reload halaman. Teks header & CTA tetap dirender oleh server component.
 */
export function FeaturedProducts({ products }: FeaturedProductsProps) {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  const visibleProducts =
    activeSlug === null
      ? products
      : products.filter((p) => p.categorySlug === activeSlug);

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <span className="text-label-md font-label-md uppercase tracking-wider text-secondary font-bold">Produk Teruji</span>
          <h2 className="text-headline-lg font-headline-lg text-on-surface mt-1">Produk Unggulan</h2>
          <p className="text-body-md font-body-md text-on-surface-variant mt-1">Pilihan terbaik petani modern Indonesia dengan garansi resmi</p>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 custom-scrollbar">
          {FILTERS.map((filter) => {
            const isActive = activeSlug === filter.slug;
            return (
              <button
                key={filter.label}
                type="button"
                onClick={() => setActiveSlug(filter.slug)}
                aria-pressed={isActive}
                className={cn(
                  "px-4 py-1.5 rounded-full text-label-md font-label-md whitespace-nowrap",
                  isActive
                    ? "bg-primary text-on-primary shadow-sm"
                    : "bg-surface-container-lowest hover:bg-surface-container text-on-surface-variant border border-outline-variant transition-colors"
                )}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {visibleProducts.map((p, i) => (
          <ProductCard
            key={p.id}
            index={i}
            product={{
              id: p.id,
              name: p.name,
              slug: p.slug,
              price: p.basePrice,
              discountPrice: p.discountPrice,
              image: p.image,
              category: p.categoryName,
              isFeatured: p.isFeatured,
              weightGram: p.weightGram ?? undefined,
              rating: p.rating,
              reviewCount: p.reviewCount,
            }}
          />
        ))}
        {visibleProducts.length === 0 && (
          <p className="col-span-full text-center text-on-surface-variant py-8">
            {products.length === 0
              ? "Belum ada produk unggulan."
              : "Belum ada produk unggulan pada kategori ini."}
          </p>
        )}
      </div>
    </>
  );
}
