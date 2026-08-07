/** Integration tests for S-06/S-07/S-08 and daily-report workflow integration. */

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

test("S-06 knowledge + S-07 contracts + S-08 ITSM adapter", async (t) => {
  const h = await buildHarness();
  t.after(h.close);

  assert.equal((await call(h.baseUrl, "GET", "/api/v1/knowledge", "")).status, 401);

  const manual = await call(h.baseUrl, "POST", "/api/v1/knowledge", h.adminCred, {
    organizationId: "org-hq",
    title: "Wi-Fi トラブル FAQ",
    content: "再起動を試してください",
    category: "faq",
    tags: ["wifi", "faq"],
  });
  assert.equal(manual.status, 201);

  const noAction = await call(h.baseUrl, "POST", "/api/v1/knowledge", h.adminCred, {
    organizationId: "org-hq",
    title: "AI article",
    content: "x",
    aiGenerated: true,
  });
  assert.equal(noAction.status, 400);

  const aiAction = await call(h.baseUrl, "POST", "/api/v1/ai-actions", h.adminCred, {
    organizationId: "org-hq",
    model: "deepseek:deepseek-chat",
    purpose: "knowledge generation",
    promptHash: "c".repeat(64),
  });
  assert.equal(aiAction.status, 201);
  const aiActionId = aiAction.json.aiAction.id as string;
  const decided = await call(
    h.baseUrl,
    "POST",
    `/api/v1/ai-actions/${aiActionId}/decision`,
    h.adminCred,
    { decision: "approved" },
  );
  assert.equal(decided.status, 200);

  const aiArticle = await call(h.baseUrl, "POST", "/api/v1/knowledge", h.adminCred, {
    organizationId: "org-hq",
    title: "AI generated",
    content: "governed",
    aiGenerated: true,
    aiActionId,
  });
  assert.equal(aiArticle.status, 201);
  const knowledgeId = aiArticle.json.knowledgeArticle.id as string;
  assert.equal(
    (await call(h.baseUrl, "GET", `/api/v1/knowledge/${knowledgeId}`, h.adminCred)).status,
    200,
  );

  const project = await call(h.baseUrl, "POST", "/api/v1/projects", h.adminCred, {
    organizationId: "org-hq",
    projectCode: "P3B-1",
    name: "contract project",
  });
  const pid = project.json.project.id as string;
  const contract = await call(h.baseUrl, "POST", `/api/v1/projects/${pid}/contracts`, h.adminCred, {
    contractNumber: "CN-100",
    title: "本工事契約",
    amount: 1_000_000,
    status: "active",
  });
  assert.equal(contract.status, 201);
  const contractId = contract.json.contract.id as string;
  assert.equal(
    (await call(h.baseUrl, "GET", `/api/v1/contracts/${contractId}`, h.adminCred)).status,
    200,
  );

  const duplicate = await call(
    h.baseUrl,
    "POST",
    `/api/v1/projects/${pid}/contracts`,
    h.adminCred,
    {
      contractNumber: "CN-100",
      title: "duplicate",
    },
  );
  assert.equal(duplicate.status, 400);

  const incidents = await call(h.baseUrl, "GET", "/api/v1/itsm/incidents", h.adminCred);
  assert.equal(incidents.status, 200);
  assert.ok(incidents.json.incidents.length >= 2);
  const created = await call(h.baseUrl, "POST", "/api/v1/itsm/incidents", h.adminCred, {
    title: "tablet offline",
    severity: "high",
  });
  assert.equal(created.status, 201);
  const incidentId = created.json.incident.id as string;
  assert.equal(
    (await call(h.baseUrl, "GET", `/api/v1/itsm/incidents/${incidentId}`, h.adminCred)).status,
    200,
  );

  const audits = h.audit.query((e) =>
    ["knowledge:", "contract:", "itsm:"].some((p) => e.event.action.startsWith(p)),
  );
  assert.ok(audits.some((e) => e.event.action === "knowledge:create"));
  assert.ok(audits.some((e) => e.event.action === "contract:create"));
  assert.ok(audits.some((e) => e.event.action === "itsm:create"));
});

test("daily report submission creates an approval workflow that approves the report", async (t) => {
  const h = await buildHarness();
  t.after(h.close);

  const project = await call(h.baseUrl, "POST", "/api/v1/projects", h.adminCred, {
    organizationId: "org-hq",
    projectCode: "WF-1",
    name: "workflow project",
  });
  const pid = project.json.project.id as string;
  const report = await call(
    h.baseUrl,
    "POST",
    `/api/v1/projects/${pid}/daily-reports`,
    h.adminCred,
    { reportDate: "2026-08-07", workerCount: 3 },
  );
  const reportId = report.json.dailyReport.id as string;

  const submitted = await call(
    h.baseUrl,
    "POST",
    `/api/v1/daily-reports/${reportId}/transition`,
    h.adminCred,
    { status: "submitted" },
  );
  assert.equal(submitted.status, 200);

  const instances = await call(
    h.baseUrl,
    "GET",
    "/api/v1/workflow-instances?status=pending",
    h.adminCred,
  );
  const approval = (
    instances.json.workflowInstances as { id: string; resourceType?: string; resourceId?: string }[]
  ).find((w) => w.resourceType === "daily-report" && w.resourceId === reportId);
  assert.ok(approval, "workflow instance for the daily report must exist");

  const decided = await call(
    h.baseUrl,
    "POST",
    `/api/v1/workflow-instances/${approval.id}/decision`,
    h.adminCred,
    { decision: "approve", comment: "ok" },
  );
  assert.equal(decided.status, 200);

  const approved = await call(h.baseUrl, "GET", `/api/v1/daily-reports/${reportId}`, h.adminCred);
  assert.equal(approved.json.dailyReport.status, "approved");
  assert.ok(h.audit.query((e) => e.event.action === "daily-report:workflow-approved").length >= 1);
});
