"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, ShoppingCart, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { cn, formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    discountPrice?: number | null;
    image: string;
    rating?: number;
    reviewCount?: number;
    category: string;
    isFeatured?: boolean;
  };
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const displayPrice = product.discountPrice ?? product.price;
  const hasDiscount = product.discountPrice != null && product.discountPrice < product.price;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group relative overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-lg"
    >
      {/* Image */}
      <Link href={`/products/${product.slug}`} className="block overflow-hidden">
        <div className="relative aspect-square bg-secondary">
          <Image
            src={product.image || "/placeholder-product.jpg"}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
          {hasDiscount && (
            <span className="absolute left-2 top-2 rounded-full bg-destructive px-2.5 py-0.5 text-xs font-bold text-white">
              -{Math.round(((product.price - product.discountPrice!) / product.price) * 100)}%
            </span>
          )}
          {product.isFeatured && !hasDiscount && (
            <span className="absolute left-2 top-2 rounded-full bg-accent px-2.5 py-0.5 text-xs font-bold text-white">
              Unggulan
            </span>
          )}
        </div>
      </Link>

      {/* Wishlist button */}
      <button className="absolute right-3 top-3 rounded-full bg-white/80 p-1.5 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white">
        <Heart className="h-4 w-4 text-muted-foreground" />
      </button>

      {/* Content */}
      <div className="p-3">
        <p className="text-xs text-muted-foreground">{product.category}</p>
        <Link href={`/products/${product.slug}`}>
          <h3 className="mt-1 text-sm font-medium leading-snug line-clamp-2 hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        {product.rating != null && (
          <div className="mt-1.5 flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-accent text-accent" />
            <span className="text-xs font-medium">{product.rating.toFixed(1)}</span>
            {product.reviewCount != null && (
              <span className="text-xs text-muted-foreground">
                ({product.reviewCount})
              </span>
            )}
          </div>
        )}

        {/* Price + Add to cart */}
        <div className="mt-2 flex items-end justify-between">
          <div>
            {hasDiscount && (
              <p className="text-xs text-muted-foreground line-through">
                {formatPrice(product.price)}
              </p>
            )}
            <p className={cn("font-bold text-primary", hasDiscount ? "text-sm" : "text-base")}>
              {formatPrice(displayPrice)}
            </p>
          </div>
          <Button size="icon" variant="primary" className="h-8 w-8 rounded-lg">
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
