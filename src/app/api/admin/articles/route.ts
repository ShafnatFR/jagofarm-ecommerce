import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET    /api/admin/articles — semua artikel.
 * POST   /api/admin/articles — buat artikel.
 * PATCH  /api/admin/articles — ubah (id wajib).
 * DELETE /api/admin/articles?id= — hapus.
 */

function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 200);
}

function requireAdmin(session: { user?: { id?: string; role?: string } | null } | null) {
  return Boolean(session?.user?.id && session.user.role === "admin");
}

const upsertSchema = z.object({
  id: z.string().min(1).optional(),
  title: z.string().trim().min(5, "Judul minimal 5 karakter").max(200),
  slug: z.string().trim().max(220).optional(),
  excerpt: z.string().trim().max(500).optional(),
  content: z.string().trim().min(20, "Isi minimal 20 karakter"),
  coverUrl: z.string().trim().max(2000).optional(),
  published: z.boolean().optional(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!requireAdmin(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const articles = await prisma.article.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json({ articles });
  } catch (error) {
    console.error("[admin/articles] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!requireAdmin(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await request.json().catch(() => ({}));
    const parsed = upsertSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
        { status: 400 }
      );
    }
    const slug = parsed.data.slug?.trim() || slugify(parsed.data.title);
    const created = await prisma.article.create({
      data: {
        title: parsed.data.title,
        slug,
        excerpt: parsed.data.excerpt?.trim() || null,
        content: parsed.data.content,
        coverUrl: parsed.data.coverUrl?.trim() || null,
        published: parsed.data.published ?? false,
      },
    });
    return NextResponse.json({ article: created }, { status: 201 });
  } catch (error) {
    console.error("[admin/articles] POST error:", error);
    const msg = error instanceof Error && error.message.includes("Unique") ? "Slug sudah dipakai" : "Internal server error";
    return NextResponse.json({ error: msg }, { status: msg === "Slug sudah dipakai" ? 409 : 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!requireAdmin(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await request.json().catch(() => ({}));
    const parsed = upsertSchema.extend({ id: z.string().min(1) }).safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
        { status: 400 }
      );
    }
    const { id, ...rest } = parsed.data;
    const updated = await prisma.article.update({
      where: { id },
      data: {
        title: rest.title,
        ...(rest.slug ? { slug: rest.slug.trim() || slugify(rest.title) } : {}),
        excerpt: rest.excerpt?.trim() || null,
        content: rest.content,
        coverUrl: rest.coverUrl?.trim() || null,
        published: rest.published,
      },
    });
    return NextResponse.json({ article: updated });
  } catch (error) {
    console.error("[admin/articles] PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!requireAdmin(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id wajib diisi" }, { status: 400 });
    await prisma.article.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[admin/articles] DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
