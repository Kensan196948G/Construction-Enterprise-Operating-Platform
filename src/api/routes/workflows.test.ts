/**
 * Integration tests for Workflow CRUD API endpoints.
 *
 * Covers: GET list, GET/:id, POST, PUT/:id, DELETE/:id
 * and authorization guards for workflow:read / workflow:write.
 * Each test gets its own isolated HTTP server on a random OS-assigned port.
 */

import { test, after } from "node:test";
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

// ---------------------------------------------------------------------------
// Harness
// ---------------------------------------------------------------------------

interface Harness {
  baseUrl: string;
  adminCred: string;
  readerCred: string;
  noPermCred: string;
  noCred: null;
  close(): Promise<void>;
}

async function buildHarness(): Promise<Harness> {
  const apiKeyStore: ApiKeyStore = new Map();

  const adminRole = unwrap(
    createRole({ id: "r-admin", name: "Admin", description: "", scope: "global", permissions: ["*:*"] }),
  );
  const readerRole = unwrap(
    createRole({
      id: "r-reader",
      name: "WorkflowReader",
      description: "",
      scope: "global",
      permissions: ["workflow:read"],
    }),
  );
  const noPermRole = unwrap(
    createRole({
      id: "r-noperm",
      name: "NoWorkflow",
      description: "",
      scope: "global",
      permissions: ["organization:read"],
    }),
  );

  const adminKV = createApiKey("admin-subject", resolvePermissions([adminRole]), apiKeyStore);
  const readerKV = createApiKey("reader-subject", resolvePermissions([readerRole]), apiKeyStore);
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
    noPermCred: `${noPermKV.key}:${noPermKV.secret}`,
    noCred: null,
    close: () => new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve()))),
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

const get = (baseUrl: string, path: string, cred: string | null) => req("GET", baseUrl, path, cred);
const post = (baseUrl: string, path: string, cred: string | null, body: unknown) =>
  req("POST", baseUrl, path, cred, body);
const put = (baseUrl: string, path: string, cred: string | null, body: unknown) =>
  req("PUT", baseUrl, path, cred, body);
const del = (baseUrl: string, path: string, cred: string | null) => req("DELETE", baseUrl, path, cred);

const WORKFLOW_PAYLOAD = {
  id: "wf-approval-01",
  name: "Purchase Approval",
  type: "approval",
  status: "draft",
  steps: [
    { key: "submit", name: "Submit Request", requiredPermission: "workflow:write" },
    { key: "approve", name: "Manager Approval", requiredPermission: "workflow:write" },
  ],
};

// ---------------------------------------------------------------------------
// POST /api/v1/workflows
// ---------------------------------------------------------------------------

test("POST /api/v1/workflows — 201 with admin key", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { status, body } = await post(h.baseUrl, "/api/v1/workflows", h.adminCred, WORKFLOW_PAYLOAD);
  assert.equal(status, 201);
  const b = body as { id: string; name: string; type: string; status: string; steps: unknown[] };
  assert.equal(b.id, "wf-approval-01");
  assert.equal(b.name, "Purchase Approval");
  assert.equal(b.type, "approval");
  assert.equal(b.status, "draft");
  assert.equal(b.steps.length, 2);
});

test("POST /api/v1/workflows — 403 with reader key (no write permission)", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { status } = await post(h.baseUrl, "/api/v1/workflows", h.readerCred, WORKFLOW_PAYLOAD);
  assert.equal(status, 403);
});

test("POST /api/v1/workflows — 401 without credentials", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { status } = await post(h.baseUrl, "/api/v1/workflows", h.noCred, WORKFLOW_PAYLOAD);
  assert.equal(status, 401);
});

test("POST /api/v1/workflows — 400 on empty name", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { status, body } = await post(h.baseUrl, "/api/v1/workflows", h.adminCred, {
    ...WORKFLOW_PAYLOAD,
    name: "",
  });
  assert.equal(status, 400);
  const b = body as { error: string };
  assert.equal(b.error, "Bad Request");
});

test("POST /api/v1/workflows — 400 on invalid type", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { status } = await post(h.baseUrl, "/api/v1/workflows", h.adminCred, {
    ...WORKFLOW_PAYLOAD,
    type: "invalid-type",
  });
  assert.equal(status, 400);
});

test("POST /api/v1/workflows — 400 on empty steps array", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { status } = await post(h.baseUrl, "/api/v1/workflows", h.adminCred, {
    ...WORKFLOW_PAYLOAD,
    steps: [],
  });
  assert.equal(status, 400);
});

test("POST /api/v1/workflows — 400 on malformed steps (missing fields)", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { status } = await post(h.baseUrl, "/api/v1/workflows", h.adminCred, {
    ...WORKFLOW_PAYLOAD,
    steps: [{ key: "submit" }],
  });
  assert.equal(status, 400);
});

test("POST /api/v1/workflows — 400 on duplicate step keys", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { status } = await post(h.baseUrl, "/api/v1/workflows", h.adminCred, {
    ...WORKFLOW_PAYLOAD,
    steps: [
      { key: "submit", name: "A", requiredPermission: "workflow:write" },
      { key: "submit", name: "B", requiredPermission: "workflow:write" },
    ],
  });
  assert.equal(status, 400);
});

// ---------------------------------------------------------------------------
// GET /api/v1/workflows (list)
// ---------------------------------------------------------------------------

test("GET /api/v1/workflows — 200 empty list initially", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { status, body } = await get(h.baseUrl, "/api/v1/workflows", h.readerCred);
  assert.equal(status, 200);
  const b = body as { workflows: unknown[]; total: number };
  assert.equal(b.total, 0);
  assert.equal(b.workflows.length, 0);
});

test("GET /api/v1/workflows — 200 list contains created workflow", async () => {
  const h = await buildHarness();
  after(() => h.close());
  await post(h.baseUrl, "/api/v1/workflows", h.adminCred, WORKFLOW_PAYLOAD);
  const { status, body } = await get(h.baseUrl, "/api/v1/workflows", h.readerCred);
  assert.equal(status, 200);
  const b = body as { workflows: { id: string }[]; total: number };
  assert.equal(b.total, 1);
  assert.equal(b.workflows[0]!.id, "wf-approval-01");
});

test("GET /api/v1/workflows — 403 with noPermCred", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { status } = await get(h.baseUrl, "/api/v1/workflows", h.noPermCred);
  assert.equal(status, 403);
});

test("GET /api/v1/workflows — 401 without credentials", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { status } = await get(h.baseUrl, "/api/v1/workflows", h.noCred);
  assert.equal(status, 401);
});

test("GET /api/v1/workflows?type=approval — filters by type", async () => {
  const h = await buildHarness();
  after(() => h.close());
  await post(h.baseUrl, "/api/v1/workflows", h.adminCred, WORKFLOW_PAYLOAD);
  await post(h.baseUrl, "/api/v1/workflows", h.adminCred, {
    ...WORKFLOW_PAYLOAD,
    id: "wf-notif-01",
    name: "Notification Flow",
    type: "notification",
  });
  const { status, body } = await get(h.baseUrl, "/api/v1/workflows?type=approval", h.readerCred);
  assert.equal(status, 200);
  const b = body as { workflows: { type: string }[]; total: number };
  assert.equal(b.total, 1);
  assert.equal(b.workflows[0]!.type, "approval");
});

test("GET /api/v1/workflows?status=active — filters by status", async () => {
  const h = await buildHarness();
  after(() => h.close());
  await post(h.baseUrl, "/api/v1/workflows", h.adminCred, WORKFLOW_PAYLOAD);
  await post(h.baseUrl, "/api/v1/workflows", h.adminCred, {
    ...WORKFLOW_PAYLOAD,
    id: "wf-active-01",
    name: "Active Flow",
    status: "active",
  });
  const { status, body } = await get(h.baseUrl, "/api/v1/workflows?status=active", h.readerCred);
  assert.equal(status, 200);
  const b = body as { workflows: { status: string }[]; total: number };
  assert.equal(b.total, 1);
  assert.equal(b.workflows[0]!.status, "active");
});

test("GET /api/v1/workflows — pagination works", async () => {
  const h = await buildHarness();
  after(() => h.close());
  for (let i = 0; i < 5; i++) {
    await post(h.baseUrl, "/api/v1/workflows", h.adminCred, {
      ...WORKFLOW_PAYLOAD,
      id: `wf-pg-${i}`,
      name: `Workflow ${i}`,
    });
  }
  const { status, body } = await get(h.baseUrl, "/api/v1/workflows?limit=2&offset=0", h.readerCred);
  assert.equal(status, 200);
  const b = body as { workflows: unknown[]; total: number; limit: number; offset: number; count: number };
  assert.equal(b.total, 5);
  assert.equal(b.count, 2);
  assert.equal(b.limit, 2);
  assert.equal(b.offset, 0);
});

// ---------------------------------------------------------------------------
// GET /api/v1/workflows/:id
// ---------------------------------------------------------------------------

test("GET /api/v1/workflows/:id — 200 for existing workflow", async () => {
  const h = await buildHarness();
  after(() => h.close());
  await post(h.baseUrl, "/api/v1/workflows", h.adminCred, WORKFLOW_PAYLOAD);
  const { status, body } = await get(h.baseUrl, "/api/v1/workflows/wf-approval-01", h.readerCred);
  assert.equal(status, 200);
  const b = body as { id: string };
  assert.equal(b.id, "wf-approval-01");
});

test("GET /api/v1/workflows/:id — 404 for unknown id", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { status } = await get(h.baseUrl, "/api/v1/workflows/not-exist", h.readerCred);
  assert.equal(status, 404);
});

test("GET /api/v1/workflows/:id — 403 with noPermCred", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { status } = await get(h.baseUrl, "/api/v1/workflows/wf-approval-01", h.noPermCred);
  assert.equal(status, 403);
});

// ---------------------------------------------------------------------------
// PUT /api/v1/workflows/:id
// ---------------------------------------------------------------------------

test("PUT /api/v1/workflows/:id — 200 updates name and status", async () => {
  const h = await buildHarness();
  after(() => h.close());
  await post(h.baseUrl, "/api/v1/workflows", h.adminCred, WORKFLOW_PAYLOAD);
  const { status, body } = await put(
    h.baseUrl,
    "/api/v1/workflows/wf-approval-01",
    h.adminCred,
    { name: "Updated Approval", status: "active" },
  );
  assert.equal(status, 200);
  const b = body as { name: string; status: string; type: string };
  assert.equal(b.name, "Updated Approval");
  assert.equal(b.status, "active");
  assert.equal(b.type, "approval");
});

test("PUT /api/v1/workflows/:id — 200 updates steps", async () => {
  const h = await buildHarness();
  after(() => h.close());
  await post(h.baseUrl, "/api/v1/workflows", h.adminCred, WORKFLOW_PAYLOAD);
  const newSteps = [
    { key: "review", name: "Review Step", requiredPermission: "workflow:read" },
  ];
  const { status, body } = await put(
    h.baseUrl,
    "/api/v1/workflows/wf-approval-01",
    h.adminCred,
    { steps: newSteps },
  );
  assert.equal(status, 200);
  const b = body as { steps: { key: string }[] };
  assert.equal(b.steps.length, 1);
  assert.equal(b.steps[0]!.key, "review");
});

test("PUT /api/v1/workflows/:id — 404 for unknown id", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { status } = await put(h.baseUrl, "/api/v1/workflows/not-exist", h.adminCred, { name: "X" });
  assert.equal(status, 404);
});

test("PUT /api/v1/workflows/:id — 403 with reader key", async () => {
  const h = await buildHarness();
  after(() => h.close());
  await post(h.baseUrl, "/api/v1/workflows", h.adminCred, WORKFLOW_PAYLOAD);
  const { status } = await put(
    h.baseUrl,
    "/api/v1/workflows/wf-approval-01",
    h.readerCred,
    { name: "X" },
  );
  assert.equal(status, 403);
});

test("PUT /api/v1/workflows/:id — 400 on malformed steps in body", async () => {
  const h = await buildHarness();
  after(() => h.close());
  await post(h.baseUrl, "/api/v1/workflows", h.adminCred, WORKFLOW_PAYLOAD);
  const { status } = await put(
    h.baseUrl,
    "/api/v1/workflows/wf-approval-01",
    h.adminCred,
    { steps: [{ key: "bad" }] },
  );
  assert.equal(status, 400);
});

// ---------------------------------------------------------------------------
// DELETE /api/v1/workflows/:id
// ---------------------------------------------------------------------------

test("DELETE /api/v1/workflows/:id — 204 deletes existing workflow", async () => {
  const h = await buildHarness();
  after(() => h.close());
  await post(h.baseUrl, "/api/v1/workflows", h.adminCred, WORKFLOW_PAYLOAD);
  const { status } = await del(h.baseUrl, "/api/v1/workflows/wf-approval-01", h.adminCred);
  assert.equal(status, 204);
  const { status: getStatus } = await get(h.baseUrl, "/api/v1/workflows/wf-approval-01", h.readerCred);
  assert.equal(getStatus, 404);
});

test("DELETE /api/v1/workflows/:id — 404 for unknown id", async () => {
  const h = await buildHarness();
  after(() => h.close());
  const { status } = await del(h.baseUrl, "/api/v1/workflows/not-exist", h.adminCred);
  assert.equal(status, 404);
});

test("DELETE /api/v1/workflows/:id — 403 with reader key", async () => {
  const h = await buildHarness();
  after(() => h.close());
  await post(h.baseUrl, "/api/v1/workflows", h.adminCred, WORKFLOW_PAYLOAD);
  const { status } = await del(h.baseUrl, "/api/v1/workflows/wf-approval-01", h.readerCred);
  assert.equal(status, 403);
});
