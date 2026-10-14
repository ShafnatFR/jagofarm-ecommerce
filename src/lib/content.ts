import { prisma } from "./prisma";
import { sanitizeHtml } from "./sanitize";

/**
 * Ambil HTML statis halaman konten dari DB.
 * Dipakai oleh halaman policy/info supaya konten tidak lagi hardcode di halaman.
 * HTML disanitasi di sini (bukan di tiap pemanggil) supaya satu titik keamanan.
 *
 * Tahan-error: bila DB tidak terjangkau (mis. saat build/prerender, atau pool
 * koneksi penuh), kembalikan null alih-alih melempar — halaman tetap ter-render
 * (konten kosong) dan build tidak gagal.
 */
export async function getContentPageHtml(slug: string): Promise<string | null> {
  try {
    const page = await prisma.contentPage.findUnique({
      where: { slug, isActive: true },
    });
    return page?.contentHtml ? sanitizeHtml(page.contentHtml) : null;
  } catch (error) {
    console.error(`[content] gagal memuat halaman "${slug}":`, error);
    return null;
  }
}
