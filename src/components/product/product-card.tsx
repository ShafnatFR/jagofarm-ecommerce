"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { MouseEvent } from "react";
import { Star, ShoppingCart, Heart, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn, formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { useCartStore } from "@/lib/cart-store";

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
    /** Berat dalam gram (dipakai saat menambah ke keranjang). */
    weightGram?: number;
  };
  index?: number;
  /** Kondisi awal tombol hati (mis. dari GET /api/wishlist di halaman induk). */
  isWishlisted?: boolean;
  /** Dipanggil setelah perubahan wishlist berhasil/final. */
  onWishlistChange?: (productId: string, wishlisted: boolean) => void;
}

export function ProductCard({
  product,
  index = 0,
  isWishlisted,
  onWishlistChange,
}: ProductCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const addItem = useCartStore((s) => s.addItem);

  const displayPrice = product.discountPrice ?? product.price;
  const hasDiscount = product.discountPrice != null && product.discountPrice < product.price;

  const [wishlisted, setWishlisted] = useState(isWishlisted ?? false);
  const [pending, setPending] = useState(false);

  // Sinkronkan saat data induk berubah (mis. daftar wishlist baru dimuat).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sinkronisasi state hati saat prop isWishlisted berubah (nilai turunan dari prop)
    if (isWishlisted !== undefined) setWishlisted(isWishlisted);
  }, [isWishlisted]);

  /** Optimistic update + rollback kalau request gagal. */
  async function toggleWishlist(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (pending) return;

    const next = !wishlisted;
    setWishlisted(next);
    setPending(true);

    try {
      const res = await fetch("/api/wishlist", {
        method: next ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      });

      if (res.status === 401) {
        setWishlisted(!next);
        toast({
          variant: "destructive",
          title: "Silakan masuk dulu",
          description: "Anda perlu login untuk menyimpan produk ke wishlist.",
        });
        router.push(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }

      // 409 = produk sudah ada di wishlist: state akhir tetap terisi.
      if (!res.ok && !(res.status === 409 && next)) {
        throw new Error(`HTTP ${res.status}`);
      }

      onWishlistChange?.(product.id, next);
      toast({
        title: next ? "Ditambahkan ke wishlist" : "Dihapus dari wishlist",
        description: product.name,
      });
    } catch {
      setWishlisted(!next);
      toast({
        variant: "destructive",
        title: "Gagal memperbarui wishlist",
        description: "Periksa koneksi internet Anda lalu coba lagi.",
      });
    } finally {
      setPending(false);
    }
  }

  function handleAddToCart(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      price: displayPrice,
      quantity: 1,
      image: product.image || undefined,
      weightGram: product.weightGram ?? 0,
      slug: product.slug,
    });
    toast({
      title: "Ditambahkan ke keranjang",
      description: product.name,
    });
  }

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
      <button
        type="button"
        onClick={toggleWishlist}
        disabled={pending}
        aria-pressed={wishlisted}
        aria-label={wishlisted ? "Hapus dari wishlist" : "Simpan ke wishlist"}
        title={wishlisted ? "Hapus dari wishlist" : "Simpan ke wishlist"}
        className={cn(
          "absolute right-3 top-3 rounded-full bg-white/80 p-1.5 transition-opacity hover:bg-white disabled:cursor-not-allowed",
          wishlisted ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
        )}
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <Heart
            className={cn(
              "h-4 w-4",
              wishlisted ? "fill-destructive text-destructive" : "text-muted-foreground"
            )}
          />
        )}
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
          <Button
            size="icon"
            variant="primary"
            className="h-8 w-8 rounded-lg"
            onClick={handleAddToCart}
            aria-label="Tambah ke keranjang"
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
