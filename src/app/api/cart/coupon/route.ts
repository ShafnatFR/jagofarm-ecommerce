import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { applyCouponSchema } from "@/lib/validators";

/** Hitung subtotal dari item cart DB (harga efektif + modifier varian). */
async function computeCartSubtotal(cartId: string): Promise<number> {
  const items = await prisma.cartItem.findMany({
    where: { cartId },
    include: { product: true, variant: true },
  });

  const subtotal = items.reduce((sum, item) => {
    const basePrice = Number(item.product.basePrice);
    const discountPrice = item.product.discountPrice
      ? Number(item.product.discountPrice)
      : null;
    const variantModifier = item.variant ? Number(item.variant.priceModifier) : 0;
    return sum + ((discountPrice || basePrice) + variantModifier) * item.quantity;
  }, 0);

  return Math.round(subtotal);
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Body request tidak valid" },
        { status: 400 }
      );
    }

    const parsed = applyCouponSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const code = parsed.data.code.trim().toUpperCase();

    const coupon = await prisma.coupon.findUnique({ where: { code } });
    if (!coupon) {
      return NextResponse.json(
        { error: "Kode kupon tidak ditemukan" },
        { status: 400 }
      );
    }
    if (!coupon.isActive) {
      return NextResponse.json(
        { error: "Kupon sudah tidak aktif" },
        { status: 400 }
      );
    }

    const now = new Date();
    if (now < coupon.startsAt) {
      return NextResponse.json(
        { error: "Kupon belum berlaku" },
        { status: 400 }
      );
    }
    if (now > coupon.expiresAt) {
      return NextResponse.json(
        { error: "Kupon sudah kedaluwarsa" },
        { status: 400 }
      );
    }
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      return NextResponse.json(
        { error: "Kuota kupon sudah habis" },
        { status: 400 }
      );
    }

    let cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
    });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId: session.user.id } });
    }

    const subtotal = await computeCartSubtotal(cart.id);
    if (subtotal <= 0) {
      return NextResponse.json(
        { error: "Keranjang masih kosong" },
        { status: 400 }
      );
    }

    const minOrder = coupon.minOrderValue ? Number(coupon.minOrderValue) : 0;
    if (subtotal < minOrder) {
      return NextResponse.json(
        {
          error: `Minimal belanja ${formatPrice(
            minOrder
          )} untuk memakai kupon ini`,
        },
        { status: 400 }
      );
    }

    const value = Number(coupon.discountValue);
    let discount =
      coupon.discountType === "percentage" ? (subtotal * value) / 100 : value;
    const maxDiscount = coupon.maxDiscount ? Number(coupon.maxDiscount) : null;
    if (
      coupon.discountType === "percentage" &&
      maxDiscount !== null &&
      discount > maxDiscount
    ) {
      discount = maxDiscount;
    }
    if (discount > subtotal) discount = subtotal;
    discount = Math.round(discount);

    await prisma.cart.update({
      where: { id: cart.id },
      data: { couponId: coupon.id },
    });

    return NextResponse.json({
      message: "Kupon berhasil dipakai",
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: value,
        minOrderValue: minOrder || null,
      },
      cart: {
        subtotal,
        discount,
        total: Math.max(0, subtotal - discount),
      },
    });
  } catch (error) {
    console.error("Apply coupon error:", error);
    return NextResponse.json(
      { error: "Gagal memakai kupon" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
    });

    if (!cart) {
      return NextResponse.json({ message: "Tidak ada kupon aktif" });
    }

    await prisma.cart.update({
      where: { id: cart.id },
      data: { couponId: null },
    });

    return NextResponse.json({ message: "Kupon dihapus dari keranjang" });
  } catch (error) {
    console.error("Remove coupon error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus kupon" },
      { status: 500 }
    );
  }
}
