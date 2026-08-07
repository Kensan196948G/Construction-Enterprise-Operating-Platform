/**
 * Integration tests for the Workflow Instance API (L-02).
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
import type { ApiKeyStore } from "../types.ts";
import type { Result } from "../../domain/common.ts";

function unwrap<T>(r: Result<T>): T {
  if (!r.ok) throw new Error(JSON.stringify(r.error));
  return r.value;
}

interface Harness {
  baseUrl: string;
  adminCred: string;
  readerCred: string;
  orgCred: string;
  noPermCred: string;
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
      name: "Reader",
      description: "",
      scope: "global",
      permissions: ["workflow:read"],
    }),
  );
  const noPermRole = unwrap(
    createRole({
      id: "r-noperm",
      name: "NoPerm",
      description: "",
      scope: "global",
      permissions: ["organization:read"],
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
  const noPermKV = createApiKey("noperm-subject", resolvePermissions([noPermRole]), apiKeyStore);

  const container = {
    repositories: createInMemoryRepositories(),
    auditLog: new AuditLog(),
    apiKeyStore,
  };
  const server = createServer({ port: 0 }, container);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    adminCred: `${adminKV.key}:${adminKV.secret}`,
    readerCred: `${readerKV.key}:${readerKV.secret}`,
    orgCred: `${orgKV.key}:${orgKV.secret}`,
    noPermCred: `${noPermKV.key}:${noPermKV.secret}`,
    close: () =>
      new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve()))),
  };
}

async function req(
  method: string,
  baseUrl: string,
  path: string,
  cred: string | null,
  body?: unknown,
): Promise<{ status: number; body: unknown }> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (cred !== null) headers["Authorization"] = `Bearer ${cred}`;
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, body: json };
}

interface InstanceLike {
  readonly id: string;
  readonly status: string;
  readonly stepKey: string;
  readonly decidedBy?: string;
}

function instanceOf(res: { body: unknown }): InstanceLike {
  const body = res.body as { workflowInstance?: InstanceLike };
  const instance = body.workflowInstance;
  if (instance === undefined) throw new Error("missing workflowInstance");
  return instance;
}

function listBody(res: { body: unknown }): {
  total: number;
  workflowInstances: readonly InstanceLike[];
} {
  return res.body as {
    total: number;
    workflowInstances: readonly InstanceLike[];
  };
}

const get = (baseUrl: string, path: string, cred: string | null) => req("GET", baseUrl, path, cred);
const post = (baseUrl: string, path: string, cred: string | null, body: unknown) =>
  req("POST", baseUrl, path, cred, body);

async function seedWorkflow(baseUrl: string, cred: string): Promise<string> {
  const res = await post(baseUrl, "/api/v1/workflows", cred, {
    id: "wf-approval-01",
    name: "承認フロー",
    type: "approval",
    status: "active",
    steps: [
      { key: "submit", name: "申請", requiredPermission: "workflow:read" },
      { key: "approve", name: "承認", requiredPermission: "workflow:write" },
    ],
  });
  assert.equal(res.status, 201);
  return "wf-approval-01";
}

test("workflow-instances: create → list → approve flow with audit", async (t) => {
  const h = await buildHarness();
  t.after(() => h.close());
  await seedWorkflow(h.baseUrl, h.adminCred);

  const created = await post(h.baseUrl, "/api/v1/workflow-instances", h.adminCred, {
    workflowId: "wf-approval-01",
    subject: "user-requester",
    organizationId: "org-hq",
  });
  assert.equal(created.status, 201);
  const createdInstance = instanceOf(created);
  const id = createdInstance.id;
  assert.equal(createdInstance.status, "pending");
  assert.equal(createdInstance.stepKey, "submit");

  const list = await get(h.baseUrl, "/api/v1/workflow-instances", h.adminCred);
  assert.equal(list.status, 200);
  assert.equal(listBody(list).total, 1);

  const decided = await post(h.baseUrl, `/api/v1/workflow-instances/${id}/decision`, h.adminCred, {
    decision: "approve",
    comment: "承認しました",
  });
  assert.equal(decided.status, 200);
  const decidedInstance = instanceOf(decided);
  assert.equal(decidedInstance.status, "approved");
  assert.equal(decidedInstance.decidedBy, "admin-subject");

  // A decided instance cannot be decided again.
  const again = await post(h.baseUrl, `/api/v1/workflow-instances/${id}/decision`, h.adminCred, {
    decision: "reject",
  });
  assert.equal(again.status, 400);

  const audit = await get(h.baseUrl, "/api/v1/governance/audit?limit=200", h.adminCred);
  const auditBody = audit.body as { entries: readonly { event: { action: string } }[] };
  const actions = auditBody.entries.map((e) => e.event.action);
  assert.ok(actions.includes("workflow-instance:create"));
  assert.ok(actions.includes("workflow-instance:decision"));
});

test("workflow-instances: reader can list but not mutate", async (t) => {
  const h = await buildHarness();
  t.after(() => h.close());
  await seedWorkflow(h.baseUrl, h.adminCred);

  const created = await post(h.baseUrl, "/api/v1/workflow-instances", h.readerCred, {
    workflowId: "wf-approval-01",
    subject: "user-requester",
  });
  assert.equal(created.status, 403);

  const list = await get(h.baseUrl, "/api/v1/workflow-instances", h.readerCred);
  assert.equal(list.status, 200);
});

test("workflow-instances: unauthenticated and no-permission are rejected", async (t) => {
  const h = await buildHarness();
  t.after(() => h.close());

  const noCred = await get(h.baseUrl, "/api/v1/workflow-instances", null);
  assert.equal(noCred.status, 401);
  const noPerm = await get(h.baseUrl, "/api/v1/workflow-instances", h.noPermCred);
  assert.equal(noPerm.status, 403);
});

test("workflow-instances: org-scoped credential is isolated", async (t) => {
  const h = await buildHarness();
  t.after(() => h.close());
  await seedWorkflow(h.baseUrl, h.adminCred);

  const adminCreated = await post(h.baseUrl, "/api/v1/workflow-instances", h.adminCred, {
    workflowId: "wf-approval-01",
    subject: "user-hq",
    organizationId: "org-hq",
  });
  assert.equal(adminCreated.status, 201);
  const hqId = instanceOf(adminCreated).id;

  const orgCreated = await post(h.baseUrl, "/api/v1/workflow-instances", h.orgCred, {
    workflowId: "wf-approval-01",
    subject: "user-site",
  });
  assert.equal(orgCreated.status, 201);
  const siteId = instanceOf(orgCreated).id;

  // Cross-org decision must 404 (non-disclosure).
  const cross = await post(h.baseUrl, `/api/v1/workflow-instances/${hqId}/decision`, h.orgCred, {
    decision: "approve",
  });
  assert.equal(cross.status, 404);

  const orgList = await get(h.baseUrl, "/api/v1/workflow-instances", h.orgCred);
  assert.equal(orgList.status, 200);
  const orgListBody = listBody(orgList);
  assert.equal(orgListBody.total, 1);
  assert.equal(orgListBody.workflowInstances[0]?.id, siteId);
});

test("workflow-instances: invalid inputs and inactive workflows are rejected", async (t) => {
  const h = await buildHarness();
  t.after(() => h.close());

  const missing = await post(h.baseUrl, "/api/v1/workflow-instances", h.adminCred, {
    subject: "user-requester",
  });
  assert.equal(missing.status, 400);

  const unknown = await post(h.baseUrl, "/api/v1/workflow-instances", h.adminCred, {
    workflowId: "wf-nope",
    subject: "user-requester",
  });
  assert.equal(unknown.status, 400);

  await post(h.baseUrl, "/api/v1/workflows", h.adminCred, {
    id: "wf-draft",
    name: "下書き",
    type: "approval",
    status: "draft",
    steps: [{ key: "approve", name: "承認", requiredPermission: "workflow:write" }],
  });
  const draft = await post(h.baseUrl, "/api/v1/workflow-instances", h.adminCred, {
    workflowId: "wf-draft",
    subject: "user-requester",
  });
  assert.equal(draft.status, 400);

  const invalidStatus = await get(
    h.baseUrl,
    "/api/v1/workflow-instances?status=bogus",
    h.adminCred,
  );
  assert.equal(invalidStatus.status, 400);
});

test("workflow-instances: cancel transitions pending → cancelled", async (t) => {
  const h = await buildHarness();
  t.after(() => h.close());
  await seedWorkflow(h.baseUrl, h.adminCred);
  const created = await post(h.baseUrl, "/api/v1/workflow-instances", h.adminCred, {
    workflowId: "wf-approval-01",
    subject: "user-requester",
    organizationId: "org-hq",
  });
  const id = instanceOf(created).id;
  const cancelled = await post(
    h.baseUrl,
    `/api/v1/workflow-instances/${id}/cancel`,
    h.adminCred,
    {},
  );
  assert.equal(cancelled.status, 200);
  assert.equal(instanceOf(cancelled).status, "cancelled");
  const again = await post(h.baseUrl, `/api/v1/workflow-instances/${id}/cancel`, h.adminCred, {});
  assert.equal(again.status, 400);
});
