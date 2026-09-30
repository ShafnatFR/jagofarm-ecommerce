"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { motion } from "framer-motion";
import { cn, formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ReviewForm } from "@/components/product/review-form";
import { useCartStore } from "@/lib/cart-store";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

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

interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  distribution: Record<string, number>;
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

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
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(null);
  const [activeTab, setActiveTab] = useState<"deskripsi" | "ulasan" | "tanya">("deskripsi");

  /** Muat ulasan + ringkasan rating; dipakai saat halaman dibuka dan setelah kirim ulasan. */
  async function loadReviews(productId: string) {
    try {
      const res = await fetch(`/api/reviews?productId=${productId}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = await res.json();
      setReviews(data.reviews ?? []);
      setReviewSummary(data.summary ?? null);
    } catch {
      /* ulasan opsional: kegagalan muat tidak boleh menggagalkan halaman */
    }
  }

  useEffect(() => {
    async function fetchProduct() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/products/${slug}`);
        if (!res.ok) throw new Error("Produk tidak ditemukan");
        const data = await res.json();
        setProduct(data);
        await loadReviews(data.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [slug]);

  /* ---------- Loading skeleton ---------- */
  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-8 py-8">
        <Skeleton className="mb-6 h-4 w-64" />
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5 space-y-4">
            <Skeleton className="aspect-square rounded-3xl" />
            <div className="grid grid-cols-4 gap-3">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="aspect-square rounded-2xl" />
              ))}
            </div>
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
          <div className="lg:col-span-7 space-y-6">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  /* ---------- Error ---------- */
  if (error || !product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <Icon name="info" size={48} className="mx-auto text-destructive" />
        <h1 className="mt-4 text-2xl font-bold">Produk Tidak Ditemukan</h1>
        <p className="mt-2 text-muted-foreground">{error ?? "Produk tidak tersedia."}</p>
        <Link href="/products" className="mt-6 inline-block"><Button>Kembali ke Produk</Button></Link>
      </div>
    );
  }

  /* ---------- Derived data ---------- */
  const variant = product.variants?.[selectedVariant];
  const priceMod = variant?.priceModifier ?? 0;
  const basePrice = product.basePrice + priceMod;
  const displayPrice = (product.discountPrice ?? product.basePrice) + priceMod;
  const hasDiscount = product.discountPrice != null && product.discountPrice < product.basePrice;
  const discountPct = hasDiscount
    ? Math.round(((product.basePrice - product.discountPrice!) / product.basePrice) * 100)
    : 0;
  const images = product.images?.length > 0
    ? product.images
    : [{ url: "/placeholder-product.png", altText: product.name }];

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
      slug: product!.slug,
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  }

  /* ---------- Star rating helpers ---------- */
  const avgRating = reviewSummary?.averageRating ?? 0;
  const totalReviews = reviewSummary?.totalReviews ?? reviews.length;

  /* ================================================================== */
  /*  RENDER                                                             */
  /* ================================================================== */
  return (
    <div className="bg-background min-h-screen">
      {/* BREADCRUMB */}
      <div className="bg-surface-container-low border-b border-outline-variant/40">
        <nav className="mx-auto max-w-7xl px-4 sm:px-8 py-3" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-xs sm:text-sm text-outline">
            <li className="flex items-center gap-1">
              <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1">
                <Icon name="home" size={16} />
                Beranda
              </Link>
            </li>
            <li className="text-outline-variant">/</li>
            <li><Link href="/products" className="hover:text-primary transition-colors">Produk</Link></li>
            <li className="text-outline-variant">/</li>
            <li>
              <Link
                href={`/products?category=${product.category.slug}`}
                className="hover:text-primary transition-colors"
              >
                {product.category.name}
              </Link>
            </li>
            <li className="text-outline-variant">/</li>
            <li className="text-primary font-semibold truncate max-w-[200px] sm:max-w-none">{product.name}</li>
          </ol>
        </nav>
      </div>

      {/* MAIN */}
      <main className="mx-auto max-w-7xl px-4 sm:px-8 py-8 w-full">
        {/* ---------- TOP SHOWCASE: 5-col gallery + 7-col info ---------- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mb-14">

          {/* ======== LEFT COLUMN: GALLERY (5 cols) ======== */}
          <div className="lg:col-span-5 space-y-4">
            {/* Main image */}
            <motion.div
              key={selectedImage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative bg-surface-container-lowest border border-outline-variant/70 rounded-3xl p-3 shadow-sm overflow-hidden group"
            >
              <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-secondary">
                <Image
                  src={images[selectedImage]?.url}
                  alt={images[selectedImage]?.altText ?? product.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  priority
                />
                {/* Discount badge */}
                {hasDiscount && (
                  <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/90 backdrop-blur-md text-secondary-fixed-dim text-xs font-bold shadow-md">
                    <Icon name="sell" size={15} filled className="text-secondary-fixed-dim" />
                    -{discountPct}%
                  </span>
                )}
                {/* Zoom button */}
                <button
                  className="absolute bottom-4 right-4 w-9 h-9 rounded-full bg-surface-container-lowest/90 backdrop-blur-md text-primary hover:bg-primary hover:text-on-primary flex items-center justify-center transition-colors shadow-md"
                  aria-label="Perbesar Foto"
                >
                  <Icon name="zoom_in" size={18} />
                </button>
              </div>
            </motion.div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={cn(
                      "relative rounded-2xl overflow-hidden aspect-square border-2 transition-all active:scale-95",
                      selectedImage === i
                        ? "border-primary ring-2 ring-primary/20 shadow-sm"
                        : "border-outline-variant hover:border-primary"
                    )}
                  >
                    <Image src={img.url} alt={img.altText ?? ""} fill className="object-cover" />
                    {selectedImage === i && (
                      <span className="absolute bottom-1 inset-x-1 text-[9px] bg-primary text-on-primary py-0.5 rounded text-center font-bold">
                        Utama
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Guarantee card */}
            <div className="p-4 rounded-2xl bg-primary-fixed/30 border border-primary-fixed-dim/60 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary text-secondary-fixed-dim flex items-center justify-center shrink-0">
                <Icon name="security" size={20} filled />
              </div>
              <div>
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider">Garansi Pengiriman</h4>
                <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                  Jika ada kerusakan saat pengiriman, sertakan video tanpa jeda. Kami kirim produk pengganti atau refund 100%.
                </p>
              </div>
            </div>
          </div>

          {/* ======== RIGHT COLUMN: PRODUCT INFO (7 cols) ======== */}
          <div className="lg:col-span-7 flex flex-col space-y-6">
            {/* Category + Status + SKU */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-1 rounded-md bg-surface-container text-primary text-xs font-bold uppercase tracking-wide">
                  {product.category.name}
                </span>
                <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 text-xs font-bold">
                  Kondisi Aktif &amp; Tersedia
                </span>
                {product.sku && (
                  <span className="text-xs text-outline font-medium">SKU: {product.sku}</span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-on-surface tracking-tight leading-snug">
                {product.name}
              </h1>

              {/* Rating & social proof */}
              <div className="flex items-center gap-4 flex-wrap text-sm pt-1">
                {avgRating > 0 && (
                  <div className="flex items-center gap-1.5 text-amber-500 font-bold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                    <span className="text-on-surface font-extrabold">{avgRating.toFixed(1)}</span>
                    <div className="flex items-center text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Icon key={i} name="star" size={16} filled className={i < Math.round(avgRating) ? "text-amber-400" : "text-gray-300"} />
                      ))}
                    </div>
                    <span className="text-outline text-xs font-normal ml-0.5">({totalReviews} ulasan)</span>
                  </div>
                )}
                <span className="text-outline-variant hidden sm:inline">•</span>
                <span className="text-on-surface-variant font-medium text-xs sm:text-sm">
                  Terjual <strong className="text-on-surface">140+ paket</strong>
                </span>
              </div>
            </div>

            {/* Pricing card */}
            <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-outline uppercase tracking-wider">Harga Spesial</span>
                <div className="flex items-baseline gap-2.5 mt-0.5">
                  <span className="text-3xl sm:text-4xl font-extrabold text-primary tracking-tight">
                    {formatPrice(displayPrice)}
                  </span>
                  {hasDiscount && (
                    <span className="text-sm text-muted-foreground line-through">
                      {formatPrice(basePrice)}
                    </span>
                  )}
                </div>
                {product.shortDesc && (
                  <p className="text-xs text-on-surface-variant mt-1">{product.shortDesc}</p>
                )}
              </div>
              {product.stock != null && (
                <div className="flex items-center gap-2 self-start sm:self-center">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                    Stok: {product.stock} tersedia
                  </span>
                </div>
              )}
            </div>

            {/* Variant selector */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-3">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Pilih Varian</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {product.variants.map((v, i) => {
                    const isSelected = selectedVariant === i;
                    const mod = v.priceModifier ?? 0;
                    return (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVariant(i)}
                        className={cn(
                          "flex flex-col items-start p-3 rounded-xl text-left transition-all",
                          isSelected
                            ? "border-2 border-primary bg-primary/5"
                            : "border border-outline-variant hover:border-primary/50 bg-surface-container-lowest opacity-80 hover:opacity-100"
                        )}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className={cn("text-sm", isSelected ? "font-bold text-primary" : "font-semibold text-on-surface")}>
                            {v.name}
                          </span>
                          {isSelected ? (
                            <Icon name="check_circle" size={18} filled className="text-primary" />
                          ) : mod > 0 ? (
                            <span className="text-[10px] font-bold bg-secondary-fixed-dim/40 text-secondary px-1.5 py-0.5 rounded">
                              +{formatPrice(mod)}
                            </span>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity + Dual CTA */}
            <div className="space-y-4 pt-2 border-t border-outline-variant/60">
              <div className="flex items-center gap-6">
                <span className="text-xs font-bold text-on-surface uppercase tracking-wider">Jumlah:</span>
                {/* Quantity stepper */}
                <div className="inline-flex items-center border border-outline-variant rounded-xl bg-surface-container-lowest shadow-sm overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors font-bold active:scale-95"
                    aria-label="Kurangi jumlah"
                  >
                    <Icon name="remove" size={18} />
                  </button>
                  <span className="w-14 text-center font-bold text-sm text-on-surface">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock ?? 99, quantity + 1))}
                    className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors font-bold active:scale-95"
                    aria-label="Tambah jumlah"
                  >
                    <Icon name="add" size={18} />
                  </button>
                </div>
                {product.weightGram && (
                  <span className="text-xs text-outline">
                    Total berat: <strong>{((product.weightGram * quantity) / 1000).toFixed(1)} kg</strong>
                  </span>
                )}
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full rounded-full border-2 border-primary text-primary hover:bg-primary/5 font-bold shadow-sm"
                  onClick={handleAddToCart}
                >
                  <Icon name="add_shopping_cart" size={20} className="mr-2" />
                  {addedToCart ? "Ditambahkan ✓" : "Tambah ke Keranjang"}
                </Button>
                <Button
                  size="lg"
                  className="w-full rounded-full bg-primary hover:bg-primary-container text-on-primary font-bold shadow-md shadow-primary/20"
                >
                  <Icon name="bolt" size={20} filled className="mr-2 text-secondary-fixed-dim" />
                  Beli Sekarang
                </Button>
              </div>
            </div>

            {/* Trust / benefit chips */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-surface-container-lowest border border-outline-variant/70">
                <div className="w-9 h-9 rounded-xl bg-secondary-fixed/50 text-secondary flex items-center justify-center shrink-0">
                  <Icon name="local_shipping" size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-on-surface">Gratis Ongkir</p>
                  <p className="text-[11px] text-outline mt-0.5 leading-snug">Untuk pembelian minimum Rp 500.000</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-surface-container-lowest border border-outline-variant/70">
                <div className="w-9 h-9 rounded-xl bg-primary-fixed/50 text-primary flex items-center justify-center shrink-0">
                  <Icon name="package_2" size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-on-surface">Garansi 7 Hari</p>
                  <p className="text-[11px] text-outline mt-0.5 leading-snug">Perlindungan terhadap kerusakan pengiriman</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================== */}
        {/*  TABS SECTION                                                      */}
        {/* ================================================================== */}
        <div className="bg-surface-container-lowest border border-outline-variant/70 rounded-3xl p-6 sm:p-10 shadow-sm mb-16">
          {/* Tab header */}
          <div className="flex items-center gap-8 border-b border-outline-variant/60 overflow-x-auto pb-px mb-8">
            {[
              { id: "deskripsi" as const, label: "Deskripsi Produk", icon: "description" },
              { id: "ulasan" as const, label: `Ulasan Pembeli (${totalReviews})`, icon: "reviews" },
              { id: "tanya" as const, label: "Tanya Jawab", icon: "forum" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "pb-3 text-sm whitespace-nowrap flex items-center gap-2 transition-colors",
                  activeTab === tab.id
                    ? "font-bold text-primary border-b-2 border-primary"
                    : "font-medium text-outline hover:text-primary"
                )}
              >
                <Icon name={tab.icon} size={18} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* === TAB: Deskripsi Produk === */}
          {activeTab === "deskripsi" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-on-surface mb-3 flex items-center gap-2">
                    <Icon name="info" size={20} className="text-primary" />
                    Tentang {product.name}
                  </h3>
                  <div className="text-sm text-on-surface-variant leading-relaxed space-y-3">
                    {(product.description ?? "Deskripsi belum tersedia.").split("\n").map((line, i) => (
                      <p key={i}>{line.replace(/^- /, "• ")}</p>
                    ))}
                  </div>
                </div>

                {/* Feature checklist cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                  {[
                    { title: "Kualitas Terjamin", desc: "Produk telah melewati quality control ketat sebelum dikemas." },
                    { title: "Packing Aman", desc: "Kemasan pelindung ganda untuk pengiriman aman sampai tujuan." },
                    { title: "Stok Segar", desc: "Stok selalu diperbarui untuk menjamin kesegaran produk." },
                    { title: "Layanan Purna Jual", desc: "Tim support siap membantu jika ada kendala setelah pembelian." },
                  ].map((feat, i) => (
                    <div key={i} className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/50">
                      <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                        <Icon name="check_circle" size={16} className="text-emerald-600" />
                        {feat.title}
                      </span>
                      <p className="text-xs text-on-surface-variant mt-1">{feat.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right side: reviews inside description tab */}
              <div className="lg:col-span-5 space-y-6">
                {/* Rating summary box */}
                {reviewSummary && reviewSummary.totalReviews > 0 && (
                  <div className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/60">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-base font-bold text-on-surface">Ulasan Pembeli</h3>
                        <p className="text-xs text-outline">Berdasarkan {totalReviews} transaksi terverifikasi</p>
                      </div>
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full">
                        {avgRating >= 4.5 ? "Sangat Baik" : avgRating >= 3.5 ? "Baik" : "Cukup"}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 pb-4 border-b border-outline-variant/50">
                      <div className="text-center">
                        <span className="text-4xl font-extrabold text-on-surface tracking-tight">{avgRating.toFixed(1)}</span>
                        <p className="text-[11px] text-outline mt-0.5">dari 5 bintang</p>
                      </div>
                      <div className="flex-1 space-y-1">
                        {[5, 4, 3, 2, 1].map((star) => {
                          const count = reviewSummary.distribution?.[String(star)] ?? 0;
                          const pct = reviewSummary.totalReviews > 0
                            ? Math.round((count / reviewSummary.totalReviews) * 100)
                            : 0;
                          return (
                            <div key={star} className="flex items-center gap-2 text-xs">
                              <span className="text-outline w-3">{star}</span>
                              <div className="flex-1 h-2 rounded-full bg-surface-container-highest overflow-hidden">
                                <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-outline text-outline-variant w-5 text-right">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Individual reviews */}
                    {reviews.slice(0, 2).map((r) => (
                      <div key={r.id} className="py-4 space-y-2 border-b border-outline-variant/40 last:border-b-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-primary text-secondary-fixed-dim font-bold text-xs flex items-center justify-center">
                              {r.user.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-xs font-bold text-on-surface">{r.user}</span>
                          </div>
                          <span className="text-[11px] text-outline">{r.date}</span>
                        </div>
                        <div className="flex items-center text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <Icon key={i} name="star" size={14} filled className={i < r.rating ? "text-amber-400" : "text-gray-300"} />
                          ))}
                        </div>
                        <p className="text-xs text-on-surface-variant leading-relaxed">{r.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* === TAB: Ulasan Pembeli === */}
          {activeTab === "ulasan" && (
            <div className="space-y-6">
              {/* Rating summary */}
              {reviewSummary && reviewSummary.totalReviews > 0 && (
                <div className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/60">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <span className="text-5xl font-extrabold text-on-surface tracking-tight">{avgRating.toFixed(1)}</span>
                      <div className="flex items-center justify-center text-amber-400 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Icon key={i} name="star" size={16} filled className={i < Math.round(avgRating) ? "text-amber-400" : "text-gray-300"} />
                        ))}
                      </div>
                      <p className="text-[11px] text-outline mt-0.5">{totalReviews} ulasan</p>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      {[5, 4, 3, 2, 1].map((star) => {
                        const count = reviewSummary.distribution?.[String(star)] ?? 0;
                        const pct = reviewSummary.totalReviews > 0
                          ? Math.round((count / reviewSummary.totalReviews) * 100)
                          : 0;
                        return (
                          <div key={star} className="flex items-center gap-2 text-xs">
                            <span className="text-outline w-3">{star}</span>
                            <div className="flex-1 h-2.5 rounded-full bg-surface-container-highest overflow-hidden">
                              <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-outline font-semibold w-5 text-right">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Review list */}
              {reviews.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Belum ada ulasan.</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((r) => (
                    <div key={r.id} className="rounded-2xl border border-outline-variant/70 bg-surface-container-lowest p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary text-secondary-fixed-dim font-bold text-sm flex items-center justify-center">
                            {r.user.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="text-sm font-bold text-on-surface">{r.user}</span>
                            <span className="inline-block ml-1.5 text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 rounded">Terverifikasi</span>
                          </div>
                        </div>
                        <span className="text-[11px] text-outline">{r.date}</span>
                      </div>
                      <div className="flex items-center text-amber-400 mt-1.5">
                        {[...Array(5)].map((_, i) => (
                          <Icon key={i} name="star" size={14} filled className={i < r.rating ? "text-amber-400" : "text-gray-300"} />
                        ))}
                      </div>
                      <p className="mt-2 text-sm text-on-surface-variant leading-relaxed">{r.comment}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Review form */}
              {product.id && (
                <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/70 shadow-sm">
                  <ReviewForm productId={product.id} onSuccess={() => loadReviews(product.id)} />
                </div>
              )}
            </div>
          )}

          {/* === TAB: Tanya Jawab === */}
          {activeTab === "tanya" && (
            <div className="text-center py-12">
              <Icon name="forum" size={48} className="mx-auto text-outline-variant" />
              <h3 className="mt-4 text-lg font-bold text-on-surface">Tanya Jawab</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
                Fitur tanya jawab akan segera hadir. Sementara, silakan hubungi kami via WhatsApp untuk pertanyaan seputar produk ini.
              </p>
            </div>
          )}
        </div>

        {/* ================================================================== */}
        {/*  CROSS-SELL / RELATED PRODUCTS                                      */}
        {/* ================================================================== */}
        <section className="space-y-6 mb-12">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-secondary uppercase tracking-wider">Rekomendasi</span>
              <h2 className="text-xl sm:text-2xl font-bold text-on-surface mt-0.5">Produk Terkait</h2>
            </div>
            <Link
              href="/products"
              className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-primary hover:text-secondary transition-colors"
            >
              Lihat Semua
              <Icon name="arrow_forward" size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-surface-container-lowest border border-outline-variant/60 hover:border-primary/50 rounded-2xl p-4 flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-md group"
              >
                <div className="w-full aspect-square rounded-xl bg-surface-container-low flex items-center justify-center mb-3">
                  <Icon name="inventory_2" size={44} className="text-outline-variant" />
                </div>
                <span className="text-[10px] uppercase font-bold text-outline">Kategori</span>
                <h3 className="text-sm font-bold text-on-surface line-clamp-2 mt-1 group-hover:text-primary">
                  Produk Terkait {i}
                </h3>
                <div className="mt-4 pt-3 border-t border-outline-variant/40 flex items-center justify-between">
                  <span className="text-sm font-bold text-primary">-</span>
                  <button className="w-8 h-8 rounded-lg bg-primary hover:bg-secondary-fixed-dim text-on-primary hover:text-primary flex items-center justify-center transition-colors">
                    <Icon name="add_shopping_cart" size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}