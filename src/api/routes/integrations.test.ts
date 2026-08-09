/** Integration tests for webhook receiving, event queue, and retry delivery. */

import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import type { AddressInfo } from "node:net";
import { createServer as createHttpServer, type Server } from "node:http";

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

async function buildHarness() {
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
  const admin = createApiKey("admin", resolvePermissions([adminRole]), apiKeyStore);
  const audit = new AuditLog();
  const server = createServer(
    { port: 0 },
    { repositories: createInMemoryRepositories(), auditLog: audit, apiKeyStore },
  );
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    adminCred: `${admin.key}:${admin.secret}`,
    audit,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

async function call(
  baseUrl: string,
  method: string,
  path: string,
  credential: string,
  body?: unknown,
  extraHeaders: Record<string, string> = {},
): Promise<{ status: number; json: Record<string, unknown> }> {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${credential}`,
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...extraHeaders,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  return { status: res.status, json: (await res.json().catch(() => ({}))) as never };
}

function rec(value: unknown): Record<string, unknown> {
  return (typeof value === "object" && value !== null ? value : {}) as Record<string, unknown>;
}

function listen(server: Server): Promise<string> {
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address() as AddressInfo;
      resolve(`http://127.0.0.1:${port}`);
    });
  });
}

test("inbound webhook requires auth, enforces idempotency, and records audit", async (t) => {
  const h = await buildHarness();
  t.after(h.close);

  assert.equal(
    (await call(h.baseUrl, "POST", "/api/v1/integrations/webhooks/dx-idea", "")).status,
    401,
  );

  const body = {
    idempotencyKey: "idea-1",
    eventType: "idea.submitted",
    title: "新アイデア",
    payload: { ideaId: "i-1" },
  };
  const first = await call(
    h.baseUrl,
    "POST",
    "/api/v1/integrations/webhooks/dx-idea",
    h.adminCred,
    body,
  );
  assert.equal(first.status, 202);
  assert.equal(rec(first.json["event"])["status"], "received");

  const duplicate = await call(
    h.baseUrl,
    "POST",
    "/api/v1/integrations/webhooks/dx-idea",
    h.adminCred,
    body,
  );
  assert.equal(duplicate.status, 200);
  assert.equal(duplicate.json.duplicated, true);

  const events = await call(
    h.baseUrl,
    "GET",
    "/api/v1/integrations/events?system=dx-idea",
    h.adminCred,
  );
  assert.equal(events.status, 200);
  assert.equal(rec(events.json)["total"], 1);
  assert.ok(h.audit.entries.some((entry) => entry.event.action === "integration.receive"));
});

test("inbound webhook rejects event types outside the contract", async (t) => {
  const h = await buildHarness();
  t.after(h.close);

  const response = await call(
    h.baseUrl,
    "POST",
    "/api/v1/integrations/webhooks/dx-idea",
    h.adminCred,
    {
      idempotencyKey: "idea-2",
      eventType: "not.in.contract",
    },
  );
  assert.equal(response.status, 400);
});

test("inbound webhook requires valid HMAC signature when shared secret is set", async (t) => {
  const h = await buildHarness();
  t.after(h.close);
  const previous = process.env["CEOP_INTEGRATION_SHARED_SECRET"];
  process.env["CEOP_INTEGRATION_SHARED_SECRET"] = "test-secret";
  t.after(() => {
    if (previous !== undefined) process.env["CEOP_INTEGRATION_SHARED_SECRET"] = previous;
    else delete process.env["CEOP_INTEGRATION_SHARED_SECRET"];
  });

  const body = {
    idempotencyKey: "idea-hmac-1",
    eventType: "idea.submitted",
    title: "HMAC検証",
  };
  const raw = JSON.stringify(body);
  const bad = await call(
    h.baseUrl,
    "POST",
    "/api/v1/integrations/webhooks/dx-idea",
    h.adminCred,
    body,
    { "X-CEOP-Signature": "0".repeat(64), "X-Integration-Token": "test-secret" },
  );
  assert.equal(bad.status, 401);

  const signature = createHmac("sha256", "test-secret").update(raw).digest("hex");
  const good = await call(
    h.baseUrl,
    "POST",
    "/api/v1/integrations/webhooks/dx-idea",
    h.adminCred,
    body,
    { "X-CEOP-Signature": signature, "X-Integration-Token": "test-secret" },
  );
  assert.equal(good.status, 202);
});

test("outbound event is queued and retry delivers to the configured endpoint", async (t) => {
  const h = await buildHarness();
  t.after(h.close);
  const received: Record<string, unknown>[] = [];
  const target = createHttpServer((req, res) => {
    let raw = "";
    req.on("data", (chunk) => (raw += String(chunk)));
    req.on("end", () => {
      received.push(JSON.parse(raw) as Record<string, unknown>);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end('{"ok":true}');
    });
  });
  const targetUrl = await listen(target);
  t.after(() => new Promise<void>((resolve) => target.close(() => resolve())));

  const queued = await call(h.baseUrl, "POST", "/api/v1/integrations/events", h.adminCred, {
    system: "photo-logger",
    eventType: "photo.captured",
    idempotencyKey: "photo-1",
    outboundUrl: targetUrl,
  });
  assert.equal(queued.status, 201);
  assert.equal(rec(queued.json["event"])["status"], "pending");

  const retried = await call(
    h.baseUrl,
    "POST",
    `/api/v1/integrations/events/${rec(queued.json["event"])["id"] as string}/retry`,
    h.adminCred,
  );
  assert.equal(retried.status, 200);
  assert.equal(rec(retried.json["event"])["status"], "sent");
  assert.equal(received.length, 1);
  assert.equal((received[0] as Record<string, unknown>)["eventType"], "photo.captured");
});

test("integration contracts are exposed", async (t) => {
  const h = await buildHarness();
  t.after(h.close);
  const contracts = await call(h.baseUrl, "GET", "/api/v1/integrations/contracts", h.adminCred);
  assert.equal(contracts.status, 200);
  assert.equal((contracts.json["contracts"] as unknown[]).length, 6);
});
