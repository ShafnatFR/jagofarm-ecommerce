import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== "admin") {
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
      prisma.$queryRawUnsafe(`
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
      dailyRevenue: (dailyRevenue as any[]).map((d: any) => ({
        date: d.date,
        revenue: Number(d.revenue),
        orders: Number(d.orders),
      })),
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
