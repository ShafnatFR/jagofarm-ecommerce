import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { consume, getClientIp, resolveRule } from "@/lib/rate-limit";

export async function middleware(request: NextRequest) {
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

      const response = await withSession(request);
      response.headers.set("X-RateLimit-Limit", String(result.limit));
      response.headers.set("X-RateLimit-Remaining", String(result.remaining));
      return response;
    }
  }

  return await withSession(request);
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
    return NextResponse.next({ request });
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
