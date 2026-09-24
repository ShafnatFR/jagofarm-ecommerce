import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  isApproved: z.boolean({
    message: "isApproved wajib berupa boolean (true/false)",
  }),
});

/**
 * PATCH /api/admin/reviews/[id]
 * Body: { isApproved: boolean }
 *  - true  -> Setujui (tayang di halaman produk)
 *  - false -> Sembunyikan (menunggu moderasi)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Body permintaan tidak valid: harus berupa JSON." },
        { status: 400 }
      );
    }

    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            "Body permintaan tidak valid: field isApproved wajib berupa boolean (true/false).",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const existing = await prisma.review.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Ulasan tidak ditemukan." },
        { status: 404 }
      );
    }

    const review = await prisma.review.update({
      where: { id },
      data: { isApproved: parsed.data.isApproved },
    });

    return NextResponse.json({
      message: review.isApproved
        ? "Ulasan berhasil disetujui dan ditayangkan."
        : "Ulasan berhasil disembunyikan.",
      review: {
        id: review.id,
        productId: review.productId,
        userId: review.userId,
        rating: review.rating,
        comment: review.comment,
        imageUrl: review.imageUrl,
        isApproved: review.isApproved,
        createdAt: review.createdAt,
      },
    });
  } catch (error) {
    console.error("Admin review PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/reviews/[id]
 * Hapus permanen satu ulasan.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const existing = await prisma.review.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Ulasan tidak ditemukan." },
        { status: 404 }
      );
    }

    await prisma.review.delete({ where: { id } });

    return NextResponse.json({ message: "Ulasan berhasil dihapus." });
  } catch (error) {
    console.error("Admin review DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
