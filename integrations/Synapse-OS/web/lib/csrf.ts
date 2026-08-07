/**
 * CSRF same-origin helpers.
 *
 * Extracted from the logout route handler so the same-origin decision can be
 * unit-tested without constructing a full NextRequest. State-changing endpoints
 * use this because SameSite=Lax does not block cross-site POSTs that receive a
 * Set-Cookie response.
 */

/**
 * Decide whether a request is same-origin, given the raw Origin/Referer headers
 * and the server's expected origin.
 *
 * Rules (fail-closed):
 *   - If Origin is present, it must exactly equal `expected`.
 *   - Else if Referer is present, its origin must equal `expected`
 *     (a malformed Referer is rejected).
 *   - If neither header is present, reject — never fail open.
 */
export function isSameOrigin(
  origin: string | null,
  referer: string | null,
  expected: string,
): boolean {
  if (origin) return origin === expected;
  if (referer) {
    try {
      return new URL(referer).origin === expected;
    } catch {
      return false;
    }
  }
  return false;
}
