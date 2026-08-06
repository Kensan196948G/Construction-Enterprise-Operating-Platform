/**
 * API key authentication middleware.
 *
 * Credentials travel as `keyId:secret` in the Authorization header
 * (`Bearer keyId:secret`).  The secret is never stored in plaintext:
 * only its HMAC-SHA256 (keyed on the keyId) is persisted, so a
 * compromised key store does not reveal the original secrets.
 */

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { err, ok } from "../../domain/common.ts";
import type { Result } from "../../domain/common.ts";
import type { Permission } from "../../domain/role.ts";
import type { ApiKeyContext, ApiKeyRecord, ApiKeyStore } from "../types.ts";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Derive the stored hash for a given (keyId, secret) pair.
 * Using the keyId as the HMAC key prevents cross-key collision attacks.
 */
function computeSecretHash(keyId: string, secret: string): string {
  return createHmac("sha256", keyId).update(secret).digest("hex");
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate a fresh API key credential, register it in `store`, and return
 * the one-time plaintext credentials that the caller must deliver securely.
 *
 * @returns `{ key, secret }` — the client sends `key:secret` as its Bearer token.
 */
export function createApiKey(
  subject: string,
  permissions: readonly Permission[],
  store: ApiKeyStore,
): { key: string; secret: string } {
  const keyId = randomBytes(16).toString("hex");
  const secret = randomBytes(32).toString("hex");
  const secretHash = computeSecretHash(keyId, secret);

  const record: ApiKeyRecord = { keyId, subject, permissions: [...permissions], secretHash };
  store.set(keyId, record);

  return { key: keyId, secret };
}

/**
 * Validate an API credential in `keyId:secret` format.
 *
 * Returns an {@link ApiKeyContext} on success, or a list of
 * {@link ValidationIssue}-compatible errors on failure.
 */
export function validateApiKey(
  credential: string,
  store: ApiKeyStore,
): Result<ApiKeyContext> {
  const colonIdx = credential.indexOf(":");
  if (colonIdx === -1) {
    return err([
      { path: "credential", message: "invalid API key format: expected keyId:secret" },
    ]);
  }

  const keyId = credential.slice(0, colonIdx);
  const secret = credential.slice(colonIdx + 1);

  if (keyId.length === 0 || secret.length === 0) {
    return err([
      { path: "credential", message: "keyId and secret must both be non-empty" },
    ]);
  }

  const record = store.get(keyId);
  if (record === undefined) {
    // Unified message prevents keyId enumeration via distinct error responses.
    return err([{ path: "credential", message: "invalid credentials" }]);
  }

  const expectedHash = computeSecretHash(keyId, secret);
  // Constant-time comparison prevents timing side-channel attacks on the stored hash.
  const expectedBuf = Buffer.from(expectedHash, "hex");
  const storedBuf = Buffer.from(record.secretHash, "hex");
  const hashesMatch =
    expectedBuf.length === storedBuf.length && timingSafeEqual(expectedBuf, storedBuf);
  if (!hashesMatch) {
    return err([{ path: "credential", message: "invalid credentials" }]);
  }

  return ok({
    keyId: record.keyId,
    subject: record.subject,
    permissions: [...record.permissions],
    authKind: "apikey",
  });
}
