/** Integration tests for Work Schedule API (Enterprise-OS E-02). */

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
      permissions: ["work-schedule:read"],
    }),
  );
  const adminKV = createApiKey("admin-subject", resolvePermissions([adminRole]), apiKeyStore);
  const viewerKV = createApiKey("viewer-subject", resolvePermissions([viewerRole]), apiKeyStore);
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

test("Work Schedule API — 401 without credential", async (t) => {
  const h = await buildHarness();
  t.after(h.close);
  assert.equal(
    (await call(h.baseUrl, "GET", "/api/v1/projects/p-1/work-schedules", "")).status,
    401,
  );
});

test("Work Schedule API — CRUD normal path with admin key", async (t) => {
  const h = await buildHarness();
  t.after(h.close);

  // Create a project first
  const project = await call(h.baseUrl, "POST", "/api/v1/projects", h.adminCred, {
    organizationId: "org-hq",
    projectCode: "WS-1",
    name: "work schedule project",
  });
  const pid = (project.json as { project: { id: string } }).project.id;

  // List (empty)
  const listEmpty = await call(
    h.baseUrl,
    "GET",
    `/api/v1/projects/${pid}/work-schedules`,
    h.adminCred,
  );
  assert.equal(listEmpty.status, 200);
  assert.ok(Array.isArray((listEmpty.json as { workSchedules: unknown[] }).workSchedules));

  // Create
  const created = await call(
    h.baseUrl,
    "POST",
    `/api/v1/projects/${pid}/work-schedules`,
    h.adminCred,
    {
      workDate: "2026-08-10",
      title: "基礎工事",
      assignee: "worker-1",
      status: "planned",
      notes: "天候確認",
    },
  );
  assert.equal(created.status, 201);
  const ws = (created.json as { workSchedule: { id: string; title: string } }).workSchedule;
  assert.equal(ws.title, "基礎工事");

  // Get by ID
  const getRes = await call(h.baseUrl, "GET", `/api/v1/work-schedules/${ws.id}`, h.adminCred);
  assert.equal(getRes.status, 200);
  assert.equal((getRes.json as { workSchedule: { id: string } }).workSchedule.id, ws.id);

  // List (now has one)
  const list = await call(h.baseUrl, "GET", `/api/v1/projects/${pid}/work-schedules`, h.adminCred);
  assert.equal((list.json as { count: number }).count, 1);

  // Audit
  assert.ok(h.audit.query((e) => e.event.action === "work-schedule:create").length >= 1);
});

test("Work Schedule API — 403 with viewer (read-only) key for write", async (t) => {
  const h = await buildHarness();
  t.after(h.close);
  const res = await call(h.baseUrl, "POST", "/api/v1/projects/p-1/work-schedules", h.viewerCred, {
    workDate: "2026-08-10",
    title: "test",
  });
  assert.equal(res.status, 403);
});

test("Work Schedule API — 400 on invalid status", async (t) => {
  const h = await buildHarness();
  t.after(h.close);

  const project = await call(h.baseUrl, "POST", "/api/v1/projects", h.adminCred, {
    organizationId: "org-hq",
    projectCode: "WS-BAD",
    name: "bad status project",
  });
  const pid = (project.json as { project: { id: string } }).project.id;

  const res = await call(h.baseUrl, "POST", `/api/v1/projects/${pid}/work-schedules`, h.adminCred, {
    workDate: "2026-08-10",
    title: "test",
    status: "expired",
  });
  assert.equal(res.status, 400);
});

test("Work Schedule API — 400 on validation failure (empty workDate)", async (t) => {
  const h = await buildHarness();
  t.after(h.close);

  const project = await call(h.baseUrl, "POST", "/api/v1/projects", h.adminCred, {
    organizationId: "org-hq",
    projectCode: "WS-BLANK",
    name: "blank date project",
  });
  const pid = (project.json as { project: { id: string } }).project.id;

  const res = await call(h.baseUrl, "POST", `/api/v1/projects/${pid}/work-schedules`, h.adminCred, {
    workDate: "",
    title: "test",
  });
  assert.equal(res.status, 400);
});

test("Work Schedule API — 404 for non-existent project", async (t) => {
  const h = await buildHarness();
  t.after(h.close);
  const res = await call(
    h.baseUrl,
    "GET",
    "/api/v1/projects/does-not-exist/work-schedules",
    h.adminCred,
  );
  assert.equal(res.status, 404);
});

test("Work Schedule API — 404 for non-existent work schedule", async (t) => {
  const h = await buildHarness();
  t.after(h.close);
  const res = await call(h.baseUrl, "GET", "/api/v1/work-schedules/does-not-exist", h.adminCred);
  assert.equal(res.status, 404);
});
