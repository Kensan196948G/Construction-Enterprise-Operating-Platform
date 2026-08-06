/**
 * Minimal HMAC-SHA256 (HS256) JWT implementation using only node:crypto.
 *
 * Format: base64url(header) . base64url(payload) . base64url(signature)
 * The signature is computed over the raw HMAC-SHA256 bytes (32 bytes)
 * and compared with timingSafeEqual to resist timing side-channel attacks.
 */

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { Permission } from "../../domain/role.ts";
import {
  createInMemoryRevocationStore,
  type RevocationStore,
} from "../../persistence/sqlite/revocation-store.ts";

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
  /**
   * Backing store for revoked JTIs.
   * Defaults to an in-memory store (revocations lost on process restart).
   * Pass a SQLite-backed store for production deployments where restart
   * resilience is required.
   */
  readonly revocationStore?: RevocationStore;
}

export interface JwtIssuer {
  readonly ttlSeconds: number;
  issue(subject: string, permissions: readonly Permission[]): string;
  verify(token: string): JwtVerifyResult;
  revoke(jti: string): void;
}

const HEADER_B64 = b64urlEncodeStr(JSON.stringify({ alg: "HS256", typ: "JWT" }));

export function createJwtIssuer(config: JwtConfig): JwtIssuer {
  const { secret, ttlSeconds = 3600, revocationStore = createInMemoryRevocationStore() } = config;

  if (Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error("JWT signing secret must be at least 32 bytes");
  }
  if (!Number.isSafeInteger(ttlSeconds) || ttlSeconds <= 0) {
    throw new Error("ttlSeconds must be a positive safe integer");
  }
  if (!Number.isSafeInteger(Math.floor(Date.now() / 1000) + ttlSeconds)) {
    throw new Error("ttlSeconds would overflow Unix timestamp range");
  }

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

  function revoke(jti: string): void {
    // Store the JTI until the token would have expired at most (now + ttlSeconds).
    // In SQLite mode, this survives process restarts.
    revocationStore.revoke(jti, Math.floor(Date.now() / 1000) + ttlSeconds);
  }

  function verify(token: string): JwtVerifyResult {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return { ok: false, reason: "malformed" };
    }
    const [header, payload, sigB64] = parts as [string, string, string];

    // Validate header claims before processing (defense-in-depth against alg confusion).
    let parsedHeader: unknown;
    try {
      parsedHeader = JSON.parse(b64urlDecode(header).toString("utf8"));
    } catch {
      return { ok: false, reason: "malformed" };
    }
    if (
      typeof parsedHeader !== "object" ||
      parsedHeader === null ||
      (parsedHeader as Record<string, unknown>)["alg"] !== "HS256" ||
      (parsedHeader as Record<string, unknown>)["typ"] !== "JWT"
    ) {
      return { ok: false, reason: "invalid" };
    }

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
      (record["iat"] as number) >= (record["exp"] as number) ||
      typeof record["jti"] !== "string"
    ) {
      return { ok: false, reason: "malformed" };
    }

    const now = Math.floor(Date.now() / 1000);

    // Prune expired revocation entries to bound store size.
    revocationStore.prune(now);

    if ((record["exp"] as number) <= now) {
      return { ok: false, reason: "expired" };
    }

    if (revocationStore.isRevoked(record["jti"] as string)) {
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
