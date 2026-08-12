/**
 * Integration tests for the audit integrity verification endpoint.
 *
 * The endpoint exists so monitoring can prove the tamper-evident chain is
 * intact on a schedule. Three properties are pinned here: a valid chain is
 * reported as such and records its own check, a tampered chain is reported
 * with the first broken sequence and still appends the failure, and callers
 * without `audit:read` are rejected.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import { DatabaseSync } from "node:sqlite";

import { createServer } from "../server.ts";
import { createApiKey } from "../middleware/auth.ts";
import { createJwtIssuer, generateJwtSecret } from "../middleware/jwt.ts";
import { createInMemoryRepositories } from "../../persistence/in-memory/index.ts";
import { AuditLog, type IAuditLog } from "../../governance/audit-log.ts";
import { SqliteAuditLog } from "../../governance/sqlite-audit-log.ts";
import { createAuditEvent } from "../../domain/audit-event.ts";
import type { Repositories } from "../../persistence/ports.ts";
import type { IsoTimestamp } from "../../domain/common.ts";
import type { Permission } from "../../domain/role.ts";
import type { ApiKeyStore, AppContainer } from "../types.ts";

const VERIFY_PATH = "/api/v1/governance/audit/verify";

interface Harness {
  baseUrl: string;
  adminCred: string;
  readerCred: string;
  noAuditCred: string;
  close(): Promise<void>;
}

function appendEvent(auditLog: IAuditLog, actor: string, action: string): void {
  const result = createAuditEvent({
    id: `${action}-${actor}-${Date.now()}-${Math.random()}`,
    at: new Date().toISOString() as IsoTimestamp,
    actor,
    action,
    resource: "test",
    outcome: "success",
    metadata: {},
  });
  assert.ok(result.ok, "audit event factory should succeed");
  auditLog.append(result.value);
}

async function buildHarness(auditLog: IAuditLog): Promise<Harness> {
  const apiKeyStore: ApiKeyStore = new Map();
  const repositories: Repositories = createInMemoryRepositories();
  const admin = createApiKey("admin", ["*:*"] as Permission[], apiKeyStore);
  const reader = createApiKey("reader", ["audit:read", "user:read"] as Permission[], apiKeyStore);
  const noAudit = createApiKey("no-audit", ["user:read"] as Permission[], apiKeyStore);

  const container: AppContainer = {
    repositories,
    auditLog,
    apiKeyStore,
    jwtIssuer: createJwtIssuer({ secret: generateJwtSecret() }),
  };
  const server = createServer({ port: 0 }, container);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    adminCred: `${admin.key}:${admin.secret}`,
    readerCred: `${reader.key}:${reader.secret}`,
    noAuditCred: `${noAudit.key}:${noAudit.secret}`,
    close: () =>
      new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve()))),
  };
}

async function getVerify(
  baseUrl: string,
  cred: string,
): Promise<{ status: number; headers: Headers; body: { valid?: boolean; brokenAt?: number } }> {
  const res = await fetch(`${baseUrl}${VERIFY_PATH}`, {
    headers: { Authorization: `Bearer ${cred}` },
  });
  return {
    status: res.status,
    headers: res.headers,
    body: (await res.json().catch(() => null)) as { valid?: boolean; brokenAt?: number },
  };
}

test("audit/verify reports a valid chain and records the check itself", async () => {
  const auditLog = new AuditLog();
  appendEvent(auditLog, "user-a", "governance:evaluate");
  appendEvent(auditLog, "user-b", "user:create");
  const harness = await buildHarness(auditLog);
  try {
    const result = await getVerify(harness.baseUrl, harness.adminCred);
    assert.equal(result.status, 200);
    assert.equal(result.body.valid, true);
    assert.equal(result.headers.get("X-CEOP-Audit-Valid"), "true");

    // The check itself was recorded (chain grew by one).
    const verifyEvents = auditLog.entries.filter(
      (e) => e.event.action === "audit:verify" && e.event.outcome === "success",
    );
    assert.equal(verifyEvents.length, 1);
    assert.equal(auditLog.verify().valid, true);
  } finally {
    await harness.close();
  }
});

test("audit/verify detects a tampered chain and records the failure", async () => {
  const dir = mkdtempSync(join(tmpdir(), "ceop-audit-verify-"));
  const dbPath = join(dir, "audit.db");
  try {
    const auditLog = new SqliteAuditLog(dbPath);
    appendEvent(auditLog, "user-a", "governance:evaluate");
    appendEvent(auditLog, "user-b", "user:create");
    const before = auditLog.size;

    // Tamper with an indexed column directly — exactly what the chain is
    // designed to detect even though the JSON blob is unchanged.
    const db = new DatabaseSync(dbPath);
    db.prepare("UPDATE audit_log SET actor = 'attacker' WHERE sequence = 0").run();
    db.close();

    const harness = await buildHarness(auditLog);
    try {
      const result = await getVerify(harness.baseUrl, harness.readerCred);
      assert.equal(result.status, 200);
      assert.equal(result.body.valid, false);
      assert.equal(result.body.brokenAt, 0);
      assert.equal(result.headers.get("X-CEOP-Audit-Valid"), "false");
      // The failure event itself was appended after the broken entry, so the
      // recorded chain has one more entry and still reports the break.
      assert.equal(auditLog.size, before + 1);
      assert.equal(auditLog.verify().valid, false);
    } finally {
      await harness.close();
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("audit/verify rejects callers without audit:read", async () => {
  const harness = await buildHarness(new AuditLog());
  try {
    const result = await getVerify(harness.baseUrl, harness.noAuditCred);
    assert.equal(result.status, 403);
    assert.equal(result.body.valid, undefined);
    assert.equal(result.headers.get("X-CEOP-Audit-Valid"), null);
  } finally {
    await harness.close();
  }
});
