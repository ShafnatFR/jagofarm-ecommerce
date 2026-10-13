import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listPointHistory } from "@/lib/loyalty";

/**
 * GET /api/user/points
 * Saldo poin + riwayat mutasi milik user yang sedang login.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [user, history] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { points: true, referralCode: true },
      }),
      listPointHistory(session.user.id, 30),
    ]);

    return NextResponse.json({
      points: user?.points ?? 0,
      referralCode: user?.referralCode ?? null,
      history,
    });
  } catch (error) {
    console.error("[points] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
