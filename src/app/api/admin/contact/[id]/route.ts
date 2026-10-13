import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  status: z.enum(["read", "unread"], {
    message: 'status wajib berupa "read" atau "unread"',
  }),
});

/**
 * PATCH /api/admin/contact/[id]
 * Body: { status: "read" | "unread" }
 *  - "read"   -> tandai sudah dibaca (read_at diisi)
 *  - "unread" -> tandai belum dibaca (read_at dikosongkan)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Body permintaan tidak valid: harus berupa JSON." },
        { status: 400 }
      );
    }

    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            'Body permintaan tidak valid: field status wajib berupa "read" atau "unread".',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const existing = await prisma.contactMessage.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Pesan tidak ditemukan." },
        { status: 404 }
      );
    }

    const isRead = parsed.data.status === "read";
    const contactMessage = await prisma.contactMessage.update({
      where: { id },
      data: {
        status: parsed.data.status,
        readAt: isRead ? new Date() : null,
      },
    });

    return NextResponse.json({
      message: isRead
        ? "Pesan ditandai sudah dibaca."
        : "Pesan ditandai belum dibaca.",
      contactMessage: {
        id: contactMessage.id,
        status: contactMessage.status,
        readAt: contactMessage.readAt,
      },
    });
  } catch (error) {
    console.error("Admin contact PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/contact/[id]
 * Hapus permanen satu pesan masuk.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const existing = await prisma.contactMessage.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Pesan tidak ditemukan." },
        { status: 404 }
      );
    }

    await prisma.contactMessage.delete({ where: { id } });

    return NextResponse.json({ message: "Pesan berhasil dihapus." });
  } catch (error) {
    console.error("Admin contact DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
