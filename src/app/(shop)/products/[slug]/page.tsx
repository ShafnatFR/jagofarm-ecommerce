"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Star, ShoppingCart, Heart, Minus, Plus, Truck,
  Shield, ChevronRight, AlertCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn, formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCartStore } from "@/lib/cart-store";

interface ApiProduct {
  id: string; name: string; slug: string; description?: string;
  shortDesc?: string; basePrice: number; discountPrice?: number | null;
  sku?: string; weightGram?: number; stock?: number;
  images: { url: string; altText?: string | null; isPrimary?: boolean }[];
  category: { id: string; name: string; slug: string };
  variants?: { id: string; name: string; priceModifier?: number }[];
  _count?: { reviews?: number };
}

interface Review {
  id: string; user: string; rating: number; comment: string; date: string;
}

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const addItem = useCartStore((s) => s.addItem);

  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    async function fetchProduct() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/products/${slug}`);
        if (!res.ok) throw new Error("Produk tidak ditemukan");
        const data = await res.json();
        setProduct(data);
        // Try fetching reviews
        try {
          const revRes = await fetch(`/api/reviews?productId=${data.id}`);
          if (revRes.ok) {
            const revData = await revRes.json();
            setReviews(revData.reviews ?? []);
          }
        } catch { /* reviews optional */ }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [slug]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <Skeleton className="mb-6 h-4 w-64" />
        <div className="grid gap-8 lg:grid-cols-2">
          <Skeleton className="aspect-square rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
        <h1 className="mt-4 text-2xl font-bold">Produk Tidak Ditemukan</h1>
        <p className="mt-2 text-muted-foreground">{error ?? "Produk tidak tersedia."}</p>
        <Link href="/products" className="mt-6 inline-block"><Button>Kembali ke Produk</Button></Link>
      </div>
    );
  }

  const variant = product.variants?.[selectedVariant];
  const priceMod = variant?.priceModifier ?? 0;
  const basePrice = product.basePrice + priceMod;
  const displayPrice = (product.discountPrice ?? product.basePrice) + priceMod;
  const hasDiscount = product.discountPrice != null && product.discountPrice < product.basePrice;
  const images = product.images?.length > 0 ? product.images : [{ url: "/placeholder-product.jpg", altText: product.name }];

  function handleAddToCart() {
    addItem({
      id: `${product!.id}${variant ? `-${variant.id}` : ""}`,
      productId: product!.id,
      variantId: variant?.id,
      name: product!.name + (variant ? ` (${variant.name})` : ""),
      price: displayPrice,
      quantity,
      image: images[0]?.url,
      weightGram: product!.weightGram ?? 0,
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">Beranda</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/products" className="hover:text-primary">Produk</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/products?category=${product.category.slug}`} className="hover:text-primary">
          {product.category.name}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Image Gallery */}
        <div>
          <motion.div key={selectedImage} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="relative aspect-square overflow-hidden rounded-xl bg-secondary">
            <Image src={images[selectedImage]?.url} alt={images[selectedImage]?.altText ?? product.name}
              fill className="object-cover" priority />
            {hasDiscount && (
              <span className="absolute left-4 top-4 rounded-full bg-destructive px-3 py-1 text-sm font-bold text-white">
                -{Math.round(((product.basePrice - product.discountPrice!) / product.basePrice) * 100)}%
              </span>
            )}
          </motion.div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-3">
              {images.map((img, i) => (
                <button key={i} onClick={() => setSelectedImage(i)}
                  className={cn("relative h-20 w-20 overflow-hidden rounded-lg border-2 transition-colors",
                    selectedImage === i ? "border-primary" : "border-transparent hover:border-border")}>
                  <Image src={img.url} alt={img.altText ?? ""} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <p className="text-sm text-muted-foreground">{product.category.name}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{product.name}</h1>
          <div className="mt-4">
            {hasDiscount && <p className="text-lg text-muted-foreground line-through">{formatPrice(basePrice)}</p>}
            <p className="text-3xl font-bold text-primary">{formatPrice(displayPrice)}</p>
          </div>
          {product.shortDesc && (
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{product.shortDesc}</p>
          )}

          {/* Variants */}
          {product.variants && product.variants.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold">Pilih Varian</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.variants.map((v, i) => (
                  <button key={v.id} onClick={() => setSelectedVariant(i)}
                    className={cn("rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                      selectedVariant === i ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary")}>
                    {v.name}
                    {(v.priceModifier ?? 0) > 0 && (
                      <span className="ml-1 text-xs opacity-70">(+{formatPrice(v.priceModifier!)})</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity + Add to cart */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-lg border border-input">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-2 transition-colors hover:bg-secondary">
                <Minus className="h-4 w-4" />
              </button>
              <span className="min-w-[3rem] text-center text-sm font-medium">{quantity}</span>
              <button onClick={() => setQuantity(Math.min(product.stock ?? 99, quantity + 1))}
                className="px-3 py-2 transition-colors hover:bg-secondary">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <Button size="lg" className="flex-1 sm:flex-none" onClick={handleAddToCart}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              {addedToCart ? "Ditambahkan ✓" : "Tambah ke Keranjang"}
            </Button>
          </div>

          {product.stock != null && (
            <p className="mt-3 text-sm text-muted-foreground">
              Stok: <span className="font-medium text-primary">{product.stock} tersedia</span>
            </p>
          )}

          <div className="mt-6 space-y-2 rounded-xl bg-secondary/50 p-4">
            <div className="flex items-center gap-2 text-sm">
              <Truck className="h-4 w-4 text-primary" />
              <span>Gratis ongkir untuk pembelian di atas Rp 500.000</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 text-primary" />
              <span>Garansi 7 hari untuk kerusakan pengiriman</span>
            </div>
          </div>

          <div className="mt-4 flex gap-6 text-sm text-muted-foreground">
            {product.sku && <span>SKU: {product.sku}</span>}
            {product.weightGram && <span>Berat: {(product.weightGram / 1000).toFixed(1)} kg</span>}
          </div>
        </div>
      </div>

      {/* Description + Reviews */}
      <div className="mt-12 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold">Deskripsi Produk</h2>
          <div className="mt-4 prose prose-sm max-w-none text-muted-foreground">
            {(product.description ?? "").split("\n").map((line, i) => (
              <p key={i} className={line.startsWith("- ") ? "ml-4" : ""}>
                {line.replace("- ", "• ")}
              </p>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold">Ulasan ({reviews.length})</h2>
          {reviews.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Belum ada ulasan.</p>
          ) : (
            <div className="mt-4 space-y-4">
              {reviews.map((r) => (
                <div key={r.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{r.user}</span>
                    <span className="text-xs text-muted-foreground">{r.date}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={cn("h-3 w-3",
                        i < r.rating ? "fill-accent text-accent" : "text-muted")} />
                    ))}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
