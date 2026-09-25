/**
 * Registry provider pembayaran + pemilihan provider aktif.
 *
 * Aturan pemilihan:
 *  - Order yang sudah punya `paymentProvider` selalu memakai provider itu
 *    (supaya order lama Midtrans tidak tiba-tiba dicek ke Mayar).
 *  - Order baru memakai env `PAYMENT_PROVIDER`; kalau tidak diisi: Mayar bila
 *    `MAYAR_API_KEY` tersedia, lalu Midtrans bila `MIDTRANS_SERVER_KEY` ada,
 *    dan terakhir Mayar sebagai default eksplisit.
 */
import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { sendEmailSafe } from "@/lib/email";
import { paymentReceivedEmail, toEmailOrder } from "@/lib/email-templates";
import { prisma } from "@/lib/prisma";
import {
  extractMayarWebhookSecret,
  getMayarWebhookSecret,
  mayarProvider,
  mayarSecretMatches,
} from "./mayar";
import { midtransProvider, runMidtransWebhook } from "./midtrans";
import {
  PaymentProviderError,
  isPaymentProviderId,
  type NormalizedWebhookEvent,
  type PaymentProvider,
  type PaymentProviderId,
  type PaymentStatusResult,
} from "./types";

export * from "./types";

const REGISTRY: Record<PaymentProviderId, PaymentProvider> = {
  midtrans: midtransProvider,
  mayar: mayarProvider,
};

/** Provider berdasarkan id yang sudah tervalidasi. */
export function getProvider(id: PaymentProviderId): PaymentProvider {
  return REGISTRY[id];
}

/**
 * Provider yang dipakai untuk membuat pembayaran BARU (env PAYMENT_PROVIDER,
 * dengan fallback berbasis ketersediaan kredensial).
 */
export function activeProvider(): PaymentProvider {
  const configured = (process.env.PAYMENT_PROVIDER ?? "").trim().toLowerCase();
  if (isPaymentProviderId(configured)) return REGISTRY[configured];
  if (mayarProvider.isConfigured()) return mayarProvider;
  if (midtransProvider.isConfigured()) return midtransProvider;
  // Default eksplisit supaya pesan error menyebut Mayar, bukan "unknown".
  return mayarProvider;
}

/**
 * Provider untuk sebuah order: `order.paymentProvider` bila valid, kalau tidak
 * fallback ke provider yang dikonfigurasi.
 *
 * Order lama (dibuat sebelum kolom `payment_provider` ada) dikenali dari
 * `midtransToken`/`midtransOrderId` supaya tidak tiba-tiba dicek ke gateway lain.
 */
export function providerForOrder(order: {
  paymentProvider?: string | null;
  midtransOrderId?: string | null;
  midtransToken?: string | null;
}): PaymentProvider {
  const stored = (order.paymentProvider ?? "").trim().toLowerCase();
  if (isPaymentProviderId(stored)) return REGISTRY[stored];
  if (order.midtransOrderId || order.midtransToken) return REGISTRY.midtrans;
  return activeProvider();
}

// ── Webhook generik ─────────────────────────────────────────────────────────

/** Include relasi yang dibutuhkan transisi + email di jalur webhook. */
const webhookOrderInclude = {
  items: {
    include: {
      product: { select: { name: true } },
      variant: { select: { name: true } },
    },
  },
  user: { select: { name: true, email: true } },
  shippingAddress: true,
} satisfies Prisma.OrderInclude;

type WebhookOrder = Prisma.OrderGetPayload<{
  include: typeof webhookOrderInclude;
}>;

function errorStatus(error: unknown, fallback: number): number {
  return error instanceof PaymentProviderError ? error.statusCode : fallback;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

/** Cari order: paymentRef -> orderNumber (extraData) -> email + nominal. */
async function findOrderForMayarEvent(
  event: NormalizedWebhookEvent,
  providerRef: string
): Promise<WebhookOrder | null> {
  const byRef = await prisma.order.findFirst({
    where: { paymentRef: providerRef },
    include: webhookOrderInclude,
  });
  if (byRef) return byRef;

  if (event.orderNumber) {
    const byNumber = await prisma.order.findFirst({
      where: { orderNumber: event.orderNumber },
      include: webhookOrderInclude,
    });
    if (byNumber) return byNumber;
  }

  // Fallback terakhir: webhook lama yang belum menyimpan paymentRef.
  const raw = event.raw;
  const body =
    raw !== null && typeof raw === "object"
      ? (raw as Record<string, unknown>)
      : null;
  const data =
    body && body.data !== null && typeof body.data === "object"
      ? (body.data as Record<string, unknown>)
      : null;
  const email = asString(data?.customerEmail) ?? asString(data?.email);

  if (!email || event.amount === undefined) return null;

  const candidates = await prisma.order.findMany({
    where: {
      status: "pending",
      paymentStatus: "unpaid",
      user: { email },
    },
    include: webhookOrderInclude,
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const match =
    candidates.find((candidate) => Number(candidate.total) === event.amount) ??
    null;

  if (match) {
    console.warn(
      `[payments/webhook/mayar] Order ${match.orderNumber} dicocokkan lewat fallback email+nominal (paymentRef belum tersimpan).`
    );
  }

  return match;
}

/**
 * POST /api/payments/webhook/mayar
 *
 * Mayar tidak mengirim signature apa pun, jadi keamanan bertumpu pada tiga hal:
 *  1. secret rahasia di URL (`?secret=`) atau header `x-mayar-secret`;
 *  2. VERIFIKASI ULANG ke GET /transactions/{id} sebelum menandai lunas —
 *     payload webhook sendiri tidak pernah dipercaya;
 *  3. transisi idempoten (hanya menulis kalau status benar-benar berubah).
 */
async function handleMayarWebhook(request: NextRequest): Promise<NextResponse> {
  if (!getMayarWebhookSecret()) {
    return NextResponse.json(
      {
        error:
          "MAYAR_WEBHOOK_SECRET belum dikonfigurasi. Set env tersebut lalu daftarkan URL webhook Mayar dengan ?secret=<nilai>.",
      },
      { status: 503 }
    );
  }

  const candidate = extractMayarWebhookSecret(request);
  if (!candidate || !mayarSecretMatches(candidate)) {
    return NextResponse.json(
      { error: "Secret webhook Mayar tidak valid." },
      { status: 401 }
    );
  }

  let event: NormalizedWebhookEvent;
  try {
    event = await mayarProvider.parseWebhook(request);
  } catch (error) {
    console.error("Mayar webhook payload error:", error);
    return NextResponse.json(
      { error: errorMessage(error) },
      { status: errorStatus(error, 400) }
    );
  }

  const providerRef = event.providerRef;
  if (!providerRef) {
    return NextResponse.json(
      { error: "Payload webhook tidak memuat id transaksi Mayar." },
      { status: 400 }
    );
  }

  // ── Verifikasi ulang ke API Mayar (satu-satunya sumber kebenaran) ────────
  let verified: PaymentStatusResult;
  try {
    verified = await mayarProvider.fetchStatus(providerRef);
  } catch (error) {
    console.error("Mayar verification failed:", error);
    return NextResponse.json(
      {
        error:
          "Gagal memverifikasi pembayaran ke Mayar. Notifikasi ini tidak mengubah status pesanan.",
        detail: errorMessage(error),
      },
      { status: 502 }
    );
  }

  const order = await findOrderForMayarEvent(event, providerRef);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const orderTotal = Number(order.total);
  const amountMatches =
    verified.amount !== undefined && verified.amount === orderTotal;

  if (verified.status !== "paid" || !amountMatches) {
    console.warn(
      `[payments/webhook/mayar] Order ${order.orderNumber} TIDAK ditandai lunas: status="${verified.status}", nominal verifikasi=${verified.amount ?? "n/a"}, total order=${orderTotal}.`
    );
    return NextResponse.json({
      status: "ok",
      changed: false,
      verified: false,
      orderStatus: order.status,
      paymentStatus: order.paymentStatus,
      providerStatus: verified.status,
    });
  }

  // ── Transisi idempoten ke paid (tanpa mengembalikan stok) ───────────────
  const alreadyPaid = order.paymentStatus === "paid" && order.status === "paid";
  if (alreadyPaid) {
    return NextResponse.json({
      status: "ok",
      changed: false,
      verified: true,
      orderStatus: order.status,
      paymentStatus: order.paymentStatus,
    });
  }

  const transitionedToPaid = order.paymentStatus !== "paid";
  const paidAt = order.paidAt ?? verified.paidAt ?? new Date();

  const data: Prisma.OrderUpdateInput = {
    status: "paid",
    paymentStatus: "paid",
  };
  // paidAt hanya ditulis sekali.
  if (!order.paidAt) data.paidAt = paidAt;
  if (!order.paymentMethod && verified.paymentMethod) {
    data.paymentMethod = verified.paymentMethod;
  }
  if (!order.paymentProvider) data.paymentProvider = "mayar";
  if (!order.paymentRef) data.paymentRef = providerRef;

  try {
    await prisma.order.update({ where: { id: order.id }, data });
  } catch (error) {
    console.error("Mayar order update failed:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui status pesanan" },
      { status: 500 }
    );
  }

  // ── Email "pembayaran diterima" (best-effort, tidak menggagalkan respons) ─
  if (transitionedToPaid) {
    const recipient = order.user?.email?.trim();
    if (recipient) {
      await sendEmailSafe({
        to: recipient,
        ...paymentReceivedEmail(
          toEmailOrder(order, {
            status: "paid",
            paidAt,
            paymentMethod: verified.paymentMethod ?? order.paymentMethod,
            customerName: order.user?.name ?? null,
          })
        ),
      });
    } else {
      console.warn(
        `[payments/webhook/mayar] Email pembayaran ${order.orderNumber} dilewati: user tidak memiliki alamat email.`
      );
    }
  }

  return NextResponse.json({
    status: "ok",
    changed: true,
    verified: true,
    orderStatus: "paid",
    paymentStatus: "paid",
  });
}

/**
 * Dispatcher webhook generik.
 *
 * - `mayar`    -> verifikasi secret + verifikasi ulang ke API Mayar.
 * - `midtrans` -> handler notifikasi lama (signature SHA512), sehingga URL
 *                 /api/payments/webhook yang lama tetap kompatibel.
 */
export async function handleWebhookFor(
  providerParam: string,
  request: NextRequest
): Promise<NextResponse> {
  const id = (providerParam ?? "").trim().toLowerCase();

  if (!isPaymentProviderId(id)) {
    return NextResponse.json(
      { error: `Provider pembayaran "${providerParam}" tidak dikenal.` },
      { status: 404 }
    );
  }

  if (id === "midtrans") {
    return runMidtransWebhook(request);
  }

  try {
    return await handleMayarWebhook(request);
  } catch (error) {
    console.error("Mayar webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
