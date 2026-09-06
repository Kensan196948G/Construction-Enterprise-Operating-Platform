/**
 * Integration tests for audit-event archival endpoints (issue #83).
 *
 * Covers the batch archive endpoint (`POST /audit/archive`) and the
 * `archived` query parameter on the existing audit list endpoint, plus the
 * property that matters most: the hash chain stays verifiable after an
 * archive run.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";

import { createServer } from "../server.ts";
import { createApiKey } from "../middleware/auth.ts";
import { createJwtIssuer, generateJwtSecret } from "../middleware/jwt.ts";
import { createInMemoryRepositories } from "../../persistence/in-memory/index.ts";
import { AuditLog, type IAuditLog } from "../../governance/audit-log.ts";
import { InMemoryAuditArchiveStore } from "../../governance/audit-archive.ts";
import { createAuditEvent } from "../../domain/audit-event.ts";
import type { Repositories } from "../../persistence/ports.ts";
import type { IsoTimestamp } from "../../domain/common.ts";
import type { Permission } from "../../domain/role.ts";
import type { ApiKeyStore, AppContainer } from "../types.ts";

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function appendEvent(auditLog: IAuditLog, id: string, at: string, actor = "seed"): void {
  const result = createAuditEvent({
    id,
    at: at as IsoTimestamp,
    actor,
    action: "read",
    resource: "application",
    outcome: "success",
  });
  assert.ok(result.ok, "audit event factory should succeed");
  auditLog.append(result.value);
}

interface Harness {
  baseUrl: string;
  auditLog: IAuditLog;
  archiverCred: string;
  orgScopedArchiverCred: string;
  readOnlyCred: string;
  adminCred: string;
  close(): Promise<void>;
}

async function buildHarness(includeArchiveStore = true): Promise<Harness> {
  const apiKeyStore: ApiKeyStore = new Map();
  const repositories: Repositories = createInMemoryRepositories();
  const auditLog = new AuditLog();

  const archiver = createApiKey(
    "archiver",
    ["audit:read", "audit:archive"] as Permission[],
    apiKeyStore,
  );
  const orgScopedArchiver = createApiKey(
    "org-archiver",
    ["audit:read", "audit:archive"] as Permission[],
    apiKeyStore,
    "org-a",
  );
  const readOnly = createApiKey("reader", ["audit:read"] as Permission[], apiKeyStore);
  const admin = createApiKey("admin", ["*:*"] as Permission[], apiKeyStore);

  const container: AppContainer = {
    repositories,
    auditLog,
    apiKeyStore,
    jwtIssuer: createJwtIssuer({ secret: generateJwtSecret() }),
    ...(includeArchiveStore ? { auditArchive: new InMemoryAuditArchiveStore() } : {}),
  };
  const server = createServer({ port: 0 }, container);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    auditLog,
    archiverCred: `${archiver.key}:${archiver.secret}`,
    orgScopedArchiverCred: `${orgScopedArchiver.key}:${orgScopedArchiver.secret}`,
    readOnlyCred: `${readOnly.key}:${readOnly.secret}`,
    adminCred: `${admin.key}:${admin.secret}`,
    close: () =>
      new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve()))),
  };
}

async function req(
  method: string,
  baseUrl: string,
  path: string,
  cred: string,
  body?: unknown,
): Promise<{ status: number; body: unknown }> {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${cred}` },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  return { status: res.status, body: await res.json().catch(() => null) };
}

interface ArchiveResultBody {
  readonly archivedCount: number;
  readonly archivedSequences: readonly number[];
  readonly totalArchived: number;
  readonly cutoff: string;
  readonly retentionDays: number;
}

interface AuditEntryShape {
  readonly event: { readonly id: string };
  readonly archived: boolean;
  readonly archivedAt?: string;
}

interface AuditListBody {
  readonly entries: readonly AuditEntryShape[];
  readonly total: number;
}

test("audit/archive: rejects callers without audit:archive", async (t) => {
  const h = await buildHarness();
  t.after(() => h.close());

  const res = await req("POST", h.baseUrl, "/api/v1/governance/audit/archive", h.readOnlyCred);
  assert.equal(res.status, 403);
});

test("audit/archive: rejects organization-scoped credentials even with audit:archive", async (t) => {
  const h = await buildHarness();
  t.after(() => h.close());

  const res = await req(
    "POST",
    h.baseUrl,
    "/api/v1/governance/audit/archive",
    h.orgScopedArchiverCred,
  );
  assert.equal(res.status, 403);
});

test("audit/archive: rejects a non-positive-integer retentionDays", async (t) => {
  const h = await buildHarness();
  t.after(() => h.close());

  const res = await req("POST", h.baseUrl, "/api/v1/governance/audit/archive", h.archiverCred, {
    retentionDays: -5,
  });
  assert.equal(res.status, 400);
});

test("audit/archive: 503 when no archive store is configured", async (t) => {
  const h = await buildHarness(false);
  t.after(() => h.close());

  const res = await req("POST", h.baseUrl, "/api/v1/governance/audit/archive", h.archiverCred, {
    retentionDays: 30,
  });
  assert.equal(res.status, 503);
});

test("audit/archive: archives entries past the retention window, leaves recent ones, and preserves chain integrity", async (t) => {
  const h = await buildHarness();
  t.after(() => h.close());

  appendEvent(h.auditLog, "old-1", isoDaysAgo(400));
  appendEvent(h.auditLog, "recent-1", isoDaysAgo(1));

  const before = h.auditLog.entries.map((e) => ({ ...e }));

  const res = await req("POST", h.baseUrl, "/api/v1/governance/audit/archive", h.archiverCred, {
    retentionDays: 30,
  });
  assert.equal(res.status, 200);
  const body = res.body as ArchiveResultBody;
  assert.equal(body.archivedCount, 1);
  assert.equal(body.totalArchived, 1);
  assert.equal(body.retentionDays, 30);
  assert.equal(typeof body.cutoff, "string");

  // The pre-existing chain entries are untouched by the archive run itself;
  // the only addition is the `audit:archive` event the route records for its
  // own invocation (same pattern as `audit:export`/`audit:verify`).
  const after = h.auditLog.entries;
  assert.deepEqual(after.slice(0, before.length), before);
  assert.equal(after.length, before.length + 1);
  assert.equal(after.at(-1)?.event.action, "audit:archive");

  const verifyRes = await req("GET", h.baseUrl, "/api/v1/governance/audit/verify", h.adminCred);
  assert.equal((verifyRes.body as { valid: boolean }).valid, true);

  // Running again immediately archives nothing new.
  const again = await req("POST", h.baseUrl, "/api/v1/governance/audit/archive", h.archiverCred, {
    retentionDays: 30,
  });
  assert.equal((again.body as ArchiveResultBody).archivedCount, 0);
  assert.equal((again.body as ArchiveResultBody).totalArchived, 1);
});

test("audit list: `archived` query param filters and every entry is annotated", async (t) => {
  const h = await buildHarness();
  t.after(() => h.close());

  appendEvent(h.auditLog, "old-2", isoDaysAgo(400));
  appendEvent(h.auditLog, "recent-2", isoDaysAgo(1));

  await req("POST", h.baseUrl, "/api/v1/governance/audit/archive", h.archiverCred, {
    retentionDays: 30,
  });

  // The archive call itself records an `audit:archive` event, so the chain
  // now holds the two seeded entries plus that one.
  const all = await req("GET", h.baseUrl, "/api/v1/governance/audit", h.adminCred);
  const allBody = all.body as AuditListBody;
  assert.equal(allBody.entries.length, 3);
  const oldEntry = allBody.entries.find((e) => e.event.id === "old-2");
  const recentEntry = allBody.entries.find((e) => e.event.id === "recent-2");
  assert.equal(oldEntry?.archived, true);
  assert.equal(typeof oldEntry?.archivedAt, "string");
  assert.equal(recentEntry?.archived, false);
  assert.equal(recentEntry?.archivedAt, undefined);

  const onlyArchived = await req(
    "GET",
    h.baseUrl,
    "/api/v1/governance/audit?archived=true",
    h.adminCred,
  );
  const onlyArchivedBody = onlyArchived.body as AuditListBody;
  assert.equal(onlyArchivedBody.total, 1);
  assert.equal(onlyArchivedBody.entries[0]?.event.id, "old-2");

  const onlyActive = await req(
    "GET",
    h.baseUrl,
    "/api/v1/governance/audit?archived=false",
    h.adminCred,
  );
  const onlyActiveBody = onlyActive.body as AuditListBody;
  // "recent-2" plus the `audit:archive` event the archive call itself recorded
  // (also within the retention window, so also unarchived).
  assert.equal(onlyActiveBody.total, 2);
  assert.ok(onlyActiveBody.entries.some((e) => e.event.id === "recent-2"));
  assert.ok(onlyActiveBody.entries.every((e) => e.archived === false));
});

test("audit list: rejects an invalid `archived` value", async (t) => {
  const h = await buildHarness();
  t.after(() => h.close());

  const res = await req("GET", h.baseUrl, "/api/v1/governance/audit?archived=maybe", h.adminCred);
  assert.equal(res.status, 400);
});
