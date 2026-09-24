import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/customers/{id}
 * Detail pelanggan: profil, daftar alamat, dan ringkasan order
 * (jumlah order, total belanja, 10 order terakhir).
 */

const RECENT_ORDER_LIMIT = 10;

async function guardAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user?.id || (role !== "admin" && role !== "staff")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const denied = await guardAdmin();
    if (denied) return denied;

    const { id } = await params;
    const searchParams = new URL(request.url).searchParams;
    const requestedLimit = Number(searchParams.get("limit"));
    const recentLimit = Number.isFinite(requestedLimit)
      ? Math.min(50, Math.max(1, Math.trunc(requestedLimit)))
      : RECENT_ORDER_LIMIT;

    const customer = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        addresses: {
          orderBy: [{ isDefault: "desc" }, { label: "asc" }],
        },
        _count: { select: { orders: true, reviews: true } },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: "Pelanggan tidak ditemukan" }, { status: 404 });
    }

    const [totalSpentAgg, recentOrders, lastOrder] = await Promise.all([
      prisma.order.aggregate({
        where: { userId: id, status: { notIn: ["cancelled", "expired"] } },
        _sum: { total: true },
      }),
      prisma.order.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
        take: recentLimit,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          paymentStatus: true,
          paymentMethod: true,
          total: true,
          trackingNumber: true,
          createdAt: true,
          _count: { select: { items: true } },
        },
      }),
      prisma.order.findFirst({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
    ]);

    const { _count, addresses, ...profile } = customer;

    return NextResponse.json({
      customer: {
        ...profile,
        addresses,
        summary: {
          orderCount: _count.orders,
          reviewCount: _count.reviews,
          totalSpent: Number(totalSpentAgg._sum.total || 0),
          lastOrderAt: lastOrder?.createdAt ?? null,
          recentOrders: recentOrders.map((order) => ({
            id: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            paymentStatus: order.paymentStatus,
            paymentMethod: order.paymentMethod,
            total: Number(order.total),
            trackingNumber: order.trackingNumber,
            createdAt: order.createdAt,
            itemCount: order._count.items,
          })),
        },
      },
    });
  } catch (error) {
    console.error("Admin customer detail GET error:", error);
    return NextResponse.json({ error: "Gagal memuat detail pelanggan" }, { status: 500 });
  }
}
