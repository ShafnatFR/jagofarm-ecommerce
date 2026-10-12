import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SITE_CONFIG } from "@/lib/constants";

const contactSchema = z.object({
  name: z.string().min(2, "Nama harus minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  topic: z.enum(["pemesanan", "teknis", "iot", "kemitraan"]),
  subject: z.string().min(3, "Subjek harus minimal 3 karakter"),
  message: z.string().min(20, "Pesan harus minimal 20 karakter"),
});

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

    // Log ke console
    console.log(
      `[Contact Form] Baru:\n` +
      `  Nama: ${name}\n` +
      `  Email: ${email}\n` +
      `  Topik: ${topic}\n` +
      `  Subjek: ${subject}\n` +
      `  Pesan: ${message}\n` +
      `  Waktu: ${new Date().toISOString()}`
    );

    // Kirim notifikasi email ke tim (bila dikonfigurasi)
    try {
      const { sendEmailSafe } = await import("@/lib/email");
      await sendEmailSafe({
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
    } catch (emailError) {
      // Email gagal tidak boleh mengganggu respons sukses ke user
      console.error("[Contact API] Gagal mengirim email notifikasi:", emailError);
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
