/** Integration tests for the project API (S-01). */

import { test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";

import { createServer } from "../server.ts";
import { createApiKey } from "../middleware/auth.ts";
import { createInMemoryRepositories } from "../../persistence/in-memory/index.ts";
import { AuditLog } from "../../governance/audit-log.ts";
import { resolvePermissions } from "../../governance/policy-engine.ts";
import { createRole } from "../../domain/index.ts";
import type { Result } from "../../domain/common.ts";
import type { ApiKeyStore } from "../types.ts";

function unwrap<T>(r: Result<T>): T {
  if (!r.ok) throw new Error(JSON.stringify(r.error));
  return r.value;
}

interface Harness {
  baseUrl: string;
  adminCred: string;
  readerCred: string;
  orgCred: string;
  audit: AuditLog;
  close(): Promise<void>;
}

async function buildHarness(): Promise<Harness> {
  const apiKeyStore: ApiKeyStore = new Map();
  const adminRole = unwrap(
    createRole({
      id: "r-admin",
      name: "Admin",
      description: "",
      scope: "global",
      permissions: ["*:*"],
    }),
  );
  const readerRole = unwrap(
    createRole({
      id: "r-reader",
      name: "Project Reader",
      description: "",
      scope: "global",
      permissions: ["project:read"],
    }),
  );
  const adminKV = createApiKey("admin-subject", resolvePermissions([adminRole]), apiKeyStore);
  const readerKV = createApiKey("reader-subject", resolvePermissions([readerRole]), apiKeyStore);
  const orgKV = createApiKey(
    "org-manager",
    resolvePermissions([adminRole]),
    apiKeyStore,
    "org-site",
  );
  const audit = new AuditLog();
  const server = createServer(
    { port: 0 },
    { repositories: createInMemoryRepositories(), auditLog: audit, apiKeyStore },
  );
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    adminCred: `${adminKV.key}:${adminKV.secret}`,
    readerCred: `${readerKV.key}:${readerKV.secret}`,
    orgCred: `${orgKV.key}:${orgKV.secret}`,
    audit,
    close: () =>
      new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve()))),
  };
}

async function call(
  baseUrl: string,
  method: string,
  path: string,
  credential: string,
  body?: unknown,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test helper reads arbitrary JSON
): Promise<{ status: number; json: any }> {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${credential}`,
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test helper reads arbitrary JSON
  return { status: res.status, json: (await res.json().catch(() => ({}))) as any };
}

test("project CRUD lifecycle with permissions and audit", async (t) => {
  const h = await buildHarness();
  t.after(h.close);

  assert.equal((await call(h.baseUrl, "GET", "/api/v1/projects", "")).status, 401);
  assert.equal(
    (await call(h.baseUrl, "POST", "/api/v1/projects", h.readerCred, { name: "x" })).status,
    403,
  );

  const created = await call(h.baseUrl, "POST", "/api/v1/projects", h.adminCred, {
    organizationId: "org-hq",
    projectCode: "P-2026-001",
    name: "田町再開発",
    budget: 1_000_000,
    startDate: "2026-09-01",
  });
  assert.equal(created.status, 201);
  const id = created.json.project.id as string;

  const duplicate = await call(h.baseUrl, "POST", "/api/v1/projects", h.adminCred, {
    organizationId: "org-hq",
    projectCode: "P-2026-001",
    name: "duplicate",
  });
  assert.equal(duplicate.status, 400);

  const list = await call(h.baseUrl, "GET", "/api/v1/projects", h.readerCred);
  assert.equal(list.status, 200);
  assert.equal(list.json.total, 1);

  const detail = await call(h.baseUrl, "GET", `/api/v1/projects/${id}`, h.readerCred);
  assert.equal(detail.status, 200);
  assert.equal(detail.json.project.projectCode, "P-2026-001");

  const patched = await call(h.baseUrl, "PATCH", `/api/v1/projects/${id}`, h.adminCred, {
    status: "in_progress",
    budget: 1_200_000,
  });
  assert.equal(patched.status, 200);
  assert.equal(patched.json.project.status, "in_progress");

  assert.equal((await call(h.baseUrl, "GET", "/api/v1/projects/nope", h.readerCred)).status, 404);
  const deleted = await call(h.baseUrl, "DELETE", `/api/v1/projects/${id}`, h.adminCred);
  assert.equal(deleted.status, 200);
  assert.equal((await call(h.baseUrl, "GET", `/api/v1/projects/${id}`, h.readerCred)).status, 404);

  const audits = h.audit.query((e) => e.event.action.startsWith("project:"));
  assert.ok(audits.some((e) => e.event.action === "project:create"));
  assert.ok(audits.some((e) => e.event.action === "project:update"));
  assert.ok(audits.some((e) => e.event.action === "project:delete"));
});

test("project tenant scope is enforced", async (t) => {
  const h = await buildHarness();
  t.after(h.close);

  const mismatch = await call(h.baseUrl, "POST", "/api/v1/projects", h.orgCred, {
    organizationId: "org-other",
    projectCode: "T-1",
    name: "n",
  });
  assert.equal(mismatch.status, 400);

  const created = await call(h.baseUrl, "POST", "/api/v1/projects", h.orgCred, {
    projectCode: "T-2",
    name: "n",
  });
  assert.equal(created.status, 201);
  assert.equal(created.json.project.organizationId, "org-site");

  const orgList = await call(h.baseUrl, "GET", "/api/v1/projects", h.orgCred);
  assert.equal(orgList.json.total, 1);

  const globalList = await call(h.baseUrl, "GET", "/api/v1/projects", h.adminCred);
  assert.equal(globalList.json.total, 1);
});
