import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidateTag } from "next/cache";
import { slugify } from "@/lib/utils";

/** Produk Prisma beserta relasi varian (selalu di-include oleh route ini). */
type ProductWithVariants = Prisma.ProductGetPayload<{ include: { variants: true } }>;

function serializeProduct(p: ProductWithVariants) {
  return {
    ...p,
    basePrice: Number(p.basePrice),
    discountPrice: p.discountPrice ? Number(p.discountPrice) : null,
    variants: p.variants?.map((v) => ({ ...v, priceModifier: Number(v.priceModifier) })),
  };
}

/** Field Product yang boleh diubah lewat PATCH — mencegah error Prisma akibat key asing dari form */
const PATCHABLE_FIELDS = [
  "name",
  "slug",
  "categoryId",
  "description",
  "shortDesc",
  "basePrice",
  "discountPrice",
  "sku",
  "weightGram",
  "lengthCm",
  "widthCm",
  "heightCm",
  "stock",
  "isActive",
  "isFeatured",
  "tags",
  "metaTitle",
  "metaDesc",
] as const;

function pickProductFields(input: unknown) {
  const out: Record<string, unknown> = {};
  if (!input || typeof input !== "object") return out;

  const source = input as Record<string, unknown>;
  for (const field of PATCHABLE_FIELDS) {
    if (source[field] !== undefined) out[field] = source[field];
  }

  // Form admin mengirim angka sebagai string — koersikan sebelum masuk Prisma
  for (const key of ["basePrice", "discountPrice"]) {
    const value = out[key];
    if (typeof value === "string") {
      const num = Number(value);
      if (Number.isFinite(num)) out[key] = num;
      else delete out[key];
    }
  }
  for (const key of ["weightGram", "stock", "lengthCm", "widthCm", "heightCm"]) {
    const value = out[key];
    if (typeof value === "string") {
      const num = Number(value);
      if (Number.isFinite(num)) out[key] = Math.trunc(num);
      else delete out[key];
    } else if (typeof value === "number" && key in out) {
      out[key] = Math.trunc(value);
    }
  }
  if (out.discountPrice === null || out.discountPrice === 0) out.discountPrice = null;
  const tags = out.tags;
  if (typeof tags === "string") {
    out.tags = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }

  return out;
}

/** Normalisasi daftar gambar: buang yang kosong, pertama = primary, sortOrder sesuai urutan */
function normalizeImages(images: unknown) {
  if (!Array.isArray(images)) return undefined;
  return images
    .filter((img) => img && typeof img.url === "string" && img.url.trim().length > 0)
    .map((img, i) => ({
      url: img.url.trim(),
      altText: typeof img.altText === "string" && img.altText.trim() ? img.altText.trim() : null,
      sortOrder: i,
      isPrimary: i === 0,
    }));
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: true,
        category: { select: { id: true, name: true, slug: true } },
        _count: { select: { orderItems: true, reviews: true } },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ product: serializeProduct(product) });
  } catch (error) {
    console.error("Admin product GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { images, ...rest } = (body ?? {}) as { images?: unknown } & Record<string, unknown>;

    const existing = await prisma.product.findUnique({
      where: { id },
      select: { id: true, isActive: true, weightGram: true, lengthCm: true, widthCm: true, heightCm: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // pickProductFields hanya mengembalikan field PATCHABLE_FIELDS (sudah
    // dikoersikan dari string form admin), jadi bentuknya cocok dengan Prisma.
    const updateData = pickProductFields(rest) as Prisma.ProductUpdateInput;

    // Validasi berat & dimensi paket.
    // Aturannya dua, supaya produk lama yang datanya belum lengkap tetap bisa
    // diedit tanpa memaksa admin mengarang dimensi:
    //   1. Nilai yang DIKIRIM admin harus valid (tolak 0/negatif/NaN).
    //   2. Produk tidak boleh diaktifkan kalau data kirimnya belum lengkap.
    const explicitWeight = updateData.weightGram === undefined ? undefined : Number(updateData.weightGram);
    const hasExplicitDimension =
      updateData.lengthCm !== undefined || updateData.widthCm !== undefined || updateData.heightCm !== undefined;
    const effectiveActive = updateData.isActive === undefined ? existing.isActive : Boolean(updateData.isActive);
    const effectiveWeight = explicitWeight ?? existing.weightGram;
    const effectiveDimensions = [
      updateData.lengthCm === undefined ? existing.lengthCm : Number(updateData.lengthCm),
      updateData.widthCm === undefined ? existing.widthCm : Number(updateData.widthCm),
      updateData.heightCm === undefined ? existing.heightCm : Number(updateData.heightCm),
    ];

    const invalidExplicitValue =
      (explicitWeight !== undefined && (!Number.isFinite(explicitWeight) || explicitWeight <= 0)) ||
      (hasExplicitDimension &&
        effectiveDimensions.some((value) => value === null || !Number.isFinite(value) || value <= 0));

    if (invalidExplicitValue) {
      return NextResponse.json({ error: "Berat dan dimensi paket harus lebih dari 0" }, { status: 400 });
    }

    const shippingComplete =
      effectiveWeight > 0 &&
      effectiveDimensions.every((value) => value !== null && Number.isFinite(value) && value > 0);

    if (effectiveActive && !existing.isActive && !shippingComplete) {
      return NextResponse.json(
        { error: "Produk tidak bisa diaktifkan tanpa berat dan dimensi paket lebih dari 0" },
        { status: 400 }
      );
    }

    if (updateData.name) {
      // slugify() memanggil toString() — String() menjaga perilaku lama persis.
      updateData.slug = slugify(String(updateData.name));
    }

    // Sinkronisasi gambar: daftar terkirim menggantikan gambar lama (pertama = primary)
    const normalizedImages = normalizeImages(images);

    const product = await prisma.$transaction(async (tx) => {
      if (normalizedImages) {
        await tx.productImage.deleteMany({ where: { productId: id } });
      }

      return tx.product.update({
        where: { id },
        data: {
          ...updateData,
          ...(normalizedImages ? { images: { create: normalizedImages } } : {}),
        },
        include: {
          images: { orderBy: { sortOrder: "asc" } },
          variants: true,
        },
      });
    });

    revalidateTag("catalog", "max");
    return NextResponse.json({
      message: "Product updated",
      product: serializeProduct(product),
      // Data pengiriman produk lama masih kosong; admin bisa mengisinya kapan saja.
      shippingIncomplete: !shippingComplete,
    });
  } catch (error) {
    console.error("Admin product PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // Soft delete - just deactivate
    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    revalidateTag("catalog", "max");
    return NextResponse.json({ message: "Product deactivated" });
  } catch (error) {
    console.error("Admin product DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
