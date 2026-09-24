import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import {
  createTransaction,
  getMidtransClientConfig,
  type MidtransItemDetail,
} from "@/lib/midtrans";

/**
 * POST /api/payments/create
 * Body: { orderNumber: string }
 *
 * Creates (or re-creates) a Snap transaction for the current user's pending,
 * unpaid order and stores the Snap token on the order.
 */

const createPaymentSchema = z.object({
  orderNumber: z.string().min(1, "orderNumber wajib diisi").max(60),
});

/** Midtrans limits: item/customer names max 50 / 20 chars. */
const MAX_ITEM_NAME = 50;
const MAX_CUSTOMER_NAME = 20;

function truncate(value: string, max: number): string {
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length > max ? clean.slice(0, max) : clean;
}

/** Absolute origin of this app, honouring reverse-proxy headers. */
function resolveOrigin(request: NextRequest): string {
  const proto =
    request.headers.get("x-forwarded-proto")?.split(",")[0].trim() || "http";
  const host =
    request.headers.get("x-forwarded-host")?.split(",")[0].trim() ||
    request.headers.get("host");
  if (host) return `${proto}://${host}`;
  try {
    return new URL(request.url).origin;
  } catch {
    return "";
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

    const parsed = createPaymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { orderNumber } = parsed.data;

    const order = await prisma.order.findFirst({
      where: { orderNumber, userId: session.user.id },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, slug: true } },
            variant: { select: { id: true, name: true } },
          },
        },
        shippingAddress: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!order) {
      // Same answer as "not yours" so we never leak other users' orders.
      return NextResponse.json(
        { error: "Pesanan tidak ditemukan" },
        { status: 404 }
      );
    }

    if (order.paymentStatus === "paid") {
      return NextResponse.json(
        { error: "Pesanan ini sudah dibayar. Tidak perlu membuat pembayaran baru." },
        { status: 409 }
      );
    }

    if (order.status !== "pending") {
      return NextResponse.json(
        {
          error: `Pesanan berstatus "${order.status}" tidak dapat dibayar. Silakan buat pesanan baru.`,
        },
        { status: 409 }
      );
    }

    if (order.items.length === 0) {
      return NextResponse.json(
        { error: "Pesanan tidak memiliki item" },
        { status: 400 }
      );
    }

    const totalInt = Math.round(Number(order.total));

    // ── item_details must sum exactly to gross_amount ──
    const itemDetails: MidtransItemDetail[] = order.items.map((item) => ({
      id: item.productId.slice(0, MAX_ITEM_NAME),
      name: truncate(
        item.variant ? `${item.product.name} - ${item.variant.name}` : item.product.name,
        MAX_ITEM_NAME
      ),
      price: Math.round(Number(item.price)),
      quantity: item.quantity,
    }));

    let itemsSum = itemDetails.reduce((acc, i) => acc + i.price * i.quantity, 0);

    const discountInt = Math.round(Number(order.discount));
    if (discountInt > 0) {
      itemDetails.push({
        id: "DISCOUNT",
        name: "Diskon",
        price: -discountInt,
        quantity: 1,
      });
      itemsSum -= discountInt;
    }

    const shippingInt = Math.round(Number(order.shippingCost));
    if (shippingInt > 0) {
      itemDetails.push({
        id: "SHIPPING",
        name: "Ongkos Kirim",
        price: shippingInt,
        quantity: 1,
      });
      itemsSum += shippingInt;
    }

    const adjustment = totalInt - itemsSum;
    if (adjustment !== 0) {
      itemDetails.push({
        id: "ADJUSTMENT",
        name: "Penyesuaian",
        price: adjustment,
        quantity: 1,
      });
    }

    const address = order.shippingAddress;
    const customerName = truncate(
      address?.recipientName || order.user?.name || "Pelanggan",
      MAX_CUSTOMER_NAME
    );

    const origin = resolveOrigin(request);
    const orderUrl = `${origin}/orders/${order.orderNumber}`;

    const snap = await createTransaction({
      orderId: order.orderNumber,
      grossAmount: totalInt,
      itemDetails,
      customerDetails: {
        first_name: customerName,
        email: order.user?.email || session.user.email,
        phone: address?.phone || undefined,
        shipping_address: {
          first_name: customerName,
          phone: address?.phone || undefined,
          address: address?.detail
            ? truncate(address.detail, 200)
            : undefined,
          city: address?.city || undefined,
          postal_code: address?.postalCode || undefined,
          country_code: "IDN",
        },
      },
      callbacks: {
        finish: orderUrl,
        unfinish: `${orderUrl}?payment=unfinish`,
        error: `${orderUrl}?payment=error`,
      },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: {
        midtransToken: snap.token,
        midtransOrderId: order.orderNumber,
      },
    });

    const clientConfig = getMidtransClientConfig();

    return NextResponse.json({
      token: snap.token,
      redirectUrl: snap.redirect_url,
      // Helpers so the browser can load Snap.js without extra env wiring.
      clientKey: clientConfig.clientKey,
      snapScriptUrl: clientConfig.snapUrl,
      isProduction: clientConfig.isProduction,
      orderNumber: order.orderNumber,
      grossAmount: totalInt,
    });
  } catch (error) {
    console.error("Create payment error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error:
          "Gagal membuat transaksi pembayaran. Silakan coba lagi beberapa saat lagi.",
        detail: process.env.NODE_ENV === "production" ? undefined : message,
      },
      { status: 502 }
    );
  }
}
