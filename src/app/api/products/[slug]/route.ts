import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const product = await prisma.product.findUnique({
      where: { slug, isActive: true },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: true,
        category: {
          select: { id: true, name: true, slug: true, parentId: true },
        },
        reviews: {
          where: { isApproved: true },
          include: { user: { select: { id: true, name: true, image: true } } },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        _count: { select: { reviews: { where: { isApproved: true } } } },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const reviewStats = await prisma.review.aggregate({
      where: { productId: product.id, isApproved: true },
      _avg: { rating: true },
      _count: true,
    });

    const ratingDistribution = await prisma.review.groupBy({
      by: ["rating"],
      where: { productId: product.id, isApproved: true },
      _count: true,
    });

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratingDistribution.forEach((r) => {
      distribution[r.rating] = r._count;
    });

    return NextResponse.json({
      ...product,
      basePrice: Number(product.basePrice),
      discountPrice: product.discountPrice ? Number(product.discountPrice) : null,
      variants: product.variants.map((v) => ({
        ...v,
        priceModifier: Number(v.priceModifier),
      })),
      reviews: {
        items: product.reviews,
        stats: {
          total: reviewStats._count,
          average: reviewStats._avg.rating || 0,
          distribution,
        },
      },
    });
  } catch (error) {
    console.error("Product detail error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
