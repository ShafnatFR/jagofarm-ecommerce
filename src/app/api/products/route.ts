import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { parseIntSafe } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseIntSafe(searchParams.get("page"), 1, 1, 10_000);
    const limit = parseIntSafe(searchParams.get("limit"), 12, 1, 50);
    const category = searchParams.get("category");
    const minPrice = searchParams.get("min_price");
    const maxPrice = searchParams.get("max_price");
    const sort = searchParams.get("sort") || "newest";
    const search = searchParams.get("search");
    const tags = searchParams.get("tags");
    const inStock = searchParams.get("in_stock");

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      basePrice: { gt: 0 },
      weightGram: { gt: 0 },
    };

    if (category) {
      where.category = { slug: category };
    }

    if (minPrice || maxPrice) {
      // Guard: parseFloat("abc") = NaN -> Prisma menolak filter Decimal ->
      // 500. Hanya nilai finit yang dipakai.
      const min = minPrice ? parseFloat(minPrice) : NaN;
      const max = maxPrice ? parseFloat(maxPrice) : NaN;

      /*
       * Produk bervarian menyimpan harga di varian, bukan basePrice (basePrice
       * hanya cache harga termurah). Filter harus memakai rentang varian supaya
       * produk dengan varian mahal tidak ikut tersembunyi:
       *   - batas bawah -> bandingkan dengan maxPrice (harga termahal)
       *   - batas atas  -> bandingkan dengan minPrice (harga termurah)
       * Produk tanpa varian memakai basePrice seperti sebelumnya.
       */
      const priceConditions: Prisma.ProductWhereInput[] = [];

      if (Number.isFinite(min)) {
        priceConditions.push({
          OR: [
            { hasVariants: false, basePrice: { gte: min } },
            { hasVariants: true, maxPrice: { gte: min } },
          ],
        });
      }
      if (Number.isFinite(max)) {
        priceConditions.push({
          OR: [
            { hasVariants: false, basePrice: { lte: max } },
            { hasVariants: true, minPrice: { lte: max } },
          ],
        });
      }

      if (priceConditions.length > 0) {
        where.AND = priceConditions;
        // Filter harga menggantikan syarat basePrice dasar.
        delete where.basePrice;
      }
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { shortDesc: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ];
    }

    if (tags) {
      const tagList = tags.split(",").map((t) => t.trim());
      where.tags = { hasSome: tagList };
    }

    if (inStock === "true") {
      where.stock = { gt: 0 };
    }

    // Array (bukan object) supaya bisa menampung tiebreaker `id` di akhir
    // kunci urutan utama — tanpa tiebreaker, baris dgn createdAt sama bisa
    // muncul ganda/terlewat antar halaman.
    let orderBy: Prisma.ProductOrderByWithRelationInput[];
    switch (sort) {
      case "price_asc":
        // Urutkan pakai harga efektif: varian termurah untuk produk bervarian,
        // basePrice untuk produk tunggal. basePrice sudah diisi harga varian
        // termurah oleh API admin, jadi satu kolom cukup.
        orderBy = [{ basePrice: "asc" }, { id: "asc" }];
        break;
      case "price_desc":
        // Untuk "termahal dulu", produk bervarian harus dibandingkan lewat
        // harga varian tertingginya — kalau memakai basePrice, produk dengan
        // varian 500k akan muncul seolah berharga 150k.
        orderBy = [{ maxPrice: { sort: "desc", nulls: "last" } }, { basePrice: "desc" }, { id: "asc" }];
        break;
      case "name_asc":
        orderBy = [{ name: "asc" }, { id: "asc" }];
        break;
      case "name_desc":
        orderBy = [{ name: "desc" }, { id: "asc" }];
        break;
      case "popular":
        orderBy = [{ orderItems: { _count: "desc" } }, { id: "asc" }];
        break;
      case "newest":
      default:
        orderBy = [{ createdAt: "desc" }, { id: "asc" }];
        break;
    }

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          images: { orderBy: { sortOrder: "asc" }, take: 1 },
          category: { select: { id: true, name: true, slug: true } },
          _count: { select: { reviews: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    const serialized = products.map((p) => ({
      ...p,
      basePrice: Number(p.basePrice),
      discountPrice: p.discountPrice ? Number(p.discountPrice) : null,
      minPrice: p.minPrice ? Number(p.minPrice) : null,
      maxPrice: p.maxPrice ? Number(p.maxPrice) : null,
    }));

    return NextResponse.json({
      products: serialized,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Products fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
