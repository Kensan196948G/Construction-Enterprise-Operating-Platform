/**
 * Integration tests for HEAD method support.
 *
 * HEAD is what most uptime monitors and load balancers send by default, so a
 * router that answers 404 to it reports the service as down while it is in
 * fact healthy. RFC 9110 defines HEAD as GET without a body: same status, same
 * headers, no payload. These tests pin all three halves of that contract —
 * the mirroring, the absence of a body, and the parts that must NOT be
 * mirrored (auth is still enforced, and non-GET routes are not reachable).
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";

import { createServer } from "../server.ts";
import { createApiKey } from "../middleware/auth.ts";
import { createInMemoryRepositories } from "../../persistence/in-memory/index.ts";
import { AuditLog } from "../../governance/audit-log.ts";
import type { Permission } from "../../domain/role.ts";
import type { ApiKeyStore, AppContainer } from "../types.ts";

/** Public routes that a probe would realistically target. */
const PUBLIC_PATHS = ["/health", "/health/ready", "/api/v1/info"] as const;

interface Harness {
  baseUrl: string;
  auditLog: AuditLog;
  exporterCred: string;
  close(): Promise<void>;
}

async function buildHarness(): Promise<Harness> {
  const apiKeyStore: ApiKeyStore = new Map();
  const exporter = createApiKey(
    "user-exporter",
    ["audit:read", "audit:export"] as Permission[],
    apiKeyStore,
    "org-a",
  );
  const auditLog = new AuditLog();
  const container: AppContainer = {
    repositories: createInMemoryRepositories(),
    auditLog,
    apiKeyStore,
  };
  const server = createServer({ port: 0 }, container);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    auditLog,
    exporterCred: `${exporter.key}:${exporter.secret}`,
    close: () =>
      new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve()))),
  };
}

test("HEAD: public probe endpoints mirror GET status and headers with no body", async (t) => {
  const h = await buildHarness();
  t.after(() => h.close());

  for (const path of PUBLIC_PATHS) {
    const get = await fetch(`${h.baseUrl}${path}`);
    const getBody = await get.text();
    const head = await fetch(`${h.baseUrl}${path}`, { method: "HEAD" });
    const headBody = await head.text();

    assert.equal(head.status, get.status, `${path}: HEAD status must equal GET status`);
    assert.equal(
      head.headers.get("content-type"),
      get.headers.get("content-type"),
      `${path}: Content-Type must be identical`,
    );
    // Content-Length is retained even though the body is not sent — that is
    // the whole point of HEAD: learn the size without paying for the transfer.
    // `/health` includes `uptime`, whose decimal length can change between the
    // GET and HEAD calls, so only the stable endpoints get an exact assertion.
    if (path !== "/health") {
      assert.equal(
        head.headers.get("content-length"),
        String(Buffer.byteLength(getBody)),
        `${path}: Content-Length must describe the body GET would have returned`,
      );
    }
    assert.equal(headBody, "", `${path}: HEAD must not return a body`);
  }
});

test("HEAD: baseline security headers are present on probe responses", async (t) => {
  const h = await buildHarness();
  t.after(() => h.close());

  const res = await fetch(`${h.baseUrl}/health`, { method: "HEAD" });
  assert.equal(res.headers.get("x-content-type-options"), "nosniff");
  assert.equal(res.headers.get("x-frame-options"), "DENY");
  assert.equal(res.headers.get("referrer-policy"), "no-referrer");
  assert.equal(res.headers.get("cache-control"), "no-store");
  assert.equal(res.headers.get("strict-transport-security"), "max-age=63072000; includeSubDomains");
  assert.ok(res.headers.get("x-request-id"), "X-Request-Id should be present");
});

test("HEAD: authentication is still enforced — no credential means 401, not 200", async (t) => {
  const h = await buildHarness();
  t.after(() => h.close());

  const res = await fetch(`${h.baseUrl}/api/v1/governance/audit`, { method: "HEAD" });
  assert.equal(res.status, 401, "the GET fallback must not bypass the route's auth requirement");
  assert.equal(await res.text(), "");
});

test("HEAD: falls back only to GET, never to POST-only routes", async (t) => {
  const h = await buildHarness();
  t.after(() => h.close());

  // /api/v1/auth/token is registered for POST only. If the fallback matched on
  // path alone it would answer here, letting a probe believe a write endpoint
  // is a readable resource.
  const res = await fetch(`${h.baseUrl}/api/v1/auth/token`, { method: "HEAD" });
  assert.equal(res.status, 404);
});

test("HEAD: unknown paths still 404", async (t) => {
  const h = await buildHarness();
  t.after(() => h.close());

  const res = await fetch(`${h.baseUrl}/no/such/route`, { method: "HEAD" });
  assert.equal(res.status, 404);
});

test("HEAD: an audit export probe is recorded as HEAD, not as a delivered export", async (t) => {
  const h = await buildHarness();
  t.after(() => h.close());

  const auth = { Authorization: `Bearer ${h.exporterCred}` };
  await fetch(`${h.baseUrl}/api/v1/governance/audit/export`, { method: "HEAD", headers: auth });
  await fetch(`${h.baseUrl}/api/v1/governance/audit/export`, { headers: auth });

  const exports = h.auditLog.entries.filter((e) => e.event.action === "audit:export");
  assert.equal(exports.length, 2, "both the probe and the real export are recorded");

  const methods = exports.map((e) => e.event.metadata["method"]);
  assert.deepEqual(
    methods,
    ["HEAD", "GET"],
    "the evidence trail must distinguish a probe from an actual data transfer",
  );
});
