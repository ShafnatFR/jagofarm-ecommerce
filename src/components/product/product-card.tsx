"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { MouseEvent } from "react";
import { Icon } from "@/components/ui/icon";
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
    /** Produk dijual dalam beberapa varian (harga & stok per varian). */
    hasVariants?: boolean;
    /** Harga terendah & tertinggi antar varian aktif. */
    minPrice?: number | null;
    maxPrice?: number | null;
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

  /*
   * Produk bervarian: tampilkan rentang harga varian (mis. "Rp150.000 -
   * Rp500.000"). Kalau semua varian berharga sama, atau hanya ada satu,
   * cukup satu harga — rentang "Rp150.000 - Rp150.000" terlihat seperti bug.
   */
  const isVariantProduct = Boolean(product.hasVariants);
  const variantMin = product.minPrice ?? null;
  const variantMax = product.maxPrice ?? null;
  const hasPriceRange =
    isVariantProduct &&
    variantMin != null &&
    variantMax != null &&
    variantMax > variantMin;

  /** Label harga yang tampil di kartu. */
  const priceLabel = hasPriceRange
    ? `${formatPrice(variantMin)} - ${formatPrice(variantMax)}`
    : formatPrice(isVariantProduct && variantMin != null ? variantMin : displayPrice);

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
      className="group relative overflow-hidden rounded-2xl border border-outline-variant bg-surface transition-all duration-300 hover:shadow-lg hover:border-primary/40"
    >
      {/* Image */}
      <Link href={`/products/${product.slug}`} className="block overflow-hidden">
        <div className="relative aspect-square bg-surface-container-low overflow-hidden">
          <Image
            src={product.image || "/placeholder-product.png"}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
          {hasDiscount && (
            <span className="absolute left-2.5 top-2.5 rounded-full bg-[#9f2c25] px-2.5 py-0.5 text-[11px] font-bold text-white shadow-xs">
              -{Math.round(((product.price - product.discountPrice!) / product.price) * 100)}%
            </span>
          )}
          {product.isFeatured && !hasDiscount && (
            <span className="absolute left-2.5 top-2.5 rounded-full bg-lime text-forest-deep px-2.5 py-0.5 text-[11px] font-bold shadow-xs">
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
          "absolute right-2.5 top-2.5 rounded-full bg-surface/85 hover:bg-surface text-on-surface border border-outline-variant/60 p-1.5 backdrop-blur-xs transition-all duration-200 disabled:cursor-not-allowed shadow-xs",
          wishlisted ? "opacity-100 text-error" : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
        )}
      >
        {pending ? (
          <Icon name="progress_activity" size={16} className="animate-spin text-on-surface-variant" />
        ) : (
          <Icon name="favorite" size={16} />
        )}
      </button>

      {/* Content */}
      <div className="p-3.5">
        <p className="text-xs font-medium text-secondary">{product.category}</p>
        <Link href={`/products/${product.slug}`}>
          <h3 className="mt-1 text-sm font-semibold leading-snug line-clamp-2 text-on-surface hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        {product.rating != null && (
          <div className="mt-1.5 flex items-center gap-1">
            <Icon name="star" size={13} className="fill-secondary text-secondary" />
            <span className="text-xs font-medium text-on-surface">{product.rating.toFixed(1)}</span>
            {product.reviewCount != null && (
              <span className="text-xs text-on-surface-variant">
                ({product.reviewCount})
              </span>
            )}
          </div>
        )}

        {/* Price + Add to cart */}
        <div className="mt-2.5 flex items-end justify-between gap-2">
          <div className="min-w-0">
            {hasDiscount && !isVariantProduct && (
              <p className="text-xs text-on-surface-variant line-through">
                {formatPrice(product.price)}
              </p>
            )}
            <p
              className={cn(
                "font-serif font-bold text-primary",
                hasPriceRange ? "text-sm leading-tight" : hasDiscount ? "text-base" : "text-lg"
              )}
            >
              {priceLabel}
            </p>
            {hasPriceRange && (
              <p className="text-[10px] text-on-surface-variant">
                {variantMin === null ? "" : "Harga per varian"}
              </p>
            )}
          </div>
          {isVariantProduct ? (
            // Produk bervarian wajib dipilih variannya dulu di halaman detail;
            // menambah ke keranjang tanpa varian akan membuat harga tidak pasti.
            <Button
              size="sm"
              variant="secondary"
              className="h-8 shrink-0 rounded-xl px-3 text-xs"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                router.push(`/products/${product.slug}`);
              }}
              aria-label="Pilih varian produk"
            >
              Pilih Varian
            </Button>
          ) : (
            <Button
              size="icon"
              variant="primary"
              className="h-8 w-8 rounded-xl bg-primary hover:bg-primary-container text-on-primary shadow-xs"
              onClick={handleAddToCart}
              aria-label="Tambah ke keranjang"
            >
              <Icon name="shopping_cart" size={16} />
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
