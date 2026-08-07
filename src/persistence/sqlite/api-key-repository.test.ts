/**
 * Integration tests for the SQLite API key repository (SEC-013).
 *
 * The repository is the persistent half of the key management API: it lists
 * key metadata (never the secret hash) and revokes keys by hard delete.
 * Tests use a migrated temp-file database so the real `api_keys` schema
 * (migration 002 + 005) is exercised.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { openDatabase } from "./base-sqlite-repository.ts";
import { createSqliteApiKeyRepository } from "./api-key-repository.ts";
import { applyMigrations } from "../../../scripts/migrate.ts";

async function makeMigratedDb(): Promise<{
  dbPath: string;
  cleanup: () => Promise<void>;
}> {
  const dir = await mkdtemp(join(tmpdir(), "ceop-api-key-repo-"));
  const dbPath = join(dir, "test.db");
  const db = openDatabase(dbPath);
  applyMigrations(db);
  db.close();
  return { dbPath, cleanup: () => rm(dir, { recursive: true, force: true }) };
}

test("api-key-repository: lists key metadata newest-first without the secret hash", async () => {
  const { dbPath, cleanup } = await makeMigratedDb();
  try {
    const db = openDatabase(dbPath);
    const insert = db.prepare(
      "INSERT INTO api_keys (key_id, subject, permissions, secret_hash, created_at, organization_id) " +
        "VALUES (?, ?, ?, ?, ?, ?)",
    );
    insert.run("key-1", "alice", JSON.stringify(["application:read"]), "never-shown", "2026-08-07T00:00:00Z", null);
    insert.run("key-2", "bob", JSON.stringify(["device:read", "device:write"]), "never-shown", "2026-08-07T01:00:00Z", "org-a");
    db.close();

    const repo = createSqliteApiKeyRepository(dbPath);
    const keys = repo.list();
    assert.equal(keys.length, 2);
    // Newest first (created_at DESC).
    assert.deepEqual(
      keys.map((k) => k.keyId),
      ["key-2", "key-1"],
    );
    assert.equal(keys[0]?.organizationId, "org-a");
    const serialized = JSON.stringify(keys);
    assert.doesNotMatch(serialized, /secret|hash/i, "secret hashes must never leave the repository");
    assert.ok(keys.every((k) => k.createdAt !== undefined));
  } finally {
    await cleanup();
  }
});

test("api-key-repository: delete removes the row and reports missing keys", async () => {
  const { dbPath, cleanup } = await makeMigratedDb();
  try {
    const db = openDatabase(dbPath);
    db.prepare(
      "INSERT INTO api_keys (key_id, subject, permissions, secret_hash, created_at, organization_id) " +
        "VALUES ('key-1', 'alice', '[]', 'h', '2026-08-07T00:00:00Z', NULL)",
    ).run();
    db.close();

    const repo = createSqliteApiKeyRepository(dbPath);
    assert.equal(repo.delete("key-1"), true);
    assert.equal(repo.delete("key-1"), false, "second delete must report not found");
    assert.equal(repo.list().length, 0);
  } finally {
    await cleanup();
  }
});
