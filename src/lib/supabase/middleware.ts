import type { User } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export interface SessionRefreshResult {
  /**
   * Response dengan Set-Cookie hasil refresh sesi (kalau Supabase memutasi
   * cookie). Panggil yang memutuskan untuk redirect harus menyalin cookie
   * dari response ini supaya sesi baru tidak hilang.
   */
  response: NextResponse;
  /** User yang sudah terautentikasi, atau null kalau belum login/gagal refresh. */
  user: User | null;
}

/**
 * Refresh sesi Supabase di middleware/proxy.
 *
 * Kalau konfigurasi Supabase belum lengkap (mis. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
 * masih kosong) atau jaringan ke Supabase gagal, middleware TIDAK boleh
 * menumbangkan seluruh situs: kita cukup lewati refresh sesi dan lanjut.
 */
export async function updateSession(
  request: NextRequest
): Promise<SessionRefreshResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    warnOnce(
      "Supabase belum dikonfigurasi (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY kosong) — refresh sesi dilewati."
    );
    return { response: NextResponse.next({ request }), user: null };
  }

  let supabaseResponse = NextResponse.next({ request });
  let user: User | null = null;

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    // getUser() memvalidasi token ke server Supabase; kalau token tidak valid,
    // error terisi dan data.user tetap null — dihitung sebagai belum login.
    const { data, error } = await supabase.auth.getUser();
    if (!error) {
      user = data.user;
    }
  } catch (error) {
    warnOnce(
      `Gagal refresh sesi Supabase (${error instanceof Error ? error.message : "unknown"}). Permintaan diteruskan tanpa sesi baru.`
    );
  }

  return { response: supabaseResponse, user };
}

let warned = false;

function warnOnce(message: string) {
  if (warned) return;
  warned = true;
  console.warn(`[middleware] ${message}`);
}
