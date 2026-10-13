import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { TEAM } from "@/lib/constants";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessions = await prisma.consultationSession.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: { select: { messages: true } },
      },
    });

    return NextResponse.json({
      sessions: sessions.map((s) => {
        const last = s.messages[0];
        return {
          id: s.id,
          sessionRef: s.sessionRef,
          status: s.status,
          expertName: s.expertName || TEAM.LABEL,
          messageCount: s._count.messages,
          lastMessage: last
            ? {
                content: last.content,
                senderType: last.senderType,
                createdAt: last.createdAt.toISOString(),
              }
            : null,
          createdAt: s.createdAt.toISOString(),
          updatedAt: s.updatedAt.toISOString(),
        };
      }),
    });
  } catch (error) {
    console.error("[Consultation List] Error:", error);
    return NextResponse.json(
      { error: "Gagal memuat daftar konsultasi" },
      { status: 500 }
    );
  }
}
