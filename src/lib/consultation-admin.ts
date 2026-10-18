"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/auth";

/**
 * Inbox konsultasi untuk admin.
 *
 * Sesi chatting dibuat dari halaman /consultation. Tanpa inbox ini, pesan
 * pelanggan masuk ke database tapi tidak pernah dibalas — tidak ada layar
 * admin untuk membaca dan menimpali.
 */

export interface ConsultationSessionSummary {
  id: string;
  sessionRef: string | null;
  status: string;
  expertName: string;
  createdAt: Date;
  updatedAt: Date;
  userName: string | null;
  userEmail: string | null;
  /** Nama/email tamu (tanpa akun) — dipakai bila userName kosong. */
  guestName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  /** "guest" bila tiket dibuat tanpa login, "account" bila oleh user login. */
  source: string;
  messageCount: number;
  unreadCount: number;
  lastMessage: string | null;
}

export interface ConsultationMessageRow {
  id: string;
  senderType: string;
  content: string;
  createdAt: Date;
  isRead: boolean;
}

export interface ConsultationThread {
  session: ConsultationSessionSummary;
  messages: ConsultationMessageRow[];
}

export async function listConsultationSessions(status?: string): Promise<ConsultationSessionSummary[]> {
  await requireAdminUser();

  const sessions = await prisma.consultationSession.findMany({
    where: status && status !== "all" ? { status } : undefined,
    orderBy: { updatedAt: "desc" },
    take: 100,
    select: {
      id: true,
      sessionRef: true,
      status: true,
      expertName: true,
      createdAt: true,
      updatedAt: true,
      guestName: true,
      guestEmail: true,
      guestPhone: true,
      metadata: true,
      user: { select: { name: true, email: true } },
      _count: { select: { messages: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { content: true, senderType: true },
      },
    },
  });

  // Jumlah pesan user yang belum dibaca dihitung terpisah supaya tidak
  // memakai _count terfilter yang Prisma 5 belum mendukung di include.
  const unread = await prisma.consultationMessage.groupBy({
    by: ["sessionId"],
    where: { senderType: "user", isRead: false },
    _count: { _all: true },
  });
  const unreadMap = new Map(unread.map((row) => [row.sessionId, row._count._all]));

  return sessions.map((session) => ({
    id: session.id,
    sessionRef: session.sessionRef,
    status: session.status,
    expertName: session.expertName,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    userName: session.user?.name ?? null,
    userEmail: session.user?.email ?? null,
    guestName: session.guestName,
    guestEmail: session.guestEmail,
    guestPhone: session.guestPhone,
    source: readSource(session.metadata),
    messageCount: session._count.messages,
    unreadCount: unreadMap.get(session.id) ?? 0,
    lastMessage: session.messages[0]?.content ?? null,
  }));
}

/** Baca asal tiket dari metadata JSON (default: tiket lama = akun). */
function readSource(metadata: unknown): string {
  if (metadata && typeof metadata === "object" && "source" in metadata) {
    const value = (metadata as { source?: unknown }).source;
    if (typeof value === "string") return value;
  }
  return "account";
}

export async function getConsultationThread(sessionId: string): Promise<ConsultationThread | null> {
  await requireAdminUser();

  const session = await prisma.consultationSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      sessionRef: true,
      status: true,
      expertName: true,
      createdAt: true,
      updatedAt: true,
      guestName: true,
      guestEmail: true,
      guestPhone: true,
      metadata: true,
      user: { select: { name: true, email: true } },
      _count: { select: { messages: true } },
    },
  });
  if (!session) return null;

  const messages = await prisma.consultationMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
    select: { id: true, senderType: true, content: true, createdAt: true, isRead: true },
  });

  return {
    session: {
      id: session.id,
      sessionRef: session.sessionRef,
      status: session.status,
      expertName: session.expertName,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      userName: session.user?.name ?? null,
      userEmail: session.user?.email ?? null,
      guestName: session.guestName,
      guestEmail: session.guestEmail,
      guestPhone: session.guestPhone,
      source: readSource(session.metadata),
      messageCount: session._count.messages,
      unreadCount: messages.filter((message) => message.senderType === "user" && !message.isRead).length,
      lastMessage: messages[messages.length - 1]?.content ?? null,
    },
    messages,
  };
}

/** Balas sebagai ahli. Pesan lama dari pelanggan ditandai sudah dibaca. */
export async function replyToConsultation(sessionId: string, content: string): Promise<void> {
  const admin = await requireAdminUser();
  const trimmed = content.trim();
  if (!trimmed) throw new Error("Balasan tidak boleh kosong.");
  if (trimmed.length > 5000) throw new Error("Balasan maksimal 5000 karakter.");

  const session = await prisma.consultationSession.findUnique({
    where: { id: sessionId },
    select: { id: true, status: true },
  });
  if (!session) throw new Error("Sesi konsultasi tidak ditemukan.");
  if (session.status === "closed") throw new Error("Sesi sudah ditutup — buka lagi sebelum membalas.");

  await prisma.$transaction([
    prisma.consultationMessage.create({
      data: {
        sessionId,
        senderType: "expert",
        senderId: admin.id,
        content: trimmed,
      },
    }),
    prisma.consultationMessage.updateMany({
      where: { sessionId, senderType: "user", isRead: false },
      data: { isRead: true },
    }),
    prisma.consultationSession.update({
      where: { id: sessionId },
      data: { status: "active", updatedAt: new Date() },
    }),
  ]);

  revalidatePath("/admin/consultation");
}

export async function markConsultationRead(sessionId: string): Promise<void> {
  await requireAdminUser();
  await prisma.consultationMessage.updateMany({
    where: { sessionId, senderType: "user", isRead: false },
    data: { isRead: true },
  });
  revalidatePath("/admin/consultation");
}

export async function setConsultationStatus(sessionId: string, status: string): Promise<void> {
  await requireAdminUser();
  if (!['active', 'closed', 'pending'].includes(status)) {
    throw new Error("Status tidak dikenal.");
  }
  const result = await prisma.consultationSession.updateMany({
    where: { id: sessionId },
    data: { status },
  });
  if (result.count === 0) throw new Error("Sesi konsultasi tidak ditemukan.");
  revalidatePath("/admin/consultation");
}