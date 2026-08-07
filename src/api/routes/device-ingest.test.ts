/**
 * Integration tests for device agent ingest API (D-01..D-03).
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

interface Harness {
  baseUrl: string;
  adminCred: string;
  deviceWriterCred: string;
  noPermCred: string;
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
      name: "Device Writer",
      description: "",
      scope: "global",
      permissions: ["device:write"],
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
  const writerKV = createApiKey("writer-subject", resolvePermissions([writerRole]), apiKeyStore);
  const noPermKV = createApiKey("noperm-subject", resolvePermissions([noPermRole]), apiKeyStore);
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
    deviceWriterCred: `${writerKV.key}:${writerKV.secret}`,
    noPermCred: `${noPermKV.key}:${noPermKV.secret}`,
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

test("device register/heartbeat/inventory lifecycle with permissions and audit", async (t) => {
  const h = await buildHarness();
  t.after(h.close);

  const noAuth = await call(h.baseUrl, "POST", "/api/v1/devices/register", "");
  assert.equal(noAuth.status, 401);

  const noPerm = await call(h.baseUrl, "POST", "/api/v1/devices/register", h.noPermCred, {
    id: "device-1",
    organizationId: "org-hq",
    kind: "laptop",
  });
  assert.equal(noPerm.status, 403);

  const registered = await call(h.baseUrl, "POST", "/api/v1/devices/register", h.deviceWriterCred, {
    id: "device-1",
    organizationId: "org-hq",
    kind: "laptop",
    status: "provisioned",
    metadata: { os: "windows11" },
  });
  assert.equal(registered.status, 201);
  assert.equal(registered.json.device.metadata.os, "windows11");

  const duplicate = await call(h.baseUrl, "POST", "/api/v1/devices/register", h.deviceWriterCred, {
    id: "device-1",
    organizationId: "org-hq",
    kind: "laptop",
  });
  assert.equal(duplicate.status, 400);

  const beat = await call(
    h.baseUrl,
    "POST",
    "/api/v1/devices/device-1/heartbeat",
    h.deviceWriterCred,
    {
      status: "active",
    },
  );
  assert.equal(beat.status, 200);
  assert.equal(beat.json.device.status, "active");
  assert.ok(beat.json.device.lastSeenAt);

  const inventory = await call(
    h.baseUrl,
    "POST",
    "/api/v1/devices/device-1/inventory",
    h.deviceWriterCred,
    {
      metadata: { cpu: "i7", os: "windows11-24h2" },
    },
  );
  assert.equal(inventory.status, 200);
  assert.equal(inventory.json.device.metadata.os, "windows11-24h2");
  assert.equal(inventory.json.device.metadata.cpu, "i7");

  const missing = await call(
    h.baseUrl,
    "POST",
    "/api/v1/devices/nope/heartbeat",
    h.deviceWriterCred,
  );
  assert.equal(missing.status, 404);

  const audits = h.audit.query((e) => e.event.action.startsWith("device:"));
  assert.ok(audits.some((e) => e.event.action === "device:register"));
  assert.ok(audits.some((e) => e.event.action === "device:heartbeat"));
  assert.ok(audits.some((e) => e.event.action === "device:inventory"));
});

test("device register enforces credential tenant scope", async (t) => {
  const h = await buildHarness();
  t.after(h.close);

  const mismatch = await call(h.baseUrl, "POST", "/api/v1/devices/register", h.orgCred, {
    id: "device-2",
    organizationId: "org-other",
    kind: "tablet",
  });
  assert.equal(mismatch.status, 400);

  const created = await call(h.baseUrl, "POST", "/api/v1/devices/register", h.orgCred, {
    id: "device-2",
    kind: "tablet",
  });
  assert.equal(created.status, 201);
  assert.equal(created.json.device.organizationId, "org-site");
});
