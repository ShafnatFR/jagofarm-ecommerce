/**
 * Helper pemberitahuan status/error API untuk halaman admin (dan UI umum).
 *
 * Masalah yang diselesaikan:
 * - Backend balas 400 dengan pesan bahasa Indonesia yang jelas, tapi
 *   banyak halaman membuangnya dan menyisakan "Gagal ..." generik.
 * - Status HTTP yang khas punya konteks berbeda: 401 (sesi admin berakhir),
 *   403 (bukan admin), 429 (rate limit) — bukan sekadar "HTTP 401".
 *
 * Konvensi:
 * - `extractApiErrorMessage` TIDAK menembak jaringan; murni parsing payload
 *   yang sudah ada (hasil `res.json()` yang berhasil).
 * - `throwIfNotOk` menggabungkan `.ok` check + baca body + pesan akhir
 *   dalam satu fungsi supaya halaman tidak lagi menulis `data?.error || ...`.
 */

/** Pesan kontekstual per status HTTP. */
export function describeHttpStatus(status: number): string {
  switch (status) {
    case 400:
      return "Data yang dikirim tidak valid.";
    case 401:
      return "Sesi admin berakhir atau belum login. Silakan login ulang.";
    case 403:
      return "Akun ini tidak memiliki akses admin.";
    case 404:
      return "Data tidak ditemukan. Kemungkinan sudah dihapus.";
    case 429:
      return "Terlalu sering mencoba. Tunggu sejenak lalu coba lagi.";
    case 500:
    case 502:
    case 503:
      return "Terjadi kesalahan di server. Coba lagi beberapa saat.";
    default:
      return "";
  }
}

/**
 * Ambil pesan error dari payload respons API.
 * Bentuk yang didukung:
 * - { error: "pesan" }                     → pakai pesan langsung
 * - { error: { field: [msg, ...], ... } }  → gabung semua field error
 * Bila tidak ada pesan yang bisa diekstrak, kembalikan `fallback`.
 */
export function extractApiErrorMessage(data: unknown, fallback: string): string {
  if (data && typeof data === "object") {
    const err = (data as { error?: unknown }).error;
    if (typeof err === "string" && err) return err;
    if (err && typeof err === "object") {
      const parts: string[] = [];
      for (const [field, messages] of Object.entries(err as Record<string, unknown>)) {
        if (Array.isArray(messages) && messages.length > 0) {
          parts.push(`${field}: ${messages.join("; ")}`);
        }
      }
      if (parts.length > 0) return parts.join(" • ");
    }
  }
  return fallback;
}

/** Bentuk payload dari badan respons, aman walau bukan JSON. */
async function safeJson(res: { json: () => Promise<unknown> }): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return undefined;
  }
}

/**
 * Untuk fetch yang Diharapkan sukses: bila `res.ok` false, lempar Error
 * dengan pesan terbaik yang tersedia (pesan server > deskripsi status).
 * Contoh: `throwIfNotOk(await fetch(...), "Gagal menyimpan produk.")`
 */
export async function throwIfNotOk(res: { ok: boolean; status: number; json: () => Promise<unknown> }, fallback: string): Promise<null> {
  if (res.ok) return null;
  const data = await safeJson(res);
  const server = extractApiErrorMessage(data, "");
  if (server) throw new Error(server);
  const hint = describeHttpStatus(res.status);
  throw new Error(hint || `${fallback} (HTTP ${res.status})`);
}
