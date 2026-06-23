/**
 * URL safety helpers.
 *
 * Extracted from the login page so the open-redirect defense can be unit-tested
 * in isolation (the `next` query param is attacker-controlled — see middleware).
 */

/**
 * Only accept same-origin relative paths to prevent open redirect.
 *
 * Rejects (returns "/"):
 *   - null / empty
 *   - absolute URLs ("https://evil.com", "javascript:...") — anything not starting with "/"
 *   - protocol-relative ("//evil.com") and back-slash tricks ("/\\evil.com")
 * Accepts: same-origin relative paths beginning with a single "/".
 */
export function safeNextPath(raw: string | null): string {
  if (!raw) return "/";
  if (!raw.startsWith("/")) return "/";
  if (raw.startsWith("//") || raw.startsWith("/\\")) return "/";
  return raw;
}
