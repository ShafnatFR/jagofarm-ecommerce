"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Star,
  ShoppingCart,
  Heart,
  Minus,
  Plus,
  Truck,
  Shield,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn, formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// Mock product — replace with Prisma query
const product = {
  id: "1",
  name: "Set Hidroponik NFT 6 Lubang — Starter Kit",
  slug: "set-hidroponik-nft-6-lubang",
  description: `Set hidroponik NFT (Nutrient Film Technique) 6 lubang adalah solusi sempurna untuk memulai berkebun hidroponik di rumah. Sistem ini menggunakan teknik aliran nutrisi tipis yang memastikan akar tanaman mendapat oksigen dan nutrisi secara optimal.\n\n**Spesifikasi:**\n- Ukuran: 100 x 40 x 80 cm\n- Bahan: PVC food grade\n- Kapasitas: 6 tanaman\n- Pompa air: 5 watt\n- Include: Net pot, rockwool, nutrisi AB Mix starter\n\n**Cocok untuk:** Selada, kangkung, bayam, pakcoy, dan sayuran daun lainnya.`,
  shortDesc: "Sistem hidroponik NFT siap pakai untuk 6 tanaman sayuran daun",
  basePrice: 850000,
  discountPrice: 699000,
  sku: "JF-HNFT-006",
  stock: 25,
  images: [
    { url: "/products/hidroponik-nft-6.jpg", alt: "Set Hidroponik NFT 6", isPrimary: true },
    { url: "/products/hidroponik-nft-6-2.jpg", alt: "Detail pompa", isPrimary: false },
    { url: "/products/hidroponik-nft-6-3.jpg", alt: "Hasil panen", isPrimary: false },
  ],
  variants: [
    { id: "v1", name: "6 Lubang (Starter)", priceModifier: 0 },
    { id: "v2", name: "12 Lubang (Medium)", priceModifier: 400000 },
    { id: "v3", name: "24 Lubang (Pro)", priceModifier: 1200000 },
  ],
  rating: 4.8,
  reviewCount: 124,
  category: "Set Hidroponik",
  weightGram: 3500,
};

const reviews = [
  {
    id: "r1",
    user: "Budi S.",
    rating: 5,
    comment: "Kualitas sangat bagus! Sudah 3 bulan pakai dan hasil panen melimpah. Pengemasan juga rapi.",
    date: "2 minggu lalu",
  },
  {
    id: "r2",
    user: "Siti A.",
    rating: 4,
    comment: "Produk sesuai deskripsi. Cuma pompa agak berisik, tapi overall recommended.",
    date: "1 bulan lalu",
  },
  {
    id: "r3",
    user: "Andi P.",
    rating: 5,
    comment: "Paket lengkap, tinggal pakai. Cocok buat pemula yang mau coba hidroponik.",
    date: "1 bulan lalu",
  },
];

export default function ProductDetailPage() {
  const params = useParams();
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const variant = product.variants[selectedVariant];
  const price = product.basePrice + variant.priceModifier;
  const displayPrice = (product.discountPrice ?? product.basePrice) + variant.priceModifier;
  const hasDiscount = product.discountPrice != null && product.discountPrice < product.basePrice;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">Beranda</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/products" className="hover:text-primary">Produk</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/products?category=${product.category.toLowerCase().replace(/ /g, "-")}`} className="hover:text-primary">
          {product.category}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Image Gallery */}
        <div>
          <motion.div
            key={selectedImage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative aspect-square overflow-hidden rounded-xl bg-secondary"
          >
            <Image
              src={product.images[selectedImage]?.url || "/placeholder-product.jpg"}
              alt={product.images[selectedImage]?.alt || product.name}
              fill
              className="object-cover"
              priority
            />
            {hasDiscount && (
              <span className="absolute left-4 top-4 rounded-full bg-destructive px-3 py-1 text-sm font-bold text-white">
                -{Math.round(((product.basePrice - product.discountPrice!) / product.basePrice) * 100)}%
              </span>
            )}
          </motion.div>
          <div className="mt-3 flex gap-3">
            {product.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setSelectedImage(i)}
                className={cn(
                  "relative h-20 w-20 overflow-hidden rounded-lg border-2 transition-colors",
                  selectedImage === i ? "border-primary" : "border-transparent hover:border-border"
                )}
              >
                <Image src={img.url} alt={img.alt} fill className="object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div>
          <p className="text-sm text-muted-foreground">{product.category}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            {product.name}
          </h1>

          {/* Rating */}
          <div className="mt-2 flex items-center gap-2">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-4 w-4",
                    i < Math.round(product.rating)
                      ? "fill-accent text-accent"
                      : "text-muted"
                  )}
                />
              ))}
            </div>
            <span className="text-sm font-medium">{product.rating}</span>
            <span className="text-sm text-muted-foreground">
              ({product.reviewCount} ulasan)
            </span>
          </div>

          {/* Price */}
          <div className="mt-4">
            {hasDiscount && (
              <p className="text-lg text-muted-foreground line-through">
                {formatPrice(price)}
              </p>
            )}
            <p className="text-3xl font-bold text-primary">
              {formatPrice(displayPrice)}
            </p>
          </div>

          {/* Short description */}
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            {product.shortDesc}
          </p>

          {/* Variants */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold">Pilih Varian</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {product.variants.map((v, i) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVariant(i)}
                  className={cn(
                    "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                    selectedVariant === i
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-primary"
                  )}
                >
                  {v.name}
                  {v.priceModifier > 0 && (
                    <span className="ml-1 text-xs opacity-70">
                      (+{formatPrice(v.priceModifier)})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity + Add to cart */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-lg border border-input">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-2 transition-colors hover:bg-secondary"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="min-w-[3rem] text-center text-sm font-medium">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                className="px-3 py-2 transition-colors hover:bg-secondary"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <Button size="lg" className="flex-1 sm:flex-none">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Tambah ke Keranjang
            </Button>
            <Button size="lg" variant="secondary" className="px-4">
              <Heart className="h-4 w-4" />
            </Button>
          </div>

          {/* Stock */}
          <p className="mt-3 text-sm text-muted-foreground">
            Stok: <span className="font-medium text-primary">{product.stock} tersedia</span>
          </p>

          {/* Benefits */}
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

          {/* SKU & Weight */}
          <div className="mt-4 flex gap-6 text-sm text-muted-foreground">
            <span>SKU: {product.sku}</span>
            <span>Berat: {(product.weightGram / 1000).toFixed(1)} kg</span>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="mt-12 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold">Deskripsi Produk</h2>
          <div className="mt-4 prose prose-sm max-w-none text-muted-foreground">
            {product.description.split("\n").map((line, i) => (
              <p key={i} className={line.startsWith("- ") ? "ml-4" : ""}>
                {line.replace("- ", "• ")}
              </p>
            ))}
          </div>
        </div>

        {/* Reviews */}
        <div>
          <h2 className="text-xl font-bold">Ulasan ({reviews.length})</h2>
          <div className="mt-4 space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{review.user}</span>
                  <span className="text-xs text-muted-foreground">{review.date}</span>
                </div>
                <div className="mt-1 flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-3 w-3",
                        i < review.rating ? "fill-accent text-accent" : "text-muted"
                      )}
                    />
                  ))}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
