import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const forgotPasswordSchema = z.object({
  email: z.string().email("Email tidak valid"),
});

/** Always answered with the same message so the endpoint cannot be used to enumerate accounts. */
const GENERIC_MESSAGE =
  "Jika email tersebut terdaftar, kami telah mengirim tautan untuk mengatur ulang password. Silakan cek inbox atau folder spam Anda.";

/** Public origin of the app, used for the Supabase recovery redirect. */
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
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Email tidak valid" }, { status: 400 });
    }

    const email = parsed.data.email.trim().toLowerCase();
    const origin = getOrigin(request);
    const supabase = await createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?next=/reset-password`,
    });

    // Never leak whether the address exists (nor whether Supabase throttled the request).
    if (error) {
      console.error("Forgot password: Supabase error:", error.message);
    }

    return NextResponse.json({ message: GENERIC_MESSAGE });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ message: GENERIC_MESSAGE });
  }
}
