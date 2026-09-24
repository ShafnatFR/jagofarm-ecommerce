import crypto from "crypto";

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY ?? "";
const MIDTRANS_CLIENT_KEY = process.env.MIDTRANS_CLIENT_KEY ?? "";
const MIDTRANS_IS_PRODUCTION =
  process.env.MIDTRANS_IS_PRODUCTION === "true";

const MIDTRANS_BASE_URL = MIDTRANS_IS_PRODUCTION
  ? "https://app.midtrans.com"
  : "https://app.sandbox.midtrans.com";

/**
 * Snap token endpoint.
 * The correct endpoint is POST {base}/snap/v1/transactions (the previous
 * constant wrongly pointed at /snap/v2).
 */
const MIDTRANS_SNAP_URL = `${MIDTRANS_BASE_URL}/snap/v1/transactions`;

const MIDTRANS_STATUS_URL = MIDTRANS_IS_PRODUCTION
  ? "https://api.midtrans.com/v2"
  : "https://api.sandbox.midtrans.com/v2";

/** Snap.js browser script URL (used together with data-client-key). */
const MIDTRANS_SNAP_SCRIPT_URL = `${MIDTRANS_BASE_URL}/snap/snap.js`;

export interface MidtransItemDetail {
  id: string;
  price: number;
  quantity: number;
  name: string;
  brand?: string;
  category?: string;
}

export interface MidtransCustomerDetails {
  first_name: string;
  last_name?: string;
  email: string;
  phone?: string;
  billing_address?: MidtransAddress;
  shipping_address?: MidtransAddress;
}

export interface MidtransAddress {
  first_name: string;
  last_name?: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country_code?: string;
}

/**
 * Snap callbacks (optional).
 * `finish`   — customer completed the payment flow successfully.
 * `unfinish` — customer closed the payment page before finishing.
 * `error`    — the payment failed / was rejected.
 */
export interface MidtransCallbacks {
  finish?: string;
  unfinish?: string;
  error?: string;
}

export interface CreateTransactionParams {
  orderId: string;
  grossAmount: number;
  itemDetails: MidtransItemDetail[];
  customerDetails: MidtransCustomerDetails;
  callbacks?: MidtransCallbacks;
  /** Snap expiry in hours (default 24). */
  expiryHours?: number;
}

export interface MidtransSnapResponse {
  token: string;
  redirect_url: string;
}

export interface MidtransTransactionStatus {
  order_id: string;
  transaction_status: string;
  fraud_status?: string;
  payment_type?: string;
  status_code: string;
  status_message: string;
  transaction_id?: string;
  gross_amount: string;
  transaction_time?: string;
  settlement_time?: string;
  va_numbers?: Array<{ bank: string; va_number: string }>;
  permata_va_number?: string;
  bill_key?: string;
  biller_code?: string;
  store?: string;
  qr_string?: string;
  actions?: Array<{ name: string; method: string; url: string }>;
}

export type MidtransOrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "expired";

export type MidtransPaymentStatus = "unpaid" | "paid" | "refunded" | "failed";

/**
 * Build Basic auth header for Midtrans
 */
function getAuthHeader(): string {
  const encoded = Buffer.from(`${MIDTRANS_SERVER_KEY}:`).toString("base64");
  return `Basic ${encoded}`;
}

/** Fail fast (with a clear message) when the server key is missing. */
function assertServerKey(): void {
  if (!MIDTRANS_SERVER_KEY) {
    throw new Error(
      "MIDTRANS_SERVER_KEY belum dikonfigurasi. Set env tersebut sebelum membuat pembayaran."
    );
  }
}

/**
 * Create a Midtrans Snap transaction
 * Returns a Snap token and redirect URL for the payment page
 */
export async function createTransaction(
  params: CreateTransactionParams
): Promise<MidtransSnapResponse> {
  assertServerKey();

  const payload: Record<string, unknown> = {
    transaction_details: {
      order_id: params.orderId,
      gross_amount: params.grossAmount,
    },
    item_details: params.itemDetails,
    customer_details: params.customerDetails,
    credit_card: {
      secure: true,
    },
    expiry: {
      start_time: new Date().toISOString(),
      unit: "hours",
      duration: params.expiryHours ?? 24,
    },
  };

  // Only forward the callbacks that are actually set — Midtrans rejects empty strings.
  if (params.callbacks) {
    const callbacks: MidtransCallbacks = {};
    if (params.callbacks.finish) callbacks.finish = params.callbacks.finish;
    if (params.callbacks.unfinish) callbacks.unfinish = params.callbacks.unfinish;
    if (params.callbacks.error) callbacks.error = params.callbacks.error;
    if (Object.keys(callbacks).length > 0) {
      payload.callbacks = callbacks;
    }
  }

  const response = await fetch(MIDTRANS_SNAP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: getAuthHeader(),
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Midtrans Snap error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Get transaction status from Midtrans
 */
export async function getTransactionStatus(
  orderId: string
): Promise<MidtransTransactionStatus> {
  const url = `${MIDTRANS_STATUS_URL}/${orderId}/status`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: getAuthHeader(),
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(
      `Midtrans status check error: ${response.status} - ${error}`
    );
  }

  return response.json();
}

/**
 * Verify Midtrans notification signature
 * Signature = SHA512(order_id + status_code + gross_amount + server_key)
 */
export function verifySignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  signatureKey: string
): boolean {
  const input = `${orderId}${statusCode}${grossAmount}${MIDTRANS_SERVER_KEY}`;
  const hash = crypto.createHash("sha512").update(input).digest("hex");
  return hash === signatureKey;
}

/**
 * Map Midtrans transaction_status + fraud_status to our OrderStatus
 */
export function mapToOrderStatus(
  transactionStatus: string,
  fraudStatus?: string
): { orderStatus: MidtransOrderStatus; paymentStatus: MidtransPaymentStatus } {
  // transaction_status values: capture, settlement, pending, deny, cancel, expire, refund, partial_refund, failure
  // fraud_status values: accept, challenge, deny

  switch (transactionStatus) {
    case "capture":
      if (fraudStatus === "challenge") {
        return { orderStatus: "pending", paymentStatus: "unpaid" };
      }
      // fraud_status === "accept" or undefined for non-credit-card
      return { orderStatus: "paid", paymentStatus: "paid" };

    case "settlement":
      return { orderStatus: "paid", paymentStatus: "paid" };

    case "pending":
      return { orderStatus: "pending", paymentStatus: "unpaid" };

    case "deny":
      return { orderStatus: "cancelled", paymentStatus: "failed" };

    case "cancel":
      return { orderStatus: "cancelled", paymentStatus: "failed" };

    case "expire":
      return { orderStatus: "expired", paymentStatus: "failed" };

    case "refund":
    case "partial_refund":
      return { orderStatus: "cancelled", paymentStatus: "refunded" };

    case "failure":
      return { orderStatus: "cancelled", paymentStatus: "failed" };

    default:
      return { orderStatus: "pending", paymentStatus: "unpaid" };
  }
}

/**
 * True when a Midtrans transaction_status means the order is dead
 * (cancelled / expired/failed), so the stock reserved at checkout must be
 * released again. Refunds are intentionally excluded.
 */
export function shouldReleaseStock(transactionStatus: string): boolean {
  return ["expire", "cancel", "deny", "failure"].includes(transactionStatus);
}

/**
 * Get the Midtrans client-side config for Snap.js
 */
export function getMidtransClientConfig() {
  return {
    clientKey:
      process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || MIDTRANS_CLIENT_KEY,
    snapUrl: MIDTRANS_SNAP_SCRIPT_URL,
    isProduction: MIDTRANS_IS_PRODUCTION,
  };
}

export {
  MIDTRANS_CLIENT_KEY,
  MIDTRANS_IS_PRODUCTION,
  MIDTRANS_SNAP_SCRIPT_URL,
};
