import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import {
  PaymentProviderError,
  providerForOrder,
  type PaymentLineItem,
} from "@/lib/payments";

/**
 * POST /api/payments/create
 * Body: { orderNumber: string }
 *
 * Membuat (atau membuat ulang) transaksi pembayaran untuk order pending milik
 * user yang sedang login, memakai provider yang tercatat pada order
 * (`order.paymentProvider`) atau provider aktif dari env.
 *
 * Kontrak respons:
 *  - Midtrans  : { token, redirectUrl, clientKey, snapScriptUrl, isProduction,
 *                  orderNumber, grossAmount }
 *  - Mayar     : { provider, paymentUrl, redirectUrl, providerRef, orderNumber,
 *                  grossAmount, expiresAt }
 * Respons selalu memuat gabungan kedua bentuk (field yang tidak relevan
 * dihilangkan), sehingga klien lama maupun baru tetap bekerja.
 */

const createPaymentSchema = z.object({
  orderNumber: z.string().min(1, "orderNumber wajib diisi").max(60),
});

/** Masa berlaku pembayaran (jam) — harus cocok dengan default Snap. */
const PAYMENT_EXPIRY_HOURS = 24;

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

/** Nilai `expiredAt` dari respons gateway bila ada (Mayar: epoch ms). */
function resolveExpiresAt(raw: unknown, fallback: Date): string {
  if (raw !== null && typeof raw === "object" && "expiredAt" in raw) {
    const value = (raw as { expiredAt?: unknown }).expiredAt;
    if (typeof value === "number" && Number.isFinite(value)) {
      const date = new Date(value < 1e12 ? value * 1000 : value);
      if (!Number.isNaN(date.getTime())) return date.toISOString();
    }
    if (typeof value === "string") {
      const date = new Date(value);
      if (!Number.isNaN(date.getTime())) return date.toISOString();
    }
  }
  return fallback.toISOString();
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
        {
          error:
            "Pesanan ini sudah dibayar. Tidak perlu membuat pembayaran baru.",
        },
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

    const provider = providerForOrder(order);
    if (!provider.isConfigured()) {
      return NextResponse.json(
        {
          error: `Provider pembayaran ${provider.label} belum dikonfigurasi. Hubungi admin toko untuk mengaktifkan pembayaran.`,
        },
        { status: 503 }
      );
    }

    const totalInt = Math.round(Number(order.total));

    // ── Baris item: produk + diskon (negatif) + ongkir + penyesuaian ──────
    const items: PaymentLineItem[] = order.items.map((item) => ({
      description: item.variant
        ? `${item.product.name} - ${item.variant.name}`
        : item.product.name,
      quantity: item.quantity,
      rate: Math.round(Number(item.price)),
    }));

    let itemsSum = items.reduce(
      (acc, item) => acc + item.rate * item.quantity,
      0
    );

    const discountInt = Math.round(Number(order.discount));
    if (discountInt > 0) {
      items.push({ description: "Diskon", quantity: 1, rate: -discountInt });
      itemsSum -= discountInt;
    }

    const shippingInt = Math.round(Number(order.shippingCost));
    if (shippingInt > 0) {
      items.push({
        description: "Ongkos Kirim",
        quantity: 1,
        rate: shippingInt,
      });
      itemsSum += shippingInt;
    }

    const adjustment = totalInt - itemsSum;
    if (adjustment !== 0) {
      items.push({
        description: "Penyesuaian",
        quantity: 1,
        rate: adjustment,
      });
    }

    const address = order.shippingAddress;
    const origin = resolveOrigin(request);
    const redirectUrl = `${origin}/orders/${order.orderNumber}`;
    const expiresAt = new Date(
      Date.now() + PAYMENT_EXPIRY_HOURS * 60 * 60 * 1000
    );

    const result = await provider.createPayment({
      orderNumber: order.orderNumber,
      amount: totalInt,
      customer: {
        name: address?.recipientName || order.user?.name || "Pelanggan",
        email: order.user?.email || session.user.email,
        mobile: address?.phone || undefined,
      },
      items,
      redirectUrl,
      expiresAt,
      // Hanya dipakai provider yang mendukung pembatasan channel (Mayar).
      paymentMethodHint: order.paymentMethod ?? undefined,
    });

    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentProvider: result.provider,
        paymentRef: result.providerRef,
        paymentUrl: result.paymentUrl,
        // Snap token tetap disimpan supaya alur Midtrans lama (dan kolom
        // midtrans_order_id) tidak berubah.
        ...(result.token ? { midtransToken: result.token } : {}),
        ...(result.provider === "midtrans"
          ? { midtransOrderId: order.orderNumber }
          : {}),
      },
    });

    return NextResponse.json({
      provider: result.provider,
      providerRef: result.providerRef,
      paymentUrl: result.paymentUrl,
      redirectUrl: result.paymentUrl,
      token: result.token,
      clientKey: result.clientKey,
      snapScriptUrl: result.snapScriptUrl,
      isProduction: result.isProduction,
      orderNumber: order.orderNumber,
      grossAmount: totalInt,
      expiresAt: resolveExpiresAt(result.raw, expiresAt),
    });
  } catch (error) {
    console.error("Create payment error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    if (error instanceof PaymentProviderError && error.statusCode < 500) {
      return NextResponse.json({ error: message }, { status: error.statusCode });
    }
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
