import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { TEAM } from "@/lib/constants";
import { notifyAdminSafe } from "@/lib/notifications";
import { createAccessToken, createSessionRef } from "@/lib/consultation-ticket";

/**
 * Buka tiket konsultasi baru.
 *
 * Bisa dipakai dua jenis pengunjung:
 *  - Tamu tanpa akun: wajib mengisi nama + email. Server membuat accessToken
 *    yang dikembalikan SEKALI ke browser; token itu yang dipakai untuk
 *    membaca & membalas tiket tanpa login.
 *  - User login: tiket terikat ke userId (tanpa token tamu).
 *
 * Setiap tiket baru langsung memunculkan notifikasi di halaman admin.
 */

const ticketSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(100),
  email: z.string().trim().email("Email tidak valid").max(255),
  phone: z
    .string()
    .trim()
    .max(20)
    .optional()
    .transform((value) => (value ? value : null)),
  message: z
    .string()
    .trim()
    .min(10, "Ceritakan kebutuhan Anda minimal 10 karakter")
    .max(5000, "Pesan maksimal 5000 karakter"),
  subject: z.string().trim().max(150).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = ticketSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      return NextResponse.json({ error: "Validasi gagal", errors }, { status: 400 });
    }

    const { name, email, phone, message, subject } = parsed.data;
    const user = await getCurrentUser().catch(() => null);

    // Tiket milik user login tidak memakai token tamu.
    const accessToken = user ? null : createAccessToken();
    const sessionRef = createSessionRef();

    const session = await prisma.consultationSession.create({
      data: {
        userId: user?.id ?? null,
        sessionRef,
        accessToken,
        status: "active",
        expertName: TEAM.LABEL,
        // Tamu: simpan identitas agar admin bisa menghubungi kembali.
        guestName: user ? null : name,
        guestEmail: user ? null : email,
        guestPhone: user ? null : phone,
        metadata: {
          expert: TEAM.LABEL,
          expertSpecialty: TEAM.SPECIALTY,
          startedAt: new Date().toISOString(),
          source: user ? "account" : "guest",
          subject: subject || null,
        },
        messages: {
          create: [
            {
              senderType: "system",
              content: `Tiket ${sessionRef} dibuat. ${TEAM.INITIAL_MESSAGE}`,
            },
            {
              senderType: "user",
              senderId: user?.id ?? null,
              content: message,
            },
          ],
        },
      },
      select: {
        id: true,
        sessionRef: true,
        status: true,
        expertName: true,
        createdAt: true,
      },
    });

    // Notifikasi bell admin — best-effort, kegagalan tidak menggagalkan tiket.
    await notifyAdminSafe({
      type: "consultation",
      title: `Konsultasi baru: ${name}`,
      body: subject ? `${subject} — ${email}` : `${email} · ${message.slice(0, 80)}`,
      href: `/admin/consultation?session=${session.id}`,
    });

    return NextResponse.json(
      {
        sessionId: session.id,
        sessionRef: session.sessionRef,
        status: session.status,
        expertName: session.expertName,
        // Token hanya dikembalikan di sini (sekali). Browser tamu menyimpannya.
        accessToken,
        createdAt: session.createdAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Consultation Ticket] Gagal membuat tiket:", error);
    return NextResponse.json(
      { error: "Gagal membuka tiket konsultasi. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
