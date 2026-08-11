/** Integration tests for Notification Preference API (Enterprise-OS E-11 / ServiceHub S-09). */

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
      permissions: ["notification:read"],
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

test("Notification Preference API — 401 without credential", async (t) => {
  const h = await buildHarness();
  t.after(h.close);
  assert.equal(
    (await call(h.baseUrl, "GET", "/api/v1/notification-preferences/user-1", "")).status,
    401,
  );
});

test("Notification Preference API — PUT creates and GET returns preference", async (t) => {
  const h = await buildHarness();
  t.after(h.close);

  // First GET → 404 (not found)
  const getMissing = await call(
    h.baseUrl,
    "GET",
    "/api/v1/notification-preferences/user-1",
    h.adminCred,
  );
  assert.equal(getMissing.status, 404);

  // PUT creates (upsert)
  const created = await call(
    h.baseUrl,
    "PUT",
    "/api/v1/notification-preferences/user-1",
    h.adminCred,
    {
      emailEnabled: true,
      slackEnabled: false,
      slackWebhookUrl: "https://hooks.slack.com/services/TEST",
    },
  );
  assert.equal(created.status, 201);
  const pref = (
    created.json as { notificationPreference: { userId: string; emailEnabled: boolean } }
  ).notificationPreference;
  assert.equal(pref.userId, "user-1");
  assert.equal(pref.emailEnabled, true);

  // GET returns it
  const getRes = await call(
    h.baseUrl,
    "GET",
    "/api/v1/notification-preferences/user-1",
    h.adminCred,
  );
  assert.equal(getRes.status, 200);

  // PUT updates existing
  const updated = await call(
    h.baseUrl,
    "PUT",
    "/api/v1/notification-preferences/user-1",
    h.adminCred,
    { emailEnabled: false, slackEnabled: true },
  );
  assert.equal(updated.status, 200);
  const updatedPref = (
    updated.json as { notificationPreference: { emailEnabled: boolean; slackEnabled: boolean } }
  ).notificationPreference;
  assert.equal(updatedPref.emailEnabled, false);
  assert.equal(updatedPref.slackEnabled, true);

  // Audit
  assert.ok(h.audit.query((e) => e.event.action === "notification-preference:create").length >= 1);
  assert.ok(h.audit.query((e) => e.event.action === "notification-preference:update").length >= 1);
});

test("Notification Preference API — 403 with viewer (read-only) key for write", async (t) => {
  const h = await buildHarness();
  t.after(h.close);
  const res = await call(
    h.baseUrl,
    "PUT",
    "/api/v1/notification-preferences/user-1",
    h.viewerCred,
    { emailEnabled: true },
  );
  assert.equal(res.status, 403);
});

test("Notification Preference API — 400 on invalid slackWebhookUrl", async (t) => {
  const h = await buildHarness();
  t.after(h.close);
  const res = await call(h.baseUrl, "PUT", "/api/v1/notification-preferences/user-1", h.adminCred, {
    slackWebhookUrl: "http://example.com/webhook",
  });
  assert.equal(res.status, 400);
});

test("Notification Preference API — GET works with viewer (read) key", async (t) => {
  const h = await buildHarness();
  t.after(h.close);

  // First create with admin
  await call(h.baseUrl, "PUT", "/api/v1/notification-preferences/user-v", h.adminCred, {
    emailEnabled: true,
  });

  // Read with viewer
  const res = await call(h.baseUrl, "GET", "/api/v1/notification-preferences/user-v", h.viewerCred);
  assert.equal(res.status, 200);
});
