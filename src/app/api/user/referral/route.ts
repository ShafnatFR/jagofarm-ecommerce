import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ensureReferralCode, referralStats } from "@/lib/referral";

/**
 * GET /api/user/referral
 * Kode referral milik user + statistik (total/berhasil/pending).
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const code = await ensureReferralCode(session.user.id);
    const stats = await referralStats(session.user.id);

    return NextResponse.json({ code, stats });
  } catch (error) {
    console.error("[referral] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
