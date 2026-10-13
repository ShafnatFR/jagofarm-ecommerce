import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET  /api/products/questions?productId=xxx  — daftar Q&A yang sudah dijawab (publik).
 * POST /api/products/questions                — kirim pertanyaan baru (perlu login).
 */

const questionSchema = z.object({
  productId: z.string().min(1, "productId wajib diisi"),
  question: z
    .string()
    .min(10, "Pertanyaan minimal 10 karakter")
    .max(1000, "Pertanyaan maksimal 1000 karakter"),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    if (!productId) {
      return NextResponse.json({ error: "productId wajib diisi" }, { status: 400 });
    }

    const questions = await prisma.productQuestion.findMany({
      where: { productId, isPublished: true, answer: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        askerName: true,
        question: true,
        answer: true,
        answeredAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("[questions] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Masuk dulu untuk bertanya." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const parsed = questionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: parsed.data.productId, isActive: true },
      select: { id: true },
    });
    if (!product) {
      return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
    }

    const asker = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true },
    });
    const askerName =
      asker?.name?.trim() || asker?.email?.split("@")[0] || "Pembeli";

    const created = await prisma.productQuestion.create({
      data: {
        productId: parsed.data.productId,
        userId: session.user.id,
        askerName,
        question: parsed.data.question.trim(),
      },
      select: { id: true, question: true, createdAt: true },
    });

    // Notifikasi admin (best-effort).
    try {
      const { notifyAdminSafe } = await import("@/lib/notifications");
      await notifyAdminSafe({
        type: "system",
        title: "Pertanyaan produk baru",
        body: `${askerName}: ${parsed.data.question.trim().slice(0, 120)}`,
        href: "/admin/products",
      });
    } catch {
      /* abaikan */
    }

    return NextResponse.json({ question: created }, { status: 201 });
  } catch (error) {
    console.error("[questions] POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
