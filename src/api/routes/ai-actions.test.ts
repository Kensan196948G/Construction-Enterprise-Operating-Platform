/**
 * Integration tests for AI action governance API (Y-09).
 */

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

const HASH = "b".repeat(64);

interface Harness {
  baseUrl: string;
  adminCred: string;
  aiWriterCred: string;
  aiReaderCred: string;
  aiApproverCred: string;
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
  const writerRole = unwrap(
    createRole({
      id: "r-writer",
      name: "AI Writer",
      description: "",
      scope: "global",
      permissions: ["ai:write"],
    }),
  );
  const readerRole = unwrap(
    createRole({
      id: "r-reader",
      name: "AI Reader",
      description: "",
      scope: "global",
      permissions: ["ai:read"],
    }),
  );
  const approverRole = unwrap(
    createRole({
      id: "r-approver",
      name: "AI Approver",
      description: "",
      scope: "global",
      permissions: ["ai:approve"],
    }),
  );
  const adminKV = createApiKey("admin-subject", resolvePermissions([adminRole]), apiKeyStore);
  const writerKV = createApiKey("writer-subject", resolvePermissions([writerRole]), apiKeyStore);
  const readerKV = createApiKey("reader-subject", resolvePermissions([readerRole]), apiKeyStore);
  const approverKV = createApiKey(
    "approver-subject",
    resolvePermissions([approverRole]),
    apiKeyStore,
  );
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
    aiWriterCred: `${writerKV.key}:${writerKV.secret}`,
    aiReaderCred: `${readerKV.key}:${readerKV.secret}`,
    aiApproverCred: `${approverKV.key}:${approverKV.secret}`,
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
  return { status: res.status, json: await res.json().catch(() => ({})) };
}

test("ai actions require auth, read/write/approve permissions and audit", async (t) => {
  const h = await buildHarness();
  t.after(h.close);

  const noAuth = await call(h.baseUrl, "GET", "/api/v1/ai-actions", "");
  assert.equal(noAuth.status, 401);

  const forbidden = await call(h.baseUrl, "GET", "/api/v1/ai-actions", h.aiWriterCred);
  assert.equal(forbidden.status, 403);

  const created = await call(h.baseUrl, "POST", "/api/v1/ai-actions", h.aiWriterCred, {
    model: "deepseek:deepseek-chat",
    purpose: "summarize incident",
    promptHash: HASH,
  });
  assert.equal(created.status, 201);
  assert.equal(created.json.aiAction.status, "pending");
  const id = created.json.aiAction.id as string;

  const invalid = await call(h.baseUrl, "POST", "/api/v1/ai-actions", h.aiWriterCred, {
    model: "m",
    purpose: "p",
    promptHash: "bad",
  });
  assert.equal(invalid.status, 400);

  const list = await call(h.baseUrl, "GET", "/api/v1/ai-actions", h.aiReaderCred);
  assert.equal(list.status, 200);
  assert.equal(list.json.total, 1);
  assert.equal(list.json.aiActions[0].id, id);

  const noApprove = await call(
    h.baseUrl,
    "POST",
    `/api/v1/ai-actions/${id}/decision`,
    h.aiReaderCred,
    {
      decision: "approved",
    },
  );
  assert.equal(noApprove.status, 403);

  const decided = await call(
    h.baseUrl,
    "POST",
    `/api/v1/ai-actions/${id}/decision`,
    h.aiApproverCred,
    {
      decision: "approved",
      note: "ok",
    },
  );
  assert.equal(decided.status, 200);
  assert.equal(decided.json.aiAction.status, "approved");

  const double = await call(
    h.baseUrl,
    "POST",
    `/api/v1/ai-actions/${id}/decision`,
    h.aiApproverCred,
    {
      decision: "rejected",
    },
  );
  assert.equal(double.status, 400);

  const audits = h.audit.query((e) => e.event.action.startsWith("ai-action:"));
  assert.ok(audits.some((e) => e.event.action === "ai-action:create"));
  assert.ok(audits.some((e) => e.event.action === "ai-action:decide"));
});

test("ai actions enforce tenant scope", async (t) => {
  const h = await buildHarness();
  t.after(h.close);

  const mismatch = await call(h.baseUrl, "POST", "/api/v1/ai-actions", h.orgCred, {
    model: "m",
    purpose: "p",
    promptHash: HASH,
    organizationId: "org-other",
  });
  assert.equal(mismatch.status, 400);

  const created = await call(h.baseUrl, "POST", "/api/v1/ai-actions", h.orgCred, {
    model: "m",
    purpose: "p",
    promptHash: HASH,
  });
  assert.equal(created.status, 201);
  assert.equal(created.json.aiAction.organizationId, "org-site");

  const orgList = await call(h.baseUrl, "GET", "/api/v1/ai-actions", h.orgCred);
  assert.equal(orgList.json.total, 1);

  const globalList = await call(h.baseUrl, "GET", "/api/v1/ai-actions", h.adminCred);
  assert.equal(globalList.json.total, 1);
});

test("AI governance metadata and operation stop are enforced", async (t) => {
  const h = await buildHarness();
  t.after(h.close);

  const created = await call(h.baseUrl, "POST", "/api/v1/ai-actions", h.aiWriterCred, {
    model: "deepseek:deepseek-chat",
    purpose: "工事写真の異常検知",
    promptHash: HASH,
    evidenceRefs: ["doc-1", "https://example.com/standard"],
    inputRetentionDays: 0,
    piiSensitive: true,
    wrongAnswerMitigation: "異常判定は現場担当者の確認を必須とする",
  });
  assert.equal(created.status, 201);
  assert.deepEqual(created.json.aiAction.evidenceRefs, ["doc-1", "https://example.com/standard"]);
  assert.equal(created.json.aiAction.inputRetentionDays, 0);
  assert.equal(created.json.aiAction.piiSensitive, true);
  assert.equal(created.json.aiAction.operationStatus, "operational");

  const stopped = await call(
    h.baseUrl,
    "POST",
    `/api/v1/ai-actions/${created.json.aiAction.id}/status`,
    h.aiApproverCred,
    { status: "stopped", reason: "モデル障害のため利用停止" },
  );
  assert.equal(stopped.status, 200);
  assert.equal(stopped.json.aiAction.operationStatus, "stopped");

  const forbiddenStop = await call(
    h.baseUrl,
    "POST",
    `/api/v1/ai-actions/${created.json.aiAction.id}/status`,
    h.aiWriterCred,
    { status: "stopped" },
  );
  assert.equal(forbiddenStop.status, 403);

  const invalid = await call(
    h.baseUrl,
    "POST",
    `/api/v1/ai-actions/${created.json.aiAction.id}/status`,
    h.aiApproverCred,
    { status: "exploded" },
  );
  assert.equal(invalid.status, 400);
});
