import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

/**
 * Referral (A8).
 *
 * Alur:
 *  1. Setiap user punya `referralCode` unik (dibuat saat pertama diminta).
 *  2. Saat registrasi, user boleh memasukkan kode orang lain.
 *  3. Baris Referral dibuat dengan status "pending".
 *  4. Reward diberikan saat order pertama referee lunas (atau manual admin).
 *
 * Prinsip: pembuatan kode & pencatatan referral best-effort — kegagalan tidak
 * boleh menggagalkan registrasi.
 */

/** Alfabet tanpa karakter ambigu (0/O, 1/I/L). */
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function randomCode(length = 6): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return out;
}

/** Buat kode referral unik untuk user (idempoten: kembalikan yang sudah ada). */
export async function ensureReferralCode(userId: string): Promise<string | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    });
    if (!user) return null;
    if (user.referralCode) return user.referralCode;

    // Coba beberapa kali untuk menghindari tabrakan unik.
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const code = `JAGO-${randomCode(6)}`;
      try {
        const updated = await prisma.user.update({
          where: { id: userId },
          data: { referralCode: code },
          select: { referralCode: true },
        });
        return updated.referralCode;
      } catch {
        // Tabrakan kode (unique) -> coba lagi.
      }
    }
    return null;
  } catch (error) {
    console.error("[referral] Gagal membuat kode referral:", error);
    return null;
  }
}

/** Cari user pemilik kode referral (case-insensitive). */
export async function findUserByReferralCode(code: string) {
  const trimmed = (code ?? "").trim().toUpperCase();
  if (!trimmed) return null;
  return prisma.user.findFirst({
    where: { referralCode: trimmed },
    select: { id: true, name: true, email: true },
  });
}

/**
 * Catat pemakaian kode referral saat registrasi.
 * Best-effort: kembalikan true bila tercatat, false bila kode tidak valid /
 * sudah pernah dipakai / error.
 */
export async function recordReferral(params: {
  code: string;
  refereeId: string;
}): Promise<{ ok: boolean; ownerId?: string; reason?: string }> {
  try {
    const owner = await findUserByReferralCode(params.code);
    if (!owner) return { ok: false, reason: "Kode referral tidak ditemukan." };
    if (owner.id === params.refereeId) {
      return { ok: false, reason: "Tidak bisa memakai kode sendiri." };
    }

    const existing = await prisma.referral.findUnique({
      where: { refereeId: params.refereeId },
      select: { id: true },
    });
    if (existing) return { ok: false, reason: "Referral sudah tercatat." };

    await prisma.referral.create({
      data: {
        ownerId: owner.id,
        refereeId: params.refereeId,
        code: params.code.trim().toUpperCase(),
        status: "pending",
      },
    });
    return { ok: true, ownerId: owner.id };
  } catch (error) {
    console.error("[referral] Gagal mencatat referral:", error);
    return { ok: false, reason: "Gagal mencatat referral." };
  }
}

/** Statistik referral untuk halaman akun user. */
export async function referralStats(ownerId: string) {
  const [total, rewarded] = await Promise.all([
    prisma.referral.count({ where: { ownerId } }),
    prisma.referral.count({ where: { ownerId, status: "rewarded" } }),
  ]);
  return { total, rewarded, pending: total - rewarded };
}
