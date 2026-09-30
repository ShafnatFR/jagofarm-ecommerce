"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface ProductInfo {
  id: string;
  name: string;
  slug: string;
  image: string;
}

export default function WriteReviewPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<ProductInfo | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products/${params.slug}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setProduct({
          id: data.id,
          name: data.name,
          slug: data.slug,
          image: data.images?.[0]?.url || "/placeholder-product.png",
        });
      } catch {
        router.push("/products");
      }
    }
    fetchProduct();
  }, [params.slug, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product?.id, rating, comment }),
      });
      if (!res.ok) throw new Error("Failed");
      setSuccess(true);
    } catch {
      alert("Gagal mengirim ulasan. Pastikan Anda sudah login.");
    } finally {
      setLoading(false);
    }
  };

  if (!product) {
    return (
      <div className="max-w-2xl mx-auto px-margin py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-surface-container rounded w-1/3" />
          <div className="h-48 bg-surface-container rounded-2xl" />
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-margin py-20 text-center">
        <span className="material-symbols-outlined text-[64px] text-tertiary mb-4">check_circle</span>
        <h1 className="text-headline-lg font-headline-lg text-on-surface mb-2">Ulasan Terkirim!</h1>
        <p className="text-body-lg font-body-lg text-on-surface-variant mb-8">Terima kasih atas ulasan Anda.</p>
        <Link href={`/products/${product.slug}`} className="inline-flex items-center gap-2 bg-primary hover:bg-primary-container text-on-primary font-headline-sm text-headline-sm px-7 py-3.5 rounded-full shadow-md transition-all active:scale-95">
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          Kembali ke Produk
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <section className="bg-primary text-on-primary py-12 md:py-16">
        <div className="max-w-2xl mx-auto px-margin text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-secondary-fixed-dim text-label-md font-label-md mb-4 backdrop-blur-sm">
            <span className="material-symbols-outlined text-[16px]">rate_review</span>
            <span>Ulasan</span>
          </div>
          <h1 className="text-headline-lg font-headline-lg text-on-primary">Berikan Ulasan</h1>
          <p className="text-body-md font-body-md text-primary-fixed-dim mt-2">Bagikan pengalaman Anda dengan produk ini</p>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-2xl mx-auto px-margin py-8">
        {/* Product Info */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm flex items-center gap-4 mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={product.image} alt={product.name} className="w-16 h-16 rounded-xl object-cover bg-surface-container-low" />
          <div>
            <h2 className="text-headline-sm font-headline-sm text-on-surface">{product.name}</h2>
            <Link href={`/products/${product.slug}`} className="text-label-md font-label-md text-primary hover:underline">Lihat Produk</Link>
          </div>
        </div>

        {/* Review Form */}
        <form onSubmit={handleSubmit} className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm space-y-6">
          {/* Star Rating */}
          <div>
            <label className="text-headline-sm font-headline-sm text-on-surface mb-3 block">Rating</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <span className="material-symbols-outlined text-[36px] text-secondary-fixed-dim" style={{ fontVariationSettings: (hoverRating || rating) >= star ? "'FILL' 1" : "'FILL' 0" }}>
                    star
                  </span>
                </button>
              ))}
              <span className="ml-3 text-body-lg font-body-lg text-on-surface-variant">
                {rating === 0 ? "Pilih rating" : rating === 5 ? "Sangat Puas" : rating === 4 ? "Puas" : rating === 3 ? "Cukup" : rating === 2 ? "Kurang" : "Sangat Kurang"}
              </span>
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="text-headline-sm font-headline-sm text-on-surface mb-1.5 block">Ulasan</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="w-full bg-surface-container-low hover:bg-surface-container border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-2xl px-4 py-3 text-body-md font-body-md text-on-surface placeholder:text-outline outline-none transition-colors resize-none"
              placeholder="Ceritakan pengalaman Anda dengan produk ini..."
              required
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || rating === 0}
            className="w-full bg-primary hover:bg-primary-container text-on-primary font-headline-sm text-headline-sm py-3.5 rounded-full shadow-md transition-all active:scale-95 disabled:opacity-60"
          >
            {loading ? "Mengirim..." : "Kirim Ulasan"}
          </button>
        </form>
      </section>
    </div>
  );
}