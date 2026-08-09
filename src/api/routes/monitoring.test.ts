/** Integration tests for /metrics and /portal (P4). */

import { test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";

import { createServer } from "../server.ts";
import { createApiKey } from "../middleware/auth.ts";
import { createInMemoryRepositories } from "../../persistence/in-memory/index.ts";
import { AuditLog } from "../../governance/audit-log.ts";
import { resolvePermissions } from "../../governance/policy-engine.ts";
import { createRole } from "../../domain/index.ts";
import { createIsoRecord } from "../../domain/iso.ts";
import { createIntegrationEvent } from "../../domain/integration.ts";
import type { Result } from "../../domain/common.ts";
import type { ApiKeyStore } from "../types.ts";
import type { Repositories } from "../../persistence/ports.ts";

function unwrap<T>(r: Result<T>): T {
  if (!r.ok) throw new Error(JSON.stringify(r.error));
  return r.value;
}

async function buildServer(
  metricsToken?: string,
): Promise<{ baseUrl: string; repositories: Repositories; close(): Promise<void> }> {
  const apiKeyStore: ApiKeyStore = new Map();
  const repositories = createInMemoryRepositories();
  const role = unwrap(
    createRole({
      id: "r-admin",
      name: "Admin",
      description: "",
      scope: "global",
      permissions: ["*:*"],
    }),
  );
  createApiKey("admin-subject", resolvePermissions([role]), apiKeyStore);
  const previous = process.env["CEOP_METRICS_TOKEN"];
  if (metricsToken !== undefined) {
    process.env["CEOP_METRICS_TOKEN"] = metricsToken;
  } else {
    delete process.env["CEOP_METRICS_TOKEN"];
  }
  const server = createServer({ port: 0 }, { repositories, auditLog: new AuditLog(), apiKeyStore });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    repositories,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((e) => (e ? reject(e) : resolve()));
        if (previous !== undefined) process.env["CEOP_METRICS_TOKEN"] = previous;
        else delete process.env["CEOP_METRICS_TOKEN"];
      }),
  };
}

test("GET /metrics exposes Prometheus text with request counters", async (t) => {
  const server = await buildServer();
  t.after(server.close);
  await fetch(`${server.baseUrl}/health`);
  const res = await fetch(`${server.baseUrl}/metrics`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type") ?? "", /text\/plain/);
  const body = await res.text();
  assert.match(body, /# HELP ceop_http_requests_total/);
  assert.match(body, /ceop_http_requests_total\{method="GET",route="\/health",status="200"\} 1/);
  assert.match(body, /^ceop_audit_log_size 0$/m);
});

test("GET /metrics includes ISO and integration event gauges", async (t) => {
  const server = await buildServer();
  t.after(server.close);
  const iso = createIsoRecord({
    id: "iso-metric-1",
    kind: "asset",
    organizationId: "org-1",
    title: "metric asset",
    payload: { name: "asset", assetType: "structure" },
    createdBy: "u-1",
    createdAt: "2026-08-10T00:00:00.000Z" as never,
  });
  assert.ok(iso.ok);
  await server.repositories.isoRecords.save(iso.value);
  const event = createIntegrationEvent({
    id: "evt-metric-1",
    system: "ai-build",
    eventType: "model.registered",
    direction: "outbound",
    idempotencyKey: "k-1",
    organizationId: "org-1",
    payload: {},
    createdAt: "2026-08-10T00:00:00.000Z" as never,
  });
  assert.ok(event.ok);
  await server.repositories.integrationEvents.save(event.value);

  const res = await fetch(`${server.baseUrl}/metrics`);
  assert.equal(res.status, 200);
  const body = await res.text();
  assert.match(body, /^ceop_iso_records_total 1$/m);
  assert.match(body, /^ceop_integration_events_pending 1$/m);
});

test("GET /metrics enforces CEOP_METRICS_TOKEN when configured", async (t) => {
  const server = await buildServer("secret-token");
  t.after(server.close);
  const noToken = await fetch(`${server.baseUrl}/metrics`);
  assert.equal(noToken.status, 401);
  const ok = await fetch(`${server.baseUrl}/metrics`, {
    headers: { Authorization: "Bearer secret-token" },
  });
  assert.equal(ok.status, 200);
});

test("GET /portal renders the CEOP portal landing page", async (t) => {
  const server = await buildServer();
  t.after(server.close);
  const res = await fetch(`${server.baseUrl}/portal`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type") ?? "", /text\/html/);
  const body = await res.text();
  assert.match(body, /Construction Enterprise Operating Platform/);
  assert.match(body, /ダッシュボード/);
});
