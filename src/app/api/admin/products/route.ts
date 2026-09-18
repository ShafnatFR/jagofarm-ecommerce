import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { z } from "zod";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, parseInt(searchParams.get("limit") || "20"));
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const status = searchParams.get("status"); // active, inactive, all

    const where: any = {};
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
        variants: p.variants.map((v) => ({ ...v, priceModifier: Number(v.priceModifier) })),
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
  stock: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  metaTitle: z.string().optional(),
  metaDesc: z.string().optional(),
  images: z
    .array(z.object({ url: z.string(), altText: z.string().optional(), isPrimary: z.boolean().optional() }))
    .optional(),
  variants: z
    .array(
      z.object({
        name: z.string(),
        sku: z.string(),
        priceModifier: z.number().default(0),
        stock: z.number().int().min(0).default(0),
        attributes: z.any().optional(),
      })
    )
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { images, variants, ...productData } = parsed.data;
    const slug = slugify(productData.name);

    const product = await prisma.product.create({
      data: {
        ...productData,
        slug,
        images: images
          ? { create: images.map((img, i) => ({ ...img, sortOrder: i })) }
          : undefined,
        variants: variants ? { create: variants } : undefined,
      },
      include: { images: true, variants: true },
    });

    return NextResponse.json(
      { message: "Product created", product: { ...product, basePrice: Number(product.basePrice), discountPrice: product.discountPrice ? Number(product.discountPrice) : null } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Admin product POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
