import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitizer untuk HTML dari CMS (content_pages) sebelum dirender.
 *
 * Admin memasukkan HTML bebas lewat editor; tanpa penyaringan, satu baris
 * <script> atau handler on* bisa dieksekusi di halaman publik (stored XSS).
 * DOMPurify membuang script/attribute berbahaya dan mempertahankan markup
 * styling yang dipakai editor (h2, p, ul, table, class, dst).
 *
 * Dipakai di dua sisi:
 * - Saat render (halaman shop + GET /api/content/[slug]) — pertahanan utama.
 * - Saat simpan (create/updateContentPage) — konten di DB ikut bersih.
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    // <a> dari editor boleh membuka tab baru.
    ADD_ATTR: ["target"],
  });
}
