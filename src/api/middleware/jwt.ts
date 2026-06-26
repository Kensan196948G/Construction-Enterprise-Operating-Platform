/**
 * Minimal HMAC-SHA256 (HS256) JWT implementation using only node:crypto.
 *
 * Format: base64url(header) . base64url(payload) . base64url(signature)
 * The signature is computed over the raw HMAC-SHA256 bytes (32 bytes)
 * and compared with timingSafeEqual to resist timing side-channel attacks.
 */

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { Permission } from "../../domain/role.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Claims stored inside a JWT. */
export interface JwtPayload {
  readonly sub: string;
  readonly permissions: readonly string[];
  readonly iat: number;
  readonly exp: number;
  /** Unique token id — prevents log-level replay tracking confusion. */
  readonly jti: string;
}

/** Resolved identity from a valid JWT, matching the shape of ApiKeyContext. */
export interface JwtContext {
  readonly subject: string;
  readonly permissions: readonly Permission[];
}

export type JwtVerifyResult =
  | { readonly ok: true; readonly payload: JwtPayload }
  | { readonly ok: false; readonly reason: "expired" | "invalid" | "malformed" };

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function b64urlEncode(buf: Buffer): string {
  return buf.toString("base64url");
}

function b64urlEncodeStr(s: string): string {
  return b64urlEncode(Buffer.from(s, "utf8"));
}

function b64urlDecode(s: string): Buffer {
  return Buffer.from(s, "base64url");
}

/** Produce the raw 32-byte HMAC-SHA256 over "header.payload". */
function hmacRaw(header: string, payload: string, secret: string): Buffer {
  return createHmac("sha256", secret).update(`${header}.${payload}`).digest();
}

// ---------------------------------------------------------------------------
// Issuer factory
// ---------------------------------------------------------------------------

export interface JwtConfig {
  /** Signing secret — must be at least 32 random bytes. */
  readonly secret: string;
  /** Token lifetime in seconds (default: 3600). */
  readonly ttlSeconds?: number;
}

export interface JwtIssuer {
  readonly ttlSeconds: number;
  issue(subject: string, permissions: readonly Permission[]): string;
  verify(token: string): JwtVerifyResult;
  revoke(jti: string): void;
}

const HEADER_B64 = b64urlEncodeStr(JSON.stringify({ alg: "HS256", typ: "JWT" }));

export function createJwtIssuer(config: JwtConfig): JwtIssuer {
  const { secret, ttlSeconds = 3600 } = config;

  if (Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error("JWT signing secret must be at least 32 bytes");
  }

  // jti → Unix second at which the revocation entry can be pruned.
  // We store jti values for tokens that should be blocked before their natural expiry.
  const revokedJtis = new Map<string, number>();

  function issue(subject: string, permissions: readonly Permission[]): string {
    const now = Math.floor(Date.now() / 1000);
    const payload = b64urlEncodeStr(
      JSON.stringify({
        sub: subject,
        permissions: [...permissions],
        iat: now,
        exp: now + ttlSeconds,
        jti: randomBytes(16).toString("hex"),
      } satisfies JwtPayload),
    );
    const sigBuf = hmacRaw(HEADER_B64, payload, secret);
    return `${HEADER_B64}.${payload}.${b64urlEncode(sigBuf)}`;
  }

  // NOTE: Revocation state is in-memory only — revoked tokens become valid
  // again after a process restart or across multiple nodes. For multi-node
  // or persistence-required deployments, persist revoked JTIs to a shared
  // store (e.g. the SQLite api_keys-adjacent table) or rely on short TTLs
  // (≤ 15 min) combined with token rotation instead of explicit revocation.
  function revoke(jti: string): void {
    // Store until the token would have expired at most (now + ttlSeconds).
    revokedJtis.set(jti, Math.floor(Date.now() / 1000) + ttlSeconds);
  }

  function verify(token: string): JwtVerifyResult {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return { ok: false, reason: "malformed" };
    }
    const [header, payload, sigB64] = parts as [string, string, string];

    // Constant-time HMAC comparison on raw 32-byte buffers.
    const expected = hmacRaw(header, payload, secret);
    const actual = b64urlDecode(sigB64);
    const sigOk =
      expected.length === actual.length && timingSafeEqual(expected, actual);
    if (!sigOk) {
      return { ok: false, reason: "invalid" };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(b64urlDecode(payload).toString("utf8"));
    } catch {
      return { ok: false, reason: "malformed" };
    }

    if (typeof parsed !== "object" || parsed === null) {
      return { ok: false, reason: "malformed" };
    }
    const record = parsed as Record<string, unknown>;
    if (
      typeof record["sub"] !== "string" ||
      !Array.isArray(record["permissions"]) ||
      !(record["permissions"] as unknown[]).every((p) => typeof p === "string") ||
      !Number.isSafeInteger(record["iat"]) ||
      !Number.isSafeInteger(record["exp"]) ||
      typeof record["jti"] !== "string"
    ) {
      return { ok: false, reason: "malformed" };
    }

    const now = Math.floor(Date.now() / 1000);

    // Prune expired revocation entries to bound memory use.
    for (const [id, prunableAt] of revokedJtis) {
      if (prunableAt <= now) revokedJtis.delete(id);
    }

    if ((record["exp"] as number) <= now) {
      return { ok: false, reason: "expired" };
    }

    if (revokedJtis.has(record["jti"] as string)) {
      return { ok: false, reason: "invalid" };
    }

    return { ok: true, payload: parsed as JwtPayload };
  }

  return { ttlSeconds, issue, revoke, verify };
}

/** Generate a cryptographically random secret suitable for JWT signing. */
export function generateJwtSecret(): string {
  return randomBytes(48).toString("hex");
}
