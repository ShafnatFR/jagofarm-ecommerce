import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/reports
 *
 * Laporan penjualan + export CSV.
 *
 * Query:
 *  - from     : YYYY-MM-DD (default: 29 hari lalu, waktu Asia/Jakarta)
 *  - to       : YYYY-MM-DD (default: hari ini, waktu Asia/Jakarta)
 *  - groupBy  : "day" | "month" (default: "day")
 *  - category : categoryId — membatasi laporan pada item produk kategori tsb
 *  - format   : "json" (default) | "csv"
 *
 * Definisi "order terjual" (dipakai konsisten di seluruh laporan ini):
 *   paymentStatus = "paid" DAN status ∈ {paid, processing, shipped, delivered}.
 *   Artinya pesanan sudah benar-benar dibayar dan belum dibatalkan/kedaluwarsa.
 *
 * Rentang tanggal dianggap kalender WIB (UTC+7) dan inklusif di kedua ujung:
 *   created_at >= fromT00:00:00+07:00 dan created_at <= toT23:59:59.999+07:00.
 *
 * Revenue = jumlah Order.total (termasuk ongkos kirim & setelah diskon).
 */

// Pendapatan, tabel, kategori, produk & pelanggan = order LUNAS saja.
// Grafik per Hari/Bulan, Komposisi Status & Daftar Order = SEMUA status.
const DEFINITION =
  'Pendapatan, tabel, kategori, produk & pelanggan dihitung dari order LUNAS ' +
  '(paymentStatus "paid") saja. Grafik per Hari/Bulan, Komposisi Status Order & ' +
  'Daftar Order menampilkan SEMUA status (lunas/menunggu/batal). ' +
  "Revenue = total pesanan (termasuk ongkos kirim, setelah diskon). " +
  "Rentang tanggal inklusif mengikuti kalender WIB (UTC+7).";

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

const MONTHS_LONG = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const WIB_OFFSET = "+07:00";

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/** Validasi ketat format YYYY-MM-DD (menolak 2026-02-30 dsb). */
function parseIsoDate(value: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  const probe = new Date(Date.UTC(y, m - 1, d));
  if (
    probe.getUTCFullYear() !== y ||
    probe.getUTCMonth() !== m - 1 ||
    probe.getUTCDate() !== d
  ) {
    return null;
  }
  return { y, m, d };
}

function isoDate(parts: { y: number; m: number; d: number }): string {
  return `${parts.y}-${pad2(parts.m)}-${pad2(parts.d)}`;
}

/** Hari kalender WIB dari sebuah timestamp. */
function wibDateParts(date: Date): { y: number; m: number; d: number } {
  const shifted = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  return {
    y: shifted.getUTCFullYear(),
    m: shifted.getUTCMonth() + 1,
    d: shifted.getUTCDate(),
  };
}

/** Escape satu sel CSV: kutip bila mengandung koma, kutip, atau baris baru. */
function csvCell(value: string | number): string {
  const text = typeof value === "number" ? String(value) : value;
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function csvRow(cells: (string | number)[]): string {
  return cells.map(csvCell).join(",");
}

interface PeriodBucket {
  key: string;
  label: string;
  revenue: number;
  orders: number;
  items: number;
  paid: number;
  pending: number;
  cancelled: number;
}

interface OrderListRow {
  orderNumber: string;
  createdAt: string;
  status: string;
  paymentStatus: string;
  total: number;
  items: number;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);

    const rawGroupBy = (searchParams.get("groupBy") || "day").toLowerCase();
    if (rawGroupBy !== "day" && rawGroupBy !== "month") {
      return NextResponse.json(
        { error: "Parameter groupBy harus 'day' atau 'month'." },
        { status: 400 }
      );
    }
    const groupBy = rawGroupBy as "day" | "month";

    const rawFormat = (searchParams.get("format") || "json").toLowerCase();
    if (rawFormat !== "json" && rawFormat !== "csv") {
      return NextResponse.json(
        { error: "Parameter format harus 'json' atau 'csv'." },
        { status: 400 }
      );
    }
    const format = rawFormat as "json" | "csv";

    const categoryId = searchParams.get("category") || null;

    // Default rentang: 30 hari terakhir (kalender WIB).
    const todayWib = wibDateParts(new Date());
    const defaultTo = isoDate(todayWib);
    const thirtyDaysAgo = new Date(
      Date.UTC(todayWib.y, todayWib.m - 1, todayWib.d) - 29 * 24 * 60 * 60 * 1000
    );
    const defaultFrom = `${thirtyDaysAgo.getUTCFullYear()}-${pad2(
      thirtyDaysAgo.getUTCMonth() + 1
    )}-${pad2(thirtyDaysAgo.getUTCDate())}`;

    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    const fromParts = fromParam ? parseIsoDate(fromParam) : parseIsoDate(defaultFrom);
    if (fromParam && !fromParts) {
      return NextResponse.json(
        { error: "Parameter 'from' tidak valid. Gunakan format YYYY-MM-DD." },
        { status: 400 }
      );
    }
    const toParts = toParam ? parseIsoDate(toParam) : parseIsoDate(defaultTo);
    if (toParam && !toParts) {
      return NextResponse.json(
        { error: "Parameter 'to' tidak valid. Gunakan format YYYY-MM-DD." },
        { status: 400 }
      );
    }
    if (!fromParts || !toParts) {
      return NextResponse.json(
        { error: "Rentang tanggal tidak valid. Gunakan format YYYY-MM-DD." },
        { status: 400 }
      );
    }

    const fromIso = isoDate(fromParts);
    const toIso = isoDate(toParts);
    const rangeFrom = new Date(`${fromIso}T00:00:00.000${WIB_OFFSET}`);
    const rangeTo = new Date(`${toIso}T23:59:59.999${WIB_OFFSET}`);

    if (rangeFrom.getTime() > rangeTo.getTime()) {
      return NextResponse.json(
        {
          error:
            "Rentang tanggal tidak valid: 'from' harus lebih awal atau sama dengan 'to'.",
        },
        { status: 400 }
      );
    }

    const where: Prisma.OrderWhereInput = {
      createdAt: { gte: rangeFrom, lte: rangeTo },
      ...(categoryId ? { items: { some: { product: { categoryId } } } } : {}),
    };

    const orders = await prisma.order.findMany({
      where,
      select: {
        id: true,
        total: true,
        createdAt: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
        items: {
          select: {
            productId: true,
            quantity: true,
            total: true,
            product: {
              select: {
                name: true,
                categoryId: true,
                category: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // ---- Agregasi -----------------------------------------------------------
    const buckets = new Map<string, PeriodBucket>();
    const categoryMap = new Map<
      string,
      { categoryId: string; categoryName: string; revenue: number; items: number; orderIds: Set<string> }
    >();
    const productMap = new Map<
      string,
      { productId: string; name: string; qty: number; revenue: number }
    >();

    let totalRevenue = 0;
    let totalItems = 0;

    for (const order of orders) {
      const parts = wibDateParts(order.createdAt);
      const key =
        groupBy === "month"
          ? `${parts.y}-${pad2(parts.m)}`
          : `${parts.y}-${pad2(parts.m)}-${pad2(parts.d)}`;
      const label =
        groupBy === "month"
          ? `${MONTHS_LONG[parts.m - 1]} ${parts.y}`
          : `${parts.d} ${MONTHS_SHORT[parts.m - 1]} ${parts.y}`;

      const bucket =
        buckets.get(key) ?? { key, label, revenue: 0, orders: 0, items: 0, paid: 0, pending: 0, cancelled: 0 };

      const orderTotal = Number(order.total);
      const isPaid = order.paymentStatus === 'paid';
      // Angka uang & agregasi (revenue/tabel/kategori/produk) = LUNAS saja.
      if (isPaid) {
        totalRevenue += orderTotal;
        bucket.revenue += orderTotal;
        bucket.orders += 1;
      }
      // Klasifikasi visual grafik = SEMUA status.
      if (isPaid) bucket.paid += 1;
      else if (order.status === 'cancelled' || order.status === 'expired' || order.paymentStatus === 'failed') bucket.cancelled += 1;
      else bucket.pending += 1;

      for (const item of order.items) {
        // Item/kategori/produk hanya dihitung untuk order LUNAS.
        if (!isPaid) continue;
        // Saat filter kategori aktif, hanya item kategori itu yang dihitung.
        if (categoryId && item.product.categoryId !== categoryId) continue;

        const quantity = Number(item.quantity);
        const itemRevenue = Number(item.total);
        totalItems += quantity;
        bucket.items += quantity;

        const catKey = item.product.categoryId;
        const cat = categoryMap.get(catKey) ?? {
          categoryId: catKey,
          categoryName: item.product.category?.name || "Tanpa Kategori",
          revenue: 0,
          items: 0,
          orderIds: new Set<string>(),
        };
        cat.revenue += itemRevenue;
        cat.items += quantity;
        cat.orderIds.add(order.id);
        categoryMap.set(catKey, cat);

        const prod = productMap.get(item.productId) ?? {
          productId: item.productId,
          name: item.product.name || "Produk",
          qty: 0,
          revenue: 0,
        };
        prod.qty += quantity;
        prod.revenue += itemRevenue;
        productMap.set(item.productId, prod);
      }

      buckets.set(key, bucket);
    }

    const series = Array.from(buckets.values()).sort((a, b) =>
      a.key.localeCompare(b.key)
    );
    const totalOrders = series.reduce((sum, b) => sum + b.orders, 0);
    const totalOrdersAll = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const categoryBreakdown = Array.from(categoryMap.values())
      .map((row) => ({
        categoryId: row.categoryId,
        categoryName: row.categoryName,
        revenue: row.revenue,
        orders: row.orderIds.size,
        items: row.items,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.qty - a.qty || b.revenue - a.revenue)
      .slice(0, 10);

    if (format === "csv") {
      const lines: string[] = [];
      lines.push(csvRow(["Periode", "Revenue", "Orders", "Item"]));
      for (const bucket of series) {
        lines.push(csvRow([bucket.key, bucket.revenue, bucket.orders, bucket.items]));
      }
      lines.push(csvRow(["TOTAL", totalRevenue, totalOrders, totalItems]));

      // BOM supaya Excel benar membaca UTF-8, CRLF sesuai RFC 4180.
      const csv = `\uFEFF${lines.join("\r\n")}\r\n`;
      const filename = `laporan-penjualan_${fromIso}_${toIso}.csv`;

      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store",
        },
      });
    }

    // ── B21b: Laporan stok (produk menipis & habis) ────────────────────────
    // Ambang "stok menipis" dapat diatur via env LOW_STOCK_THRESHOLD (default 5).
    const lowStockThreshold = (() => {
      const raw = parseInt(process.env.LOW_STOCK_THRESHOLD || "5", 10);
      return Number.isFinite(raw) && raw >= 0 ? raw : 5;
    })();

    const stockProducts = await prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        stock: true,
        variants: { select: { id: true, name: true, sku: true, stock: true } },
      },
      orderBy: { stock: "asc" },
    });

    /** Stok efektif: jumlah stok produk + seluruh variannya (0 varian = stok produk). */
    function effectiveStock(p: { stock: number; variants: { stock: number }[] }): number {
      if (p.variants.length === 0) return p.stock;
      return p.variants.reduce((sum, v) => sum + v.stock, 0);
    }

    const stockRows = stockProducts.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      stock: effectiveStock(p),
      variantCount: p.variants.length,
    }));

    const outOfStock = stockRows.filter((r) => r.stock <= 0);
    const lowStock = stockRows.filter((r) => r.stock > 0 && r.stock <= lowStockThreshold);

    const stockReport = {
      threshold: lowStockThreshold,
      totalProducts: stockRows.length,
      outOfStockCount: outOfStock.length,
      lowStockCount: lowStock.length,
      outOfStock: outOfStock.slice(0, 50),
      lowStock: lowStock.slice(0, 50),
    };

    // ── B21c: Laporan pelanggan (baru, aktif, teratas) ─────────────────────
    const [totalCustomers, newCustomers] = await Promise.all([
      prisma.user.count({ where: { role: "customer" } }),
      prisma.user.count({
        where: { role: "customer", createdAt: { gte: rangeFrom, lte: rangeTo } },
      }),
    ]);

    // Pelanggan teratas berdasarkan belanja pada rentang (hanya order LUNAS).
    const topCustomerGroups = await prisma.order.groupBy({
      by: ["userId"],
      where: { ...where, paymentStatus: "paid" },
      _sum: { total: true },
      _count: true,
      orderBy: { _sum: { total: "desc" } },
      take: 10,
    });

    const topCustomerIds = topCustomerGroups
      .map((g) => g.userId)
      .filter((id): id is string => Boolean(id));
    const topCustomerUsers = topCustomerIds.length
      ? await prisma.user.findMany({
          where: { id: { in: topCustomerIds } },
          select: { id: true, name: true, email: true },
        })
      : [];
    const userById = new Map(topCustomerUsers.map((u) => [u.id, u]));

    const topCustomers = topCustomerGroups
      .map((g) => {
        const u = g.userId ? userById.get(g.userId) : undefined;
        return {
          userId: g.userId,
          name: u?.name ?? "Pelanggan",
          email: u?.email ?? "",
          totalSpent: Number(g._sum?.total ?? 0),
          orderCount: typeof g._count === "number" ? g._count : 0,
        };
      })
      .filter((c) => c.userId);

    const customerReport = {
      totalCustomers,
      newCustomers,
      topCustomers,
    };

    const statusCounts = new Map<string, number>();
    for (const order of orders) {
      const k = order.paymentStatus === 'paid' ? 'paid' : (order.status === 'cancelled' || order.status === 'expired' ? 'cancelled' : 'pending');
      statusCounts.set(k, (statusCounts.get(k) ?? 0) + 1);
    }
    const statusBreakdown = [
      { status: 'paid', label: 'Lunas', count: statusCounts.get('paid') ?? 0, color: 'green' },
      { status: 'pending', label: 'Menunggu', count: statusCounts.get('pending') ?? 0, color: 'yellow' },
      { status: 'cancelled', label: 'Batal/Kedaluwarsa', count: statusCounts.get('cancelled') ?? 0, color: 'red' },
    ];

    const orderList: OrderListRow[] = orders.map((o) => ({
      orderNumber: o.orderNumber,
      createdAt: o.createdAt instanceof Date ? o.createdAt.toISOString() : String(o.createdAt),
      status: o.status,
      paymentStatus: o.paymentStatus,
      total: Number(o.total),
      items: o.items.reduce((s, it) => s + Number(it.quantity), 0),
    })).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 50);

    return NextResponse.json({
      range: {
        from: fromIso,
        to: toIso,
        groupBy,
        categoryId,
        timezone: "Asia/Jakarta (UTC+7)",
        inclusive: true,
      },
      definition: DEFINITION,
      summary: {
        totalRevenue,
        totalOrders,
        totalOrdersAll,
        totalItems,
        averageOrderValue,
      },
      series,
      statusBreakdown,
      orderList,
      categoryBreakdown,
      topProducts,
      stockReport,
      customerReport,
    });
  } catch (error) {
    console.error("Admin reports GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
