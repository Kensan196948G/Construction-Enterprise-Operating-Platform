/** Integration tests for Labor Attendance API (HR — issue #74). */

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
  viewerCred: string;
  /** Has labor-attendance:read/write but not cost:write — used for the post-to-cost permission test. */
  laOnlyCred: string;
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
  const viewerRole = unwrap(
    createRole({
      id: "r-viewer",
      name: "viewer",
      description: "",
      scope: "global",
      permissions: ["labor-attendance:read"],
    }),
  );
  const laOnlyRole = unwrap(
    createRole({
      id: "r-la-only",
      name: "labor-attendance-only",
      description: "",
      scope: "global",
      permissions: ["labor-attendance:read", "labor-attendance:write"],
    }),
  );
  const adminKV = createApiKey("admin-subject", resolvePermissions([adminRole]), apiKeyStore);
  const viewerKV = createApiKey("viewer-subject", resolvePermissions([viewerRole]), apiKeyStore);
  const laOnlyKV = createApiKey("la-only-subject", resolvePermissions([laOnlyRole]), apiKeyStore);
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
    viewerCred: `${viewerKV.key}:${viewerKV.secret}`,
    laOnlyCred: `${laOnlyKV.key}:${laOnlyKV.secret}`,
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
): Promise<{ status: number; json: Record<string, unknown> }> {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${credential}`,
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  let json: Record<string, unknown> = {};
  try {
    json = (await res.json()) as Record<string, unknown>;
  } catch {
    // no-op
  }
  return { status: res.status, json };
}

async function createProject(h: Harness, code: string): Promise<string> {
  const project = await call(h.baseUrl, "POST", "/api/v1/projects", h.adminCred, {
    organizationId: "org-hq",
    projectCode: code,
    name: `project ${code}`,
  });
  return (project.json as { project: { id: string } }).project.id;
}

test("Labor Attendance API — 401 without credential", async (t) => {
  const h = await buildHarness();
  t.after(h.close);
  assert.equal(
    (await call(h.baseUrl, "GET", "/api/v1/projects/p-1/labor-attendance", "")).status,
    401,
  );
});

test("Labor Attendance API — CRUD normal path with admin key", async (t) => {
  const h = await buildHarness();
  t.after(h.close);

  const pid = await createProject(h, "LA-1");

  const listEmpty = await call(
    h.baseUrl,
    "GET",
    `/api/v1/projects/${pid}/labor-attendance`,
    h.adminCred,
  );
  assert.equal(listEmpty.status, 200);
  assert.ok(Array.isArray((listEmpty.json as { laborAttendances: unknown[] }).laborAttendances));

  const created = await call(
    h.baseUrl,
    "POST",
    `/api/v1/projects/${pid}/labor-attendance`,
    h.adminCred,
    {
      workerName: "山田太郎",
      affiliation: "in_house",
      attendanceDate: "2026-09-01",
      dailyRate: 15000,
      overtimeHours: 2,
    },
  );
  assert.equal(created.status, 201);
  const la = (created.json as { laborAttendance: { id: string; status: string } }).laborAttendance;
  assert.equal(la.status, "draft");

  const getRes = await call(h.baseUrl, "GET", `/api/v1/labor-attendance/${la.id}`, h.adminCred);
  assert.equal(getRes.status, 200);
  assert.equal(
    (getRes.json as { laborAttendance: { workerName: string } }).laborAttendance.workerName,
    "山田太郎",
  );

  const list = await call(
    h.baseUrl,
    "GET",
    `/api/v1/projects/${pid}/labor-attendance`,
    h.adminCred,
  );
  assert.equal((list.json as { count: number }).count, 1);

  // Update mutable fields
  const patched = await call(h.baseUrl, "PATCH", `/api/v1/labor-attendance/${la.id}`, h.adminCred, {
    dailyRate: 16000,
    notes: "残業対応",
  });
  assert.equal(patched.status, 200);
  assert.equal(
    (patched.json as { laborAttendance: { dailyRate: number } }).laborAttendance.dailyRate,
    16000,
  );

  // Transition draft -> submitted -> approved
  const submitted = await call(
    h.baseUrl,
    "POST",
    `/api/v1/labor-attendance/${la.id}/transition`,
    h.adminCred,
    { status: "submitted" },
  );
  assert.equal(submitted.status, 200);
  assert.equal(
    (submitted.json as { laborAttendance: { status: string } }).laborAttendance.status,
    "submitted",
  );

  const approved = await call(
    h.baseUrl,
    "POST",
    `/api/v1/labor-attendance/${la.id}/transition`,
    h.adminCred,
    { status: "approved" },
  );
  assert.equal(approved.status, 200);

  // Audit
  assert.ok(h.audit.query((e) => e.event.action === "labor-attendance:create").length >= 1);
  assert.ok(h.audit.query((e) => e.event.action === "labor-attendance:transition").length >= 2);
});

test("Labor Attendance API — 400 when subcontractorName missing for subcontractor affiliation", async (t) => {
  const h = await buildHarness();
  t.after(h.close);
  const pid = await createProject(h, "LA-SUB");

  const res = await call(
    h.baseUrl,
    "POST",
    `/api/v1/projects/${pid}/labor-attendance`,
    h.adminCred,
    {
      workerName: "鈴木一郎",
      affiliation: "subcontractor",
      attendanceDate: "2026-09-01",
      dailyRate: 18000,
    },
  );
  assert.equal(res.status, 400);
});

test("Labor Attendance API — 403 with viewer (read-only) key for write", async (t) => {
  const h = await buildHarness();
  t.after(h.close);
  const res = await call(h.baseUrl, "POST", "/api/v1/projects/p-1/labor-attendance", h.viewerCred, {
    workerName: "test",
    attendanceDate: "2026-09-01",
    dailyRate: 10000,
  });
  assert.equal(res.status, 403);
});

test("Labor Attendance API — 404 for non-existent project", async (t) => {
  const h = await buildHarness();
  t.after(h.close);
  const res = await call(
    h.baseUrl,
    "GET",
    "/api/v1/projects/does-not-exist/labor-attendance",
    h.adminCred,
  );
  assert.equal(res.status, 404);
});

test("Labor Attendance API — 404 for non-existent labor attendance", async (t) => {
  const h = await buildHarness();
  t.after(h.close);
  const res = await call(h.baseUrl, "GET", "/api/v1/labor-attendance/does-not-exist", h.adminCred);
  assert.equal(res.status, 404);
});

test("Labor Attendance API — post-to-cost creates a CostRecord reflecting labor cost", async (t) => {
  const h = await buildHarness();
  t.after(h.close);
  const pid = await createProject(h, "LA-COST");

  const created = await call(
    h.baseUrl,
    "POST",
    `/api/v1/projects/${pid}/labor-attendance`,
    h.adminCred,
    {
      workerName: "山田太郎",
      affiliation: "in_house",
      attendanceDate: "2026-09-01",
      dailyRate: 16000,
      overtimeHours: 2,
    },
  );
  assert.equal(created.status, 201);
  const la = (created.json as { laborAttendance: { id: string } }).laborAttendance;

  const posted = await call(
    h.baseUrl,
    "POST",
    `/api/v1/labor-attendance/${la.id}/post-to-cost`,
    h.adminCred,
  );
  assert.equal(posted.status, 201);
  const costRecord = (posted.json as { costRecord: { category: string; actualAmount: number } })
    .costRecord;
  assert.equal(costRecord.category, "labor");
  // hourly = 16000/8 = 2000; overtime pay = 2 * 2000 * 1.25 = 5000
  assert.equal(costRecord.actualAmount, 21000);

  // The cost record must show up in the project's cost-record list.
  const costList = await call(
    h.baseUrl,
    "GET",
    `/api/v1/projects/${pid}/cost-records`,
    h.adminCred,
  );
  assert.equal((costList.json as { count: number }).count, 1);

  assert.ok(h.audit.query((e) => e.event.action === "labor-attendance:post-to-cost").length >= 1);
});

test("Labor Attendance API — post-to-cost requires cost:write in addition to labor-attendance:write", async (t) => {
  const h = await buildHarness();
  t.after(h.close);
  const pid = await createProject(h, "LA-COST-403");

  const created = await call(
    h.baseUrl,
    "POST",
    `/api/v1/projects/${pid}/labor-attendance`,
    h.adminCred,
    { workerName: "test", attendanceDate: "2026-09-01", dailyRate: 10000 },
  );
  const la = (created.json as { laborAttendance: { id: string } }).laborAttendance;

  // Has labor-attendance:write but not cost:write — must still be forbidden.
  const res = await call(
    h.baseUrl,
    "POST",
    `/api/v1/labor-attendance/${la.id}/post-to-cost`,
    h.laOnlyCred,
  );
  assert.equal(res.status, 403);
});
