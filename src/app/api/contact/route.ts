import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SITE_CONFIG } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

const contactSchema = z.object({
  name: z.string().min(2, "Nama harus minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  topic: z.enum(["pemesanan", "teknis", "iot", "kemitraan"]),
  subject: z.string().min(3, "Subjek harus minimal 3 karakter"),
  message: z.string().min(20, "Pesan harus minimal 20 karakter"),
});

/** Ambil IP pengirim dari header proxy (best-effort, untuk deteksi spam). */
function getClientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || null;
  return request.headers.get("x-real-ip");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = contactSchema.safeParse(body);

    if (!result.success) {
      const errors = (result.error as z.ZodError).issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      return NextResponse.json(
        { error: "Validasi gagal", errors },
        { status: 400 }
      );
    }

    const { name, email, topic, subject, message } = result.data;

    // 1) Simpan pesan ke database DULU — tanpa baris ini pesan hilang
    //    (sebelumnya hanya di console.log). Kegagalan tulis = 500 sungguhan,
    //    BUKAN sukses palsu.
    let contactMessage;
    try {
      contactMessage = await prisma.contactMessage.create({
        data: {
          name,
          email,
          topic,
          subject,
          message,
          ipAddress: getClientIp(request),
        },
      });
    } catch (dbError) {
      console.error("[Contact API] Gagal menyimpan pesan ke database:", dbError);
      return NextResponse.json(
        {
          error:
            "Pesan gagal disimpan. Silakan coba lagi atau hubungi kami melalui email/telepon.",
        },
        { status: 500 }
      );
    }

    console.log(
      `[Contact Form] Baru (id: ${contactMessage.id}):\n` +
      `  Nama: ${name}\n` +
      `  Email: ${email}\n` +
      `  Topik: ${topic}\n` +
      `  Subjek: ${subject}\n` +
      `  Waktu: ${contactMessage.createdAt.toISOString()}`
    );

    // 2) Kirim notifikasi email ke tim (best-effort; statusnya dicatat di baris
    //    yang sudah tersimpan supaya admin tahu email terkirim atau tidak).
    try {
      const { sendEmailSafe } = await import("@/lib/email");
      const emailResult = await sendEmailSafe({
        to: [SITE_CONFIG.email],
        subject: `Contact Form: ${subject}`,
        replyTo: email,
        html: `
          <h2>Pesan Baru dari Contact Form</h2>
          <p><strong>Nama:</strong> ${escapeHtml(name)}</p>
          <p><strong>Email:</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
          <p><strong>Topik:</strong> ${escapeHtml(topic)}</p>
          <p><strong>Subjek:</strong> ${escapeHtml(subject)}</p>
          <hr>
          <p><strong>Pesan:</strong></p>
          <p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>
          <hr>
          <p style="color: #888; font-size: 12px;"> dikirim via JagoFarm E-commerce • ${new Date().toLocaleString("id-ID")} </p>
        `,
        text: `Pesan Baru dari Contact Form

Nama: ${name}
Email: ${email}
Topik: ${topic}
Subjek: ${subject}

Pesan:
${message}

--- dikirim via JagoFarm E-commerce • ${new Date().toLocaleString("id-ID")} ---`,
      });

      // Pelacakan status email juga best-effort: jangan sampai menggagalkan respons sukses.
      try {
        await prisma.contactMessage.update({
          where: { id: contactMessage.id },
          data: {
            emailSent: emailResult.status === "sent",
            emailError:
              emailResult.status === "failed"
                ? emailResult.error.slice(0, 1000)
                : null,
          },
        });
      } catch (trackError) {
        console.error("[Contact API] Gagal memperbarui status email pesan:", trackError);
      }
    } catch (emailError) {
      // Email gagal tidak boleh mengganggu respons sukses ke user — pesan sudah tersimpan.
      console.error("[Contact API] Gagal mengirim email notifikasi:", emailError);
    }

    // 3) Notifikasi in-app untuk admin (bell) — best-effort.
    try {
      const { notifyAdminSafe } = await import("@/lib/notifications");
      await notifyAdminSafe({
        type: "contact",
        title: `Pesan kontak baru: ${subject}`,
        body: `${name} (${email})`,
        href: "/admin/contact",
      });
    } catch {
      /* abaikan */
    }

    return NextResponse.json(
      {
        success: true,
        message: "Pesan terikat. Tim kami akan merespons dalam 1x24 jam.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Contact API] Error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

/** Escape HTML untuk mencegah XSS di email template */
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
