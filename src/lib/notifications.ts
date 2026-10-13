import { prisma } from "@/lib/prisma";

/**
 * Notifikasi in-app untuk admin (bell di header admin).
 *
 * Semua fungsi "create" bersifat best-effort: kegagalan menulis notifikasi
 * TIDAK boleh menggagalkan alur utama (order, kontak, ulasan). Call site
 * boleh memanggil `notifyAdminSafe` tanpa menangani error.
 */

export type AdminNotificationType =
  | "order"
  | "contact"
  | "review"
  | "consultation"
  | "stock"
  | "system";

export interface CreateNotificationInput {
  type: AdminNotificationType;
  title: string;
  body?: string | null;
  href?: string | null;
}

/** Batas jumlah notifikasi tersimpan (yang lama dipangkas agar tabel tidak membengkak). */
const MAX_STORED = 200;

/** Buat satu notifikasi admin. Best-effort — tidak throw ke pemanggil. */
export async function notifyAdminSafe(
  input: CreateNotificationInput
): Promise<void> {
  try {
    await prisma.adminNotification.create({
      data: {
        type: input.type,
        title: input.title.slice(0, 200),
        body: input.body ?? null,
        href: input.href ?? null,
      },
    });
  } catch (error) {
    console.error("[notifications] Gagal membuat notifikasi admin:", error);
  }
}

export interface AdminNotificationRow {
  id: string;
  type: string;
  title: string;
  body: string | null;
  href: string | null;
  isRead: boolean;
  createdAt: Date;
}

/** Daftar notifikasi terbaru + jumlah yang belum dibaca. */
export async function listNotifications(limit = 20): Promise<{
  items: AdminNotificationRow[];
  unreadCount: number;
}> {
  const [items, unreadCount] = await Promise.all([
    prisma.adminNotification.findMany({
      orderBy: { createdAt: "desc" },
      take: Math.min(Math.max(limit, 1), 50),
      select: {
        id: true,
        type: true,
        title: true,
        body: true,
        href: true,
        isRead: true,
        createdAt: true,
      },
    }),
    prisma.adminNotification.count({ where: { isRead: false } }),
  ]);
  return { items, unreadCount };
}

/** Tandai satu notifikasi sudah dibaca. */
export async function markNotificationRead(id: string): Promise<void> {
  await prisma.adminNotification.updateMany({
    where: { id },
    data: { isRead: true, readAt: new Date() },
  });
}

/** Tandai semua notifikasi sudah dibaca. */
export async function markAllNotificationsRead(): Promise<number> {
  const result = await prisma.adminNotification.updateMany({
    where: { isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
  return result.count;
}

/**
 * Pangkas notifikasi lama agar tabel tidak tumbuh tanpa batas.
 * Dipanggil berkala (mis. dari cron), bukan di jalur request panas.
 */
export async function pruneNotifications(): Promise<number> {
  const keep = await prisma.adminNotification.findMany({
    orderBy: { createdAt: "desc" },
    take: MAX_STORED,
    select: { id: true },
  });
  const keepIds = keep.map((row) => row.id);
  if (keepIds.length === 0) return 0;
  const result = await prisma.adminNotification.deleteMany({
    where: { id: { notIn: keepIds } },
  });
  return result.count;
}
