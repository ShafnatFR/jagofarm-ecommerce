import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const reviewSchema = z.object({
  productId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
  imageUrl: z.string().url().optional(),
});

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

    const { productId, rating, comment, imageUrl } = parsed.data;

    // Check product exists
    const product = await prisma.product.findUnique({
      where: { id: productId, isActive: true },
    });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check if already reviewed
    const existingReview = await prisma.review.findUnique({
      where: { userId_productId: { userId: session.user.id, productId } },
    });
    if (existingReview) {
      return NextResponse.json(
        { error: "You have already reviewed this product" },
        { status: 409 }
      );
    }

    // Verify purchased
    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: {
          userId: session.user.id,
          status: "delivered",
        },
      },
    });

    if (!hasPurchased) {
      return NextResponse.json(
        { error: "You can only review products you have purchased and received" },
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
        isApproved: false, // Needs admin approval
      },
      include: { user: { select: { id: true, name: true, image: true } } },
    });

    return NextResponse.json(
      { message: "Review submitted, pending approval", review },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create review error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
