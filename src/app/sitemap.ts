import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

/** Sitemap di-regenerate tiap jam, bukan tiap request. */
export const revalidate = 3600;
export const dynamic = "force-dynamic";

const STATIC_ROUTES: MetadataRoute.Sitemap = [
  { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
  { url: `${SITE_URL}/products`, changeFrequency: "daily", priority: 0.9 },
  { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.5 },
  { url: `${SITE_URL}/contact`, changeFrequency: "monthly", priority: 0.5 },
  { url: `${SITE_URL}/faq`, changeFrequency: "monthly", priority: 0.5 },
  { url: `${SITE_URL}/how-to-order`, changeFrequency: "monthly", priority: 0.5 },
  { url: `${SITE_URL}/shipping-policy`, changeFrequency: "yearly", priority: 0.3 },
  { url: `${SITE_URL}/return-policy`, changeFrequency: "yearly", priority: 0.3 },
  { url: `${SITE_URL}/privacy-policy`, changeFrequency: "yearly", priority: 0.3 },
  { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Database bisa tidak terjangkau (mis. saat build di CI) — sitemap tetap
  // harus keluar dengan rute statis, bukan menggagalkan build.
  try {
    const [products, categories] = await Promise.all([
      prisma.product.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 5000,
      }),
      prisma.category.findMany({
        where: { isActive: true },
        select: { slug: true, createdAt: true },
      }),
    ]);

    return [
      ...STATIC_ROUTES,
      ...categories.map((category) => ({
        url: `${SITE_URL}/products?category=${encodeURIComponent(category.slug)}`,
        lastModified: category.createdAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
      ...products.map((product) => ({
        url: `${SITE_URL}/products/${encodeURIComponent(product.slug)}`,
        lastModified: product.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ];
  } catch (error) {
    console.error("Sitemap: gagal memuat data produk/kategori", error);
    return STATIC_ROUTES;
  }
}
