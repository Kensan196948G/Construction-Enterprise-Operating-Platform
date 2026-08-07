/** Integration tests for the daily report API (S-02). */

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
  orgCred: string;
  otherOrgCred: string;
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
  const adminKV = createApiKey("admin-subject", resolvePermissions([adminRole]), apiKeyStore);
  const orgKV = createApiKey(
    "org-manager",
    resolvePermissions([adminRole]),
    apiKeyStore,
    "org-site",
  );
  const otherOrgKV = createApiKey(
    "other-org-manager",
    resolvePermissions([adminRole]),
    apiKeyStore,
    "org-other",
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
    orgCred: `${orgKV.key}:${orgKV.secret}`,
    otherOrgCred: `${otherOrgKV.key}:${otherOrgKV.secret}`,
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

test("daily report lifecycle nested under a project", async (t) => {
  const h = await buildHarness();
  t.after(h.close);

  const project = await call(h.baseUrl, "POST", "/api/v1/projects", h.adminCred, {
    organizationId: "org-hq",
    projectCode: "R-1",
    name: "report project",
  });
  assert.equal(project.status, 201);
  const projectId = project.json.project.id as string;

  const noAuth = await call(h.baseUrl, "POST", `/api/v1/projects/${projectId}/daily-reports`, "", {
    reportDate: "2026-08-07",
  });
  assert.equal(noAuth.status, 401);

  const created = await call(
    h.baseUrl,
    "POST",
    `/api/v1/projects/${projectId}/daily-reports`,
    h.adminCred,
    {
      reportDate: "2026-08-07",
      weather: "sunny",
      workerCount: 4,
      workContent: "基礎工事",
      safetyCheck: true,
      progressRate: 30,
    },
  );
  assert.equal(created.status, 201);
  const reportId = created.json.dailyReport.id as string;
  assert.equal(created.json.dailyReport.status, "draft");

  const list = await call(
    h.baseUrl,
    "GET",
    `/api/v1/projects/${projectId}/daily-reports`,
    h.adminCred,
  );
  assert.equal(list.status, 200);
  assert.equal(list.json.total, 1);

  const patched = await call(h.baseUrl, "PATCH", `/api/v1/daily-reports/${reportId}`, h.adminCred, {
    workerCount: 5,
    safetyNotes: "KY実施済み",
  });
  assert.equal(patched.status, 200);
  assert.equal(patched.json.dailyReport.workerCount, 5);

  const submitted = await call(
    h.baseUrl,
    "POST",
    `/api/v1/daily-reports/${reportId}/transition`,
    h.adminCred,
    { status: "submitted" },
  );
  assert.equal(submitted.status, 200);
  assert.equal(submitted.json.dailyReport.status, "submitted");

  const approved = await call(
    h.baseUrl,
    "POST",
    `/api/v1/daily-reports/${reportId}/transition`,
    h.adminCred,
    { status: "approved" },
  );
  assert.equal(approved.status, 200);

  const invalidTransition = await call(
    h.baseUrl,
    "POST",
    `/api/v1/daily-reports/${reportId}/transition`,
    h.adminCred,
    { status: "draft" },
  );
  assert.equal(invalidTransition.status, 400);

  assert.equal(
    (
      await call(h.baseUrl, "POST", "/api/v1/projects/nope/daily-reports", h.adminCred, {
        reportDate: "2026-08-07",
      })
    ).status,
    404,
  );

  const audits = h.audit.query((e) => e.event.action.startsWith("daily-report:"));
  assert.ok(audits.some((e) => e.event.action === "daily-report:create"));
  assert.ok(audits.some((e) => e.event.action === "daily-report:transition"));
});

test("daily reports enforce tenant scope", async (t) => {
  const h = await buildHarness();
  t.after(h.close);

  const project = await call(h.baseUrl, "POST", "/api/v1/projects", h.orgCred, {
    projectCode: "R-ORG",
    name: "site project",
  });
  assert.equal(project.status, 201);
  const projectId = project.json.project.id as string;

  // Global admin can read the org project's reports (no tenant filter for global).
  const created = await call(
    h.baseUrl,
    "POST",
    `/api/v1/projects/${projectId}/daily-reports`,
    h.orgCred,
    { reportDate: "2026-08-07" },
  );
  assert.equal(created.status, 201);

  // A different-org credential must not see the project (404).
  const otherOrg = await call(
    h.baseUrl,
    "POST",
    `/api/v1/projects/${projectId}/daily-reports`,
    h.otherOrgCred,
    { reportDate: "2026-08-08" },
  );
  assert.equal(otherOrg.status, 404);
});
