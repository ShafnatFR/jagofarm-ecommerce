import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyAdminSafe } from "@/lib/notifications";

/**
 * POST /api/returns — pelanggan mengajukan retur.
 * Syarat: order milik sendiri, status delivered (atau paid), belum ada
 * pengajuan aktif untuk order yang sama.
 */

const bodySchema = z.object({
  orderId: z.string().min(1, "orderId wajib diisi"),
  reason: z.string().trim().min(10, "Alasan minimal 10 karakter").max(2000),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findFirst({
      where: { id: parsed.data.orderId, userId: session.user.id },
      select: { id: true, orderNumber: true, status: true },
    });
    if (!order) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
    }
    if (!["delivered", "paid", "shipped"].includes(order.status)) {
      return NextResponse.json(
        { error: "Retur hanya bisa diajukan untuk pesanan yang sudah dibayar/diterima" },
        { status: 400 }
      );
    }

    const existing = await prisma.returnRequest.findFirst({
      where: {
        orderId: order.id,
        status: { in: ["requested", "approved"] },
      },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Pesanan ini sudah punya pengajuan retur aktif" },
        { status: 409 }
      );
    }

    const created = await prisma.returnRequest.create({
      data: {
        orderId: order.id,
        userId: session.user.id,
        reason: parsed.data.reason,
      },
      select: { id: true, status: true, createdAt: true },
    });

    await notifyAdminSafe({
      type: "order",
      title: `Retur diajukan: ${order.orderNumber}`,
      body: parsed.data.reason.slice(0, 150),
      href: "/admin/returns",
    });

    return NextResponse.json({ retur: created }, { status: 201 });
  } catch (error) {
    console.error("[returns] POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * GET /api/returns — daftar pengajuan retur milik pelanggan yang login.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const items = await prisma.returnRequest.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        reason: true,
        status: true,
        adminNote: true,
        refundAmount: true,
        createdAt: true,
        order: { select: { orderNumber: true, status: true } },
      },
    });
    return NextResponse.json({ returns: items });
  } catch (error) {
    console.error("[returns] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
