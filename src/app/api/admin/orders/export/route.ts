import { NextRequest, NextResponse } from "next/server";
import { OrderStatus, Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/orders/export
 *
 * Export daftar pesanan ke CSV (A4), memakai filter yang sama dengan
 * /api/admin/orders (status, search, date_from, date_to).
 *
 * Query:
 *  - status    : status pesanan atau "all" (default: semua)
 *  - search    : cari nomor pesanan / nama / email pelanggan
 *  - date_from : YYYY-MM-DD (opsional)
 *  - date_to   : YYYY-MM-DD (opsional)
 */

function csvCell(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  // Escape kutip ganda + bungkus bila mengandung koma/kutip/newline.
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function csvRow(cells: unknown[]): string {
  return cells.map(csvCell).join(",");
}

/** Tanggal lokal WIB dalam format YYYY-MM-DD HH:mm. */
function wibDateTime(d: Date): string {
  const wib = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${wib.getUTCFullYear()}-${pad(wib.getUTCMonth() + 1)}-${pad(wib.getUTCDate())} ` +
    `${pad(wib.getUTCHours())}:${pad(wib.getUTCMinutes())}`
  );
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");

    const where: Prisma.OrderWhereInput = {};
    if (status && status !== "all") where.status = status as OrderStatus;
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ];
    }
    if (dateFrom || dateTo) {
      const createdAt: Prisma.DateTimeFilter = {};
      if (dateFrom) createdAt.gte = new Date(dateFrom);
      if (dateTo) createdAt.lte = new Date(dateTo + "T23:59:59");
      where.createdAt = createdAt;
    }

    // Batasi agar tidak membebani server (maks 5000 baris).
    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 5000,
      include: {
        user: { select: { name: true, email: true } },
        items: { select: { quantity: true } },
        shippingAddress: { select: { city: true, province: true } },
      },
    });

    const header = [
      "No. Pesanan",
      "Tanggal",
      "Pelanggan",
      "Email",
      "Status",
      "Pembayaran",
      "Metode",
      "Kota",
      "Provinsi",
      "Jumlah Item",
      "Subtotal",
      "Diskon",
      "Ongkir",
      "Total",
    ];

    const lines = [csvRow(header)];
    for (const o of orders) {
      const itemCount = o.items.reduce((sum, it) => sum + it.quantity, 0);
      lines.push(
        csvRow([
          o.orderNumber,
          wibDateTime(o.createdAt),
          o.user?.name ?? "",
          o.user?.email ?? "",
          String(o.status),
          String(o.paymentStatus),
          o.paymentMethod ?? "",
          o.shippingAddress?.city ?? "",
          o.shippingAddress?.province ?? "",
          itemCount,
          Number(o.subtotal),
          Number(o.discount),
          Number(o.shippingCost),
          Number(o.total),
        ])
      );
    }

    // BOM UTF-8 agar Excel membaca karakter dengan benar.
    const csv = "\uFEFF" + lines.join("\r\n") + "\r\n";
    const stamp = new Date().toISOString().slice(0, 10);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="pesanan-${stamp}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[Orders Export API] Error:", error);
    return NextResponse.json({ error: "Gagal mengekspor pesanan." }, { status: 500 });
  }
}
