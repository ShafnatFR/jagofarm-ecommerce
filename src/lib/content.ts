import { prisma } from "./prisma";

/**
 * Ambil HTML statis halaman konten dari DB.
 * Dipakai oleh halaman policy/info supaya konten tidak lagi hardcode di halaman.
 */
export async function getContentPageHtml(slug: string): Promise<string | null> {
  const page = await prisma.contentPage.findUnique({
    where: { slug, isActive: true },
  });
  return page?.contentHtml ?? null;
}
