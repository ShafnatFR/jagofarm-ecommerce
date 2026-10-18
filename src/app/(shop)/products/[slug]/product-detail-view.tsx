"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { motion } from "framer-motion";
import { cn, formatDate, formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ReviewForm } from "@/components/product/review-form";
import { useToast } from "@/components/ui/use-toast";
import { useCartStore } from "@/lib/cart-store";
import { createClient } from "@/lib/supabase/client";
import { SITE_CONFIG, FREE_SHIPPING_THRESHOLD } from "@/lib/constants";
import { useSiteContent } from "@/hooks/use-site-content";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ApiProduct {
  id: string; name: string; slug: string; description?: string;
  shortDesc?: string; basePrice: number; discountPrice?: number | null;
  sku?: string; weightGram?: number; stock?: number;
  images: { url: string; altText?: string | null; isPrimary?: boolean }[];
  category: { id: string; name: string; slug: string };
  variants?: { id: string; name: string; price: number; stock?: number; weightGram?: number | null }[];
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

/** Produk terkait (dari server page, sudah terserialisasi). */
interface RelatedProduct {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  discountPrice?: number | null;
  image?: string;
  weightGram?: number;
}

/** Satu tanya jawab produk (dari /api/products/questions). */
interface ProductQuestion {
  id: string;
  askerName: string;
  question: string;
  answer: string | null;
  answeredAt: string | null;
  createdAt: string;
}

/** Panjang minimum pertanyaan — selaras dengan validasi zod di backend. */
const MIN_QUESTION_LENGTH = 10;
/** Panjang maksimum pertanyaan — selaras dengan validasi zod di backend. */
const MAX_QUESTION_LENGTH = 1000;

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

interface Props {
  /** Data awal dari server page — menghindari fetch pertama + skeleton. */
  initialProduct?: ApiProduct | null;
  /** Produk terkait (kategori sama) dari server page. */
  relatedProducts?: RelatedProduct[];
  /** Jumlah unit terjual riil dari order (cancel/expired tidak dihitung). */
  soldCount?: number;
}

export default function ProductDetailPage({
  initialProduct = null,
  relatedProducts = [],
  soldCount,
}: Props) {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const addItem = useCartStore((s) => s.addItem);
  const site = useSiteContent();

  const [product, setProduct] = useState<ApiProduct | null>(initialProduct);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(initialProduct === null);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(null);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"deskripsi" | "ulasan" | "tanya">("deskripsi");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [relatedAddedId, setRelatedAddedId] = useState<string | null>(null);

  /* ---------- State: Tab Tanya Jawab (Q&A produk) ---------- */
  const [questions, setQuestions] = useState<ProductQuestion[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [questionsError, setQuestionsError] = useState<string | null>(null);
  const [questionText, setQuestionText] = useState("");
  const [questionSubmitting, setQuestionSubmitting] = useState(false);
  const [questionError, setQuestionError] = useState<string | null>(null);
  const [questionSubmitted, setQuestionSubmitted] = useState(false);
  /** null = belum diketahui (masih dicek). */
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  const { toast } = useToast();

  /** Muat ulasan + ringkasan rating; dipakai saat halaman dibuka dan setelah kirim ulasan. */
  async function loadReviews(productId: string) {
    try {
      setReviewsError(null);
      const res = await fetch(`/api/reviews?productId=${productId}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        setReviewsError("Gagal memuat ulasan.");
        return;
      }
      const data = await res.json();
      setReviews(data.reviews ?? []);
      setReviewSummary(data.summary ?? null);
    } catch {
      // Ulasan opsional: kegagalan tidak boleh menggagalkan halaman, tapi
      // tetap dibedakan dari "belum ada ulasan".
      setReviewsError("Gagal memuat ulasan.");
    }
  }

  /** Muat daftar tanya jawab produk (hanya yang sudah dijawab & dipublikasikan). */
  async function loadQuestions(productId: string) {
    setQuestionsLoading(true);
    setQuestionsError(null);
    try {
      const res = await fetch(
        `/api/products/questions?productId=${encodeURIComponent(productId)}`,
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error("Gagal memuat tanya jawab.");
      const data = await res.json();
      setQuestions(Array.isArray(data.questions) ? data.questions : []);
    } catch {
      setQuestionsError("Tidak dapat memuat tanya jawab. Coba lagi nanti.");
    } finally {
      setQuestionsLoading(false);
    }
  }

  useEffect(() => {
    // Data sudah disediakan server page — cukup muat ulasannya saja.
    if (initialProduct) {
      let cancelled = false;
      void (async () => {
        const res = await fetch(`/api/reviews?productId=${initialProduct.id}`, {
          cache: "no-store",
        }).catch(() => null);
        if (cancelled || !res?.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setReviews(data.reviews ?? []);
        setReviewSummary(data.summary ?? null);
      })();
      return () => {
        cancelled = true;
      };
    }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  /** Lightbox: tutup dengan Escape. */
  useEffect(() => {
    if (!lightboxOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightboxOpen]);

  /**
   * Muat tanya jawab begitu produk siap — dipakai untuk isi tab dan jumlah
   * di label tab, sama seperti ulasan.
   */
  useEffect(() => {
    if (!product?.id) return;
    let cancelled = false;
    void (async () => {
      if (cancelled) return;
      await loadQuestions(product.id);
    })();
    return () => {
      cancelled = true;
    };
  }, [product?.id]);

  /** Cek status login (Supabase) untuk mengatur form tanya — hanya perlu sekali. */
  useEffect(() => {
    const supabase = createClient();
    let mounted = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (mounted) setIsLoggedIn(Boolean(data.user));
    });
    const { data: authSubscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (mounted) setIsLoggedIn(Boolean(session?.user));
      }
    );
    return () => {
      mounted = false;
      authSubscription.subscription.unsubscribe();
    };
  }, []);

  /** Kirim pertanyaan baru ke backend (perlu login). */
  async function handleSubmitQuestion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setQuestionError(null);

    const trimmed = questionText.trim();
    if (trimmed.length < MIN_QUESTION_LENGTH) {
      setQuestionError(
        `Pertanyaan minimal ${MIN_QUESTION_LENGTH} karakter agar tim kami bisa menjawab dengan tepat.`
      );
      return;
    }

    setQuestionSubmitting(true);
    try {
      const res = await fetch("/api/products/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product?.id, question: trimmed }),
      });

      if (res.status === 401) {
        setQuestionError("Masuk dulu untuk bertanya.");
        setIsLoggedIn(false);
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const message =
          data && typeof data.error === "string" && data.error.trim()
            ? data.error
            : "Pertanyaan gagal dikirim. Silakan coba lagi.";
        setQuestionError(message);
        toast({
          variant: "destructive",
          title: "Pertanyaan gagal dikirim",
          description: message,
        });
        return;
      }

      setQuestionSubmitted(true);
      setQuestionText("");
      toast({
        title: "Pertanyaan terkirim",
        description: "Tim JagoFarm akan menjawab dan menayangkannya di sini.",
      });
    } catch {
      const message =
        "Tidak dapat menghubungi server. Periksa koneksi Anda lalu coba lagi.";
      setQuestionError(message);
      toast({
        variant: "destructive",
        title: "Pertanyaan gagal dikirim",
        description: message,
      });
    } finally {
      setQuestionSubmitting(false);
    }
  }

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
  // Harga absolut: varian punya harga sendiri, bukan selisih dari basePrice.
  const displayPrice = variant?.price ?? product.discountPrice ?? product.basePrice;
  const basePrice = variant?.price ?? product.basePrice;
  const hasDiscount = !variant && product.discountPrice != null && product.discountPrice < product.basePrice;
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
      // Berat varian diprioritaskan; null berarti ikut berat produk.
      weightGram: variant?.weightGram ?? product!.weightGram ?? 0,
      slug: product!.slug,
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  }

  function handleBuyNow() {
    handleAddToCart();
    router.push("/checkout");
  }

  /** Tambah produk terkait ke keranjang — mekanisme sama dengan add-to-cart utama. */
  function handleAddRelatedToCart(item: RelatedProduct) {
    addItem({
      id: item.id,
      productId: item.id,
      name: item.name,
      price: item.discountPrice ?? item.basePrice,
      quantity: 1,
      image: item.image,
      weightGram: item.weightGram ?? 0,
      slug: item.slug,
    });
    setRelatedAddedId(item.id);
    setTimeout(() => setRelatedAddedId(null), 2000);
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
                  onClick={() => setLightboxOpen(true)}
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
                <span className="px-2.5 py-1 rounded-md bg-primary-fixed/20 text-primary text-xs font-bold">
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
                {soldCount != null && soldCount > 0 && (
                  <span className="text-on-surface-variant font-medium text-xs sm:text-sm">
                    Terjual <strong className="text-on-surface">{soldCount} paket</strong>
                  </span>
                )}
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
              {/* Stok: ikuti varian terpilih; tanpa varian pakai stok produk. */}
              {(variant ? variant.stock != null : product.stock != null) && (
                <div className="flex items-center gap-2 self-start sm:self-center">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-xs font-bold text-primary bg-surface-container-low px-3 py-1.5 rounded-full border border-outline-variant">
                    Stok: {variant ? (variant.stock ?? 0) : product.stock} tersedia
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
                          ) : null}
                        </div>
                        <span className="text-xs font-bold text-primary mt-0.5">
                          {formatPrice(v.price)}
                        </span>
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
                    onClick={() => setQuantity(Math.min((variant?.stock ?? product.stock) ?? 99, quantity + 1))}
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
                  onClick={handleBuyNow}
                  type="button"
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
                  <p className="text-[11px] text-outline mt-0.5 leading-snug">
                    Untuk pembelian minimum {formatPrice(FREE_SHIPPING_THRESHOLD)}
                  </p>
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
              {
                id: "tanya" as const,
                label: questionsLoading ? "Tanya Jawab" : `Tanya Jawab (${questions.length})`,
                icon: "forum",
              },
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
                        <Icon name="check_circle" size={16} className="text-primary" />
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
                      <span className="text-xs font-bold text-primary bg-primary-fixed/20 px-2.5 py-1 rounded-full">
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
                reviewsError ? (
                  <p className="text-sm text-destructive text-center py-8">
                    {reviewsError} Silakan muat ulang halaman.
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Belum ada ulasan.</p>
                )
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
                            <span className="inline-block ml-1.5 text-[10px] text-primary font-semibold bg-surface-container-low px-1.5 rounded">Terverifikasi</span>
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
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              {/* ---------- LEFT: daftar tanya jawab ---------- */}
              <div className="lg:col-span-7 space-y-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                    <Icon name="forum" size={20} className="text-primary" />
                    Pertanyaan Pembeli
                  </h3>
                  {!questionsLoading && questions.length > 0 && (
                    <span className="text-xs font-bold text-primary bg-primary-fixed/20 px-2.5 py-1 rounded-full">
                      {questions.length} terjawab
                    </span>
                  )}
                </div>

                {/* Loading */}
                {questionsLoading && (
                  <div className="space-y-4">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-5 space-y-3"
                      >
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <Skeleton className="h-3 w-28" />
                        </div>
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Error */}
                {!questionsLoading && questionsError && (
                  <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
                    <Icon name="info" size={32} className="mx-auto text-destructive" />
                    <p className="mt-2 text-sm text-on-surface-variant">{questionsError}</p>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="mt-4 rounded-full"
                      onClick={() => product?.id && loadQuestions(product.id)}
                    >
                      <Icon name="refresh" size={16} className="mr-1.5" />
                      Coba Lagi
                    </Button>
                  </div>
                )}

                {/* Empty */}
                {!questionsLoading && !questionsError && questions.length === 0 && (
                  <div className="text-center py-12 rounded-2xl border border-dashed border-outline-variant bg-surface-container-low/50">
                    <Icon name="help" size={44} className="mx-auto text-outline-variant" />
                    <h4 className="mt-3 text-base font-bold text-on-surface">
                      Belum ada tanya jawab
                    </h4>
                    <p className="mt-1.5 text-sm text-muted-foreground max-w-sm mx-auto">
                      Jadilah yang pertama bertanya tentang produk ini. Tim JagoFarm akan
                      menjawab dan jawabannya tampil di sini.
                    </p>
                  </div>
                )}

                {/* List */}
                {!questionsLoading && !questionsError && questions.length > 0 && (
                  <div className="space-y-4">
                    {questions.map((q) => (
                      <div
                        key={q.id}
                        className="rounded-2xl border border-outline-variant/70 bg-surface-container-lowest p-5"
                      >
                        {/* Pertanyaan */}
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-surface-container text-on-surface-variant font-bold text-sm flex items-center justify-center shrink-0">
                            {q.askerName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-on-surface">
                                {q.askerName}
                              </span>
                              <span className="text-[11px] text-outline">
                                {formatDate(q.createdAt)}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-on-surface-variant leading-relaxed">
                              {q.question}
                            </p>
                          </div>
                        </div>

                        {/* Jawaban admin */}
                        {q.answer && (
                          <div className="mt-3 ml-11 rounded-xl bg-primary-fixed/20 border border-primary-fixed-dim/50 p-3.5">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-primary text-secondary-fixed-dim flex items-center justify-center shrink-0">
                                <Icon name="storefront" size={14} filled />
                              </div>
                              <span className="text-xs font-bold text-primary">
                                Tim JagoFarm
                              </span>
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-primary bg-surface-container-lowest/70 px-1.5 py-0.5 rounded">
                                <Icon name="verified" size={12} filled className="text-primary" />
                                Penjual
                              </span>
                              {q.answeredAt && (
                                <span className="text-[11px] text-outline">
                                  {formatDate(q.answeredAt)}
                                </span>
                              )}
                            </div>
                            <p className="mt-1.5 text-sm text-on-surface leading-relaxed">
                              {q.answer}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ---------- RIGHT: form tanya + bantuan ---------- */}
              <div className="lg:col-span-5 space-y-5">
                <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/60">
                  <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                    <Icon name="live_help" size={20} className="text-primary" />
                    Punya Pertanyaan?
                  </h3>
                  <p className="mt-1 text-xs text-outline leading-relaxed">
                    Tanyakan seputar spesifikasi, cara pakai, atau kecocokan produk. Tim
                    JagoFarm akan menjawab dan jawabannya tayang di sini.
                  </p>

                  {/* Belum login */}
                  {isLoggedIn === false && (
                    <div className="mt-4 rounded-xl border border-primary-fixed-dim/60 bg-primary-fixed/20 p-4 text-center">
                      <Icon name="lock" size={24} className="mx-auto text-primary" />
                      <p className="mt-2 text-sm text-on-surface-variant">
                        Masuk dulu untuk mengirim pertanyaan.
                      </p>
                      <Link
                        href={`/login?next=${encodeURIComponent(`/products/${product.slug}`)}`}
                        className="mt-3 inline-block"
                      >
                        <Button size="sm" className="rounded-full font-bold">
                          <Icon name="login" size={16} className="mr-1.5" />
                          Masuk
                        </Button>
                      </Link>
                    </div>
                  )}

                  {/* Form (login / belum diketahui) */}
                  {isLoggedIn !== false && (
                    <form onSubmit={handleSubmitQuestion} className="mt-4 space-y-3">
                      {questionSubmitted && (
                        <div className="flex items-start gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-800">
                          <Icon name="check_circle" size={16} className="mt-0.5 shrink-0" />
                          <span>
                            Pertanyaan terkirim. Jawaban akan tampil di halaman ini setelah
                            dijawab tim kami.
                          </span>
                        </div>
                      )}

                      {questionError && (
                        <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                          <Icon name="info" size={16} className="mt-0.5 shrink-0" />
                          <span>{questionError}</span>
                        </div>
                      )}

                      <label
                        htmlFor="product-question"
                        className="block text-sm font-medium text-on-surface"
                      >
                        Pertanyaan Anda
                      </label>
                      <textarea
                        id="product-question"
                        value={questionText}
                        onChange={(e) => {
                          setQuestionText(e.target.value);
                          if (questionError) setQuestionError(null);
                          if (questionSubmitted) setQuestionSubmitted(false);
                        }}
                        disabled={questionSubmitting}
                        maxLength={MAX_QUESTION_LENGTH}
                        placeholder={`Contoh: Apakah ${product.name} cocok untuk pemula?`}
                        className="flex min-h-[110px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                      <p className="text-xs text-muted-foreground">
                        {questionText.trim().length}/{MAX_QUESTION_LENGTH} karakter
                        {questionText.trim().length > 0 &&
                          questionText.trim().length < MIN_QUESTION_LENGTH &&
                          ` · minimal ${MIN_QUESTION_LENGTH} karakter`}
                      </p>

                      <Button
                        type="submit"
                        className="w-full rounded-full font-bold"
                        disabled={questionSubmitting}
                      >
                        {questionSubmitting ? (
                          <>
                            <Icon
                              name="progress_activity"
                              size={16}
                              className="mr-2 animate-spin"
                            />
                            Mengirim...
                          </>
                        ) : (
                          <>
                            <Icon name="send" size={16} className="mr-2" />
                            Kirim Pertanyaan
                          </>
                        )}
                      </Button>
                    </form>
                  )}
                </div>

                {/* Bantuan tambahan */}
                <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/70">
                  <h4 className="text-sm font-bold text-on-surface">
                    Butuh jawaban lebih cepat?
                  </h4>
                  <p className="mt-1 text-xs text-outline leading-relaxed">
                    Hubungi tim kami {site.productConsultNote}
                  </p>
                  <div className="mt-4 flex flex-col gap-2.5">
                    <Link href="/consultation">
                      <Button
                        variant="secondary"
                        className="w-full rounded-full border-2 border-primary text-primary font-bold"
                      >
                        <Icon name="chat" size={18} className="mr-2" />
                        Konsultasi dengan Tim Ahli
                      </Button>
                    </Link>
                    <a
                      href={`https://wa.me/${SITE_CONFIG.whatsappIntl}?text=${encodeURIComponent(`Halo JagoFarm, saya ingin bertanya tentang produk ${product.name}.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button className="w-full rounded-full bg-primary text-on-primary font-bold">
                        <Icon name="call" size={18} className="mr-2" />
                        Chat via WhatsApp
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
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
            {relatedProducts.length === 0 ? (
              <p className="col-span-full text-center text-sm text-muted-foreground py-8">
                Belum ada produk lain di kategori ini.
              </p>
            ) : (
              relatedProducts.map((item) => {
                const added = relatedAddedId === item.id;
                return (
                  <div
                    key={item.id}
                    className="bg-surface-container-lowest border border-outline-variant/60 hover:border-primary/50 rounded-2xl p-4 flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-md group"
                  >
                    <Link href={`/products/${item.slug}`} className="flex flex-col flex-1">
                      <div className="relative w-full aspect-square rounded-xl bg-surface-container-low flex items-center justify-center mb-3 overflow-hidden">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 50vw, 25vw"
                          />
                        ) : (
                          <Icon name="inventory_2" size={44} className="text-outline-variant" />
                        )}
                      </div>
                      <span className="text-[10px] uppercase font-bold text-outline">
                        {product.category.name}
                      </span>
                      <h3 className="text-sm font-bold text-on-surface line-clamp-2 mt-1 group-hover:text-primary">
                        {item.name}
                      </h3>
                    </Link>
                    <div className="mt-4 pt-3 border-t border-outline-variant/40 flex items-center justify-between">
                      <span className="text-sm font-bold text-primary">
                        {formatPrice(item.discountPrice ?? item.basePrice)}
                      </span>
                      <button
                        onClick={() => handleAddRelatedToCart(item)}
                        className="w-8 h-8 rounded-lg bg-primary hover:bg-secondary-fixed-dim text-on-primary hover:text-primary flex items-center justify-center transition-colors"
                        aria-label={`Tambah ${item.name} ke keranjang`}
                        title={added ? "Ditambahkan" : "Tambah ke keranjang"}
                      >
                        <Icon name={added ? "check" : "add_shopping_cart"} size={16} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* ---------- LIGHTBOX / IMAGE VIEWER ---------- */}
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
            onClick={() => setLightboxOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Pratinjau foto produk"
          >
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
              aria-label="Tutup pratinjau"
            >
              <Icon name="close" size={24} />
            </button>

            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImage((i) => (i - 1 + images.length) % images.length);
                  }}
                  className="absolute left-4 w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
                  aria-label="Foto sebelumnya"
                >
                  <Icon name="chevron_left" size={28} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImage((i) => (i + 1) % images.length);
                  }}
                  className="absolute right-4 w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
                  aria-label="Foto berikutnya"
                >
                  <Icon name="chevron_right" size={28} />
                </button>
              </>
            )}

            <div
              className="relative w-full max-w-3xl aspect-square"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={images[selectedImage]?.url}
                alt={images[selectedImage]?.altText ?? product.name}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 768px"
                priority
              />
            </div>

            {images.length > 1 && (
              <span className="absolute bottom-5 text-xs text-white/80">
                {selectedImage + 1} / {images.length}
              </span>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
}