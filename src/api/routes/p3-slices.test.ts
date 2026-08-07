/** Integration tests for S-03/S-04/S-05/S-09 APIs. */

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

test("S-03/S-04/S-05/S-09 APIs work under a project with audit", async (t) => {
  const h = await buildHarness();
  t.after(h.close);

  const project = await call(h.baseUrl, "POST", "/api/v1/projects", h.adminCred, {
    organizationId: "org-hq",
    projectCode: "P3-001",
    name: "P3 slice project",
  });
  assert.equal(project.status, 201);
  const pid = project.json.project.id as string;

  assert.equal((await call(h.baseUrl, "GET", `/api/v1/projects/${pid}/photos`, "")).status, 401);

  const photo = await call(h.baseUrl, "POST", `/api/v1/projects/${pid}/photos`, h.adminCred, {
    fileName: "site.jpg",
    originalName: "IMG_001.jpg",
    contentType: "image/jpeg",
    fileSize: 2048,
    category: "progress",
    caption: "基礎工事",
  });
  assert.equal(photo.status, 201);
  assert.equal(photo.json.photo.category, "progress");
  const photoId = photo.json.photo.id as string;
  assert.equal(
    (await call(h.baseUrl, "GET", `/api/v1/photos/${photoId}`, h.adminCred)).status,
    200,
  );
  assert.equal(
    (await call(h.baseUrl, "DELETE", `/api/v1/photos/${photoId}`, h.adminCred)).status,
    200,
  );

  const safety = await call(
    h.baseUrl,
    "POST",
    `/api/v1/projects/${pid}/safety-checks`,
    h.adminCred,
    {
      checkDate: "2026-08-07",
      itemsTotal: 5,
      itemsOk: 4,
      itemsNg: 1,
      overallResult: "ng",
    },
  );
  assert.equal(safety.status, 201);
  const safetyId = safety.json.safetyCheck.id as string;
  assert.equal(
    (await call(h.baseUrl, "GET", `/api/v1/safety-checks/${safetyId}`, h.adminCred)).status,
    200,
  );
  assert.equal(
    (await call(h.baseUrl, "DELETE", `/api/v1/safety-checks/${safetyId}`, h.adminCred)).status,
    200,
  );

  const quality = await call(
    h.baseUrl,
    "POST",
    `/api/v1/projects/${pid}/quality-inspections`,
    h.adminCred,
    {
      inspectionDate: "2026-08-07",
      inspectionType: "concrete",
      targetItem: "A-1",
      result: "pass",
    },
  );
  assert.equal(quality.status, 201);
  const qualityId = quality.json.qualityInspection.id as string;
  assert.equal(
    (await call(h.baseUrl, "GET", `/api/v1/quality-inspections/${qualityId}`, h.adminCred)).status,
    200,
  );

  const cost = await call(h.baseUrl, "POST", `/api/v1/projects/${pid}/cost-records`, h.adminCred, {
    recordDate: "2026-08-07",
    category: "materials",
    description: "rebar",
    budgetedAmount: 100,
    actualAmount: 90,
  });
  assert.equal(cost.status, 201);
  const costId = cost.json.costRecord.id as string;
  assert.equal(
    (await call(h.baseUrl, "GET", `/api/v1/cost-records/${costId}`, h.adminCred)).status,
    200,
  );

  const hours = await call(h.baseUrl, "POST", `/api/v1/projects/${pid}/work-hours`, h.adminCred, {
    workDate: "2026-08-07",
    hours: 8,
    workType: "formwork",
  });
  assert.equal(hours.status, 201);
  const hoursId = hours.json.workHour.id as string;
  assert.equal(
    (await call(h.baseUrl, "GET", `/api/v1/work-hours/${hoursId}`, h.adminCred)).status,
    200,
  );

  const notification = await call(h.baseUrl, "POST", "/api/v1/notifications", h.adminCred, {
    organizationId: "org-hq",
    userId: "user-1",
    eventKey: "daily-report.submitted",
    channel: "slack",
    subject: "日報提出",
  });
  assert.equal(notification.status, 201);
  assert.equal(notification.json.notification.status, "pending");
  const notifId = notification.json.notification.id as string;
  assert.equal(
    (await call(h.baseUrl, "GET", `/api/v1/notifications/${notifId}`, h.adminCred)).status,
    200,
  );
  const list = await call(h.baseUrl, "GET", "/api/v1/notifications?status=pending", h.adminCred);
  assert.equal(list.json.total, 1);

  const audits = h.audit.query((e) =>
    ["photo:", "safety:", "quality:", "cost:", "work-hour:", "notification:"].some((p) =>
      e.event.action.startsWith(p),
    ),
  );
  assert.ok(audits.some((e) => e.event.action === "photo:create"));
  assert.ok(audits.some((e) => e.event.action === "safety:create"));
  assert.ok(audits.some((e) => e.event.action === "quality:create"));
  assert.ok(audits.some((e) => e.event.action === "cost:create"));
  assert.ok(audits.some((e) => e.event.action === "work-hour:create"));
  assert.ok(audits.some((e) => e.event.action === "notification:create"));
});
