import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    const existing = await prisma.coupon.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    if (body.code) body.code = body.code.toUpperCase();
    if (body.startsAt) body.startsAt = new Date(body.startsAt);
    if (body.expiresAt) body.expiresAt = new Date(body.expiresAt);

    const coupon = await prisma.coupon.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({
      message: "Coupon updated",
      coupon: {
        ...coupon,
        discountValue: Number(coupon.discountValue),
        minOrderValue: coupon.minOrderValue ? Number(coupon.minOrderValue) : null,
        maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : null,
      },
    });
  } catch (error) {
    console.error("Admin coupon PATCH error:", error);
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

    // Check if coupon is used in any active carts or pending orders
    const activeUsage = await prisma.cart.count({ where: { couponId: id } });
    const pendingOrders = await prisma.order.count({
      where: { couponId: id, status: "pending" },
    });

    if (activeUsage > 0 || pendingOrders > 0) {
      // Deactivate instead of delete
      await prisma.coupon.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({ message: "Coupon deactivated (has active usage)" });
    }

    await prisma.coupon.delete({ where: { id } });
    return NextResponse.json({ message: "Coupon deleted" });
  } catch (error) {
    console.error("Admin coupon DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
