import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SITE_CONFIG } from "@/lib/constants";
import ProductDetailView from "./product-detail-view";

interface Props {
  params: Promise<{ slug: string }>;
}

/**
 * Halaman produk versi server: fetch sekali di server untuk metadata SEO,
 * JSON-LD, dan data awal tampilan (menghemat satu round-trip client fetch).
 * Tampilan interaktif tetap Client Component (product-detail-view).
 */
export const dynamic = "force-dynamic";

async function loadProduct(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      variants: true,
      category: { select: { id: true, name: true, slug: true } },
      _count: { select: { reviews: { where: { isApproved: true } } } },
    },
  });
}

/** Harga efektif: diskon bila ada, selain itu harga dasar. */
function effectivePrice(base: number, discount: number | null): number {
  return discount !== null && discount > 0 ? discount : base;
}

/** Produk terkait: kategori sama, aktif, bukan produk ini. */
async function loadRelatedProducts(productId: string, categoryId: string) {
  return prisma.product.findMany({
    where: {
      categoryId,
      isActive: true,
      id: { not: productId },
    },
    include: {
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
    take: 4,
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await loadProduct(slug);
  if (!product) return { title: "Produk tidak ditemukan" };

  const price = effectivePrice(Number(product.basePrice), product.discountPrice ? Number(product.discountPrice) : null);
  const title = `${product.name} - ${SITE_CONFIG.name}`;
  const description =
    product.shortDesc?.trim() ||
    product.description?.slice(0, 155) ||
    `Beli ${product.name} dengan harga Rp${price.toLocaleString("id-ID")} di ${SITE_CONFIG.name}.`;
  const ogImage = `/api/og?title=${encodeURIComponent(product.name)}&subtitle=${encodeURIComponent(`Rp${price.toLocaleString("id-ID")}`)}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `/products/${product.slug}`,
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await loadProduct(slug);
  if (!product) notFound();

  const basePrice = Number(product.basePrice);
  const discountPrice = product.discountPrice ? Number(product.discountPrice) : null;
  const price = effectivePrice(basePrice, discountPrice);
  const productUrl = `${SITE_CONFIG.url}/products/${product.slug}`;

  // Rating agregat untuk JSON-LD (hanya ulasan yang disetujui).
  const rating = await prisma.review.aggregate({
    where: { productId: product.id, isApproved: true },
    _avg: { rating: true },
    _count: true,
  });

  // Produk terkait + jumlah terjual (data riil) — dijalankan paralel.
  const [related, soldAggregate] = await Promise.all([
    loadRelatedProducts(product.id, product.categoryId),
    prisma.orderItem.aggregate({
      where: {
        productId: product.id,
        order: { status: { notIn: ["cancelled", "expired"] } },
      },
      _sum: { quantity: true },
    }),
  ]);

  /** Jumlah unit terjual dari order riil (cancel/expired tidak dihitung). */
  const soldCount = Number(soldAggregate._sum.quantity ?? 0);

  const relatedProducts = related.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    basePrice: Number(p.basePrice),
    discountPrice: p.discountPrice ? Number(p.discountPrice) : null,
    image: p.images[0]?.url,
    weightGram: p.weightGram,
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDesc || product.description || undefined,
    sku: product.sku || undefined,
    image: product.images.map((img) => img.url),
    url: productUrl,
    brand: { "@type": "Organization", name: SITE_CONFIG.name },
    category: product.category.name,
    ...(rating._count > 0 && rating._avg.rating
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number(rating._avg.rating.toFixed(1)),
            reviewCount: rating._count,
          },
        }
      : {}),
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "IDR",
      price: String(price),
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: SITE_CONFIG.name },
    },
  };

  // Data awal untuk Client Component — bentuk sama dengan /api/products/[slug].
  const initialProduct = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description ?? undefined,
    shortDesc: product.shortDesc ?? undefined,
    basePrice,
    discountPrice,
    sku: product.sku ?? undefined,
    weightGram: product.weightGram,
    stock: product.stock,
    images: product.images.map((img) => ({
      url: img.url,
      altText: img.altText,
      isPrimary: img.isPrimary,
    })),
    category: product.category,
    variants: product.variants.map((v) => ({
      ...v,
      priceModifier: Number(v.priceModifier),
    })),
    _count: { reviews: product._count.reviews },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailView
        initialProduct={initialProduct}
        relatedProducts={relatedProducts}
        soldCount={soldCount}
      />
    </>
  );
}
