"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Leaf, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { useCartStore } from "@/lib/cart-store";
import { cn, formatPrice } from "@/lib/utils";

export interface BundleProduct {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  discountPrice?: number | null;
  shortDesc?: string | null;
  description?: string | null;
  images?: { url: string; altText?: string | null; isPrimary?: boolean }[];
  category?: { id: string; name: string; slug: string } | null;
  tags?: string[] | null;
  weightGram?: number;
}

interface BundleHighlightProps {
  /**
   * Produk yang ditampilkan sebagai set bundle terlaris. Kalau null/undefined,
   * section tidak dirender sama sekali.
   */
  product: BundleProduct | null;
  /** Daftar isi paket. Kalau tidak diisi, diturunkan dari tag produk. */
  contents?: string[];
}

const TAG_BESTSELLER = "bestseller";

/** Tag internal yang tidak layak ditampilkan sebagai poin isi paket. */
const HIDDEN_TAGS = new Set([TAG_BESTSELLER, "featured", "unggulan", "promo"]);

const FALLBACK_CONTENTS = [
  "Set lengkap siap pakai",
  "Panduan instalasi dan perawatan",
  "Garansi produk resmi JagoFarm",
];

function effectivePrice(product: BundleProduct): number {
  const discount = product.discountPrice;
  if (discount != null && discount > 0 && discount < product.basePrice) {
    return discount;
  }
  return product.basePrice;
}

/**
 * Pilih satu produk katalog sebagai "set bundle terlaris":
 * prioritas tag `bestseller`, kalau tidak ada pakai harga efektif tertinggi.
 * Data diambil dari katalog yang sudah di-fetch halaman (tanpa endpoint baru).
 */
export function pickBundleProduct(
  products: BundleProduct[] | null | undefined
): BundleProduct | null {
  if (!products || products.length === 0) return null;

  const bestseller = products.find((product) =>
    (product.tags ?? []).some(
      (tag) => tag.toLowerCase() === TAG_BESTSELLER
    )
  );
  if (bestseller) return bestseller;

  return products.reduce((highest, product) =>
    effectivePrice(product) > effectivePrice(highest) ? product : highest
  );
}

/** Ambil poin isi paket dari tag produk; kalau kosong pakai daftar umum. */
function contentsFromTags(product: BundleProduct): string[] {
  const fromTags = (product.tags ?? [])
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0 && !HIDDEN_TAGS.has(tag.toLowerCase()))
    .map((tag) => tag.replace(/[-_]+/g, " ").replace(/^\w/, (c) => c.toUpperCase()));

  return fromTags.length > 0 ? fromTags : FALLBACK_CONTENTS;
}

export function BundleHighlight({ product, contents }: BundleHighlightProps) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);

  if (!product) return null;

  const price = effectivePrice(product);
  const hasDiscount = price < product.basePrice;
  const discountPercent = hasDiscount
    ? Math.round(((product.basePrice - price) / product.basePrice) * 100)
    : 0;
  const image = product.images?.find((img) => img.isPrimary)?.url ?? product.images?.[0]?.url;
  const description = product.shortDesc || product.description || null;
  const points = contents && contents.length > 0 ? contents : contentsFromTags(product);

  function handleBuyNow() {
    addItem({
      id: product!.id,
      productId: product!.id,
      name: product!.name,
      price,
      quantity: 1,
      image: image || undefined,
      weightGram: product!.weightGram ?? 0,
      slug: product!.slug,
    });
    toast({
      title: "Ditambahkan ke keranjang",
      description: product!.name,
    });
    router.push("/cart");
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-12" aria-labelledby="bundle-highlight-title">
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="grid gap-0 md:grid-cols-2">
          {/* Gambar produk unggulan */}
          <div className="relative min-h-[240px] bg-secondary sm:min-h-[320px]">
            {image ? (
              <Image
                src={image}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            ) : (
              <div className="flex h-full min-h-[240px] items-center justify-center sm:min-h-[320px]">
                <Leaf className="h-20 w-20 text-primary/20" />
              </div>
            )}
            <span className="absolute left-4 top-4 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
              Set Bundle Terlaris
            </span>
          </div>

          {/* Detail paket */}
          <div className="flex flex-col justify-center p-6 sm:p-8">
            {product.category && (
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {product.category.name}
              </p>
            )}
            <h2
              id="bundle-highlight-title"
              className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl"
            >
              {product.name}
            </h2>
            {description && (
              <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            )}

            <div className="mt-5">
              <p className="text-sm font-semibold">Isi Paket</p>
              <ul className="mt-2 space-y-1.5">
                {points.map((point) => (
                  <li key={point} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 flex flex-wrap items-end gap-3">
              <div>
                {hasDiscount && (
                  <p className="text-sm text-muted-foreground line-through">
                    {formatPrice(product.basePrice)}
                  </p>
                )}
                <p className={cn("font-bold text-primary", hasDiscount ? "text-2xl" : "text-3xl")}>
                  {formatPrice(price)}
                </p>
              </div>
              {hasDiscount && (
                <span className="mb-1 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive">
                  Hemat {discountPercent}%
                </span>
              )}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button size="lg" onClick={handleBuyNow}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Beli Sekarang
              </Button>
              <Link href={`/products/${product.slug}`}>
                <Button size="lg" variant="secondary">
                  Lihat Detail
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default BundleHighlight;
