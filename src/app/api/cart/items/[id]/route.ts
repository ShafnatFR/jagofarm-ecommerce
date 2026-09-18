import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { quantity } = body;

    if (!quantity || quantity < 1) {
      return NextResponse.json(
        { error: "Quantity must be at least 1" },
        { status: 400 }
      );
    }

    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id,
        cart: { userId: session.user.id },
      },
      include: { product: true, variant: true },
    });

    if (!cartItem) {
      return NextResponse.json({ error: "Cart item not found" }, { status: 404 });
    }

    const availableStock = cartItem.variant
      ? cartItem.variant.stock
      : cartItem.product.stock;

    if (quantity > availableStock) {
      return NextResponse.json(
        { error: "Insufficient stock" },
        { status: 400 }
      );
    }

    await prisma.cartItem.update({
      where: { id },
      data: { quantity },
    });

    return NextResponse.json({ message: "Cart item updated" });
  } catch (error) {
    console.error("Cart update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id,
        cart: { userId: session.user.id },
      },
    });

    if (!cartItem) {
      return NextResponse.json({ error: "Cart item not found" }, { status: 404 });
    }

    await prisma.cartItem.delete({ where: { id } });

    return NextResponse.json({ message: "Cart item removed" });
  } catch (error) {
    console.error("Cart delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
