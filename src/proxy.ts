import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { consume, getClientIp, resolveRule } from "@/lib/rate-limit";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /*
   * Rate limiting sederhana untuk endpoint /api/* (lihat src/lib/rate-limit.ts
   * untuk batasan implementasinya). Halaman biasa tidak dibatasi.
   */
  if (pathname.startsWith("/api/")) {
    const match = resolveRule(pathname);

    if (match) {
      const ip = getClientIp(request.headers);
      const result = consume(`${ip}:${match.pattern}`, match.rule);

      if (!result.allowed) {
        return NextResponse.json(
          {
            error:
              "Terlalu banyak permintaan. Silakan coba lagi beberapa saat lagi.",
          },
          {
            status: 429,
            headers: {
              "Retry-After": String(result.retryAfterSeconds),
              "X-RateLimit-Limit": String(result.limit),
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": String(result.resetAt),
            },
          }
        );
      }

      const { response } = await withSession(request);
      response.headers.set("X-RateLimit-Limit", String(result.limit));
      response.headers.set("X-RateLimit-Remaining", String(result.remaining));
      return response;
    }
  }

  /*
   * Halaman /admin/* wajib punya user yang sudah login (defense-in-depth
   * server-side; halaman sebelumnya hanya dijaga client-side). Pengecekan role
   * TIDAK dilakukan di sini karena butuh lookup DB — role tetap ditangani oleh
   * src/app/admin/layout.tsx (client) dan setiap route /api/admin/*
   * (server). Endpoint /api/admin/* sengaja tidak ikut cabang ini: request-nya
   * masuk lewat cabang /api/ di atas yang sudah cek role per-route.
   */
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return await withAdminSession(request);
  }

  return (await withSession(request)).response;
}

/**
 * Middleware tidak boleh menumbangkan seluruh situs: kalau refresh sesi gagal,
 * teruskan permintaan tanpa sesi baru.
 */
async function withSession(request: NextRequest) {
  try {
    return await updateSession(request);
  } catch (error) {
    console.error(
      "[middleware] updateSession gagal:",
      error instanceof Error ? error.message : error
    );
    return { response: NextResponse.next({ request }), user: null };
  }
}

/**
 * Halaman /admin/*: butuh sesi login.
 *
 * - Sudah login -> lewatkan, lengkap dengan Set-Cookie hasil refresh sesi.
 * - Belum login (atau refresh sesi gagal) -> redirect 307 ke
 *   /login?next=<pathname>. Redirect dibuat dari response refresh supaya
 *   cookie sesi baru (mis. refresh token yang dirotasi) tidak hilang: kalau
 *   Set-Cookie-nya dibuang, sesi yang sudah di-refresh langsung putus lagi.
 */
async function withAdminSession(request: NextRequest) {
  const { response, user } = await withSession(request);

  if (user) {
    return response;
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", request.nextUrl.pathname);
  const redirect = NextResponse.redirect(loginUrl);

  // Salin Set-Cookie hasil refresh sesi ke response redirect.
  for (const cookie of response.cookies.getAll()) {
    redirect.cookies.set(cookie);
  }

  return redirect;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
