import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { where: { isPrimary: true }, take: 1 },
              },
            },
            variant: true,
          },
          orderBy: { id: "asc" },
        },
        coupon: true,
      },
    });

    if (!cart) {
      return NextResponse.json({
        cart: { id: null, items: [], subtotal: 0, discount: 0, total: 0 },
      });
    }

    let subtotal = 0;
    const items = cart.items.map((item) => {
      const basePrice = Number(item.product.basePrice);
      const discountPrice = item.product.discountPrice
        ? Number(item.product.discountPrice)
        : null;
      const variantModifier = item.variant
        ? Number(item.variant.priceModifier)
        : 0;
      const unitPrice = (discountPrice || basePrice) + variantModifier;
      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;

      return {
        ...item,
        product: {
          ...item.product,
          basePrice,
          discountPrice,
        },
        variant: item.variant
          ? { ...item.variant, priceModifier: Number(item.variant.priceModifier) }
          : null,
        unitPrice,
        lineTotal,
      };
    });

    let discount = 0;
    if (cart.coupon) {
      const coupon = cart.coupon;
      const couponValue = Number(coupon.discountValue);
      const minOrder = coupon.minOrderValue ? Number(coupon.minOrderValue) : 0;

      if (subtotal >= minOrder) {
        if (coupon.discountType === "percentage") {
          discount = (subtotal * couponValue) / 100;
          const maxDisc = coupon.maxDiscount ? Number(coupon.maxDiscount) : null;
          if (maxDisc !== null && discount > maxDisc) discount = maxDisc;
        } else {
          discount = couponValue;
        }
      }
    }

    return NextResponse.json({
      cart: {
        id: cart.id,
        items,
        subtotal,
        discount,
        total: subtotal - discount,
        coupon: cart.coupon
          ? {
              code: cart.coupon.code,
              discountType: cart.coupon.discountType,
              discountValue: Number(cart.coupon.discountValue),
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Cart fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
