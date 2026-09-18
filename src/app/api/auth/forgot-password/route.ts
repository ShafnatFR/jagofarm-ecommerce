import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email wajib diisi" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ message: "Jika email terdaftar, link reset password telah dikirim." });
    }

    // In production: send email via Resend/SendGrid with reset token
    // For now: just return success
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 3600000); // 1 hour

    // Store token (would need a password_resets table in production)
    // For MVP: just return success message
    console.log(`Password reset requested for ${email}, token: ${token}`);

    return NextResponse.json({
      message: "Jika email terdaftar, link reset password telah dikirim.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
  }
}
