import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/reviews
 *
 * Daftar ulasan untuk moderasi admin.
 *
 * Query:
 *  - status    : "pending" | "approved" | "all"  (default: "all")
 *  - productId : filter satu produk (uuid)
 *  - search    : cari di komentar / nama produk / nama pengguna / email
 *  - page      : default 1
 *  - limit     : default 20, maksimal 100
 *
 * Response: { reviews, pagination, summary }
 *  - summary dihitung dari filter productId + search (TANPA filter status)
 *    supaya angka di tab "Menunggu"/"Disetujui" tetap akurat saat mencari.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);

    const rawStatus = (searchParams.get("status") || "all").toLowerCase();
    const status =
      rawStatus === "pending" || rawStatus === "approved" ? rawStatus : "all";

    const productId = searchParams.get("productId") || undefined;
    const search = (searchParams.get("search") || "").trim();

    const page = Math.max(
      1,
      parseInt(searchParams.get("page") || "1", 10) || 1
    );
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20)
    );

    // Filter dasar (productId + search) — dipakai untuk daftar DAN ringkasan.
    const baseWhere: Prisma.ReviewWhereInput = {
      ...(productId ? { productId } : {}),
      ...(search
        ? {
            OR: [
              { comment: { contains: search, mode: "insensitive" } },
              { product: { name: { contains: search, mode: "insensitive" } } },
              { product: { slug: { contains: search, mode: "insensitive" } } },
              { user: { name: { contains: search, mode: "insensitive" } } },
              { user: { email: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const where: Prisma.ReviewWhereInput = {
      ...baseWhere,
      ...(status === "pending" ? { isApproved: false } : {}),
      ...(status === "approved" ? { isApproved: true } : {}),
    };

    const skip = (page - 1) * limit;

    const [reviews, total, pendingCount, approvedCount, ratingAggregate] =
      await Promise.all([
        prisma.review.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
          include: {
            user: { select: { id: true, name: true, email: true, image: true } },
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: {
                  orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
                  take: 1,
                  select: { url: true },
                },
              },
            },
          },
        }),
        prisma.review.count({ where }),
        prisma.review.count({ where: { ...baseWhere, isApproved: false } }),
        prisma.review.count({ where: { ...baseWhere, isApproved: true } }),
        prisma.review.aggregate({ where: baseWhere, _avg: { rating: true } }),
      ]);

    const averageRating = ratingAggregate._avg.rating
      ? Math.round(ratingAggregate._avg.rating * 10) / 10
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
        user: review.user
          ? {
              id: review.user.id,
              name: review.user.name,
              email: review.user.email,
              image: review.user.image,
            }
          : null,
        userName: review.user?.name?.trim() || "Pengguna",
        userEmail: review.user?.email || null,
        product: review.product
          ? {
              id: review.product.id,
              name: review.product.name,
              slug: review.product.slug,
              image: review.product.images[0]?.url ?? null,
            }
          : null,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      summary: {
        total: pendingCount + approvedCount,
        pending: pendingCount,
        approved: approvedCount,
        averageRating,
      },
    });
  } catch (error) {
    console.error("Admin reviews GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
