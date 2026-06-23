/**
 * POST /api/auth/login
 * Proxies credentials to the tenant-identity-service, then sets an httpOnly
 * session cookie containing the JWT access token.
 */
import { NextResponse } from "next/server";
import { SESSION_COOKIE, cookieOptions } from "@/lib/session";
import { AUTH_API } from "@/lib/api";

export async function POST(request: Request) {
  let username: string;
  let password: string;

  try {
    const body = await request.json();
    username = body.username ?? "";
    password = body.password ?? "";
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  if (!username || !password) {
    return NextResponse.json(
      { error: "username and password are required" },
      { status: 400 },
    );
  }

  // Forward as form data — the auth service expects OAuth2PasswordRequestForm
  const form = new URLSearchParams({ username, password });

  let tokenRes: Response;
  try {
    tokenRes = await fetch(`${AUTH_API}/auth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });
  } catch {
    return NextResponse.json(
      { error: "Auth service unreachable" },
      { status: 503 },
    );
  }

  if (!tokenRes.ok) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const { access_token } = (await tokenRes.json()) as {
    access_token: string;
    token_type: string;
  };

  // Fetch user info to include in the response (but token is stored in the cookie)
  let userInfo: { username: string; tenant_id: string; role: string } | null =
    null;
  try {
    const meRes = await fetch(`${AUTH_API}/auth/me`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (meRes.ok) {
      userInfo = await meRes.json();
    }
  } catch {
    // Non-critical — token is valid even if /auth/me fails here
  }

  const response = NextResponse.json(
    { ok: true, user: userInfo },
    { status: 200 },
  );
  response.cookies.set(SESSION_COOKIE, access_token, cookieOptions);
  return response;
}
