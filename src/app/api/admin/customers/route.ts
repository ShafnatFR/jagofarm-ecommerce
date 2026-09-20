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
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, parseInt(searchParams.get("limit") || "20"));
    const search = searchParams.get("search");

    const where: any = { role: "customer" };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [customers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          image: true,
          createdAt: true,
          _count: { select: { orders: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    // Get order totals per customer
    const customerIds = customers.map((c) => c.id);
    const orderTotals = await prisma.order.groupBy({
      by: ["userId"],
      where: { userId: { in: customerIds }, status: { notIn: ["cancelled", "expired"] } },
      _sum: { total: true },
      _count: true,
    });
    const totalMap = new Map(orderTotals.map((o) => [o.userId, { totalSpent: Number(o._sum.total || 0), orderCount: o._count }]));

    return NextResponse.json({
      customers: customers.map((c) => ({
        ...c,
        totalSpent: totalMap.get(c.id)?.totalSpent || 0,
        orderCount: totalMap.get(c.id)?.orderCount || 0,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Admin customers GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
