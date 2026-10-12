import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = await params;

    const session = await prisma.consultationSession.findFirst({
      where: {
        id: sessionId,
        userId: user.id,
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          take: 200,
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({
      sessionId: session.id,
      sessionRef: session.sessionRef,
      status: session.status,
      expertName: session.expertName,
      messages: session.messages.map((m) => ({
        id: m.id,
        senderType: m.senderType,
        content: m.content,
        attachments: m.attachments,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[Consultation History] Error:", error);
    return NextResponse.json(
      { error: "Gagal memuat riwayat konsultasi" },
      { status: 500 }
    );
  }
}
