/**
 * Modul email transaksional JagoFarm.
 *
 * Provider-agnostic, tanpa dependensi baru: pengiriman dilakukan lewat HTTP API
 * Resend memakai `fetch` bawaan Node/Edge runtime.
 *
 * Prinsip utama — EMAIL TIDAK BOLEH MENGGAGALKAN ALUR ORDER/PEMBAYARAN:
 *  - `sendEmail` tidak pernah `throw`; semua kegagalan jaringan/HTTP dibungkus
 *    menjadi `{ ok: false, status: "failed", error }`.
 *  - Tanpa `RESEND_API_KEY` (atau saat `EMAIL_DISABLED=true`) fungsi langsung
 *    mengembalikan `{ ok: true, status: "skipped" }` — bukan error.
 *  - `sendEmailSafe` adalah pembungkus yang dipakai call site: ia menelan
 *    error, mencatat lewat `console.error`, dan selalu mengembalikan hasil.
 *
 * Env yang dibaca:
 *  - RESEND_API_KEY  : API key Resend. Kosong => pengiriman dilewati (no-op).
 *  - EMAIL_FROM      : alamat pengirim, mis. "JagoFarm <no-reply@jagofarm.id>".
 *  - EMAIL_DISABLED  : "true" => matikan pengiriman (berguna di CI/dev).
 */

import { SITE_CONFIG } from "@/lib/constants";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

/** Pengirim default bila EMAIL_FROM tidak diisi. */
export const DEFAULT_EMAIL_FROM = "JagoFarm <no-reply@jagofarm.id>";

/** Timeout request ke Resend (ms) supaya route tidak menggantung. */
const REQUEST_TIMEOUT_MS = 10_000;

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export interface EmailSentResult {
  ok: true;
  status: "sent";
  /** ID pesan dari Resend (null bila respons tidak memuat id). */
  id: string | null;
}

export interface EmailSkippedResult {
  ok: true;
  status: "skipped";
  /** Alasan email dilewati: "EMAIL_DISABLED=true" atau "RESEND_API_KEY belum dikonfigurasi". */
  reason: string;
}

export interface EmailFailedResult {
  ok: false;
  status: "failed";
  error: string;
}

export type SendEmailResult =
  | EmailSentResult
  | EmailSkippedResult
  | EmailFailedResult;

// ── Pembacaan env (lazy: dibaca per pemanggilan, bukan saat import) ──────────

function getApiKey(): string {
  return (process.env.RESEND_API_KEY ?? "").trim();
}

function getFrom(): string {
  const from = (process.env.EMAIL_FROM ?? "").trim();
  return from || DEFAULT_EMAIL_FROM;
}

/** True bila pengiriman email dimatikan lewat EMAIL_DISABLED=true. */
export function isEmailDisabled(): boolean {
  return (process.env.EMAIL_DISABLED ?? "").trim().toLowerCase() === "true";
}

/** True bila email benar-benar akan dikirim (ada API key dan tidak dimatikan). */
export function isEmailConfigured(): boolean {
  return getApiKey().length > 0 && !isEmailDisabled();
}

// Log hanya sekali supaya tidak membanjiri log di dev/CI tanpa kunci.
let warnedMissingKey = false;
let warnedDisabled = false;

function normalizeRecipients(to: string | string[]): string[] {
  const list = Array.isArray(to) ? to : [to];
  return list
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter((value) => value.length > 0);
}

async function readErrorDetail(response: Response): Promise<string> {
  try {
    const raw = await response.text();
    const trimmed = raw.trim();
    return trimmed.length > 300 ? `${trimmed.slice(0, 300)}…` : trimmed;
  } catch {
    return "";
  }
}

/**
 * Kirim satu email lewat API Resend.
 *
 * SELALU resolve (tidak pernah reject):
 *  - `{ ok: true, status: "sent", id }`      → terkirim
 *  - `{ ok: true, status: "skipped", reason }` → tidak dikonfigurasi/dimatikan
 *  - `{ ok: false, status: "failed", error }`  → gagal (jaringan/HTTP)
 */
export async function sendEmail(
  params: SendEmailParams
): Promise<SendEmailResult> {
  try {
    const recipients = normalizeRecipients(params.to);
    if (recipients.length === 0) {
      return {
        ok: false,
        status: "failed",
        error: "Alamat email tujuan kosong — email tidak dikirim.",
      };
    }

    const subject = (params.subject ?? "").trim();
    if (!subject) {
      return {
        ok: false,
        status: "failed",
        error: "Subject email kosong — email tidak dikirim.",
      };
    }

    if (isEmailDisabled()) {
      if (!warnedDisabled) {
        warnedDisabled = true;
        console.info(
          "[email] EMAIL_DISABLED=true — email transaksional dilewati (no-op)."
        );
      }
      return { ok: true, status: "skipped", reason: "EMAIL_DISABLED=true" };
    }

    const apiKey = getApiKey();
    if (!apiKey) {
      if (!warnedMissingKey) {
        warnedMissingKey = true;
        console.warn(
          "[email] RESEND_API_KEY belum dikonfigurasi — email transaksional dilewati. " +
            "Isi RESEND_API_KEY (dan EMAIL_FROM) untuk mengaktifkan notifikasi email."
        );
      }
      return {
        ok: true,
        status: "skipped",
        reason: "RESEND_API_KEY belum dikonfigurasi",
      };
    }

    const payload: Record<string, unknown> = {
      from: getFrom(),
      to: recipients,
      subject,
      html: params.html,
    };
    if (params.text) payload.text = params.text;
    if (params.replyTo) payload.reply_to = params.replyTo;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(RESEND_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      const detail = await readErrorDetail(response);
      return {
        ok: false,
        status: "failed",
        error: `Resend HTTP ${response.status}${detail ? `: ${detail}` : ""}`,
      };
    }

    let id: string | null = null;
    try {
      const data = (await response.json()) as { id?: unknown };
      if (typeof data?.id === "string") id = data.id;
    } catch {
      id = null;
    }

    return { ok: true, status: "sent", id };
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
 * Hasilnya boleh diabaikan — kegagalan email tidak boleh mengubah respons API.
 *
 * Bila pengiriman gagal, notifikasi email dikirim ke admin (env EMAIL_ALERT_TO,
 * fallback EMAIL_FROM) supaya kegagalan ke pelanggan (mis. order lunas tapi
 * email tidak terkirim) tidak senyap. Notifikasi memakai jalur fetch langsung
 * (bukan sendEmailSafe) sehingga tidak berpotensi rekursi.
 */
async function notifyEmailFailure(
  params: SendEmailParams,
  error: string
): Promise<void> {
  const apiKey = (process.env.RESEND_API_KEY ?? "").trim();
  if (!apiKey) return; // Tanpa Resend, memang tidak ada yang bisa dikirim.

  const alertTo = (process.env.EMAIL_ALERT_TO ?? "").trim() || SITE_CONFIG.email;
  const subject = `[JagoFarm] Email gagal: ${params.subject}`;
  const html = `
    <p>Email ke pelanggan gagal dikirim.</p>
    <ul>
      <li><strong>Penerima:</strong> ${Array.isArray(params.to) ? params.to.join(", ") : params.to}</li>
      <li><strong>Subjek:</strong> ${params.subject}</li>
      <li><strong>Error:</strong> ${error}</li>
      <li><strong>Waktu:</strong> ${new Date().toISOString()}</li>
    </ul>
    <p>Periksa pengiriman manual ke pelanggan bila ini menyangkut pesanan yang sudah lunas.</p>`;

  try {
    await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM?.trim() || DEFAULT_EMAIL_FROM,
        to: [alertTo],
        subject,
        html,
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    // Notifikasi gagal juga? Cukup catat — jangan loop, jangan throw.
    console.error("[email] Notifikasi kegagalan email ke admin juga tidak terkirim.");
  }
}

export async function sendEmailSafe(
  params: SendEmailParams
): Promise<SendEmailResult> {
  let result: SendEmailResult;
  try {
    result = await sendEmail(params);
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
      `[email] Gagal mengirim email "${params.subject}":`,
      result.error
    );
    await notifyEmailFailure(params, result.error);
  }

  return result;
}
