import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { TEAM } from "@/lib/constants";

/**
 * Tiket konsultasi.
 *
 * Satu sesi = satu tiket. Tiket bisa dimiliki user login (userId) ATAU tamu
 * tanpa akun (guestEmail + accessToken). Untuk tamu, `accessToken` adalah
 * satu-satunya bukti kepemilikan: disimpan di browser tamu dan dikirim sebagai
 * header `x-consultation-token` pada setiap permintaan.
 *
 * Aturan penting: fungsi di sini TIDAK boleh menebak pemilik dari email saja.
 * Email mudah ditebak/dipalsukan; token tidak.
 */

/** Prefix referensi tiket yang ditampilkan ke pelanggan, mis. KF-8F2K1A. */
const REF_PREFIX = "KF";

/** Batas panjang isi pesan (sama dengan validasi admin). */
export const MAX_MESSAGE_LENGTH = 5000;

export interface TicketOwner {
  userId: string | null;
  accessToken: string | null;
  guestName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
}

export interface TicketMessage {
  id: string;
  senderType: string;
  content: string;
  attachments: string[];
  createdAt: string;
}

export interface TicketView {
  sessionId: string;
  sessionRef: string | null;
  status: string;
  expertName: string;
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
}

/** Buat referensi tiket yang mudah dibaca manusia: KF-<base36 waktu>-<acak>. */
export function createSessionRef(): string {
  const stamp = Date.now().toString(36).toUpperCase().slice(-5);
  const rand = randomBytes(2).toString("hex").toUpperCase();
  return `${REF_PREFIX}-${stamp}-${rand}`;
}

/** Token akses tamu: 32 byte acak (64 karakter hex). Tidak bisa ditebak. */
export function createAccessToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Cari sesi berdasarkan identitas pemilik.
 *
 * - User login: hanya sesi milik userId tersebut.
 * - Tamu: hanya sesi dengan accessToken yang cocok.
 *
 * Token yang tidak cocok menghasilkan null — bukan sesi milik orang lain.
 */
export async function findOwnedSession(
  owner: { userId?: string | null; accessToken?: string | null },
  sessionId: string
): Promise<{ id: string; userId: string | null } | null> {
  if (owner.userId) {
    return prisma.consultationSession.findFirst({
      where: { id: sessionId, userId: owner.userId },
      select: { id: true, userId: true },
    });
  }

  if (owner.accessToken) {
    return prisma.consultationSession.findFirst({
      where: { id: sessionId, accessToken: owner.accessToken },
      select: { id: true, userId: true },
    });
  }

  return null;
}

/** Susun tampilan tiket (dipakai endpoint tamu maupun user login). */
export async function loadTicket(sessionId: string): Promise<TicketView | null> {
  const session = await prisma.consultationSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      sessionRef: true,
      status: true,
      expertName: true,
      createdAt: true,
      updatedAt: true,
      messages: {
        orderBy: { createdAt: "asc" },
        take: 200,
        select: {
          id: true,
          senderType: true,
          content: true,
          attachments: true,
          createdAt: true,
        },
      },
    },
  });

  if (!session) return null;

  return {
    sessionId: session.id,
    sessionRef: session.sessionRef,
    status: session.status,
    expertName: session.expertName || TEAM.LABEL,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
    messages: session.messages.map((message) => ({
      id: message.id,
      senderType: message.senderType,
      content: message.content,
      attachments: message.attachments,
      createdAt: message.createdAt.toISOString(),
    })),
  };
}

/**
 * Tandai pesan pelanggan sebagai sudah dibaca admin.
 * Best-effort: kegagalan di sini tidak boleh menggagalkan pemuatan tiket.
 */
export async function markCustomerMessagesRead(sessionId: string): Promise<void> {
  try {
    await prisma.consultationMessage.updateMany({
      where: { sessionId, senderType: "user", isRead: false },
      data: { isRead: true },
    });
  } catch (error) {
    console.error("[consultation] Gagal menandai pesan dibaca:", error);
  }
}
