import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  findOwnedSession,
  loadTicket,
  markCustomerMessagesRead,
  MAX_MESSAGE_LENGTH,
} from "@/lib/consultation-ticket";

/**
 * Akses satu tiket konsultasi oleh pemiliknya.
 *
 * Kepemilikan ditentukan oleh salah satu bukti berikut:
 *  - token tamu (`x-consultation-token`) yang cocok, ATAU
 *  - sesi login yang memiliki tiket tersebut (userId)
 *
 * Token diperiksa lebih dulu: pengunjung bisa saja sedang login sebagai admin
 * di perangkat yang sama, tapi tetap berhak membuka tiket tamu yang tokennya
 * tersimpan di browser itu.
 *
 * Tanpa bukti apa pun, tiket dianggap tidak ada (404, bukan 403) supaya ID
 * yang valid tidak bisa ditebak.
 */

/** Ambil identitas pemilik dari sesi login atau token tamu. */
async function resolveOwner(request: NextRequest) {
  const user = await getCurrentUser().catch(() => null);
  const accessToken = request.headers.get("x-consultation-token");
  return { userId: user?.id ?? null, accessToken };
}

/**
 * Cari tiket berdasarkan token tamu lebih dulu, lalu userId.
 * Mengembalikan null bila tidak ada bukti kepemilikan yang cocok.
 */
async function findTicketForOwner(
  owner: { userId: string | null; accessToken: string | null },
  sessionId: string
) {
  if (owner.accessToken) {
    const byToken = await findOwnedSession({ accessToken: owner.accessToken }, sessionId);
    if (byToken) return byToken;
  }
  if (owner.userId) {
    return findOwnedSession({ userId: owner.userId }, sessionId);
  }
  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const owner = await resolveOwner(request);
    if (!owner.userId && !owner.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const owned = await findTicketForOwner(owner, sessionId);
    if (!owned) {
      return NextResponse.json({ error: "Tiket tidak ditemukan" }, { status: 404 });
    }

    const ticket = await loadTicket(sessionId);
    if (!ticket) {
      return NextResponse.json({ error: "Tiket tidak ditemukan" }, { status: 404 });
    }

    // Balasan pakar yang sudah dibaca pelanggan tidak perlu dihitung lagi,
    // jadi tidak ada penandaan di sisi pelanggan. Yang ditandai adalah pesan
    // pelanggan ketika admin membuka tiket (lihat consultation-admin).
    return NextResponse.json(ticket);
  } catch (error) {
    console.error("[Consultation Ticket GET] Error:", error);
    return NextResponse.json({ error: "Gagal memuat tiket" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const owner = await resolveOwner(request);
    if (!owner.userId && !owner.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const owned = await findTicketForOwner(owner, sessionId);
    if (!owned) {
      return NextResponse.json({ error: "Tiket tidak ditemukan" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const rawContent = typeof body?.content === "string" ? body.content.trim() : "";

    if (!rawContent) {
      return NextResponse.json({ error: "Pesan tidak boleh kosong" }, { status: 400 });
    }
    if (rawContent.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Pesan maksimal ${MAX_MESSAGE_LENGTH} karakter` },
        { status: 400 }
      );
    }

    // Tiket yang sudah ditutup admin tidak menerima pesan baru.
    const ticket = await loadTicket(sessionId);
    if (ticket?.status === "closed") {
      return NextResponse.json(
        { error: "Tiket sudah ditutup. Silakan buka tiket baru." },
        { status: 409 }
      );
    }

    const { prisma } = await import("@/lib/prisma");
    const message = await prisma.consultationMessage.create({
      data: {
        sessionId,
        senderType: "user",
        senderId: owner.userId ?? null,
        content: rawContent,
      },
    });

    // Pesan baru membuka kembali tiket yang sebelumnya "pending".
    await prisma.consultationSession.update({
      where: { id: sessionId },
      data: { status: "active", updatedAt: new Date() },
    });

    return NextResponse.json(
      {
        id: message.id,
        senderType: message.senderType,
        content: message.content,
        attachments: message.attachments,
        createdAt: message.createdAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Consultation Ticket POST] Error:", error);
    return NextResponse.json({ error: "Gagal mengirim pesan" }, { status: 500 });
  }
}

/** Tandai pesan pelanggan sudah dibaca (dipanggil saat pelanggan membuka tiket). */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const owner = await resolveOwner(request);
    if (!owner.userId && !owner.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const owned = await findTicketForOwner(owner, sessionId);
    if (!owned) {
      return NextResponse.json({ error: "Tiket tidak ditemukan" }, { status: 404 });
    }

    await markCustomerMessagesRead(sessionId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Consultation Ticket PATCH] Error:", error);
    return NextResponse.json({ error: "Gagal memperbarui tiket" }, { status: 500 });
  }
}
