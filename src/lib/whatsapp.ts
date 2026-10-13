/**
 * Modul notifikasi WhatsApp JagoFarm.
 *
 * Provider-agnostic & tanpa dependensi baru: pengiriman lewat HTTP API
 * (default: Fonnte) memakai `fetch` bawaan Node/Edge runtime.
 *
 * Prinsip utama — SAMA dengan lib/email.ts — NOTIFIKASI TIDAK BOLEH
 * MENGGAGALKAN ALUR ORDER:
 *  - `sendWhatsApp` tidak pernah `throw`; kegagalan jaringan/HTTP dibungkus
 *    menjadi `{ ok: false, status: "failed", error }`.
 *  - Tanpa `WHATSAPP_API_TOKEN` (atau saat `WHATSAPP_DISABLED=true`) fungsi
 *    langsung mengembalikan `{ ok: true, status: "skipped" }` — bukan error.
 *  - `sendWhatsAppSafe` menelan error, mencatat lewat `console.error`, dan
 *    selalu mengembalikan hasil. Call site boleh mengabaikannya.
 *
 * Env yang dibaca:
 *  - WHATSAPP_API_TOKEN : token API gateway (mis. Fonnte). Kosong => no-op.
 *  - WHATSAPP_API_URL   : endpoint kirim. Kosong => https://api.fonnte.com/send
 *  - WHATSAPP_DISABLED  : "true" => matikan pengiriman (CI/dev).
 *  - WHATSAPP_COUNTRY_CODE : kode negara untuk normalisasi nomor (default "62").
 */

const DEFAULT_ENDPOINT = "https://api.fonnte.com/send";
const REQUEST_TIMEOUT_MS = 10_000;

export interface SendWhatsAppParams {
  /** Nomor tujuan: lokal (08xx) atau internasional (62xx). */
  to: string;
  /** Isi pesan (teks biasa). */
  message: string;
}

export interface WhatsAppSentResult {
  ok: true;
  status: "sent";
}

export interface WhatsAppSkippedResult {
  ok: true;
  status: "skipped";
  reason: string;
}

export interface WhatsAppFailedResult {
  ok: false;
  status: "failed";
  error: string;
}

export type SendWhatsAppResult =
  | WhatsAppSentResult
  | WhatsAppSkippedResult
  | WhatsAppFailedResult;

function getToken(): string {
  return (process.env.WHATSAPP_API_TOKEN ?? "").trim();
}

function getEndpoint(): string {
  return (process.env.WHATSAPP_API_URL ?? "").trim() || DEFAULT_ENDPOINT;
}

/** True bila pengiriman WA dimatikan lewat WHATSAPP_DISABLED=true. */
export function isWhatsAppDisabled(): boolean {
  return (process.env.WHATSAPP_DISABLED ?? "").trim().toLowerCase() === "true";
}

/** True bila WA benar-benar akan dikirim (ada token dan tidak dimatikan). */
export function isWhatsAppConfigured(): boolean {
  return getToken().length > 0 && !isWhatsAppDisabled();
}

/**
 * Normalisasi nomor ke format internasional tanpa "+" (mis. 62852...).
 * - Buang semua karakter selain digit.
 * - "0" di depan -> ganti kode negara (default 62).
 * - Nomor yang sudah diawali kode negara dibiarkan.
 * Mengembalikan null bila nomor terlalu pendek/tidak masuk akal.
 */
export function normalizePhone(raw: string, countryCode = "62"): string | null {
  const digits = (raw ?? "").replace(/\D/g, "");
  if (!digits) return null;
  let normalized = digits;
  if (normalized.startsWith("0")) {
    normalized = countryCode + normalized.slice(1);
  } else if (!normalized.startsWith(countryCode) && normalized.length <= 11) {
    // Nomor lokal tanpa "0" (mis. 852...) -> tambahkan kode negara.
    normalized = countryCode + normalized;
  }
  // Panjang wajar nomor internasional: 8..15 digit.
  if (normalized.length < 8 || normalized.length > 15) return null;
  return normalized;
}

let warnedMissingToken = false;

/**
 * Kirim satu pesan WhatsApp lewat gateway HTTP.
 * SELALU resolve (tidak pernah reject).
 */
export async function sendWhatsApp(
  params: SendWhatsAppParams
): Promise<SendWhatsAppResult> {
  try {
    if (isWhatsAppDisabled()) {
      return { ok: true, status: "skipped", reason: "WHATSAPP_DISABLED=true" };
    }

    const token = getToken();
    if (!token) {
      if (!warnedMissingToken) {
        warnedMissingToken = true;
        console.warn(
          "[whatsapp] WHATSAPP_API_TOKEN belum dikonfigurasi — notifikasi WhatsApp dilewati. " +
            "Isi token gateway untuk mengaktifkannya."
        );
      }
      return {
        ok: true,
        status: "skipped",
        reason: "WHATSAPP_API_TOKEN belum dikonfigurasi",
      };
    }

    const countryCode = (process.env.WHATSAPP_COUNTRY_CODE ?? "62").trim() || "62";
    const target = normalizePhone(params.to, countryCode);
    if (!target) {
      return {
        ok: false,
        status: "failed",
        error: `Nomor WhatsApp tidak valid: "${params.to}"`,
      };
    }

    const message = (params.message ?? "").trim();
    if (!message) {
      return { ok: false, status: "failed", error: "Isi pesan kosong." };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(getEndpoint(), {
        method: "POST",
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ target, message }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      let detail = "";
      try {
        detail = (await response.text()).slice(0, 300);
      } catch {
        detail = "";
      }
      return {
        ok: false,
        status: "failed",
        error: `Gateway WhatsApp HTTP ${response.status}${detail ? `: ${detail}` : ""}`,
      };
    }

    return { ok: true, status: "sent" };
  } catch (error) {
    return {
      ok: false,
      status: "failed",
      error:
        error instanceof Error
          ? `${error.name}: ${error.message}`
          : String(error),
    };
  }
}

/**
 * Pembungkus aman untuk call site: tidak pernah throw, selalu mencatat error.
 * Hasilnya boleh diabaikan — kegagalan WA tidak boleh mengubah respons API.
 */
export async function sendWhatsAppSafe(
  params: SendWhatsAppParams
): Promise<SendWhatsAppResult> {
  let result: SendWhatsAppResult;
  try {
    result = await sendWhatsApp(params);
  } catch (error) {
    result = {
      ok: false,
      status: "failed",
      error:
        error instanceof Error
          ? `${error.name}: ${error.message}`
          : String(error),
    };
  }

  if (result.status === "failed") {
    console.error(
      `[whatsapp] Gagal mengirim WhatsApp ke ${params.to}:`,
      result.error
    );
  }

  return result;
}
