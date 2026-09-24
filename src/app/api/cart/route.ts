import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

interface CouponLike {
  code: string;
  discountType: string;
  discountValue: unknown;
  minOrderValue: unknown;
  maxDiscount: unknown;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
  startsAt: Date;
  expiresAt: Date;
}

/**
 * Hitung diskon kupon terhadap subtotal.
 * Semua validasi (aktif, periode, min order, kuota, max discount) dilakukan di server.
 * (Duplikat sengaja di src/app/api/orders/route.ts — route file tidak boleh
 * mengekspor helper non-HTTP karena validasi tipe Next.js.)
 */
function evaluateCoupon(
  subtotal: number,
  coupon: CouponLike
): { discount: number; error: string | null } {
  const now = new Date();

  if (!coupon.isActive) {
    return { discount: 0, error: "Kupon sudah tidak aktif" };
  }
  if (now < coupon.startsAt) {
    return { discount: 0, error: "Kupon belum berlaku" };
  }
  if (now > coupon.expiresAt) {
    return { discount: 0, error: "Kupon sudah kedaluwarsa" };
  }
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    return { discount: 0, error: "Kuota kupon sudah habis" };
  }

  const minOrder = coupon.minOrderValue ? Number(coupon.minOrderValue) : 0;
  if (subtotal < minOrder) {
    return {
      discount: 0,
      error: `Minimal belanja ${formatPrice(minOrder)} untuk memakai kupon ini`,
    };
  }

  const value = Number(coupon.discountValue);
  let discount =
    coupon.discountType === "percentage"
      ? (subtotal * value) / 100
      : value;

  const maxDiscount = coupon.maxDiscount ? Number(coupon.maxDiscount) : null;
  if (
    coupon.discountType === "percentage" &&
    maxDiscount !== null &&
    discount > maxDiscount
  ) {
    discount = maxDiscount;
  }

  if (discount > subtotal) discount = subtotal;

  return { discount: Math.round(discount), error: null };
}

export async function GET() {
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
        cart: {
          id: null,
          items: [],
          subtotal: 0,
          discount: 0,
          total: 0,
          coupon: null,
          couponError: null,
          itemCount: 0,
        },
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
          ? { ...item.variant, priceModifier: variantModifier }
          : null,
        unitPrice,
        lineTotal,
      };
    });

    // Bulatkan subtotal supaya tidak ada sisa pecahan (harga Rupiah)
    subtotal = Math.round(subtotal);

    let discount = 0;
    let couponError: string | null = null;
    if (cart.coupon) {
      const evaluated = evaluateCoupon(subtotal, cart.coupon);
      discount = evaluated.discount;
      couponError = evaluated.error;
    }

    return NextResponse.json({
      cart: {
        id: cart.id,
        items,
        subtotal,
        discount,
        total: Math.max(0, subtotal - discount),
        itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
        couponError,
        coupon: cart.coupon
          ? {
              code: cart.coupon.code,
              discountType: cart.coupon.discountType,
              discountValue: Number(cart.coupon.discountValue),
              minOrderValue: cart.coupon.minOrderValue
                ? Number(cart.coupon.minOrderValue)
                : null,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Cart fetch error:", error);
    return NextResponse.json(
      { error: "Gagal memuat keranjang" },
      { status: 500 }
    );
  }
}
