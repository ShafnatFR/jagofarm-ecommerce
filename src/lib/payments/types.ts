/**
 * Kontrak provider pembayaran yang agnostik gateway.
 *
 * Semua kode pemanggil (route API) hanya berbicara lewat antarmuka di file ini,
 * sehingga menambah/mengganti gateway (Midtrans, Mayar, ...) tidak menyentuh
 * logika order. Nilai mata uang selalu Rupiah utuh (hasil pembulatan).
 */
import type { NextRequest } from "next/server";

export type PaymentProviderId = "midtrans" | "mayar";

/** Status pembayaran yang sudah dinormalisasi lintas gateway. */
export type NormalizedPaymentStatus =
  | "unpaid"
  | "paid"
  | "expired"
  | "cancelled"
  | "failed"
  | "unknown";

export interface PaymentCustomer {
  name: string;
  email: string;
  /** Nomor HP/WhatsApp. Opsional — Mayar menerima invoice tanpa `mobile`. */
  mobile?: string;
}

export interface PaymentLineItem {
  description: string;
  quantity: number;
  /** Harga satuan; boleh negatif untuk baris diskon (didukung Mayar). */
  rate: number;
}

export interface CreatePaymentInput {
  orderNumber: string;
  /** Nominal yang HARUS sama dengan total pesanan (Rupiah utuh). */
  amount: number;
  customer: PaymentCustomer;
  items: PaymentLineItem[];
  /** URL halaman kembali ke toko (bukan URL halaman pembayaran). */
  redirectUrl: string;
  expiresAt?: Date;
  /** Petunjuk metode (mis. "qris", "bank_transfer") — dipakai hanya bila provider mendukung pembatasan channel. */
  paymentMethodHint?: string;
}

export interface CreatePaymentResult {
  provider: PaymentProviderId;
  /** Referensi transaksi di gateway (Mayar transactionId, Midtrans order id). */
  providerRef: string;
  /** URL halaman pembayaran hosted yang bisa dibuka pelanggan. */
  paymentUrl: string;
  token?: string;
  snapScriptUrl?: string;
  clientKey?: string;
  isProduction?: boolean;
  raw?: unknown;
}

export interface PaymentStatusResult {
  provider: PaymentProviderId;
  providerRef: string;
  status: NormalizedPaymentStatus;
  amount?: number;
  paidAt?: Date;
  paymentMethod?: string;
  raw?: unknown;
}

export interface NormalizedWebhookEvent {
  provider: PaymentProviderId;
  providerRef?: string;
  orderNumber?: string;
  status: NormalizedPaymentStatus;
  amount?: number;
  paidAt?: Date;
  raw?: unknown;
}

export interface PaymentProvider {
  id: PaymentProviderId;
  /** Label untuk pesan ke pengguna (bahasa Indonesia). */
  label: string;
  isConfigured(): boolean;
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  fetchStatus(providerRef: string): Promise<PaymentStatusResult>;
  parseWebhook(request: NextRequest): Promise<NormalizedWebhookEvent>;
}

/**
 * Error dari gateway dengan status HTTP yang disarankan.
 *
 * Route memakai `statusCode` ini supaya kegagalan otentikasi webhook (403),
 * payload rusak (400), atau gateway tidak dikonfigurasi (503) tidak semuanya
 * dilaporkan sebagai 500.
 */
export class PaymentProviderError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode = 502) {
    super(message);
    this.name = "PaymentProviderError";
    this.statusCode = statusCode;
  }
}

export function isPaymentProviderError(
  error: unknown
): error is PaymentProviderError {
  return error instanceof PaymentProviderError;
}

export function isPaymentProviderId(
  value: unknown
): value is PaymentProviderId {
  return value === "midtrans" || value === "mayar";
}
