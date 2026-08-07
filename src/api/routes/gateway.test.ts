/**
 * Integration tests for the CEOP gateway (P1).
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer as httpCreateServer } from "node:http";
import { request as rawRequest } from "node:http";
import type { AddressInfo } from "node:net";

import { createServer } from "../server.ts";
import { createApiKey } from "../middleware/auth.ts";
import { createInMemoryRepositories } from "../../persistence/in-memory/index.ts";
import { AuditLog } from "../../governance/audit-log.ts";
import { resolvePermissions } from "../../governance/policy-engine.ts";
import { createRole } from "../../domain/index.ts";
import { createGatewayService, type GatewayServiceInput } from "../../domain/gateway-service.ts";
import type { Result } from "../../domain/common.ts";
import type { ApiKeyStore } from "../types.ts";

function unwrap<T>(r: Result<T>): T {
  if (!r.ok) throw new Error(JSON.stringify(r.error));
  return r.value;
}

interface UpstreamCapture {
  method: string;
  url: string;
  headers: Record<string, string | undefined>;
  body: string;
}

async function startUpstream(
  handler: (capture: UpstreamCapture) => { status: number; body: string; delayMs?: number },
): Promise<{ port: number; captures: UpstreamCapture[]; close(): Promise<void> }> {
  const captures: UpstreamCapture[] = [];
  const server = httpCreateServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => {
      const capture: UpstreamCapture = {
        method: req.method ?? "GET",
        url: req.url ?? "/",
        headers: req.headers as Record<string, string | undefined>,
        body: Buffer.concat(chunks).toString("utf-8"),
      };
      captures.push(capture);
      const { status, body, delayMs } = handler(capture);
      setTimeout(() => {
        res.writeHead(status, { "Content-Type": "application/json" });
        res.end(body);
      }, delayMs ?? 0);
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  return {
    port,
    captures,
    close: () =>
      new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve()))),
  };
}

interface Harness {
  baseUrl: string;
  adminCred: string;
  readerCred: string;
  noPermCred: string;
  audit: AuditLog;
  close(): Promise<void>;
}

async function buildHarness(services: readonly GatewayServiceInput[]): Promise<Harness> {
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
      permissions: ["integration:read"],
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
  const noPermKV = createApiKey("noperm-subject", resolvePermissions([noPermRole]), apiKeyStore);

  const audit = new AuditLog();
  const gatewayServices = services.map((input) => {
    const result = createGatewayService(input);
    if (!result.ok) throw new Error(JSON.stringify(result.error));
    return result.value;
  });
  const container = {
    repositories: createInMemoryRepositories(),
    auditLog: audit,
    apiKeyStore,
  };
  const server = createServer({ port: 0, gatewayServices }, container);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    adminCred: `${adminKV.key}:${adminKV.secret}`,
    readerCred: `${readerKV.key}:${readerKV.secret}`,
    noPermCred: `${noPermKV.key}:${noPermKV.secret}`,
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
  headers: Record<string, string> = {},
  body?: unknown,
): Promise<{ status: number; text: string }> {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${credential}`,
      "Content-Type": "application/json",
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  return { status: res.status, text: await res.text() };
}

test("gateway forwards GET with identity headers and strips client-supplied ones", async (t) => {
  const upstream = await startUpstream(() => ({ status: 200, body: JSON.stringify({ ok: true }) }));
  t.after(upstream.close);
  const harness = await buildHarness([
    {
      id: "servicehub",
      name: "ServiceHub",
      baseUrl: `http://127.0.0.1:${upstream.port}`,
      pathPrefix: "/api/v1/integrations/servicehub",
      readPermissions: ["integration:read"],
      writePermissions: ["integration:write"],
      timeoutMs: 1000,
    },
  ]);
  t.after(harness.close);

  const noAuth = await call(harness.baseUrl, "GET", "/api/v1/integrations/servicehub/projects", "");
  assert.equal(noAuth.status, 401);

  const noPerm = await call(
    harness.baseUrl,
    "GET",
    "/api/v1/integrations/servicehub/projects",
    harness.noPermCred,
  );
  assert.equal(noPerm.status, 403);

  const res = await call(
    harness.baseUrl,
    "GET",
    "/api/v1/integrations/servicehub/projects?page=2",
    harness.readerCred,
    { "X-CEOP-Subject": "forged" },
  );
  assert.equal(res.status, 200);
  const capture = upstream.captures[0];
  assert.ok(capture);
  assert.equal(capture.url, "/projects?page=2");
  assert.equal(capture.headers["x-ceop-subject"], "reader-subject");
  assert.equal(capture.headers["x-ceop-organization-id"], "");
  assert.equal(capture.headers["x-ceop-permissions"], '["integration:read"]');
  assert.equal(capture.headers["x-ceop-service-id"], "servicehub");
  assert.equal(capture.headers["authorization"], undefined);

  const gatewayAudits = harness.audit.query((e) => e.event.action.startsWith("gateway:"));
  assert.ok(gatewayAudits.some((e) => e.event.outcome === "denied"));
  assert.ok(gatewayAudits.some((e) => e.event.outcome === "success"));
});

test("gateway forwards POST body and upstream bearer token", async (t) => {
  const upstream = await startUpstream((capture) => {
    assert.equal(capture.method, "POST");
    assert.equal(capture.body, JSON.stringify({ title: "x" }));
    return { status: 201, body: JSON.stringify({ created: true }) };
  });
  t.after(upstream.close);
  process.env["CEOP_GATEWAY_TEST_TOKEN"] = "test-upstream-token";
  t.after(() => {
    delete process.env["CEOP_GATEWAY_TEST_TOKEN"];
  });
  const harness = await buildHarness([
    {
      id: "servicehub",
      name: "ServiceHub",
      baseUrl: `http://127.0.0.1:${upstream.port}`,
      pathPrefix: "/api/v1/integrations/servicehub",
      readPermissions: ["integration:read"],
      writePermissions: ["integration:write"],
      upstreamTokenEnv: "CEOP_GATEWAY_TEST_TOKEN",
      timeoutMs: 1000,
    },
  ]);
  t.after(harness.close);

  const res = await call(
    harness.baseUrl,
    "POST",
    "/api/v1/integrations/servicehub/projects",
    harness.adminCred,
    {},
    { title: "x" },
  );
  assert.equal(res.status, 201);
  const capture = upstream.captures[0];
  assert.ok(capture);
  assert.equal(capture.headers["authorization"], "Bearer test-upstream-token");
  assert.equal(capture.headers["content-type"], "application/json");
});

test("gateway returns 502 when upstream is unreachable", async (t) => {
  const probe = httpCreateServer();
  await new Promise<void>((resolve) => probe.listen(0, "127.0.0.1", resolve));
  const { port } = probe.address() as AddressInfo;
  await new Promise<void>((resolve, reject) => probe.close((e) => (e ? reject(e) : resolve())));
  const harness = await buildHarness([
    {
      id: "servicehub",
      name: "ServiceHub",
      baseUrl: `http://127.0.0.1:${port}`,
      pathPrefix: "/api/v1/integrations/servicehub",
      readPermissions: ["integration:read"],
      writePermissions: ["integration:write"],
      timeoutMs: 500,
    },
  ]);
  t.after(harness.close);
  const res = await call(
    harness.baseUrl,
    "GET",
    "/api/v1/integrations/servicehub/projects",
    harness.adminCred,
  );
  assert.equal(res.status, 502);
});

test("gateway returns 504 on upstream timeout", async (t) => {
  const upstream = await startUpstream(() => ({
    status: 200,
    body: JSON.stringify({ ok: true }),
    delayMs: 500,
  }));
  t.after(upstream.close);
  const harness = await buildHarness([
    {
      id: "servicehub",
      name: "ServiceHub",
      baseUrl: `http://127.0.0.1:${upstream.port}`,
      pathPrefix: "/api/v1/integrations/servicehub",
      readPermissions: ["integration:read"],
      writePermissions: ["integration:write"],
      timeoutMs: 50,
    },
  ]);
  t.after(harness.close);
  const res = await call(
    harness.baseUrl,
    "GET",
    "/api/v1/integrations/servicehub/slow",
    harness.adminCred,
  );
  assert.equal(res.status, 504);
});

test("gateway rejects path traversal and unknown services", async (t) => {
  const upstream = await startUpstream(() => ({ status: 200, body: JSON.stringify({ ok: true }) }));
  t.after(upstream.close);
  const harness = await buildHarness([
    {
      id: "servicehub",
      name: "ServiceHub",
      baseUrl: `http://127.0.0.1:${upstream.port}`,
      pathPrefix: "/api/v1/integrations/servicehub",
      readPermissions: ["integration:read"],
      writePermissions: ["integration:write"],
      timeoutMs: 1000,
    },
  ]);
  t.after(harness.close);

  // Use a raw HTTP request so the traversal path is not normalized away by a
  // URL parser before it reaches the router (what a proxy/attacker would do).
  const traversalStatus = await new Promise<number>((resolve, reject) => {
    const url = new URL(harness.baseUrl);
    const raw = rawRequest(
      {
        host: url.hostname,
        port: url.port,
        path: "/api/v1/integrations/servicehub/%2e%2e/secret",
        method: "GET",
        headers: { Authorization: `Bearer ${harness.adminCred}` },
      },
      (res) => {
        res.resume();
        res.on("end", () => resolve(res.statusCode ?? 0));
      },
    );
    raw.on("error", reject);
    raw.end();
  });
  assert.equal(traversalStatus, 400);
  assert.equal(upstream.captures.length, 0);

  const unknown = await call(
    harness.baseUrl,
    "GET",
    "/api/v1/integrations/unknown/projects",
    harness.adminCred,
  );
  assert.equal(unknown.status, 404);
});
