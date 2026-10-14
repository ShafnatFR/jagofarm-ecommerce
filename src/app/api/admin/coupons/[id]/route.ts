import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";

// Whitelist field kupon yang boleh diubah (cegah mass-assignment).
const patchCouponSchema = z
  .object({
    code: z.string().min(3).max(50).optional(),
    description: z.string().max(255).optional().or(z.literal("")),
    discountType: z.enum(["percentage", "fixed", "free_shipping"]).optional(),
    discountValue: z.coerce.number().min(0).optional(),
    minOrderValue: z.coerce.number().min(0).nullable().optional(),
    maxDiscount: z.coerce.number().min(0).nullable().optional(),
    usageLimit: z.coerce.number().int().min(0).nullable().optional(),
    startsAt: z.string().optional(),
    expiresAt: z.string().optional(),
    isActive: z.boolean().optional(),
  })
  .partial();

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const parsed = patchCouponSchema.safeParse(body);
    if (!parsed.success) {
      const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0];
      return NextResponse.json(
        { error: first ?? "Data kupon tidak valid." },
        { status: 400 }
      );
    }
    const parsedData = parsed.data;

    const existing = await prisma.coupon.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    const updateData: Prisma.CouponUpdateInput = { ...parsedData };
    if (parsedData.code) updateData.code = parsedData.code.toUpperCase();
    if (parsedData.startsAt) updateData.startsAt = new Date(parsedData.startsAt);
    if (parsedData.expiresAt) updateData.expiresAt = new Date(parsedData.expiresAt);

    const coupon = await prisma.coupon.update({
      where: { id },
      data: updateData,
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
    if (!session?.user?.id || session.user.role !== "admin") {
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
