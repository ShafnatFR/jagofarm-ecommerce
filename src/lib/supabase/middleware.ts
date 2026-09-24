import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refresh sesi Supabase di edge middleware.
 *
 * Kalau konfigurasi Supabase belum lengkap (mis. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
 * masih kosong) atau jaringan ke Supabase gagal, middleware TIDAK boleh
 * menumbangkan seluruh situs: kita cukup lewati refresh sesi dan lanjut.
 */
export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    warnOnce(
      "Supabase belum dikonfigurasi (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY kosong) — refresh sesi dilewati."
    );
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

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

    await supabase.auth.getUser();
  } catch (error) {
    warnOnce(
      `Gagal refresh sesi Supabase (${error instanceof Error ? error.message : "unknown"}). Permintaan diteruskan tanpa sesi baru.`
    );
  }

  return supabaseResponse;
}

let warned = false;

function warnOnce(message: string) {
  if (warned) return;
  warned = true;
  console.warn(`[middleware] ${message}`);
}
