/**
 * Session utilities — read & verify the JWT access_token stored as an httpOnly cookie.
 *
 * Verification of the signature/expiry is done both in middleware (edge) and in
 * server components (via the /auth/me round-trip). Cookie presence alone is NOT
 * sufficient to consider a request authenticated.
 */
import { cookies } from "next/headers";
import { jwtVerify, type JWTPayload } from "jose";

/** Name of the session cookie that stores the Bearer token. */
export const SESSION_COOKIE = "synapse_session";

/** JWT signing algorithm — must match tenant-identity-service/auth.py ALGORITHM. */
const JWT_ALGORITHM = "HS256";

/**
 * JWT secret. Must match `JWT_SECRET` on the auth service.
 * The dev default is intentionally identical to the service-side default so a
 * local stack works out-of-the-box, but production deployments MUST override it.
 */
const JWT_SECRET =
  process.env.JWT_SECRET ?? "synapse-dev-secret-change-in-production";

const SECRET_KEY = new TextEncoder().encode(JWT_SECRET);

/**
 * Return the access token from the session cookie, or null if absent.
 * Safe to call from Server Components and Route Handlers.
 *
 * NOTE: presence of a token does not imply validity — call `verifyToken()` or
 * round-trip through /auth/me before trusting the caller.
 */
export async function getToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}

/**
 * Verify a JWT's signature and expiry against the shared secret.
 * Edge-runtime compatible (uses jose / Web Crypto).
 *
 * Returns the decoded payload on success, or null when the token is missing,
 * malformed, expired, or has an invalid signature. Never throws.
 */
export async function verifyToken(
  token: string | null | undefined,
): Promise<JWTPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY, {
      algorithms: [JWT_ALGORITHM],
    });
    return payload;
  } catch {
    return null;
  }
}

/**
 * Cookie options shared between login and logout handlers.
 *
 * `maxAge` is kept short (15 min) to bound the replay window for a stolen
 * cookie — logout deletes the cookie but cannot revoke the JWT itself
 * (tenant-identity-service has no revocation endpoint yet, tracked for Sprint 9).
 */
// COOKIE_SECURE=true  → HTTPS-only (production with TLS)
// COOKIE_SECURE=false or unset → allow HTTP (Docker HTTP dev / local demo)
// Deliberately NOT using NODE_ENV because Next.js inlines NODE_ENV at build
// time, which would permanently bake in `secure:true` for production Docker
// builds even when accessed over plain HTTP.
// SameSite=Strict: cookie is NOT sent on cross-site navigations (including links
// from email or external sites). Users following external links are redirected to
// /login and then back — acceptable for an internal enterprise tool. Prevents
// CSRF on top-level navigation attacks that SameSite=Lax does not block.
export const cookieOptions = {
  httpOnly: true,
  secure: process.env.COOKIE_SECURE === "true",
  sameSite: "strict" as const,
  path: "/",
  maxAge: 15 * 60,
};
