/**
 * Penyimpanan tiket konsultasi di browser.
 *
 * Tamu tanpa akun tidak punya daftar tiket di server (tidak ada identitas yang
 * bisa dipercaya selain token). Jadi daftar tiket yang pernah dia buka disimpan
 * di localStorage bersama accessToken-nya. Token inilah yang dikirim sebagai
 * header `x-consultation-token` untuk membaca/membalas tiket.
 *
 * Catatan keamanan: token disimpan di localStorage sehingga rentan bila ada XSS.
 * Ini kompromi yang disengaja — alternatifnya mewajibkan login, yang justru
 * membuat konsultasi tidak bisa dipakai pengunjung baru. Tidak ada data
 * pembayaran di sini; isinya hanya percakapan konsultasi.
 */

const STORAGE_KEY = "jagofarm:consultation-tickets";
/** Batas tiket yang diingat di browser (yang paling lama dibuang). */
const MAX_LOCAL_TICKETS = 20;

export interface LocalTicket {
  sessionId: string;
  sessionRef: string | null;
  accessToken: string | null;
  createdAt: string;
  /** Cuplikan pesan terakhir untuk ditampilkan di sidebar tanpa fetch. */
  lastMessage?: string | null;
  lastSenderType?: string | null;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/** Baca semua tiket tersimpan. Aman dipanggil saat SSR (mengembalikan []). */
export function readLocalTickets(): LocalTicket[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is LocalTicket =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as LocalTicket).sessionId === "string"
    );
  } catch {
    return [];
  }
}

/** Simpan/perbarui satu tiket (berdasarkan sessionId). */
export function saveLocalTicket(ticket: LocalTicket): LocalTicket[] {
  if (!isBrowser()) return [];
  const existing = readLocalTickets().filter(
    (item) => item.sessionId !== ticket.sessionId
  );
  // Tiket terbaru di depan, sisanya dipotong agar tidak tumbuh tanpa batas.
  const next = [ticket, ...existing].slice(0, MAX_LOCAL_TICKETS);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* kuota penuh / mode privat: abaikan, tiket tetap ada di server */
  }
  return next;
}

/** Ambil satu tiket berdasarkan id. */
export function getLocalTicket(sessionId: string): LocalTicket | null {
  return readLocalTickets().find((item) => item.sessionId === sessionId) ?? null;
}

/** Hapus satu tiket dari daftar lokal (tidak menghapus data di server). */
export function removeLocalTicket(sessionId: string): LocalTicket[] {
  if (!isBrowser()) return [];
  const next = readLocalTickets().filter((item) => item.sessionId !== sessionId);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* abaikan */
  }
  return next;
}

/** Token untuk tiket tertentu (null bila tidak ada / bukan milik browser ini). */
export function getTicketToken(sessionId: string): string | null {
  return getLocalTicket(sessionId)?.accessToken ?? null;
}
