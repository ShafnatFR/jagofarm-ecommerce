import { prisma } from "@/lib/prisma";

/**
 * Poin loyalitas (A7).
 *
 * Aturan default:
 *  - Belanja menghasilkan poin: 1 poin per Rp10.000 dari total pesanan (dibulatkan ke bawah).
 *  - Referral berhasil: bonus poin untuk owner & referee.
 *
 * Semua konstanta bisa diubah lewat env tanpa deploy:
 *  - LOYALTY_EARN_PER_AMOUNT : rupiah per 1 poin (default 10000)
 *  - LOYALTY_REFERRAL_OWNER  : poin untuk pengundang (default 5000)
 *  - LOYALTY_REFERRAL_REFEREE: poin untuk yang diundang (default 2500)
 *
 * Prinsip: fungsi "safe" tidak pernah throw ke alur order — kegagalan poin
 * tidak boleh menggagalkan pembayaran.
 */

function envInt(name: string, fallback: number): number {
  const raw = (process.env[name] ?? "").trim();
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : fallback;
}

/** Rupiah per 1 poin (default 10.000). */
export function earnPerAmount(): number {
  return Math.max(1, envInt("LOYALTY_EARN_PER_AMOUNT", 10_000));
}

/** Poin untuk pengundang saat referral valid. */
export function referralOwnerPoints(): number {
  return envInt("LOYALTY_REFERRAL_OWNER", 5_000);
}

/** Poin untuk pihak yang diundang. */
export function referralRefereePoints(): number {
  return envInt("LOYALTY_REFERRAL_REFEREE", 2_500);
}

/** Hitung poin yang didapat dari sebuah nominal belanja. */
export function pointsForAmount(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return Math.floor(amount / earnPerAmount());
}

/**
 * Tambah (atau kurangi) poin user + catat mutasi. Dijalankan dalam transaksi
 * agar saldo & ledger selalu konsisten.
 *
 * `amount` positif = dapat poin; negatif = tukar poin.
 * Mengembalikan saldo baru. Tidak throw ke pemanggil (dibungkus try/catch
 * oleh pemanggil lewat `addPointsSafe`).
 */
export async function addPoints(params: {
  userId: string;
  amount: number;
  type: "earn" | "redeem" | "adjust" | "referral" | "refund";
  note?: string;
  orderId?: string;
}): Promise<number> {
  const { userId, amount, type, note, orderId } = params;

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { points: true },
    });
    if (!user) throw new Error("User tidak ditemukan.");

    const newBalance = Math.max(0, user.points + amount);

    await tx.user.update({
      where: { id: userId },
      data: { points: newBalance },
    });

    await tx.pointTransaction.create({
      data: {
        userId,
        amount,
        balance: newBalance,
        type,
        note: note ?? null,
        orderId: orderId ?? null,
      },
    });

    return newBalance;
  });
}

/** Pembungkus aman: tidak pernah throw. Mengembalikan saldo baru atau null. */
export async function addPointsSafe(params: {
  userId: string;
  amount: number;
  type: "earn" | "redeem" | "adjust" | "referral" | "refund";
  note?: string;
  orderId?: string;
}): Promise<number | null> {
  try {
    return await addPoints(params);
  } catch (error) {
    console.error("[loyalty] Gagal menambah poin:", error);
    return null;
  }
}

/** Riwayat mutasi poin seorang user. */
export async function listPointHistory(userId: string, limit = 30) {
  return prisma.pointTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(limit, 1), 100),
    select: {
      id: true,
      amount: true,
      balance: true,
      type: true,
      note: true,
      createdAt: true,
    },
  });
}
