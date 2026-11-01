import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/blog — daftar artikel published (publik, cache 60s).
 * GET /api/blog?slug= — satu artikel published.
 */
export async function GET(request: Request) {
  try {
    const slug = new URL(request.url).searchParams.get("slug");
    if (slug) {
      const article = await prisma.article.findFirst({
        where: { slug, published: true },
        select: {
          id: true, title: true, slug: true, excerpt: true,
          content: true, coverUrl: true, createdAt: true,
        },
      });
      if (!article) {
        return NextResponse.json({ error: "Artikel tidak ditemukan" }, { status: 404 });
      }
      return NextResponse.json(
        { article },
        { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
      );
    }
    const articles = await prisma.article.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true, title: true, slug: true, excerpt: true,
        coverUrl: true, createdAt: true,
      },
    });
    return NextResponse.json(
      { articles },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
    );
  } catch (error) {
    console.error("[blog] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
