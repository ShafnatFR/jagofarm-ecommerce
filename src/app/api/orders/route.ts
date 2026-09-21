import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateOrderNumber } from "@/lib/utils";
import { z } from "zod";

const checkoutSchema = z.object({
  shippingAddressId: z.string().uuid(),
  shippingCourier: z.string(),
  shippingService: z.string(),
  shippingCost: z.number().min(0),
  shippingEtd: z.string().optional(),
  paymentMethod: z.string(),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(20, Math.max(1, parseInt(searchParams.get("limit") || "10")));
    const status = searchParams.get("status");

    const where: any = { userId: session.user.id };
    if (status) where.status = status;

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          items: {
            include: {
              product: { select: { id: true, name: true, slug: true } },
              variant: { select: { id: true, name: true } },
            },
          },
          shippingAddress: true,
        },
      }),
      prisma.order.count({ where }),
    ]);

    const serialized = orders.map((o) => ({
      ...o,
      subtotal: Number(o.subtotal),
      discount: Number(o.discount),
      shippingCost: Number(o.shippingCost),
      total: Number(o.total),
      items: o.items.map((i) => ({
        ...i,
        price: Number(i.price),
        total: Number(i.total),
      })),
    }));

    return NextResponse.json({
      orders: serialized,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Orders fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Verify address belongs to user
    const address = await prisma.address.findFirst({
      where: { id: data.shippingAddressId, userId: session.user.id },
    });
    if (!address) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    // Get cart with items
    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: {
        items: { include: { product: true, variant: true } },
        coupon: true,
      },
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // Calculate totals and verify stock
    let subtotal = 0;
    const orderItems: {
      productId: string;
      variantId: string | null;
      quantity: number;
      price: number;
      total: number;
    }[] = [];

    for (const item of cart.items) {
      const basePrice = Number(item.product.basePrice);
      const discountPrice = item.product.discountPrice
        ? Number(item.product.discountPrice)
        : null;
      const variantMod = item.variant ? Number(item.variant.priceModifier) : 0;
      const unitPrice = (discountPrice || basePrice) + variantMod;
      const lineTotal = unitPrice * item.quantity;

      // Stock check
      const availableStock = item.variant
        ? item.variant.stock
        : item.product.stock;
      if (item.quantity > availableStock) {
        return NextResponse.json(
          { error: `Insufficient stock for ${item.product.name}` },
          { status: 400 }
        );
      }

      subtotal += lineTotal;
      orderItems.push({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        price: unitPrice,
        total: lineTotal,
      });
    }

    // Apply coupon
    let discount = 0;
    let couponId: string | null = null;
    if (cart.coupon) {
      const coupon = cart.coupon;
      const couponValue = Number(coupon.discountValue);
      const minOrder = coupon.minOrderValue ? Number(coupon.minOrderValue) : 0;

      if (subtotal >= minOrder) {
        couponId = coupon.id;
        if (coupon.discountType === "percentage") {
          discount = (subtotal * couponValue) / 100;
          const maxDisc = coupon.maxDiscount ? Number(coupon.maxDiscount) : null;
          if (maxDisc !== null && discount > maxDisc) discount = maxDisc;
        } else {
          discount = couponValue;
        }
      }
    }

    const total = subtotal - discount + data.shippingCost;
    const orderNumber = generateOrderNumber();

    // Create order in transaction
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: (session.user as any).id,
          shippingAddressId: data.shippingAddressId,
          paymentMethod: data.paymentMethod,
          shippingCourier: data.shippingCourier,
          shippingService: data.shippingService,
          shippingCost: data.shippingCost,
          shippingEtd: data.shippingEtd,
          subtotal,
          discount,
          total,
          notes: data.notes,
          couponId,
          items: { create: orderItems },
        },
      });

      // Decrease stock
      for (const item of cart.items) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          });
        } else {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }

      // Increment coupon usage
      if (couponId) {
        await tx.coupon.update({
          where: { id: couponId },
          data: { usedCount: { increment: 1 } },
        });
      }

      // Clear cart
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      await tx.cart.update({
        where: { id: cart.id },
        data: { couponId: null },
      });

      return newOrder;
    });

    return NextResponse.json(
      {
        message: "Order created",
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          subtotal: Number(order.subtotal),
          discount: Number(order.discount),
          shippingCost: Number(order.shippingCost),
          total: Number(order.total),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
