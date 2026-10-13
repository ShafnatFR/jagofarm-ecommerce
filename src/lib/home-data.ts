import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

/**
 * Data katalog homepage (kategori, produk unggulan, carousel, angka trust
 * metrics) di-cache 5 menit supaya homepage tidak menjalankan 5 query Prisma
 * di setiap request. Angka metrics tetap berasal dari katalog nyata — cache
 * hanya menunda update maksimal 5 menit (revalidateTag "catalog" mempercepat
 * saat admin menyimpan produk).
 *
 * Teks hero TIDAK ikut di sini: admin mengubahnya lewat Pengaturan Situs dan
 * selalu dibaca segar.
 */
export const getHomeCatalog = unstable_cache(
  async () => {
    const [categories, featuredProducts, heroProducts, productCount, categoryCount] =
      await Promise.all([
        prisma.category.findMany({ where: { parentId: null }, orderBy: { name: "asc" } }),
        prisma.product.findMany({
          // Sama dengan /api/products & /api/products/featured: produk tanpa harga atau
          // berat tidak bisa dihitung ongkirnya, jadi jangan tampilkan di storefront.
          where: { isActive: true, isFeatured: true, basePrice: { gt: 0 }, weightGram: { gt: 0 } },
          orderBy: { createdAt: "desc" },
          take: 8,
          include: {
            images: { where: { isPrimary: true }, take: 1 },
            category: { select: { id: true, name: true, slug: true } },
            // Hanya kolom rating yang diambil supaya kartu produk bisa
            // menampilkan rata-rata bintang; jadi 8 produk x sedikit baris saja.
            reviews: { where: { isApproved: true }, select: { rating: true } },
            _count: { select: { reviews: { where: { isApproved: true } } } },
          },
        }),
        prisma.$queryRaw<
          { id: string; name: string; slug: string; base_price: unknown; discount_price: unknown; image_url: string | null; category_name: string }[]
        >`
          SELECT p.id, p.name, p.slug, p.base_price, p.discount_price,
                 pi.url as image_url, c.name as category_name
          FROM products p
          LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = true
          LEFT JOIN categories c ON c.id = p.category_id
          WHERE p.is_active = true
            AND p.base_price > 0
            AND p.weight_gram > 0
          ORDER BY RANDOM() LIMIT 5
        `,
        // Angka untuk trust metrics — dihitung dari katalog supaya tidak lagi klaim manual.
        prisma.product.count({ where: { isActive: true, basePrice: { gt: 0 }, weightGram: { gt: 0 } } }),
        prisma.category.count({ where: { parentId: null, isActive: true } }),
      ]);

    return { categories, featuredProducts, heroProducts, productCount, categoryCount };
  },
  ["home-catalog"],
  { revalidate: 300, tags: ["catalog"] }
);
