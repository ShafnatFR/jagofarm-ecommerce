import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

function serializeProduct(p: any) {
  return {
    ...p,
    basePrice: Number(p.basePrice),
    discountPrice: p.discountPrice ? Number(p.discountPrice) : null,
    variants: p.variants?.map((v: any) => ({ ...v, priceModifier: Number(v.priceModifier) })),
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== "admin") {
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
    if (!session?.user?.id || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { images, variants, ...updateData } = body;

    if (updateData.name) {
      updateData.slug = slugify(updateData.name);
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: { images: true, variants: true },
    });

    return NextResponse.json({ message: "Product updated", product: serializeProduct(product) });
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
    if (!session?.user?.id || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // Soft delete - just deactivate
    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ message: "Product deactivated" });
  } catch (error) {
    console.error("Admin product DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
