import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

const EMAIL_OTP_TYPES: EmailOtpType[] = ["signup", "invite", "magiclink", "recovery", "email_change", "email"];

/** Only allow same-site relative paths (prevents open redirects). */
function safeNext(value: string | null): string {
  if (!value) return "/";
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

/**
 * Handles both the PKCE callback (?code=... — Google OAuth, email confirmation,
 * password recovery) and {{ .TokenHash }} email links (?token_hash=...&type=...).
 * `next` is honoured so flows can land on e.g. /reset-password.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNext(searchParams.get("next"));
  const providerError = searchParams.get("error_description") || searchParams.get("error");

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error("Auth callback: code exchange failed:", error.message);
  } else if (tokenHash && type && EMAIL_OTP_TYPES.includes(type)) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error("Auth callback: OTP verification failed:", error.message);
  } else if (providerError) {
    console.error("Auth callback: provider error:", providerError);
  }

  const reason = next.startsWith("/reset-password") ? "reset" : "auth";
  return NextResponse.redirect(`${origin}/login?error=${reason}`);
}
