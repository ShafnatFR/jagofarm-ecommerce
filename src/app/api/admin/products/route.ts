import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidateTag } from "next/cache";
import { slugify , parseIntSafe} from "@/lib/utils";
import { z } from "zod";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseIntSafe(searchParams.get("page"), 1, 1, 10_000);
    const limit = parseIntSafe(searchParams.get("limit"), 20, 1, 50);
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const status = searchParams.get("status"); // active, inactive, all

    const where: Prisma.ProductWhereInput = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ];
    }
    if (category) where.category = { slug: category };
    if (status === "active") where.isActive = true;
    if (status === "inactive") where.isActive = false;

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          category: { select: { name: true, slug: true } },
          variants: true,
          _count: { select: { orderItems: true, reviews: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products: products.map((p) => ({
        ...p,
        basePrice: Number(p.basePrice),
        discountPrice: p.discountPrice ? Number(p.discountPrice) : null,
        variants: p.variants.map((v) => ({ ...v, price: Number(v.price) })),
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Admin products GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const createProductSchema = z.object({
  name: z.string().min(2),
  categoryId: z.string().uuid(),
  description: z.string().optional(),
  shortDesc: z.string().max(500).optional(),
  basePrice: z.number().positive(),
  discountPrice: z.number().positive().optional().nullable(),
  sku: z.string().min(2),
  weightGram: z.number().int().positive(),
  lengthCm: z.number().int().positive(),
  widthCm: z.number().int().positive(),
  heightCm: z.number().int().positive(),
  stock: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  metaTitle: z.string().optional(),
  metaDesc: z.string().optional(),
  images: z
    .array(z.object({ url: z.string(), altText: z.string().optional(), isPrimary: z.boolean().optional() }))
    .optional(),
  hasVariants: z.boolean().default(false),
  // Opsi varian multi-dimensi (grup + nilai)
  optionGroups: z
    .array(
      z.object({
        name: z.string().min(1, "Nama grup opsi wajib."),
        sortOrder: z.number().int().min(0).default(0),
        options: z.array(
          z.object({
            value: z.string().min(1, "Nilai opsi wajib."),
            sortOrder: z.number().int().min(0).default(0),
          })
        ).min(1, "Grup opsi harus punya minimal 1 nilai."),
      })
    )
    .optional(),
  // Kombinasi varian (hasil dari Cartesian product opsi)
  variants: z
    .array(
      z.object({
        name: z.string().min(1, "Nama varian/kombinasi wajib diisi."),
        sku: z.string().min(2, "SKU varian minimal 2 karakter."),
        price: z.number().positive("Harga varian harus lebih dari 0."),
        discountPrice: z.number().positive("Diskon varian harus > 0.").optional().nullable(),
        stock: z.number().int().min(0).default(0),
        weightGram: z.number().int().positive().nullable().optional(),
        isActive: z.boolean().default(true),
        sortOrder: z.number().int().min(0).default(0),
        // Referensi ke opsi yang dipilih untuk kombinasi ini
        optionCombination: z.array(
          z.object({
            groupId: z.string().uuid(),
            optionId: z.string().uuid(),
          })
        ).optional(),
        // Gambar spesifik varian
        images: z.array(
          z.object({ 
            url: z.string(), 
            altText: z.string().optional(), 
            isPrimary: z.boolean().optional() 
          })
        ).optional(),
      })
    )
    .optional(),
})
  .refine(
    (d) => d.discountPrice == null || d.discountPrice < d.basePrice,
    { message: "Harga diskon harus lebih kecil dari harga dasar.", path: ["discountPrice"] }
  )
  .refine(
    // Diskon hanya berlaku untuk produk tanpa varian: harga tiap varian sudah
    // final, jadi satu discountPrice di level produk akan ambigu.
    (d) => !d.hasVariants || d.discountPrice == null,
    {
      message: "Harga diskon tidak tersedia untuk produk bervarian. Atur harga langsung di tiap varian.",
      path: ["discountPrice"],
    }
  )
  .refine(
    (d) => !d.hasVariants || (d.variants != null && d.variants.length > 0),
    { message: "Tambahkan minimal satu varian bila produk bervarian.", path: ["variants"] }
  )
  .refine(
    (d) => d.hasVariants || d.variants == null || d.variants.length === 0,
    { message: "Produk tanpa varian tidak boleh memiliki baris varian.", path: ["variants"] }
  );

/**
 * Normalisasi data produk + varian agar selalu konsisten.
 *
 * Aturan yang ditegakkan di sini (bukan hanya di UI):
 *  1. Bervarian -> `stock` produk = 0, stok dihitung dari varian aktif.
 *  2. Bervarian -> `basePrice` = harga varian aktif terendah (fallback waras
 *     untuk kode lama yang masih membaca basePrice).
 *  3. Bervarian -> `minPrice`/`maxPrice` diisi dari varian aktif; dipakai
 *     filter & sort /api/products.
 *  4. Tidak bervarian -> min/max = null dan varian tidak disimpan.
 *  5. `discountPrice` dipaksa null saat bervarian (diskon sekarang per varian).
 */
function normalizeVariants(input: {
  hasVariants: boolean;
  basePrice: number;
  discountPrice?: number | null;
  stock: number;
  variants?: Array<{
    name: string;
    sku: string;
    price: number;
    discountPrice?: number | null;
    stock: number;
    weightGram?: number | null;
    isActive?: boolean;
    sortOrder?: number;
    optionCombination?: Array<{ groupId: string; optionId: string }>;
    images?: Array<{ url: string; altText?: string | null; isPrimary?: boolean }>;
  }>;
}) {
  const rows = input.hasVariants ? (input.variants ?? []).filter((v) => v.isActive !== false) : [];

  if (!input.hasVariants || rows.length === 0) {
    return {
      hasVariants: false,
      stock: input.stock,
      basePrice: input.basePrice,
      discountPrice: input.discountPrice ?? null,
      minPrice: null as number | null,
      maxPrice: null as number | null,
      variants: [] as typeof rows,
    };
  }

  const prices = rows.map((v) => v.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  return {
    hasVariants: true,
    stock: 0,
    // Harga dasar mengikuti varian termurah supaya pembaca lama tetap benar.
    basePrice: minPrice,
    discountPrice: null,
    minPrice,
    maxPrice,
    variants: rows.map((v, index) => ({
      ...v,
      isActive: v.isActive !== false,
      sortOrder: v.sortOrder ?? index,
      weightGram: v.weightGram ?? null,
      discountPrice: v.discountPrice ?? null,
      optionCombination: v.optionCombination ?? [],
      images: v.images ?? [],
    })),
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { images, variants, hasVariants, optionGroups, ...productData } = parsed.data;
    const slug = slugify(productData.name);

    // Tegakkan aturan konsistensi produk/varian sebelum menyimpan.
    const normalized = normalizeVariants({
      hasVariants,
      basePrice: productData.basePrice,
      discountPrice: productData.discountPrice ?? null,
      stock: productData.stock,
      variants,
    });

    // Gambar pertama otomatis jadi primary, sortOrder mengikuti urutan kiriman
    const normalizedImages = images
      ?.filter((img) => img.url.trim().length > 0)
      .map((img, i) => ({
        url: img.url.trim(),
        altText: img.altText ?? null,
        sortOrder: i,
        isPrimary: i === 0,
      }));

    // Build data produk dengan opsi & varian multi-dimensi
    const productCreateData: Parameters<typeof prisma.product.create>[0]["data"] = {
      ...productData,
      slug,
      hasVariants: normalized.hasVariants,
      stock: normalized.stock,
      basePrice: normalized.basePrice,
      discountPrice: normalized.discountPrice,
      minPrice: normalized.minPrice,
      maxPrice: normalized.maxPrice,
      images: normalizedImages ? { create: normalizedImages } : undefined,
    };

    // Tambahkan opsi grup + opsi nilai (multi-dimensi)
    if (normalized.hasVariants && optionGroups && optionGroups.length > 0) {
      productCreateData.optionGroups = {
        create: optionGroups.map((og, ogIdx) => ({
          name: og.name.trim(),
          sortOrder: og.sortOrder ?? ogIdx,
          options: {
            create: (og.options ?? []).map((opt, optIdx) => ({
              value: opt.value.trim(),
              sortOrder: opt.sortOrder ?? optIdx,
            })),
          },
        })),
      };
    }

    // Tambahkan kombinasi varian dengan gambar spesifik
    if (normalized.hasVariants && normalized.variants.length > 0) {
      productCreateData.variants = {
        create: normalized.variants.map((v) => ({
          name: v.name,
          sku: v.sku,
          price: v.price,
          discountPrice: v.discountPrice,
          stock: v.stock,
          weightGram: v.weightGram ?? null,
          isActive: v.isActive,
          sortOrder: v.sortOrder,
          optionCombination: v.optionCombination ?? [],
          images: v.images && v.images.length > 0
            ? {
                create: v.images
                  .filter((img) => img.url.trim().length > 0)
                  .map((img, i) => ({
                    url: img.url.trim(),
                    altText: img.altText ?? null,
                    sortOrder: i,
                    isPrimary: i === 0,
                  })),
              }
            : undefined,
        })),
      };
    }

    const product = await prisma.product.create({
      data: productCreateData,
      include: { 
        images: { orderBy: { sortOrder: "asc" } }, 
        variants: { 
          include: { images: { orderBy: { sortOrder: "asc" } } },
          orderBy: { sortOrder: "asc" } 
        },
        optionGroups: {
          include: { options: { orderBy: { sortOrder: "asc" } } },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    // Bersihkan cache katalog homepage supaya produk baru langsung tampil.
    revalidateTag("catalog", "max");
    return NextResponse.json(
      {
        message: "Product created",
        product: {
          ...product,
          basePrice: Number(product.basePrice),
          discountPrice: product.discountPrice ? Number(product.discountPrice) : null,
          minPrice: product.minPrice ? Number(product.minPrice) : null,
          maxPrice: product.maxPrice ? Number(product.maxPrice) : null,
          variants: product.variants.map((v) => ({
            ...v,
            price: Number(v.price),
            discountPrice: v.discountPrice ? Number(v.discountPrice) : null,
            images: v.images ?? [],
          })),
          optionGroups: product.optionGroups?.map(og => ({
            ...og,
            options: og.options ?? [],
          })) ?? [],
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Admin product POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
