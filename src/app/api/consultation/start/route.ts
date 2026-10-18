import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { TEAM } from "@/lib/constants";
import { notifyAdminSafe } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await request.json().catch(() => ({}));
    const existingSession = await prisma.consultationSession.findFirst({
      where: {
        userId: user.id,
        status: "active",
      },
      orderBy: { createdAt: "desc" },
    });

    if (existingSession) {
      return NextResponse.json({
        sessionId: existingSession.id,
        sessionRef: existingSession.sessionRef,
        status: existingSession.status,
        message: "Sesi aktif sudah ada",
      });
    }

    const sessionRef = `KF-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .slice(2, 6)
      .toUpperCase()}`;

    const session = await prisma.consultationSession.create({
      data: {
        userId: user.id,
        sessionRef,
        expertName: TEAM.LABEL,
        metadata: {
          expert: TEAM.LABEL,
          expertSpecialty: TEAM.SPECIALTY,
          startedAt: new Date().toISOString(),
        },
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          take: 50,
        },
      },
    });

    await prisma.consultationMessage.create({
      data: {
        sessionId: session.id,
        senderType: "system",
        content: `Sesi konsultasi dengan ${(session.metadata as { expert?: string })?.expert || TEAM.LABEL} telah dimulai. ${TEAM.INITIAL_MESSAGE}`,
      },
    });

    // Beri tahu admin bahwa ada sesi konsultasi baru (best-effort).
    await notifyAdminSafe({
      type: "consultation",
      title: `Konsultasi baru: ${user.name || user.email || "Pelanggan"}`,
      body: user.email ?? null,
      href: `/admin/consultation?session=${session.id}`,
    });

    return NextResponse.json({
      sessionId: session.id,
      sessionRef: session.sessionRef,
      status: session.status,
      message: "Sesi konsultasi dimulai",
    });
  } catch (error) {
    console.error("[Consultation Start] Error:", error);
    return NextResponse.json(
      { error: "Gagal memulai sesi konsultasi" },
      { status: 500 }
    );
  }
}
