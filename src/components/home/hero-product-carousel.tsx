"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

export interface HeroProduct {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  discountPrice: number | null;
  imageUrl: string;
  categoryName: string;
}

interface Props {
  products: HeroProduct[];
  intervalMs?: number;
}

export function HeroProductCarousel({ products, intervalMs = 4000 }: Props) {
  const [index, setIndex] = useState(0);
  const total = products.length;

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % total);
  }, [total]);

  useEffect(() => {
    if (total <= 1) return;
    const timer = setInterval(next, intervalMs);
    return () => clearInterval(timer);
  }, [next, intervalMs, total]);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center aspect-[16/10] rounded-2xl bg-white/10 border border-white/20">
        <p className="text-primary-fixed-dim text-body-md">Produk segera hadir</p>
      </div>
    );
  }

  const p = products[index];
  const price = p.discountPrice ?? p.basePrice;

  return (
    <div className="relative rounded-2xl overflow-hidden bg-surface-container-highest/20 border border-white/10">
      <AnimatePresence mode="wait">
        <motion.div
          key={p.id}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.5 }}
        >
          <Link href={`/products/${p.slug}`} className="block relative aspect-[16/10] group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              alt={p.name}
              src={p.imageUrl || "/placeholder-product.png"}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <span className="text-label-sm font-label-sm bg-secondary-fixed-dim text-primary px-2.5 py-0.5 rounded-full font-bold">
                {p.categoryName}
              </span>
              <h3 className="text-headline-md font-headline-md text-white mt-2 line-clamp-1">
                {p.name}
              </h3>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-headline-sm font-headline-sm text-white font-bold">
                  Rp {price.toLocaleString("id-ID")}
                </p>
                {p.discountPrice && (
                  <p className="text-label-md font-label-md text-white/60 line-through">
                    Rp {p.basePrice.toLocaleString("id-ID")}
                  </p>
                )}
              </div>
            </div>
          </Link>
        </motion.div>
      </AnimatePresence>

      {/* Dots */}
      {total > 1 && (
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
          {products.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Produk ${i + 1}`}
              className={`transition-all duration-300 rounded-full ${
                i === index
                  ? "w-5 h-2 bg-secondary-fixed-dim"
                  : "w-2 h-2 bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}