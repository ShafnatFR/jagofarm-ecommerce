import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmailSafe } from "@/lib/email";

/**
 * GET   /api/admin/returns — daftar pengajuan (filter ?status=).
 * PATCH /api/admin/returns — setujui / tolak / refund.
 *   approve  -> status approved (+ refundAmount opsional)
 *   reject   -> status rejected (+ adminNote wajib)
 *   refunded -> status refunded + order.status refunded (+ refundAmount)
 */

const patchSchema = z.object({
  id: z.string().min(1),
  action: z.enum(["approve", "reject", "refund"]),
  adminNote: z.string().max(2000).optional(),
  refundAmount: z.number().int().nonnegative().optional(),
});

function requireAdmin(session: { user?: { id?: string; role?: string } | null } | null) {
  return Boolean(session?.user?.id && session.user.role === "admin");
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!requireAdmin(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const status = new URL(request.url).searchParams.get("status");
    const items = await prisma.returnRequest.findMany({
      where: status ? { status: status as never } : undefined,
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        reason: true,
        status: true,
        adminNote: true,
        refundAmount: true,
        createdAt: true,
        order: { select: { id: true, orderNumber: true, status: true, total: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });
    return NextResponse.json({ returns: items });
  } catch (error) {
    console.error("[admin/returns] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!requireAdmin(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await request.json().catch(() => ({}));
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
        { status: 400 }
      );
    }
    const { id, action, adminNote, refundAmount } = parsed.data;

    const existing = await prisma.returnRequest.findUnique({
      where: { id },
      include: {
        order: { select: { id: true, orderNumber: true, userId: true } },
        user: { select: { email: true, name: true } },
      },
    });
    if (!existing) {
      return NextResponse.json({ error: "Pengajuan tidak ditemukan" }, { status: 404 });
    }
    if (existing.status !== "requested" && action !== "refund") {
      return NextResponse.json(
        { error: "Hanya pengajuan baru yang bisa diproses" },
        { status: 400 }
      );
    }

    let nextStatus: "approved" | "rejected" | "refunded";
    if (action === "approve") nextStatus = "approved";
    else if (action === "reject") {
      if (!adminNote?.trim()) {
        return NextResponse.json({ error: "Alasan penolakan wajib diisi" }, { status: 400 });
      }
      nextStatus = "rejected";
    } else {
      if (existing.status !== "approved") {
        return NextResponse.json(
          { error: "Refund hanya untuk pengajuan yang sudah disetujui" },
          { status: 400 }
        );
      }
      nextStatus = "refunded";
    }

    const updated = await prisma.$transaction(async (tx) => {
      const ret = await tx.returnRequest.update({
        where: { id },
        data: {
          status: nextStatus,
          adminNote: adminNote?.trim() || existing.adminNote,
          refundAmount: refundAmount ?? existing.refundAmount,
        },
      });
      if (nextStatus === "refunded") {
        await tx.order.update({
          where: { id: existing.orderId },
          data: { status: "refunded" },
        });
      }
      return ret;
    });

    // Notifikasi pelanggan (best-effort).
    const label =
      nextStatus === "approved"
        ? "disetujui, dana segera dikembalikan"
        : nextStatus === "refunded"
          ? "selesai direfund"
          : "ditolak";
    const msg = `Pengajuan retur ${existing.order.orderNumber} ${label}. ${adminNote?.trim() ?? ""}`.trim();
    if (existing.user.email) {
      await sendEmailSafe({
        to: existing.user.email,
        subject: `Retur ${existing.order.orderNumber} ${label}`,
        html: `<p>${msg}</p>`,
        text: msg,
      });
    }

    return NextResponse.json({ retur: updated });
  } catch (error) {
    console.error("[admin/returns] PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
