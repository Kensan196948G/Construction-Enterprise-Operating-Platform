/**
 * Next.js Edge Middleware — primary auth gate for the app.
 *
 * A request is considered authenticated only when the session cookie carries a
 * JWT whose signature AND expiry verify against the shared secret. Presence of
 * the cookie alone is NOT enough — a forged or expired token is treated the
 * same as no token at all and is redirected to /login.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifyToken } from "@/lib/session";
import { isExemptPath, isPublicPath } from "@/lib/route-access";

/** Forward the request pathname so Server Components can read it via headers(). */
function withPathnameHeader(
  response: NextResponse,
  pathname: string,
): NextResponse {
  response.headers.set("x-pathname", pathname);
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isExemptPath(pathname)) {
    return NextResponse.next();
  }

  if (isPublicPath(pathname)) {
    return withPathnameHeader(NextResponse.next(), pathname);
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const payload = await verifyToken(token);

  if (!payload) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    const response = NextResponse.redirect(loginUrl);
    // Drop the bad cookie so the next request doesn't loop on the same forged value.
    if (token) {
      response.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
    }
    return response;
  }

  return withPathnameHeader(NextResponse.next(), pathname);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files.
     * Note: /_next/static, /_next/image, /favicon.ico are excluded above in the handler.
     */
    "/((?!_next/static|_next/image|favicon\\.ico).*)",
  ],
};
