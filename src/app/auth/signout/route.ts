import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

async function signOut(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/login", request.url));
}

/**
 * Logout hanya lewat POST (tombol/form). GET tidak boleh memutus sesi:
 * bot, prefetch, dan tap yang meleset bisa menembak URL ini tanpa sengaja —
 * sesi user langsung mati dan semua halaman auth melempar ke /login.
 */
export async function GET(request: NextRequest) {
  return NextResponse.redirect(new URL("/login", request.url));
}

export async function POST(request: NextRequest) {
  return signOut(request);
}
