import { NextRequest, NextResponse } from "next/server";
import { OrderStatus, Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmailSafe } from "@/lib/email";
import { orderCreatedEmail, toEmailOrder } from "@/lib/email-templates";
import { formatPrice, generateOrderNumber } from "@/lib/utils";
import { checkoutSchema } from "@/lib/validators";

/** Error bisnis checkout (dibedakan dari error tak terduga -> 500). */
class CheckoutError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "CheckoutError";
    this.status = status;
  }
}

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
 * Validasi & hitung diskon kupon terhadap subtotal (server-authoritative).
 * Duplikat sengaja dari /api/cart (validasi kupon) agar route bisa dipastikan
 * independen dan tidak saling impor antar route handler.
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

  return { discount: Math.round(discount), error: null };
}

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

    const where: Prisma.OrderWhereInput = { userId: session.user.id };
    if (status) where.status = status as OrderStatus;

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
      { error: "Gagal memuat daftar pesanan" },
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

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Body request tidak valid" },
        { status: 400 }
      );
    }

    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const userId = session.user.id;

    // Ongkir datang dari body (pilihan kurir user), nominal lain dihitung di sini.
    const shippingCost = Math.round(Number(data.shippingCost));
    const notes = data.notes?.trim() ? data.notes.trim() : null;
    const shippingEtd = data.shippingEtd?.trim() ? data.shippingEtd.trim() : null;

    // Pastikan alamat milik user
    const address = await prisma.address.findFirst({
      where: { id: data.shippingAddressId, userId },
      select: { id: true },
    });
    if (!address) {
      return NextResponse.json(
        { error: "Alamat pengiriman tidak ditemukan" },
        { status: 404 }
      );
    }

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: { include: { product: true, variant: true } },
        coupon: true,
      },
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        { error: "Keranjang masih kosong. Tambahkan produk sebelum checkout." },
        { status: 400 }
      );
    }

    // ── Hitung ulang seluruh nominal dari data DB (jangan percaya client) ──
    let subtotal = 0;
    const orderItems: {
      productId: string;
      variantId: string | null;
      quantity: number;
      price: number;
      total: number;
    }[] = [];

    for (const item of cart.items) {
      if (!item.product.isActive) {
        throw new CheckoutError(
          `Produk ${item.product.name} sudah tidak dijual lagi. Hapus dari keranjang untuk melanjutkan.`
        );
      }

      const availableStock = item.variant ? item.variant.stock : item.product.stock;
      if (item.quantity > availableStock) {
        throw new CheckoutError(
          `Stok ${item.product.name} tidak mencukupi. Tersedia ${availableStock}, diminta ${item.quantity}.`
        );
      }

      const basePrice = Number(item.product.basePrice);
      const discountPrice = item.product.discountPrice
        ? Number(item.product.discountPrice)
        : null;
      const variantModifier = item.variant ? Number(item.variant.priceModifier) : 0;
      const unitPrice = Math.round(
        (discountPrice && discountPrice > 0 ? discountPrice : basePrice) +
          variantModifier
      );
      const lineTotal = unitPrice * item.quantity;

      subtotal += lineTotal;
      orderItems.push({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        price: unitPrice,
        total: lineTotal,
      });
    }

    subtotal = Math.round(subtotal);

    // ── Kupon: sumber utama cart.coupon, fallback couponCode dari body ──
    let coupon = cart.coupon ?? null;
    const bodyCouponCode = (data.couponCode ?? "").trim().toUpperCase();
    if (!coupon && bodyCouponCode) {
      coupon = await prisma.coupon.findUnique({ where: { code: bodyCouponCode } });
    }

    let discount = 0;
    let couponId: string | null = null;
    let couponWarning: string | null = null;

    if (coupon) {
      const evaluated = evaluateCoupon(subtotal, coupon);
      if (evaluated.error) {
        couponWarning = evaluated.error;
      } else {
        discount = evaluated.discount;
        couponId = coupon.id;
      }
    } else if (bodyCouponCode) {
      couponWarning = "Kode kupon tidak ditemukan";
    }

    const total = Math.max(0, subtotal - discount + shippingCost);
    const orderNumber = generateOrderNumber();

    // ── Simpan order + stok + kupon + kosongkan cart dalam satu transaksi ──
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          shippingAddressId: data.shippingAddressId,
          status: "pending",
          paymentStatus: "unpaid",
          paymentMethod: data.paymentMethod,
          shippingCourier: data.shippingCourier,
          shippingService: data.shippingService,
          shippingCost,
          shippingEtd,
          subtotal,
          discount,
          total,
          notes,
          couponId,
          // Snapshot item sesuai schema OrderItem (productId/variantId/price/quantity/total)
          items: { create: orderItems },
        },
      });

      // Kurangi stok (guard `gte` supaya tidak minus saat request balapan)
      for (const item of cart.items) {
        if (item.variantId) {
          const updated = await tx.productVariant.updateMany({
            where: { id: item.variantId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (updated.count === 0) {
            throw new CheckoutError(
              `Stok ${item.product.name} tidak mencukupi saat pesanan diproses. Silakan perbarui keranjang.`
            );
          }
        } else {
          const updated = await tx.product.updateMany({
            where: { id: item.productId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (updated.count === 0) {
            throw new CheckoutError(
              `Stok ${item.product.name} tidak mencukupi saat pesanan diproses. Silakan perbarui keranjang.`
            );
          }
        }
      }

      // Hitung pemakaian kupon
      if (couponId) {
        await tx.coupon.update({
          where: { id: couponId },
          data: { usedCount: { increment: 1 } },
        });
      }

      // Kosongkan keranjang + lepas kupon
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      await tx.cart.update({
        where: { id: cart.id },
        data: { couponId: null },
      });

      return newOrder;
    });

    const fullOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, slug: true } },
            variant: { select: { id: true, name: true } },
          },
        },
        shippingAddress: true,
      },
    });

    // ── Notifikasi email "pesanan dibuat" ──────────────────────────────────
    // Best-effort: sendEmailSafe tidak pernah throw, jadi kegagalan email
    // tidak mengubah respons checkout. Data diambil dari fullOrder yang sudah
    // ada (tanpa query tambahan); alamat email diambil dari sesi user.
    if (fullOrder) {
      const recipient = session.user.email?.trim();
      if (recipient) {
        await sendEmailSafe({
          to: recipient,
          ...orderCreatedEmail(
            toEmailOrder(fullOrder, { customerName: session.user.name ?? null })
          ),
        });
      } else {
        console.warn(
          `[orders] Email pesanan ${order.orderNumber} dilewati: user tidak memiliki alamat email.`
        );
      }
    }

    return NextResponse.json(
      {
        message: "Pesanan berhasil dibuat",
        orderNumber: order.orderNumber,
        couponWarning,
        order: fullOrder
          ? {
              ...fullOrder,
              subtotal: Number(fullOrder.subtotal),
              discount: Number(fullOrder.discount),
              shippingCost: Number(fullOrder.shippingCost),
              total: Number(fullOrder.total),
              items: fullOrder.items.map((i) => ({
                ...i,
                price: Number(i.price),
                total: Number(i.total),
              })),
            }
          : {
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
    if (error instanceof CheckoutError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Gagal membuat pesanan" },
      { status: 500 }
    );
  }
}
