import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET   /api/admin/questions            — daftar semua pertanyaan (semua status).
 * PATCH /api/admin/questions            — jawab / ubah status publish.
 *   Body: { id, answer?, isPublished? }
 */

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const questions = await prisma.productQuestion.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        askerName: true,
        question: true,
        answer: true,
        isPublished: true,
        answeredAt: true,
        createdAt: true,
        product: { select: { id: true, name: true, slug: true } },
      },
    });

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("[admin/questions] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const patchSchema = z.object({
  id: z.string().min(1),
  answer: z.string().max(2000).optional(),
  isPublished: z.boolean().optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
        { status: 400 }
      );
    }

    const { id, answer, isPublished } = parsed.data;
    const data: {
      answer?: string;
      isPublished?: boolean;
      answeredBy?: string;
      answeredAt?: Date;
    } = {};

    if (typeof answer === "string") {
      data.answer = answer.trim();
      data.answeredBy = session.user.id;
      data.answeredAt = new Date();
      // Jawaban baru langsung dipublikasikan kecuali diminta lain.
      data.isPublished = isPublished ?? true;
    } else if (typeof isPublished === "boolean") {
      data.isPublished = isPublished;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Tidak ada perubahan." }, { status: 400 });
    }

    const updated = await prisma.productQuestion.update({
      where: { id },
      data,
      select: { id: true, answer: true, isPublished: true, answeredAt: true },
    });

    return NextResponse.json({ question: updated });
  } catch (error) {
    console.error("[admin/questions] PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id wajib diisi" }, { status: 400 });
    }

    await prisma.productQuestion.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[admin/questions] DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
