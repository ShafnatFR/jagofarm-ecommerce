"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/auth";
import { sanitizeHtml } from "@/lib/sanitize";

export interface ContentPageRow {
  id: string;
  slug: string;
  title: string;
  seoTitle: string | null;
  seoDesc: string | null;
  isActive: boolean;
  updatedAt: Date;
}

export async function listContentPages(): Promise<ContentPageRow[]> {
  await requireAdminUser();
  const pages = await prisma.contentPage.findMany({
    orderBy: { slug: "asc" },
    select: {
      id: true,
      slug: true,
      title: true,
      seoTitle: true,
      seoDesc: true,
      isActive: true,
      updatedAt: true,
    },
  });
  return pages as ContentPageRow[];
}

export async function getContentPage(id: string): Promise<ContentPageRow | null> {
  await requireAdminUser();
  const page = await prisma.contentPage.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      title: true,
      seoTitle: true,
      seoDesc: true,
      isActive: true,
      updatedAt: true,
    },
  });
  return (page ?? null) as (ContentPageRow | null);
}

export interface CreateContentPageInput {
  slug: string;
  title: string;
  seoTitle?: string;
  seoDesc?: string;
  contentHtml: string;
  isActive?: boolean;
}

export async function createContentPage(input: CreateContentPageInput) {
  const user = await requireAdminUser();
  const { slug, title, seoTitle, seoDesc, contentHtml, isActive = true } = input;

  const existing = await prisma.contentPage.findUnique({ where: { slug } });
  if (existing) {
    throw new Error(`Halaman dengan slug "${slug}" sudah ada.`);
  }

  const page = await prisma.contentPage.create({
    data: {
      slug,
      title,
      seoTitle: seoTitle || null,
      seoDesc: seoDesc || null,
      contentHtml: sanitizeHtml(contentHtml),
      isActive,
    },
  });

  revalidatePath("/admin/content-pages");
  revalidatePath("/api/content/[slug]");
  return page;
}

export interface UpdateContentPageInput {
  id: string;
  title?: string;
  seoTitle?: string;
  seoDesc?: string;
  contentHtml?: string;
  isActive?: boolean;
}

export async function updateContentPage(input: UpdateContentPageInput) {
  await requireAdminUser();
  const { id, title, seoTitle, seoDesc, contentHtml, isActive } = input;

  const page = await prisma.contentPage.findUnique({ where: { id } });
  if (!page) {
    throw new Error("Halaman konten tidak ditemukan.");
  }

  const updated = await prisma.contentPage.update({
    where: { id },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(seoTitle !== undefined ? { seoTitle: seoTitle || null } : {}),
      ...(seoDesc !== undefined ? { seoDesc: seoDesc || null } : {}),
      ...(contentHtml !== undefined ? { contentHtml: sanitizeHtml(contentHtml) } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
    },
  });

  revalidatePath("/admin/content-pages");
  revalidatePath("/api/content/[slug]");
  return updated;
}

export async function deactivateContentPage(id: string) {
  await requireAdminUser();
  const page = await prisma.contentPage.findUnique({ where: { id } });
  if (!page) {
    throw new Error("Halaman konten tidak ditemukan.");
  }

  const deactivated = await prisma.contentPage.update({
    where: { id },
    data: { isActive: false },
  });

  revalidatePath("/admin/content-pages");
  revalidatePath("/api/content/[slug]");
  return deactivated;
}
