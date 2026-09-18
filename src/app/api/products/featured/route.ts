import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        category: { select: { id: true, name: true, slug: true } },
        _count: { select: { reviews: { where: { isApproved: true } } } },
      },
    });

    const serialized = products.map((p) => ({
      ...p,
      basePrice: Number(p.basePrice),
      discountPrice: p.discountPrice ? Number(p.discountPrice) : null,
    }));

    return NextResponse.json({ products: serialized });
  } catch (error) {
    console.error("Featured products error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
