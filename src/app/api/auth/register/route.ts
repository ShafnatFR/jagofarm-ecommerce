import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

const registerSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  phone: z.string().optional(),
});

/** Messages from Supabase that mean "this email already has a Supabase account". */
const DUPLICATE_EMAIL_PATTERN = /already|registered|exists/i;

/** Public origin of the app, used for Supabase email redirects. */
function getOrigin(request: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");

  const forwardedHost = request.headers.get("x-forwarded-host");
  if (forwardedHost) {
    const proto = request.headers.get("x-forwarded-proto") ?? "https";
    return `${proto}://${forwardedHost}`;
  }

  return new URL(request.url).origin;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const firstMessage = Object.values(fieldErrors).flat().find(Boolean);
      return NextResponse.json(
        { error: firstMessage ?? "Data pendaftaran tidak valid", fieldErrors },
        { status: 400 }
      );
    }

    const { name, password, phone } = parsed.data;
    const email = parsed.data.email.trim().toLowerCase();

    // 1) Row already in our Postgres table (may be leftover from the old bcrypt schema
    //    or an account created through Google/Supabase).
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, passwordHash: true },
    });

    if (existingUser) {
      if (existingUser.passwordHash) {
        // Legacy bcrypt-only account: it has no Supabase Auth user, so email+password
        // login cannot work until the account is migrated.
        return NextResponse.json(
          {
            error:
              "Email ini terdaftar sebagai akun lama (skema password bcrypt) dan belum tersinkron dengan Supabase Auth. Silakan masuk menggunakan Google dengan email yang sama, atau gunakan Lupa Password untuk mengatur ulang password.",
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: "Email sudah terdaftar. Silakan masuk atau gunakan fitur Lupa Password." },
        { status: 409 }
      );
    }

    // 2) Supabase Auth is the source of truth for credentials.
    const supabase = await createClient();
    const origin = getOrigin(request);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, phone: phone || null },
        emailRedirectTo: `${origin}/auth/callback?next=/login`,
      },
    });

    if (error) {
      if (DUPLICATE_EMAIL_PATTERN.test(error.message)) {
        return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 409 });
      }
      // Weak password / rate limit / provider errors — surface the real message.
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Supabase hides duplicate sign-ups: an existing email returns a user with no identities.
    if (!data.user || (Array.isArray(data.user.identities) && data.user.identities.length === 0)) {
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 409 });
    }

    // 3) Sync the Postgres users row (id = Supabase user id) + Cart.
    let user;
    try {
      user = await prisma.user.create({
        data: {
          id: data.user.id,
          supabaseId: data.user.id,
          name,
          email,
          phone: phone || null,
          role: "customer",
        },
        select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
      });
    } catch (syncError) {
      console.error("Registration: failed to sync users row:", syncError);
      const byEmail = await prisma.user
        .findUnique({ where: { email }, select: { id: true } })
        .catch(() => null);
      if (byEmail) {
        return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 409 });
      }
      return NextResponse.json(
        {
          error:
            "Akun dibuat, tetapi gagal disinkronkan ke database. Silakan coba masuk; jika masih gagal, hubungi admin.",
        },
        { status: 500 }
      );
    }

    await prisma.cart
      .upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id } })
      .catch((cartError) => {
        console.error("Registration: failed to create cart:", cartError);
      });

    if (data.session) {
      // Case (b): email confirmation disabled -> the user is already signed in.
      return NextResponse.json(
        { message: "Registrasi berhasil", user, session: true },
        { status: 201 }
      );
    }

    // Case (a): email confirmation enabled -> no session yet.
    return NextResponse.json(
      {
        message:
          "Registrasi berhasil. Kami mengirim tautan konfirmasi ke email Anda — silakan konfirmasi sebelum masuk.",
        user,
        requiresEmailConfirmation: true,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}
