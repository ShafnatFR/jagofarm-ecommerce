import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect admin routes
  if (pathname.startsWith("/admin")) {
    // We'll check auth in the admin layout via session
    // This middleware just adds headers for now
    const response = NextResponse.next();
    response.headers.set("x-pathname", pathname);
    return response;
  }

  // Protect account/orders routes
  if (pathname.startsWith("/account") || pathname.startsWith("/orders")) {
    const response = NextResponse.next();
    response.headers.set("x-pathname", pathname);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*", "/orders/:path*"],
};
