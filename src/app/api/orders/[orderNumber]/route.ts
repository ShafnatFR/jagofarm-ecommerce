import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderNumber } = await params;

    const order = await prisma.order.findFirst({
      where: { orderNumber, userId: session.user.id },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, slug: true },
              include: { images: { where: { isPrimary: true }, take: 1 } },
            },
            variant: { select: { id: true, name: true, attributes: true } },
          },
        },
        shippingAddress: true,
        coupon: { select: { code: true, discountType: true, discountValue: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({
      order: {
        ...order,
        subtotal: Number(order.subtotal),
        discount: Number(order.discount),
        shippingCost: Number(order.shippingCost),
        total: Number(order.total),
        items: order.items.map((i) => ({
          ...i,
          price: Number(i.price),
          total: Number(i.total),
        })),
        coupon: order.coupon
          ? {
              code: order.coupon.code,
              discountType: order.coupon.discountType,
              discountValue: Number(order.coupon.discountValue),
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Order detail error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
