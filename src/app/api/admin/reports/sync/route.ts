import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncOrderToSheets, type SyncOrder } from "@/lib/sheets-sync";

/**
 * POST /api/admin/reports/sync?from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * Sinkron massal SEMUA order pada rentang tanggal ke Google Spreadsheet
 * (tab Orders + OrderItems + Ringkasan). Semua status masuk
 * (pending/unpaid/expired/cancelled/paid) — kolom Status/Payment Status
 * di sheet membedakan tiap baris. Realtime per order lunas via webhook,
 * tombol ini untuk backfill periode lama.
 */

function parseIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const d = new Date(`${value}T00:00:00.000+07:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    const defaultTo = new Date();
    const defaultFrom = new Date(defaultTo.getTime() - 29 * 24 * 60 * 60 * 1000);

    const fromDate = fromParam ? parseIsoDate(fromParam) : defaultFrom;
    const toRaw = toParam ? parseIsoDate(toParam) : defaultTo;
    if (!fromDate || !toRaw) {
      return NextResponse.json(
        { error: "Parameter from/to harus YYYY-MM-DD." },
        { status: 400 }
      );
    }
    // to inklusif sampai akhir hari WIB.
    const toDate = new Date(toRaw.getTime());
    toDate.setHours(23, 59, 59, 999);

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: fromDate, lte: toDate },
      },
      include: {
        items: {
          include: {
            product: { select: { name: true } },
            variant: { select: { name: true } },
          },
        },
        user: { select: { name: true, email: true } },
        shippingAddress: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Ambil nominal item terpisah (include di atas tidak bawa price/qty/total).
    const orderIds = orders.map((o) => o.id);
    const allItems = orderIds.length
      ? await prisma.orderItem.findMany({
          where: { orderId: { in: orderIds } },
          include: {
            product: { select: { name: true } },
            variant: { select: { name: true } },
          },
        })
      : [];
    const itemsByOrder = new Map<string, typeof allItems>();
    for (const item of allItems) {
      const list = itemsByOrder.get(item.orderId) ?? [];
      list.push(item);
      itemsByOrder.set(item.orderId, list);
    }

    let synced = 0;
    const failed: string[] = [];
    for (const order of orders) {
      const addr = order.shippingAddress;
      const payload: SyncOrder = {
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        status: order.status,
        paymentStatus: order.paymentStatus,
        customerName: order.user?.name ?? null,
        customerEmail: order.user?.email ?? null,
        phone: addr?.phone ?? null,
        address: addr
          ? [addr.detail, addr.district, addr.city, addr.province, addr.postalCode]
              .filter(Boolean)
              .join(", ")
          : null,
        courier: order.shippingCourier ?? null,
        service: order.shippingService ?? null,
        subtotal: Number(order.subtotal),
        shippingCost: Number(order.shippingCost),
        insuranceFee:
          order.insuranceFee != null ? Number(order.insuranceFee) : null,
        discount: order.discount != null ? Number(order.discount) : null,
        total: Number(order.total),
        paymentMethod: order.paymentMethod ?? null,
        paymentProvider: order.paymentProvider ?? null,
        paidAt: order.paidAt ?? null,
        items: (itemsByOrder.get(order.id) ?? []).map((item) => ({
          name: item.product?.name ?? "Produk",
          variant: item.variant?.name ?? null,
          quantity: Number(item.quantity),
          price: Number(item.price),
          total: Number(item.total),
        })),
      };
      const ok = await syncOrderToSheets(payload);
      if (ok) synced += 1;
      else failed.push(order.orderNumber);
    }

    return NextResponse.json({
      synced,
      total: orders.length,
      failed,
    });
  } catch (error) {
    console.error("Reports sync error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
