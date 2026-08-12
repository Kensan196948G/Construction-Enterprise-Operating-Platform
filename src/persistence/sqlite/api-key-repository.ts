/**
 * SQLite-backed API key management (SEC-013).
 *
 * API keys are provisioned by `scripts/provision-api-key.ts` into the
 * `api_keys` table and loaded into the runtime store at boot. This repository
 * gives the HTTP layer the same management surface the CLI has — listing and
 * revoking keys — so operators can rotate credentials without restarting the
 * service or touching the database directly.
 *
 * The raw secret is never stored: only its HMAC-SHA256 hash exists in the
 * database, and this repository never exposes it. Revocation is a hard delete
 * (the audit trail records when and by whom it happened).
 */

import type { Permission } from "../../domain/role.ts";
import { openDatabase } from "./base-sqlite-repository.ts";

/** Key metadata safe to return through the API. */
export interface ApiKeyInfo {
  readonly keyId: string;
  readonly subject: string;
  readonly permissions: readonly Permission[];
  readonly organizationId?: string;
  readonly createdAt?: string;
}

/** Persistence contract for API key management. */
export interface ApiKeyRepository {
  /** All provisioned keys, newest first. */
  list(): readonly ApiKeyInfo[];
  /** Remove a key by id; returns true when a row was deleted. */
  delete(keyId: string): boolean;
}

interface ApiKeyRow {
  readonly key_id: string;
  readonly subject: string;
  readonly permissions: string;
  readonly organization_id?: string | null;
  readonly created_at?: string | null;
}

/** Open a repository backed by the production `api_keys` table. */
export function createSqliteApiKeyRepository(dbPath: string): ApiKeyRepository {
  const db = openDatabase(dbPath);

  return {
    list(): readonly ApiKeyInfo[] {
      const stmt = db.prepare(
        "SELECT key_id, subject, permissions, organization_id, created_at " +
          "FROM api_keys ORDER BY created_at DESC, key_id ASC",
      );
      const rows = stmt.all() as unknown as ApiKeyRow[];
      return rows.map((row) => ({
        keyId: row.key_id,
        subject: row.subject,
        permissions: JSON.parse(row.permissions) as readonly Permission[],
        ...(row.organization_id !== undefined && row.organization_id !== null
          ? { organizationId: row.organization_id }
          : {}),
        ...(row.created_at !== undefined && row.created_at !== null
          ? { createdAt: row.created_at }
          : {}),
      }));
    },

    delete(keyId: string): boolean {
      const result = db.prepare("DELETE FROM api_keys WHERE key_id = ?").run(keyId);
      return Number((result as { changes?: number }).changes ?? 0) > 0;
    },
  };
}
