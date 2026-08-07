/**
 * Route access classification for the auth middleware.
 *
 * Extracted from middleware.ts so the "which paths skip authentication" logic
 * — security-critical, because a mistake here is an auth bypass — can be
 * unit-tested independently of the Edge runtime.
 */

/** Paths that do NOT require authentication. */
export const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/auth/logout"];

/**
 * Framework/asset paths that bypass the auth gate entirely (no pathname header).
 * Kept deliberately narrow — only static assets and the health probe.
 */
export function isExemptPath(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/api/health")
  );
}

/** Public (unauthenticated) application paths — login + auth endpoints. */
export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}
