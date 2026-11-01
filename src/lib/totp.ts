/**
 * TOTP (RFC 6238, SHA-1, 30 detik, 6 digit) tanpa dependensi baru.
 * Dipakai untuk 2FA admin: setup sekali (scan QR / salin secret),
 * lalu verifikasi tiap login sensitif / aksi penting.
 *
 * Catatan keamanan: rahasia `pepper` env TOTP_PEPPER dicampur ke secret
 * supaya bocor DB saja tidak cukup untuk memalsukan kode.
 */

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Decode(input: string): Uint8Array {
  const clean = input.trim().replace(/=+$/, "").toUpperCase();
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    const idx = BASE32.indexOf(ch);
    if (idx < 0) throw new Error("Secret base32 tidak valid");
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return new Uint8Array(out);
}

function base32Encode(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const b of bytes) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += BASE32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += BASE32[(value << (5 - bits)) & 31];
  return out;
}

/** Secret acak 20 byte (160 bit, standar TOTP). */
export function generateTotpSecret(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return base32Encode(bytes);
}

function peppered(secret: string): Uint8Array {
  const pepper = (process.env.TOTP_PEPPER ?? "").trim();
  // Pepper dicampur sebagai prefix byte agar bocor DB saja tidak cukup.
  const raw = base32Decode(secret);
  if (!pepper) return raw;
  const enc = new TextEncoder().encode(pepper);
  const out = new Uint8Array(enc.length + raw.length);
  out.set(enc, 0);
  out.set(raw, enc.length);
  return out;
}

/** Kode TOTP saat ini (toleransi ±1 langkah = 90 detik). */
export async function verifyTotp(secret: string, code: string, windowSteps = 1): Promise<boolean> {
  const clean = code.trim().replace(/\s/g, "");
  if (!/^\d{6}$/.test(clean)) return false;
  let key: Uint8Array;
  try {
    key = peppered(secret);
  } catch {
    return false;
  }
  // Target TS ES2017: tanpa literal BigInt — pakai counter number.
  const step = Math.floor(Date.now() / 30_000);
  for (let d = -windowSteps; d <= windowSteps; d++) {
    if ((await hotpNumber(key, step + d)) === clean) return true;
  }
  return false;
}

async function hotpNumber(secretBytes: Uint8Array, counter: number): Promise<string> {
  const msg = new Uint8Array(8);
  let c = counter;
  for (let i = 7; i >= 0; i--) {
    msg[i] = c & 0xff;
    c = Math.floor(c / 256);
  }
  const keyBuf = new Uint8Array(secretBytes).buffer as ArrayBuffer;
  const key = await crypto.subtle.importKey("raw", keyBuf, { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, new Uint8Array(msg).buffer as ArrayBuffer));
  const offset = sig[sig.length - 1] & 0x0f;
  const binCode =
    ((sig[offset] & 0x7f) << 24) |
    (sig[offset + 1] << 16) |
    (sig[offset + 2] << 8) |
    sig[offset + 3];
  return String(binCode % 1_000_000).padStart(6, "0");
}

/** URL otpauth:// untuk QR setup di Google Authenticator / 1Password. */
export function totpSetupUrl(secret: string, account: string, issuer = "JagoFarm"): string {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}
