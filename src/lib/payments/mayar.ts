/**
 * Provider Mayar (API v2).
 *
 * Fakta API yang dipakai (docs.mayar.id):
 *  - Base URL produksi : https://api.mayar.id/hl/v2
 *  - Base URL sandbox  : https://api.mayar.io/hl/v2
 *  - Auth              : header `Authorization: Bearer <MAYAR_API_KEY>`
 *  - Buat tagihan      : POST /invoices/create
 *  - Detail transaksi  : GET  /transactions/{id}
 *  - Webhook           : POST JSON dari Mayar (event `payment.received`)
 *    TIDAK ADA signature/secret di payload, jadi webhook diverifikasi ulang
 *    lewat GET /transactions/{id} di route webhook (lihat lib/payments/index.ts).
 */
import crypto from "crypto";
import type { NextRequest } from "next/server";
import {
  PaymentProviderError,
  type CreatePaymentInput,
  type CreatePaymentResult,
  type NormalizedPaymentStatus,
  type NormalizedWebhookEvent,
  type PaymentProvider,
  type PaymentStatusResult,
} from "./types";

const PRODUCTION_BASE_URL = "https://api.mayar.id/hl/v2";
const SANDBOX_BASE_URL = "https://api.mayar.io/hl/v2";

/** Potongan body error yang ditampilkan di pesan (jangan pernah kirim API key). */
const BODY_SNIPPET_LENGTH = 300;

// ── Konfigurasi (dibaca saat dipanggil supaya bisa diuji/di-stub) ────────────

export function getMayarApiKey(): string {
  return (process.env.MAYAR_API_KEY ?? "").trim();
}

/**
 * Sandbox dipakai sebagai default (aman): hanya `MAYAR_IS_SANDBOX="false"`
 * yang mengalihkan ke endpoint produksi.
 */
export function isMayarSandbox(): boolean {
  return (process.env.MAYAR_IS_SANDBOX ?? "true").trim().toLowerCase() !== "false";
}

/** Base URL efektif; `MAYAR_BASE_URL` menimpanya penuh (untuk uji/stub lokal). */
export function mayarBaseUrl(): string {
  const override = (process.env.MAYAR_BASE_URL ?? "").trim();
  if (override) return override.replace(/\/+$/, "");
  return isMayarSandbox() ? SANDBOX_BASE_URL : PRODUCTION_BASE_URL;
}

export function isMayarRestrictPaymentMethod(): boolean {
  return (
    (process.env.MAYAR_RESTRICT_PAYMENT_METHOD ?? "").trim().toLowerCase() ===
    "true"
  );
}

/**
 * Petakan petunjuk metode internal ke channel Mayar.
 *
 * Hanya dipakai bila MAYAR_RESTRICT_PAYMENT_METHOD="true" — Mayar menolak (400)
 * `paymentMethod` yang belum diaktifkan di dashboard, jadi kita sengaja TIDAK
 * mengirim field tersebut pada konfigurasi normal.
 *
 * `bank_transfer` dan `credit_card` sengaja dibiarkan kosong: kita tidak menebak
 * bank mana yang aktif, dan invoice Mayar tidak menerima kartu lewat field ini.
 */
export function mapPaymentMethodHint(hint?: string): string | undefined {
  const value = (hint ?? "").trim().toLowerCase();
  const supported = new Set([
    "qris",
    "va/bni",
    "va/bri",
    "va/mandiri",
    "va/cimb",
    "va/permata",
    "va/bjb",
    "va/bsi",
    "ewallet/dana",
    "ewallet/gopay",
    "ewallet/linkaja",
    "ewallet/shopeepay",
    "ewallet/jenius",
    "outlet/alfamart",
  ]);
  return supported.has(value) ? value : undefined;
}

// ── Secret webhook ──────────────────────────────────────────────────────────

export function getMayarWebhookSecret(): string {
  return (process.env.MAYAR_WEBHOOK_SECRET ?? "").trim();
}

/** Secret dari `?secret=` (query) atau header `x-mayar-secret`. */
export function extractMayarWebhookSecret(request: NextRequest): string | null {
  try {
    const fromQuery = new URL(request.url).searchParams.get("secret");
    if (fromQuery && fromQuery.trim()) return fromQuery.trim();
  } catch {
    /* URL tidak bisa diparse: lanjut ke header */
  }
  const fromHeader = request.headers.get("x-mayar-secret");
  return fromHeader && fromHeader.trim() ? fromHeader.trim() : null;
}

/**
 * Perbandingan waktu-konstan. Kedua nilai di-hash lebih dulu supaya panjang
 * string tidak ikut terukur dan `timingSafeEqual` tidak melempar error panjang.
 */
export function mayarSecretMatches(candidate: string): boolean {
  const expected = getMayarWebhookSecret();
  if (!expected) return false;
  const a = crypto.createHash("sha256").update(candidate).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

// ── Helper internal ─────────────────────────────────────────────────────────

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function asDate(value: unknown): Date | undefined {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? undefined : value;
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }
  return undefined;
}

/** Buang API key dari teks apa pun sebelum dimasukkan ke pesan error. */
function sanitize(text: string, apiKey: string): string {
  const cleaned = apiKey ? text.split(apiKey).join("***") : text;
  return cleaned.replace(/\s+/g, " ").trim().slice(0, BODY_SNIPPET_LENGTH);
}

/** Ambil payload `{ data: {...} }` (Mayar selalu membungkus data di field `data`). */
function extractData(body: unknown): Record<string, unknown> {
  const record = asRecord(body);
  const data = record ? asRecord(record.data) : null;
  if (data) return data;
  if (record) return record;
  throw new PaymentProviderError(
    "Respons Mayar tidak berisi objek data yang dikenali.",
    502
  );
}

interface MayarRequestInit {
  method?: "GET" | "POST";
  body?: string;
}

async function mayarRequest(
  path: string,
  init: MayarRequestInit = {}
): Promise<unknown> {
  const apiKey = getMayarApiKey();
  if (!apiKey) {
    throw new PaymentProviderError(
      "MAYAR_API_KEY belum dikonfigurasi. Set env tersebut sebelum memakai pembayaran Mayar.",
      503
    );
  }

  let response: Response;
  try {
    response = await fetch(`${mayarBaseUrl()}${path}`, {
      method: init.method ?? "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: init.body,
      cache: "no-store",
    });
  } catch (error) {
    throw new PaymentProviderError(
      `Gagal menghubungi Mayar: ${
        error instanceof Error ? error.message : String(error)
      }`,
      502
    );
  }

  const text = await response.text();

  if (!response.ok) {
    const retryAfter = response.headers.get("retry-after");
    const hint = retryAfter ? ` (coba lagi setelah ${retryAfter} detik)` : "";
    throw new PaymentProviderError(
      `Mayar API error ${response.status}${hint}: ${sanitize(text, apiKey)}`,
      response.status === 429 ? 429 : 502
    );
  }

  if (!text) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new PaymentProviderError(
      `Respons Mayar tidak valid (bukan JSON): ${sanitize(text, apiKey)}`,
      502
    );
  }
}

// ── Baris item + penyesuaian ────────────────────────────────────────────────

interface MayarInvoiceItem {
  quantity: number;
  rate: number;
  description: string;
}

/**
 * Susun `items` Mayar yang totalnya PASTI sama dengan `amount` (> 0).
 *
 * Bila total baris dari pemanggil tidak pas, ditambahkan satu baris penyesuaian:
 * kekurangan -> baris positif (ongkir/penyesuaian), kelebihan -> baris negatif
 * (diskon), sesuai catatan dokumen Mayar bahwa `rate` boleh negatif.
 */
function buildInvoiceItems(input: CreatePaymentInput): MayarInvoiceItem[] {
  const amount = Math.round(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new PaymentProviderError(
      "Nominal pembayaran tidak valid (harus lebih dari 0).",
      400
    );
  }

  const items: MayarInvoiceItem[] = input.items.map((item, index) => ({
    description: (item.description || `Item ${index + 1}`).slice(0, 120),
    quantity: Math.max(1, Math.round(item.quantity)),
    rate: Math.round(item.rate),
  }));

  let sum = items.reduce((acc, item) => acc + item.rate * item.quantity, 0);
  const delta = amount - sum;

  if (delta > 0) {
    items.push({
      description: "Ongkos Kirim / Penyesuaian",
      quantity: 1,
      rate: delta,
    });
  } else if (delta < 0) {
    items.push({ description: "Diskon", quantity: 1, rate: delta });
  }

  sum = items.reduce((acc, item) => acc + item.rate * item.quantity, 0);
  if (sum !== amount || sum <= 0) {
    throw new PaymentProviderError(
      `Total baris item (${sum}) tidak sama dengan nominal pembayaran (${amount}).`,
      400
    );
  }

  return items;
}

// ── Implementasi PaymentProvider ────────────────────────────────────────────

async function createPayment(
  input: CreatePaymentInput
): Promise<CreatePaymentResult> {
  if (!input.customer.email?.trim()) {
    throw new PaymentProviderError(
      "Email pelanggan wajib diisi untuk membuat tagihan Mayar.",
      400
    );
  }

  const items = buildInvoiceItems(input);

  const paymentMethod = mapPaymentMethodHint(input.paymentMethodHint);
  const basePayload: Record<string, unknown> = {
    name: input.customer.name?.trim() || "Pelanggan",
    email: input.customer.email.trim(),
    description: `Pembayaran pesanan ${input.orderNumber}`,
    extraData: {
      orderNumber: input.orderNumber,
      provider: "mayar",
      redirectUrl: input.redirectUrl,
    },
  };

  if (input.customer.mobile?.trim()) basePayload.mobile = input.customer.mobile.trim();
  if (input.expiresAt && !Number.isNaN(input.expiresAt.getTime())) {
    basePayload.expiredAt = input.expiresAt.toISOString();
  }

  // Payment Request API mendukung paymentMethod spesifik dan menghindari
  // halaman select-channel. Invoice API dipakai bila channel tidak dipilih.
  const endpoint = paymentMethod ? "/payments/create" : "/invoices/create";
  const payload: Record<string, unknown> = paymentMethod
    ? { ...basePayload, amount: Math.round(input.amount), paymentMethod }
    : { ...basePayload, items, redirectUrl: input.redirectUrl };

  const body = await mayarRequest(endpoint, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const data = extractData(body);

  const id = asString(data.id);
  const transactionId = asString(data.transactionId);
  const link = asString(data.link);
  const providerRef = transactionId ?? id;

  if (!providerRef || !link) {
    throw new PaymentProviderError(
      "Respons Mayar tidak memuat link pembayaran yang bisa dibuka.",
      502
    );
  }

  return {
    provider: "mayar",
    providerRef,
    paymentUrl: link,
    raw: data,
  };
}

async function fetchStatus(providerRef: string): Promise<PaymentStatusResult> {
  const body = await mayarRequest(
    `/transactions/${encodeURIComponent(providerRef)}`,
    { method: "GET" }
  );
  const data = extractData(body);
  const rawStatus = (asString(data.status) ?? "").toLowerCase();

  let status: NormalizedPaymentStatus = "unknown";
  if (rawStatus === "paid") status = "paid";
  else if (rawStatus === "unpaid" || rawStatus === "created") status = "unpaid";
  else if (rawStatus === "expired") status = "expired";

  const amount = asNumber(data.amount);
  const paymentMethod = asString(data.paymentMethod);
  // Mayar tidak menyediakan paidAt khusus: updatedAt adalah waktu transisi
  // terakhir, jadi hanya dipakai ketika status benar-benar paid.
  const paidAt = status === "paid" ? asDate(data.updatedAt) : undefined;

  return {
    provider: "mayar",
    providerRef: asString(data.id) ?? providerRef,
    status,
    amount,
    paidAt,
    paymentMethod,
    raw: data,
  };
}

/**
 * Baca payload webhook Mayar.
 *
 * PENTING: hasil parsing TIDAK boleh dipercaya untuk menandai lunas — payload
 * tidak bertanda tangan. Route webhook selalu memverifikasi ulang lewat
 * `fetchStatus()` sebelum mengubah status order.
 */
async function parseWebhook(
  request: NextRequest
): Promise<NormalizedWebhookEvent> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new PaymentProviderError(
      "Payload webhook Mayar tidak valid (bukan JSON).",
      400
    );
  }

  const record = asRecord(body);
  if (!record) {
    throw new PaymentProviderError("Payload webhook Mayar bukan objek.", 400);
  }

  const event = asString(record.event) ?? "";
  const data = asRecord(record.data) ?? {};
  const statusFlag = data.status;

  const isPaid = event.startsWith("payment.received") || statusFlag === true;
  const status: NormalizedPaymentStatus = isPaid
    ? "paid"
    : statusFlag === false
      ? "unpaid"
      : "unknown";

  const extraData = asRecord(data.extraData);

  return {
    provider: "mayar",
    providerRef: asString(data.transactionId) ?? asString(data.id),
    orderNumber: extraData ? asString(extraData.orderNumber) : undefined,
    status,
    amount: asNumber(data.amount),
    raw: body,
  };
}

export const mayarProvider: PaymentProvider = {
  id: "mayar",
  label: "Mayar",
  isConfigured: () => Boolean(getMayarApiKey()),
  createPayment,
  fetchStatus,
  parseWebhook,
};
