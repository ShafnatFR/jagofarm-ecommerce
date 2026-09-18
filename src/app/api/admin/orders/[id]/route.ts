import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, slug: true } },
            variant: true,
          },
        },
        shippingAddress: true,
        coupon: true,
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
      },
    });
  } catch (error) {
    console.error("Admin order GET error:", error);
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
    const { status: newStatus, trackingNumber, notes } = body;

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (newStatus) updateData.status = newStatus;
    if (trackingNumber) updateData.trackingNumber = trackingNumber;
    if (notes !== undefined) updateData.notes = notes;

    if (newStatus === "shipped" && order.status !== "shipped") {
      updateData.shippedAt = new Date();
    }
    if (newStatus === "delivered" && order.status !== "delivered") {
      updateData.deliveredAt = new Date();
    }

    const updated = await prisma.order.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      message: "Order updated",
      order: {
        ...updated,
        subtotal: Number(updated.subtotal),
        discount: Number(updated.discount),
        shippingCost: Number(updated.shippingCost),
        total: Number(updated.total),
      },
    });
  } catch (error) {
    console.error("Admin order PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
