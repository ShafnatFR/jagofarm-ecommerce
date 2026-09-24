import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Label bulan pendek bahasa Indonesia (dipakai field `label` di monthlyRevenue). */
const ID_MONTHS_SHORT = [
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

/**
 * Baris agregat dari $queryRawUnsafe. Nilainya datang apa adanya dari driver
 * pg (SUM numeric & COUNT bigint sering berupa string/bigint), sehingga
 * dikonversi lewat Number() di bawah.
 */
interface DailyRevenueRow {
  date: string | Date | null;
  revenue: string | number | bigint | null;
  orders: string | number | bigint | null;
}

interface MonthlyRevenueRow {
  month: string | null;
  revenue: string | number | bigint | null;
  orders: string | number | bigint | null;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30"; // days

    const since = new Date();
    since.setDate(since.getDate() - parseInt(period));

    const [
      totalRevenue,
      totalOrders,
      totalCustomers,
      recentOrders,
      orderStatusCounts,
      topProducts,
      dailyRevenue,
    ] = await Promise.all([
      prisma.order.aggregate({
        where: { status: { notIn: ["cancelled", "expired"] }, createdAt: { gte: since } },
        _sum: { total: true },
      }),
      prisma.order.count({ where: { createdAt: { gte: since } } }),
      prisma.user.count({ where: { role: "customer", createdAt: { gte: since } } }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { user: { select: { name: true, email: true } } },
      }),
      prisma.order.groupBy({
        by: ["status"],
        where: { createdAt: { gte: since } },
        _count: true,
      }),
      prisma.orderItem.groupBy({
        by: ["productId"],
        _sum: { quantity: true, total: true },
        orderBy: { _sum: { total: "desc" } },
        take: 5,
      }),
      // Daily revenue for chart
      prisma.$queryRawUnsafe<DailyRevenueRow[]>(`
        SELECT DATE(created_at) as date, SUM(total) as revenue, COUNT(*) as orders
        FROM orders
        WHERE created_at >= $1 AND status NOT IN ('cancelled', 'expired')
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `, since),
    ]);

    // Enrich top products with names
    const productIds = topProducts.map((p) => p.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, slug: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    // -----------------------------------------------------------------------
    // monthlyRevenue — agregasi SERVER-SIDE 12 bulan terakhir (YYYY-MM).
    // Definisi "terjual" disamakan dengan dailyRevenue di atas: status bukan
    // cancelled/expired. Field lama TIDAK diubah supaya dashboard tetap jalan.
    // -----------------------------------------------------------------------
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);
    monthStart.setUTCMonth(monthStart.getUTCMonth() - 11);

    const monthlyRows = await prisma.$queryRawUnsafe<MonthlyRevenueRow[]>(
      `
        SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') as month,
               SUM(total) as revenue,
               COUNT(*) as orders
        FROM orders
        WHERE created_at >= $1 AND status NOT IN ('cancelled', 'expired')
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY DATE_TRUNC('month', created_at) ASC
      `,
      monthStart
    );

    const monthlyMap = new Map<string, { revenue: number; orders: number }>();
    for (const row of monthlyRows) {
      monthlyMap.set(String(row.month), {
        revenue: Number(row.revenue),
        orders: Number(row.orders),
      });
    }

    const monthlyRevenue = Array.from({ length: 12 }, (_, index) => {
      const d = new Date(
        Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + index, 1)
      );
      const month = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      const found = monthlyMap.get(month);
      return {
        month,
        label: ID_MONTHS_SHORT[d.getUTCMonth()],
        revenue: found?.revenue ?? 0,
        orders: found?.orders ?? 0,
      };
    });

    return NextResponse.json({
      stats: {
        totalRevenue: totalRevenue._sum.total ? Number(totalRevenue._sum.total) : 0,
        totalOrders,
        totalCustomers,
        orderStatusCounts: Object.fromEntries(
          orderStatusCounts.map((s) => [s.status, s._count])
        ),
      },
      recentOrders: recentOrders.map((o) => ({
        ...o,
        subtotal: Number(o.subtotal),
        total: Number(o.total),
      })),
      topProducts: topProducts.map((tp) => ({
        ...productMap.get(tp.productId),
        totalSold: tp._sum.quantity,
        totalRevenue: tp._sum.total ? Number(tp._sum.total) : 0,
      })),
      dailyRevenue: dailyRevenue.map((d) => ({
        date: d.date,
        revenue: Number(d.revenue),
        orders: Number(d.orders),
      })),
      monthlyRevenue,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
