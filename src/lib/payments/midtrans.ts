/**
 * Adapter tipis yang membungkus {@link "@/lib/midtrans"} ke antarmuka
 * provider-agnostik di ./types.
 *
 * Isi src/lib/midtrans.ts TIDAK diubah — semua perilaku lama (Snap, signature
 * SHA512, pemetaan status) tetap dipakai lewat fungsi yang sudah ada.
 *
 * Handler notifikasi Midtrans lama juga tinggal di sini (`runMidtransWebhook`)
 * supaya POST /api/payments/webhook (URL lama) dan
 * POST /api/payments/webhook/midtrans menjalankan implementasi yang sama persis.
 */
import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { sendEmailSafe } from "@/lib/email";
import { paymentReceivedEmail, toEmailOrder } from "@/lib/email-templates";
import { prisma } from "@/lib/prisma";
import {
  createTransaction,
  getMidtransClientConfig,
  getTransactionStatus,
  mapToOrderStatus,
  shouldReleaseStock,
  verifySignature,
  type MidtransItemDetail,
  type MidtransTransactionStatus,
} from "@/lib/midtrans";
import {
  PaymentProviderError,
  type CreatePaymentInput,
  type CreatePaymentResult,
  type NormalizedPaymentStatus,
  type NormalizedWebhookEvent,
  type PaymentProvider,
  type PaymentStatusResult,
} from "./types";

/** Batas Midtrans: nama item 50 karakter, nama pelanggan 20 karakter. */
const MAX_ITEM_NAME = 50;
const MAX_CUSTOMER_NAME = 20;
const DEFAULT_EXPIRY_HOURS = 24;
const MAX_EXPIRY_HOURS = 24 * 7;

function truncate(value: string, max: number): string {
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length > max ? clean.slice(0, max) : clean;
}

/** Tambahkan query param ke URL redirect (aman untuk URL tanpa query). */
function appendQuery(url: string, key: string, value: string): string {
  try {
    const parsed = new URL(url);
    parsed.searchParams.set(key, value);
    return parsed.toString();
  } catch {
    return `${url}${url.includes("?") ? "&" : "?"}${key}=${encodeURIComponent(
      value
    )}`;
  }
}

/** Jumlah jam kedaluwarsa Snap dari `expiresAt` (default 24 jam, minimal 1). */
function resolveExpiryHours(expiresAt?: Date): number {
  if (!expiresAt || Number.isNaN(expiresAt.getTime())) {
    return DEFAULT_EXPIRY_HOURS;
  }
  const hours = Math.ceil((expiresAt.getTime() - Date.now()) / 3_600_000);
  return Math.min(MAX_EXPIRY_HOURS, Math.max(1, hours));
}

/** Terjemahkan transaction_status Midtrans ke status ternormalisasi. */
function toNormalizedStatus(
  transactionStatus: string,
  fraudStatus?: string
): NormalizedPaymentStatus {
  const { paymentStatus } = mapToOrderStatus(transactionStatus, fraudStatus);
  if (paymentStatus === "paid") return "paid";
  switch (transactionStatus) {
    case "expire":
      return "expired";
    case "cancel":
    case "deny":
    case "refund":
    case "partial_refund":
      return "cancelled";
    case "failure":
      return "failed";
    default:
      return "unpaid";
  }
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

/** Objek status Midtrans dikenali dari field `transaction_status`. */
function asMidtransStatus(raw: unknown): MidtransTransactionStatus | null {
  if (raw === null || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  return typeof record.transaction_status === "string"
    ? (raw as MidtransTransactionStatus)
    : null;
}

// ── Implementasi PaymentProvider ────────────────────────────────────────────

async function createPayment(
  input: CreatePaymentInput
): Promise<CreatePaymentResult> {
  const amount = Math.round(input.amount);

  // item_details WAJIB berjumlah tepat sama dengan gross_amount.
  const itemDetails: MidtransItemDetail[] = input.items.map((item, index) => ({
    id: `ITEM-${index + 1}`,
    name: truncate(item.description || `Item ${index + 1}`, MAX_ITEM_NAME),
    price: Math.round(item.rate),
    quantity: Math.max(1, Math.round(item.quantity)),
  }));

  const itemsSum = itemDetails.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  const adjustment = amount - itemsSum;
  if (adjustment !== 0) {
    itemDetails.push({
      id: "ADJUSTMENT",
      name: "Penyesuaian",
      price: adjustment,
      quantity: 1,
    });
  }

  const snap = await createTransaction({
    orderId: input.orderNumber,
    grossAmount: amount,
    itemDetails,
    customerDetails: {
      first_name: truncate(
        input.customer.name || "Pelanggan",
        MAX_CUSTOMER_NAME
      ),
      email: input.customer.email,
      phone: input.customer.mobile || undefined,
    },
    callbacks: {
      finish: input.redirectUrl,
      unfinish: appendQuery(input.redirectUrl, "payment", "unfinish"),
      error: appendQuery(input.redirectUrl, "payment", "error"),
    },
    expiryHours: resolveExpiryHours(input.expiresAt),
  });

  const clientConfig = getMidtransClientConfig();

  return {
    provider: "midtrans",
    providerRef: input.orderNumber,
    paymentUrl: snap.redirect_url,
    token: snap.token,
    snapScriptUrl: clientConfig.snapUrl,
    clientKey: clientConfig.clientKey,
    isProduction: clientConfig.isProduction,
    raw: snap,
  };
}

async function fetchStatus(providerRef: string): Promise<PaymentStatusResult> {
  const transaction = await getTransactionStatus(providerRef);

  const paidAtCandidate =
    transaction.settlement_time ?? transaction.transaction_time;
  const paidAt = paidAtCandidate ? new Date(paidAtCandidate) : undefined;

  return {
    provider: "midtrans",
    providerRef: transaction.order_id || providerRef,
    status: toNormalizedStatus(
      transaction.transaction_status,
      transaction.fraud_status
    ),
    amount: toNumber(transaction.gross_amount),
    paidAt:
      paidAt && !Number.isNaN(paidAt.getTime()) ? paidAt : undefined,
    paymentMethod: transaction.payment_type,
    raw: transaction,
  };
}

interface MidtransNotification {
  order_id?: string;
  status_code?: string;
  gross_amount?: string;
  signature_key?: string;
  transaction_status?: string;
  fraud_status?: string;
  payment_type?: string;
}

async function parseWebhook(
  request: NextRequest
): Promise<NormalizedWebhookEvent> {
  let body: MidtransNotification;
  try {
    body = (await request.json()) as MidtransNotification;
  } catch {
    throw new PaymentProviderError(
      "Payload notifikasi Midtrans tidak valid.",
      400
    );
  }

  const {
    order_id,
    status_code,
    gross_amount,
    signature_key,
    transaction_status,
    fraud_status,
  } = body;

  if (
    !order_id ||
    !status_code ||
    !gross_amount ||
    !signature_key ||
    !transaction_status
  ) {
    throw new PaymentProviderError(
      "Payload notifikasi Midtrans tidak lengkap.",
      400
    );
  }

  // Signature = SHA512(order_id + status_code + gross_amount + server_key)
  if (!verifySignature(order_id, status_code, gross_amount, signature_key)) {
    throw new PaymentProviderError("Invalid signature", 403);
  }

  return {
    provider: "midtrans",
    providerRef: order_id,
    orderNumber: order_id,
    status: toNormalizedStatus(transaction_status, fraud_status),
    amount: toNumber(gross_amount),
    raw: body,
  };
}

export const midtransProvider: PaymentProvider = {
  id: "midtrans",
  label: "Midtrans",
  isConfigured: () => Boolean((process.env.MIDTRANS_SERVER_KEY ?? "").trim()),
  createPayment,
  fetchStatus,
  parseWebhook,
};

// ── Handler notifikasi Midtrans (perilaku lama, dipakai dua route) ──────────

/**
 * POST /api/payments/webhook (dan /api/payments/webhook/midtrans)
 *
 * Endpoint notifikasi HTTP Midtrans: verifikasi signature SHA512, idempoten
 * (Midtrans mengulang notifikasi), dan mesin statusnya sama dengan
 * GET /api/payments/status/[orderId].
 */
export async function runMidtransWebhook(
  request: NextRequest
): Promise<NextResponse> {
  try {
    let body: MidtransNotification;
    try {
      body = (await request.json()) as MidtransNotification;
    } catch {
      return NextResponse.json(
        { error: "Payload notifikasi tidak valid" },
        { status: 400 }
      );
    }

    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
      payment_type,
    } = body;

    if (
      !order_id ||
      !status_code ||
      !gross_amount ||
      !signature_key ||
      !transaction_status
    ) {
      return NextResponse.json(
        { error: "Payload notifikasi tidak lengkap" },
        { status: 400 }
      );
    }

    // Verify signature: SHA512(order_id + status_code + gross_amount + server_key)
    if (!verifySignature(order_id, status_code, gross_amount, signature_key)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    const order = await prisma.order.findFirst({
      where: { orderNumber: order_id },
      include: {
        // Nama produk/varian + kontak pemilik dipakai untuk isi email.
        items: {
          include: {
            product: { select: { name: true } },
            variant: { select: { name: true } },
          },
        },
        user: { select: { name: true, email: true } },
        shippingAddress: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const { orderStatus, paymentStatus } = mapToOrderStatus(
      transaction_status,
      fraud_status
    );

    // Idempotent: notifications are retried and may arrive out of order.
    const hasChanged =
      order.status !== orderStatus || order.paymentStatus !== paymentStatus;

    // Never downgrade an order Midtrans already settled.
    const wouldDowngrade =
      order.paymentStatus === "paid" && paymentStatus !== "paid";

    if (!hasChanged || wouldDowngrade) {
      return NextResponse.json({ status: "ok", changed: false });
    }

    const alreadyTerminal =
      order.status === "cancelled" || order.status === "expired";
    const releaseStock =
      shouldReleaseStock(transaction_status) && !alreadyTerminal;

    const data: Prisma.OrderUpdateInput = {
      status: orderStatus,
      paymentStatus,
    };

    // Transisi NYATA ke paid (bukan notifikasi Midtrans berulang untuk order
    // yang sudah paid) — dipakai sebagai pemicu email "pembayaran diterima".
    const transitionedToPaid =
      paymentStatus === "paid" && order.paymentStatus !== "paid";

    let paidAtForEmail: Date | null = order.paidAt;
    let paymentMethodForEmail: string | null = order.paymentMethod;

    if (paymentStatus === "paid") {
      if (!order.paidAt) {
        paidAtForEmail = new Date();
        data.paidAt = paidAtForEmail;
      }
      if (!order.paymentMethod && payment_type) {
        data.paymentMethod = payment_type;
        paymentMethodForEmail = payment_type;
      }
      // Order lama bisa saja belum mencatat providernya (dibuat sebelum
      // kolom payment_provider ada) — isi tanpa menurunkan status apa pun.
      if (!order.paymentProvider) data.paymentProvider = "midtrans";
      if (!order.paymentRef) data.paymentRef = order.orderNumber;
    }

    await prisma.$transaction(async (tx) => {
      if (releaseStock) {
        // Stock was reserved when the order was created (see POST /api/orders).
        for (const item of order.items) {
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stock: { increment: item.quantity } },
            });
          } else {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } },
            });
          }
        }
      }

      await tx.order.update({
        where: { id: order.id },
        data,
      });
    });

    // ── Notifikasi email "pembayaran diterima" (best-effort) ───────────────
    if (transitionedToPaid) {
      const recipient = order.user?.email?.trim();
      if (recipient) {
        await sendEmailSafe({
          to: recipient,
          ...paymentReceivedEmail(
            toEmailOrder(order, {
              status: orderStatus,
              paidAt: paidAtForEmail,
              paymentMethod: paymentMethodForEmail,
              customerName: order.user?.name ?? null,
            })
          ),
        });
      } else {
        console.warn(
          `[payments/webhook] Email pembayaran ${order.orderNumber} dilewati: user tidak memiliki alamat email.`
        );
      }
    }

    return NextResponse.json({
      status: "ok",
      changed: true,
      orderStatus,
      paymentStatus,
      stockRestored: releaseStock,
    });
  } catch (error) {
    console.error("Midtrans webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export { asMidtransStatus, toNormalizedStatus };
