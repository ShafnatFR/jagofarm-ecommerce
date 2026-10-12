import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = await params;
    const body = await request.json();
    const { content, attachments } = body as { content?: string; attachments?: string[] };

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Isi pesan wajib diisi" },
        { status: 400 }
      );
    }

    const session = await prisma.consultationSession.findFirst({
      where: { id: sessionId, userId: user.id },
    });

    if (!session) {
      return NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 404 });
    }

    const message = await prisma.consultationMessage.create({
      data: {
        sessionId,
        senderType: "user",
        senderId: user.id,
        content: content.trim(),
        attachments: (attachments || []) as string[],
      },
    });

    return NextResponse.json({
      id: message.id,
      senderType: message.senderType,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("[Consultation Send Message] Error:", error);
    return NextResponse.json(
      { error: "Gagal mengirim pesan" },
      { status: 500 }
    );
  }
}
