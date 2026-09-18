import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

    const where: any = {};
    if (search) {
      where.OR = [
        { code: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [coupons, total] = await Promise.all([
      prisma.coupon.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.coupon.count({ where }),
    ]);

    return NextResponse.json({
      coupons: coupons.map((c) => ({
        ...c,
        discountValue: Number(c.discountValue),
        minOrderValue: c.minOrderValue ? Number(c.minOrderValue) : null,
        maxDiscount: c.maxDiscount ? Number(c.maxDiscount) : null,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Admin coupons GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const couponSchema = z.object({
  code: z.string().min(3).max(50),
  description: z.string().max(255).optional(),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: z.number().positive(),
  minOrderValue: z.number().min(0).optional().nullable(),
  maxDiscount: z.number().min(0).optional().nullable(),
  usageLimit: z.number().int().positive().optional().nullable(),
  isActive: z.boolean().default(true),
  startsAt: z.string().transform((v) => new Date(v)),
  expiresAt: z.string().transform((v) => new Date(v)),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = couponSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const data = parsed.data;
    const code = data.code.toUpperCase();

    const existing = await prisma.coupon.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json({ error: "Coupon code already exists" }, { status: 409 });
    }

    const coupon = await prisma.coupon.create({
      data: {
        ...data,
        code,
      },
    });

    return NextResponse.json(
      {
        message: "Coupon created",
        coupon: {
          ...coupon,
          discountValue: Number(coupon.discountValue),
          minOrderValue: coupon.minOrderValue ? Number(coupon.minOrderValue) : null,
          maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : null,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Admin coupons POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
