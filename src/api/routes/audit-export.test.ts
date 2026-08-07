/**
 * Integration tests for the audit evidence export.
 *
 * The export is the one endpoint that hands out the whole evidence trail in a
 * single response, so it carries three obligations the paged read does not:
 * a distinct permission, tenant scoping that still holds in bulk, and output
 * that is inert when opened in a spreadsheet. Each is pinned here end-to-end
 * rather than at the unit level, because all three are properties of the
 * response a real client receives.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";

import { createServer } from "../server.ts";
import { createApiKey } from "../middleware/auth.ts";
import { createJwtIssuer, generateJwtSecret } from "../middleware/jwt.ts";
import { createInMemoryRepositories } from "../../persistence/in-memory/index.ts";
import { AuditLog } from "../../governance/audit-log.ts";
import { createOrganization } from "../../domain/index.ts";
import type { Repositories } from "../../persistence/ports.ts";
import type { IsoTimestamp } from "../../domain/common.ts";
import type { Permission } from "../../domain/role.ts";
import type { ApiKeyStore, AppContainer } from "../types.ts";

function unwrap<T>(r: { ok: boolean; value?: T }): T {
  if (!r.ok) throw new Error("factory failed");
  return r.value as T;
}

const EXPORT_PATH = "/api/v1/governance/audit/export";

/** A subject that a spreadsheet would execute if it reached a cell unescaped. */
const FORMULA_SUBJECT = "=cmd|'/c calc'!A1";

interface Harness {
  baseUrl: string;
  auditLog: AuditLog;
  /** org-a, has audit:export */
  exporterCred: string;
  /** org-a, has audit:read but NOT audit:export */
  readerCred: string;
  /** org-b, has audit:export — used to prove scoping holds in bulk */
  otherOrgCred: string;
  /** org-a, subject is a spreadsheet formula */
  formulaCred: string;
  adminCred: string;
  close(): Promise<void>;
}

async function buildHarness(): Promise<Harness> {
  const apiKeyStore: ApiKeyStore = new Map();
  const repositories: Repositories = createInMemoryRepositories();
  const now = new Date().toISOString() as IsoTimestamp;

  for (const id of ["org-a", "org-b"]) {
    await repositories.organizations.save(
      unwrap(
        createOrganization({
          id,
          name: id.toUpperCase(),
          type: "headquarters",
          status: "active",
          createdAt: now,
        }),
      ),
    );
  }

  const writePerms = ["user:read", "user:write", "organization:read"] as Permission[];
  const exporter = createApiKey(
    "user-exporter",
    [...writePerms, "audit:read", "audit:export"] as Permission[],
    apiKeyStore,
    "org-a",
  );
  const reader = createApiKey(
    "user-reader",
    [...writePerms, "audit:read"] as Permission[],
    apiKeyStore,
    "org-a",
  );
  const other = createApiKey(
    "user-other",
    [...writePerms, "audit:export"] as Permission[],
    apiKeyStore,
    "org-b",
  );
  const formula = createApiKey(
    FORMULA_SUBJECT,
    [...writePerms, "audit:export"] as Permission[],
    apiKeyStore,
    "org-a",
  );
  const admin = createApiKey("admin", ["*:*"] as Permission[], apiKeyStore);

  const auditLog = new AuditLog();
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
    auditLog,
    exporterCred: `${exporter.key}:${exporter.secret}`,
    readerCred: `${reader.key}:${reader.secret}`,
    otherOrgCred: `${other.key}:${other.secret}`,
    formulaCred: `${formula.key}:${formula.secret}`,
    adminCred: `${admin.key}:${admin.secret}`,
    close: () =>
      new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve()))),
  };
}

async function get(baseUrl: string, path: string, auth: string): Promise<Response> {
  return fetch(`${baseUrl}${path}`, { headers: { Authorization: `Bearer ${auth}` } });
}

/** Create a user through the API so a real audit entry is recorded for that tenant. */
async function seedEntry(h: Harness, cred: string, orgId: string, email: string): Promise<void> {
  const res = await fetch(`${h.baseUrl}/api/v1/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${cred}` },
    body: JSON.stringify({
      organizationId: orgId,
      displayName: email,
      email,
      status: "active",
      roleIds: [],
    }),
  });
  assert.equal(res.status, 201, `setup write failed: ${await res.text()}`);
}

/** Split a CSV document into records, respecting quoted fields containing CRLF. */
function csvRecords(csv: string): string[] {
  const records: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < csv.length; i += 1) {
    const ch = csv[i];
    if (ch === '"') inQuotes = !inQuotes;
    if (!inQuotes && ch === "\r" && csv[i + 1] === "\n") {
      records.push(current);
      current = "";
      i += 1;
      continue;
    }
    current += ch;
  }
  if (current.length > 0) records.push(current);
  return records;
}

test("audit-export: audit:read alone does not grant export", async (t) => {
  const h = await buildHarness();
  t.after(() => h.close());
  await seedEntry(h, h.readerCred, "org-a", "r1@example.test");

  // Paging through the log and walking out with all of it are different
  // capabilities; the permission split is the control that separates them.
  const res = await get(h.baseUrl, EXPORT_PATH, h.readerCred);
  assert.equal(res.status, 403);
  const body = (await res.json()) as { message: string };
  assert.match(body.message, /audit:export/);
});

test("audit-export: a denied export is itself recorded", async (t) => {
  const h = await buildHarness();
  t.after(() => h.close());

  const before = h.auditLog.entries.length;
  const res = await get(h.baseUrl, EXPORT_PATH, h.readerCred);
  assert.equal(res.status, 403);

  const added = h.auditLog.entries.slice(before);
  const denial = added.find((e) => e.event.action === "audit:export");
  assert.ok(denial, "the refused extraction attempt must appear in the trail");
  assert.equal(denial.event.outcome, "denied");
  assert.equal(denial.event.actor, "user-reader");
  assert.equal(denial.event.metadata["organizationId"], "org-a");
});

test("audit-export: csv carries the chain columns needed to re-verify offline", async (t) => {
  const h = await buildHarness();
  t.after(() => h.close());
  await seedEntry(h, h.exporterCred, "org-a", "e1@example.test");

  const res = await get(h.baseUrl, `${EXPORT_PATH}?format=csv`, h.exporterCred);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("content-type"), "text/csv; charset=utf-8");
  assert.match(
    res.headers.get("content-disposition") ?? "",
    /^attachment; filename="audit-export-/,
  );
  assert.equal(res.headers.get("x-content-type-options"), "nosniff");

  const records = csvRecords(await res.text());
  assert.equal(
    records[0],
    "sequence,id,at,actor,action,resource,outcome,metadata,previousHash,hash",
  );
  // Without sequence/previousHash/hash the export is a list of claims, not
  // tamper-evident evidence.
  assert.ok(records.length > 1, "at least one data record expected");
});

test("audit-export: a formula-shaped actor is neutralized in the csv", async (t) => {
  const h = await buildHarness();
  t.after(() => h.close());
  // The actor is taken from the authenticated subject, so this is the realistic
  // path by which attacker-influenced text reaches a cell.
  await seedEntry(h, h.formulaCred, "org-a", "f1@example.test");

  const res = await get(h.baseUrl, `${EXPORT_PATH}?format=csv`, h.formulaCred);
  assert.equal(res.status, 200);
  const csv = await res.text();

  assert.ok(csv.includes(FORMULA_SUBJECT), "the recorded value must still be present");
  // Every occurrence must be preceded by the text marker — a single unescaped
  // one is enough to execute when the file is opened.
  let idx = csv.indexOf(FORMULA_SUBJECT);
  let occurrences = 0;
  while (idx !== -1) {
    assert.equal(csv[idx - 1], "'", `unescaped formula at offset ${idx}`);
    occurrences += 1;
    idx = csv.indexOf(FORMULA_SUBJECT, idx + 1);
  }
  assert.ok(occurrences > 0);
});

test("audit-export: tenant scoping still holds in bulk", async (t) => {
  const h = await buildHarness();
  t.after(() => h.close());
  await seedEntry(h, h.exporterCred, "org-a", "a1@example.test");
  await seedEntry(h, h.otherOrgCred, "org-b", "b1@example.test");

  const res = await get(h.baseUrl, `${EXPORT_PATH}?format=json`, h.exporterCred);
  assert.equal(res.status, 200);
  const body = (await res.json()) as {
    entries: readonly { event: { actor: string; metadata: Record<string, string> } }[];
  };
  assert.ok(body.entries.length > 0);
  for (const entry of body.entries) {
    assert.equal(entry.event.metadata["organizationId"], "org-a");
    assert.notEqual(entry.event.actor, "user-other");
  }
});

test("audit-export: the export is recorded but absent from its own payload", async (t) => {
  const h = await buildHarness();
  t.after(() => h.close());
  await seedEntry(h, h.exporterCred, "org-a", "e2@example.test");

  const res = await get(h.baseUrl, `${EXPORT_PATH}?format=json`, h.exporterCred);
  const body = (await res.json()) as {
    entries: readonly { event: { action: string } }[];
    total: number;
  };

  // The range is snapshotted before the export event is appended: including it
  // would describe an event that had not happened when the range was taken.
  assert.ok(
    !body.entries.some((e) => e.event.action === "audit:export"),
    "the export must not appear inside the payload it produced",
  );
  const recorded = h.auditLog.entries.filter(
    (e) => e.event.action === "audit:export" && e.event.outcome === "success",
  );
  assert.equal(recorded.length, 1, "but it must be recorded in the chain");
  assert.equal(recorded[0]?.event.metadata["format"], "json");
  assert.equal(recorded[0]?.event.metadata["count"], String(body.entries.length));
});

test("audit-export: json export is delivered as a download with an envelope", async (t) => {
  const h = await buildHarness();
  t.after(() => h.close());
  await seedEntry(h, h.exporterCred, "org-a", "e3@example.test");

  const res = await get(h.baseUrl, `${EXPORT_PATH}?format=json`, h.exporterCred);
  assert.equal(res.headers.get("content-type"), "application/json; charset=utf-8");
  assert.match(
    res.headers.get("content-disposition") ?? "",
    /^attachment; filename="audit-export-.*\.json"$/,
  );
  const body = (await res.json()) as Record<string, unknown>;
  for (const key of ["exportedAt", "count", "total", "limit", "offset", "entries"]) {
    assert.ok(key in body, `envelope must carry ${key}`);
  }
});

test("audit-export: an unsupported format is rejected", async (t) => {
  const h = await buildHarness();
  t.after(() => h.close());

  const res = await get(h.baseUrl, `${EXPORT_PATH}?format=xlsx`, h.exporterCred);
  assert.equal(res.status, 400);
  const body = (await res.json()) as { message: string };
  assert.match(body.message, /csv.*json/);
});

test("audit-export: limit and offset bound the range", async (t) => {
  const h = await buildHarness();
  t.after(() => h.close());
  for (const n of [1, 2, 3]) {
    await seedEntry(h, h.exporterCred, "org-a", `p${n}@example.test`);
  }

  const first = await get(h.baseUrl, `${EXPORT_PATH}?format=json&limit=2`, h.exporterCred);
  const firstBody = (await first.json()) as { entries: readonly unknown[]; total: number };
  assert.equal(firstBody.entries.length, 2);
  assert.ok(firstBody.total > 2);

  const next = await get(h.baseUrl, `${EXPORT_PATH}?format=json&limit=2&offset=2`, h.exporterCred);
  const nextBody = (await next.json()) as { entries: readonly unknown[]; offset: number };
  assert.equal(nextBody.offset, 2);
  assert.ok(nextBody.entries.length > 0);
});

test("audit-export: a global credential exports the whole chain", async (t) => {
  const h = await buildHarness();
  t.after(() => h.close());
  await seedEntry(h, h.exporterCred, "org-a", "g1@example.test");
  await seedEntry(h, h.otherOrgCred, "org-b", "g2@example.test");

  // Platform-level integrity verification needs the unscoped chain; that is why
  // a global credential is not filtered.
  const res = await get(h.baseUrl, `${EXPORT_PATH}?format=json`, h.adminCred);
  const body = (await res.json()) as {
    entries: readonly { event: { metadata: Record<string, string> } }[];
  };
  const orgs = new Set(body.entries.map((e) => e.event.metadata["organizationId"]));
  assert.ok(orgs.has("org-a") && orgs.has("org-b"), "global credential must see both tenants");
});

test("audit-export: default format is csv", async (t) => {
  const h = await buildHarness();
  t.after(() => h.close());
  await seedEntry(h, h.exporterCred, "org-a", "d1@example.test");

  const res = await get(h.baseUrl, EXPORT_PATH, h.exporterCred);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("content-type"), "text/csv; charset=utf-8");
});
