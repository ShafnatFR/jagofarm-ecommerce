import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sanitizeHtml } from "@/lib/sanitize";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const page = await prisma.contentPage.findUnique({
      where: { slug, isActive: true },
    });

    if (!page) {
      return NextResponse.json({ error: "Halaman tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({
      slug: page.slug,
      title: page.title,
      seoTitle: page.seoTitle,
      seoDesc: page.seoDesc,
      contentHtml: sanitizeHtml(page.contentHtml),
    });
  } catch (error) {
    console.error("[Content Page] Error:", error);
    return NextResponse.json(
      { error: "Gagal memuat halaman" },
      { status: 500 }
    );
  }
}
