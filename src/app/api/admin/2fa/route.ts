import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateTotpSecret, totpSetupUrl, verifyTotp } from "@/lib/totp";

/**
 * GET   /api/admin/2fa — status (enabled atau belum).
 * POST  /api/admin/2fa { step: "setup" } — buat secret baru (belum aktif).
 * POST  /api/admin/2fa { step: "enable", code } — verifikasi + aktifkan.
 * POST  /api/admin/2fa { step: "disable", code } — matikan (perlu kode).
 */

function requireAdmin(session: { user?: { id?: string; role?: string } | null } | null) {
  return session?.user?.id && session.user.role === "admin" ? session.user.id : null;
}

export async function GET() {
  const adminId = requireAdmin(await auth());
  if (!adminId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const user = await prisma.user.findUnique({
    where: { id: adminId },
    select: { totpEnabled: true, totpSecret: true, email: true },
  });
  return NextResponse.json({
    enabled: user?.totpEnabled ?? false,
    hasSecret: Boolean(user?.totpSecret),
  });
}

const bodySchema = z.object({
  step: z.enum(["setup", "enable", "disable"]),
  code: z.string().trim().max(10).optional(),
});

export async function POST(request: NextRequest) {
  const adminId = requireAdmin(await auth());
  if (!adminId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: adminId },
    select: { email: true, totpSecret: true, totpEnabled: true },
  });
  if (!user) return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });

  if (parsed.data.step === "setup") {
    const secret = generateTotpSecret();
    await prisma.user.update({ where: { id: adminId }, data: { totpSecret: secret } });
    return NextResponse.json({
      secret,
      setupUrl: totpSetupUrl(secret, user.email ?? adminId),
    });
  }

  const code = parsed.data.code?.replace(/\s/g, "") ?? "";
  if (!user.totpSecret || !(await verifyTotp(user.totpSecret, code))) {
    return NextResponse.json({ error: "Kode 2FA salah" }, { status: 400 });
  }

  if (parsed.data.step === "enable") {
    await prisma.user.update({ where: { id: adminId }, data: { totpEnabled: true } });
    return NextResponse.json({ enabled: true });
  }
  await prisma.user.update({
    where: { id: adminId },
    data: { totpEnabled: false, totpSecret: null },
  });
  return NextResponse.json({ enabled: false });
}
