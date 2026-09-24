import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const reviewSchema = z.object({
  productId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
});

const reviewQuerySchema = z.object({
  productId: z.string().uuid("productId tidak valid"),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

/** Order statuses that mean "this customer has actually paid / received it". */
const REVIEWABLE_ORDER_STATUSES = [
  "paid",
  "processing",
  "shipped",
  "delivered",
] as const;

function formatReviewDate(date: Date): string {
  try {
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

/**
 * GET /api/reviews?productId=<uuid>&limit=<1..50>
 * Returns published (isApproved) reviews plus an aggregate summary.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = reviewQuerySchema.safeParse({
      productId: searchParams.get("productId") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { productId, limit } = parsed.data;
    const take = limit ?? 20;

    const [reviews, aggregate, grouped] = await Promise.all([
      prisma.review.findMany({
        where: { productId, isApproved: true },
        orderBy: { createdAt: "desc" },
        take,
        include: { user: { select: { id: true, name: true, image: true } } },
      }),
      prisma.review.aggregate({
        where: { productId, isApproved: true },
        _avg: { rating: true },
        _count: { rating: true },
      }),
      prisma.review.groupBy({
        by: ["rating"],
        where: { productId, isApproved: true },
        _count: { rating: true },
      }),
    ]);

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    grouped.forEach((row) => {
      if (row.rating >= 1 && row.rating <= 5) {
        distribution[row.rating] = row._count.rating;
      }
    });

    const totalReviews = aggregate._count.rating;
    const averageRating = aggregate._avg.rating
      ? Math.round(aggregate._avg.rating * 10) / 10
      : 0;

    return NextResponse.json({
      reviews: reviews.map((review) => ({
        id: review.id,
        userId: review.userId,
        productId: review.productId,
        rating: review.rating,
        comment: review.comment,
        imageUrl: review.imageUrl,
        isApproved: review.isApproved,
        createdAt: review.createdAt,
        // Display helpers kept for the storefront UI.
        date: formatReviewDate(review.createdAt),
        user: review.user?.name?.trim() || "Pengguna",
        userName: review.user?.name?.trim() || "Pengguna",
        userImage: review.user?.image ?? null,
      })),
      summary: {
        averageRating,
        totalReviews,
        distribution,
        // Convenience aliases.
        average: averageRating,
        total: totalReviews,
      },
    });
  } catch (error) {
    console.error("Fetch reviews error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reviews
 * Body: { productId, rating (1-5), comment?, imageUrl? }
 * Only customers who bought (and already paid for / received) the product
 * may review it. Reviews are auto-published (moderation comes later).
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { productId, rating } = parsed.data;
    const comment = parsed.data.comment?.trim() || undefined;
    const imageUrl = parsed.data.imageUrl?.trim() || undefined;

    // Check product exists
    const product = await prisma.product.findUnique({
      where: { id: productId, isActive: true },
    });
    if (!product) {
      return NextResponse.json(
        { error: "Produk tidak ditemukan" },
        { status: 404 }
      );
    }

    // Check if already reviewed
    const existingReview = await prisma.review.findUnique({
      where: { userId_productId: { userId: session.user.id, productId } },
    });
    if (existingReview) {
      return NextResponse.json(
        { error: "Anda sudah pernah mengulas produk ini." },
        { status: 409 }
      );
    }

    // 1) Did this user ever buy the product (ignoring cancelled/expired orders)?
    const everPurchased = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: {
          userId: session.user.id,
          status: { notIn: ["cancelled", "expired"] },
        },
      },
      select: { id: true },
    });

    if (!everPurchased) {
      return NextResponse.json(
        {
          error:
            "Anda belum pernah membeli produk ini. Ulasan hanya bisa ditulis setelah produk dibeli.",
        },
        { status: 403 }
      );
    }

    // 2) Has the purchase been paid for / received?
    const received = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: {
          userId: session.user.id,
          status: { in: [...REVIEWABLE_ORDER_STATUSES] },
        },
      },
      select: { id: true },
    });

    if (!received) {
      return NextResponse.json(
        {
          error:
            "Pesanan Anda belum dibayar atau barang belum diterima. Ulasan bisa ditulis setelah pembayaran terkonfirmasi.",
        },
        { status: 403 }
      );
    }

    const review = await prisma.review.create({
      data: {
        userId: session.user.id,
        productId,
        rating,
        comment,
        imageUrl,
        // Auto-publish so the review shows up immediately.
        isApproved: true,
      },
      include: { user: { select: { id: true, name: true, image: true } } },
    });

    return NextResponse.json(
      {
        message: "Ulasan berhasil dikirim dan sudah tayang.",
        review: {
          id: review.id,
          userId: review.userId,
          productId: review.productId,
          rating: review.rating,
          comment: review.comment,
          imageUrl: review.imageUrl,
          isApproved: review.isApproved,
          createdAt: review.createdAt,
          date: formatReviewDate(review.createdAt),
          user: review.user?.name?.trim() || "Pengguna",
          userName: review.user?.name?.trim() || "Pengguna",
          userImage: review.user?.image ?? null,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    // Unique constraint (userId + productId) raced by a double submit.
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Anda sudah pernah mengulas produk ini." },
        { status: 409 }
      );
    }
    console.error("Create review error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
