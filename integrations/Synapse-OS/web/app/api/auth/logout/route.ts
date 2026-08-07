/**
 * POST /api/auth/logout
 *
 * Clears the session cookie. Server-side token revocation is not yet supported
 * (tenant-identity-service has no revocation endpoint — tracked for Sprint 9);
 * the JWT remains valid until expiry, but the access window is bounded by the
 * short cookie lifetime in `cookieOptions`.
 *
 * Treated as a state-changing endpoint and gated by a same-origin check so a
 * cross-site form POST cannot force-log users out (SameSite=Lax does not block
 * cross-site POSTs that receive Set-Cookie responses).
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";
import { isSameOrigin } from "@/lib/csrf";

function isSameOriginRequest(request: NextRequest): boolean {
  return isSameOrigin(
    request.headers.get("origin"),
    request.headers.get("referer"),
    request.nextUrl.origin,
  );
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "cross-site request rejected" },
      { status: 403 },
    );
  }

  const response = NextResponse.json({ ok: true }, { status: 200 });
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
