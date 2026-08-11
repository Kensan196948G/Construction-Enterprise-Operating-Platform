/** Integration tests for Document API (Enterprise-OS E-03). */

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
      permissions: ["document:read"],
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

test("Document API — 401 without credential", async (t) => {
  const h = await buildHarness();
  t.after(h.close);
  assert.equal((await call(h.baseUrl, "GET", "/api/v1/documents", "")).status, 401);
});

test("Document API — CRUD normal path with admin key", async (t) => {
  const h = await buildHarness();
  t.after(h.close);

  // List (empty)
  const listEmpty = await call(h.baseUrl, "GET", "/api/v1/documents", h.adminCred);
  assert.equal(listEmpty.status, 200);
  assert.ok(Array.isArray((listEmpty.json as { documents: unknown[] }).documents));

  // Create
  const created = await call(h.baseUrl, "POST", "/api/v1/documents", h.adminCred, {
    organizationId: "org-hq",
    title: "構造図 A-1",
    documentType: "drawing",
    revision: 1,
    status: "review",
    tags: ["structure", "A-block"],
  });
  assert.equal(created.status, 201);
  const doc = (created.json as { document: { id: string } }).document;
  assert.ok(doc.id);

  // Get by ID
  const getRes = await call(h.baseUrl, "GET", `/api/v1/documents/${doc.id}`, h.adminCred);
  assert.equal(getRes.status, 200);
  const got = (getRes.json as { document: { title: string } }).document;
  assert.equal(got.title, "構造図 A-1");

  // List (now has one)
  const list = await call(h.baseUrl, "GET", "/api/v1/documents", h.adminCred);
  assert.equal((list.json as { count: number }).count, 1);

  // Delete
  const del = await call(h.baseUrl, "DELETE", `/api/v1/documents/${doc.id}`, h.adminCred);
  assert.equal(del.status, 200);

  // Gone
  const afterDel = await call(h.baseUrl, "GET", `/api/v1/documents/${doc.id}`, h.adminCred);
  assert.equal(afterDel.status, 404);

  // Audit
  assert.ok(h.audit.query((e) => e.event.action === "document:create").length >= 1);
  assert.ok(h.audit.query((e) => e.event.action === "document:delete").length >= 1);
});

test("Document API — 403 with viewer (read-only) key for write", async (t) => {
  const h = await buildHarness();
  t.after(h.close);
  const res = await call(h.baseUrl, "POST", "/api/v1/documents", h.viewerCred, {
    organizationId: "org-hq",
    title: "test",
  });
  assert.equal(res.status, 403);
});

test("Document API — 400 on invalid document type", async (t) => {
  const h = await buildHarness();
  t.after(h.close);
  const res = await call(h.baseUrl, "POST", "/api/v1/documents", h.adminCred, {
    organizationId: "org-hq",
    title: "test",
    documentType: "blueprint",
  });
  assert.equal(res.status, 400);
});

test("Document API — 400 on invalid status", async (t) => {
  const h = await buildHarness();
  t.after(h.close);
  const res = await call(h.baseUrl, "POST", "/api/v1/documents", h.adminCred, {
    organizationId: "org-hq",
    title: "test",
    status: "deleted",
  });
  assert.equal(res.status, 400);
});

test("Document API — 400 on validation failure (empty title)", async (t) => {
  const h = await buildHarness();
  t.after(h.close);
  const res = await call(h.baseUrl, "POST", "/api/v1/documents", h.adminCred, {
    organizationId: "org-hq",
    title: "",
  });
  assert.equal(res.status, 400);
});

test("Document API — 404 for non-existent document", async (t) => {
  const h = await buildHarness();
  t.after(h.close);
  const res = await call(h.baseUrl, "GET", "/api/v1/documents/does-not-exist", h.adminCred);
  assert.equal(res.status, 404);
});

test("Document API — filter by type", async (t) => {
  const h = await buildHarness();
  t.after(h.close);

  await call(h.baseUrl, "POST", "/api/v1/documents", h.adminCred, {
    organizationId: "org-hq",
    title: "safety doc",
    documentType: "safety",
  });
  await call(h.baseUrl, "POST", "/api/v1/documents", h.adminCred, {
    organizationId: "org-hq",
    title: "quality doc",
    documentType: "quality",
  });

  const bySafety = await call(h.baseUrl, "GET", "/api/v1/documents?type=safety", h.adminCred);
  assert.equal(bySafety.status, 200);
  assert.equal((bySafety.json as { count: number }).count, 1);

  const badType = await call(h.baseUrl, "GET", "/api/v1/documents?type=blueprint", h.adminCred);
  assert.equal(badType.status, 400);
});
