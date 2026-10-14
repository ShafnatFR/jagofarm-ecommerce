import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.redirect(new URL("/login", request.url), 303);
    }

    const { id } = await params;

    // Verify ownership
    const address = await prisma.address.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!address) {
      return NextResponse.redirect(
        new URL("/account/addresses?error=Alamat+tidak+ditemukan", request.url),
        303
      );
    }

    // Unset other defaults
    await prisma.address.updateMany({
      where: { userId: session.user.id, isDefault: true },
      data: { isDefault: false },
    });

    // Set this as default
    await prisma.address.update({
      where: { id },
      data: { isDefault: true },
    });

    // Form HTML native: redirect balik ke daftar alamat (bukan JSON mentah).
    return NextResponse.redirect(new URL("/account/addresses", request.url), 303);
  } catch (error) {
    console.error("Default address error:", error);
    return NextResponse.redirect(
      new URL("/account/addresses?error=Gagal+menjadikan+alamat+utama", request.url),
      303
    );
  }
}