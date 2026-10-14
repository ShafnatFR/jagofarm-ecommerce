import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmailSafe } from "@/lib/email";
import { SITE_CONFIG } from "@/lib/constants";

/**
 * GET/POST /api/cron/abandoned-cart
 *
 * Kirim pengingat untuk keranjang yang "tertinggal" (A9):
 *  - keranjang punya item,
 *  - tidak diubah >= JAM_IDLE (default 24 jam),
 *  - belum pernah diingatkan (atau sudah lewat JEDA_REMINDER).
 *
 * Proteksi: header `x-cron-secret` harus sama dengan env CRON_SECRET
 * (bila CRON_SECRET diisi). Tanpa CRON_SECRET, endpoint mengembalikan 503
 * agar tidak bisa dipanggil sembarangan di produksi.
 *
 * Env:
 *  - CRON_SECRET            : rahasia pemanggil (wajib di produksi)
 *  - ABANDONED_IDLE_HOURS   : jam idle sebelum diingatkan (default 24)
 *  - ABANDONED_MAX_AGE_HOURS: batas atas umur keranjang (default 168 = 7 hari)
 */

const DEFAULT_IDLE_HOURS = 24;
const DEFAULT_MAX_AGE_HOURS = 168;
const BATCH_LIMIT = 50;

function envHours(name: string, fallback: number): number {
  const raw = (process.env[name] ?? "").trim();
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

async function run(request: NextRequest) {
  const secret = (process.env.CRON_SECRET ?? "").trim();
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET belum dikonfigurasi." },
      { status: 503 }
    );
  }
  const provided =
    request.headers.get("x-cron-secret") ??
    // Vercel Cron mengirim "Authorization: Bearer <CRON_SECRET>".
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    new URL(request.url).searchParams.get("secret") ??
    "";
  if (provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const idleHours = envHours("ABANDONED_IDLE_HOURS", DEFAULT_IDLE_HOURS);
    const maxAgeHours = envHours("ABANDONED_MAX_AGE_HOURS", DEFAULT_MAX_AGE_HOURS);

    const now = Date.now();
    const idleBefore = new Date(now - idleHours * 3_600_000);
    const maxAgeAfter = new Date(now - maxAgeHours * 3_600_000);

    const carts = await prisma.cart.findMany({
      where: {
        items: { some: {} },
        updatedAt: { lte: idleBefore, gte: maxAgeAfter },
        OR: [{ reminderSentAt: null }, { reminderSentAt: { lte: idleBefore } }],
        user: { email: { not: "" } },
      },
      orderBy: { updatedAt: "asc" },
      take: BATCH_LIMIT,
      select: {
        id: true,
        updatedAt: true,
        user: { select: { name: true, email: true } },
        items: { select: { quantity: true, product: { select: { name: true } } } },
      },
    });

    let sent = 0;
    const base = (process.env.NEXT_PUBLIC_SITE_URL ?? SITE_CONFIG.url).replace(/\/$/, "");

    for (const cart of carts) {
      const recipient = cart.user?.email?.trim();
      if (!recipient) continue;

      const itemLines = cart.items
        .slice(0, 5)
        .map((it) => `<li>${it.quantity}× ${it.product?.name ?? "Produk"}</li>`)
        .join("");

      const result = await sendEmailSafe({
        to: recipient,
        subject: "Keranjang belanja Anda masih menunggu 🛒",
        html: `
          <h2>Halo ${cart.user?.name ?? "Pelanggan"},</h2>
          <p>Produk berikut masih tersimpan di keranjang Anda:</p>
          <ul>${itemLines}</ul>
          <p>Lanjutkan pembelian sebelum stoknya habis:</p>
          <p><a href="${base}/cart" style="background:#1B4D3E;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;">Buka Keranjang</a></p>
          <p style="color:#888;font-size:12px;">${SITE_CONFIG.name}</p>
        `,
        text: `Produk masih di keranjang Anda. Lanjutkan di ${base}/cart`,
      });

      // Tandai sudah diingatkan meski email dilewati (tanpa RESEND_API_KEY),
      // supaya tidak mencoba berulang tiap cron berjalan.
      await prisma.cart.update({
        where: { id: cart.id },
        data: { reminderSentAt: new Date() },
      });
      if (result.status === "sent") sent += 1;
    }

    return NextResponse.json({
      ok: true,
      candidates: carts.length,
      sent,
      idleHours,
      maxAgeHours,
    });
  } catch (error) {
    // Jangan biarkan cron gagal dengan error tak tertangani — kembalikan JSON bersih.
    console.error("[cron/abandoned-cart] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return run(request);
}

export async function POST(request: NextRequest) {
  return run(request);
}
