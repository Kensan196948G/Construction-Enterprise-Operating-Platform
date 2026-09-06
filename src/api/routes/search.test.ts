/** Integration tests for cross-domain search API (Issue #86, in-memory fallback). */

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
  dailyReportViewerCred: string;
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
  const dailyReportViewerRole = unwrap(
    createRole({
      id: "r-daily-report-viewer",
      name: "DailyReportViewer",
      description: "",
      scope: "global",
      permissions: ["daily-report:read"],
    }),
  );
  const adminKV = createApiKey("admin-subject", resolvePermissions([adminRole]), apiKeyStore);
  const viewerKV = createApiKey(
    "daily-report-viewer-subject",
    resolvePermissions([dailyReportViewerRole]),
    apiKeyStore,
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
    dailyReportViewerCred: `${viewerKV.key}:${viewerKV.secret}`,
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
      ...(credential !== "" ? { Authorization: `Bearer ${credential}` } : {}),
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

/** Seed one daily-report, contract, document, and inspection, all containing "橋梁". */
async function seedCrossDomainFixtures(h: Harness): Promise<void> {
  const project = await call(h.baseUrl, "POST", "/api/v1/projects", h.adminCred, {
    organizationId: "org-hq",
    projectCode: `SEARCH-${Date.now()}`,
    name: "橋梁工事",
  });
  assert.equal(project.status, 201);
  const projectId = (project.json as { project: { id: string } }).project.id;

  const dailyReport = await call(
    h.baseUrl,
    "POST",
    `/api/v1/projects/${projectId}/daily-reports`,
    h.adminCred,
    { reportDate: "2026-01-01", workContent: "橋梁点検を実施した" },
  );
  assert.equal(dailyReport.status, 201);

  const contract = await call(
    h.baseUrl,
    "POST",
    `/api/v1/projects/${projectId}/contracts`,
    h.adminCred,
    { contractNumber: `C-${Date.now()}`, title: "橋梁工事請負契約" },
  );
  assert.equal(contract.status, 201);

  const document = await call(h.baseUrl, "POST", "/api/v1/documents", h.adminCred, {
    organizationId: "org-hq",
    title: "橋梁設計図",
  });
  assert.equal(document.status, 201);

  const inspection = await call(
    h.baseUrl,
    "POST",
    `/api/v1/projects/${projectId}/inspections`,
    h.adminCred,
    { title: "橋梁完成検査" },
  );
  assert.equal(inspection.status, 201);
}

test("Search API — 401 without credential", async (t) => {
  const h = await buildHarness();
  t.after(h.close);
  const res = await call(h.baseUrl, "GET", "/api/v1/search?q=test", "");
  assert.equal(res.status, 401);
});

test("Search API — 400 when q is missing or empty", async (t) => {
  const h = await buildHarness();
  t.after(h.close);
  assert.equal((await call(h.baseUrl, "GET", "/api/v1/search", h.adminCred)).status, 400);
  assert.equal((await call(h.baseUrl, "GET", "/api/v1/search?q=", h.adminCred)).status, 400);
});

test("Search API — 400 on invalid ?type=", async (t) => {
  const h = await buildHarness();
  t.after(h.close);
  const res = await call(h.baseUrl, "GET", "/api/v1/search?q=test&type=bogus", h.adminCred);
  assert.equal(res.status, 400);
});

test("Search API — cross-domain results for an admin key", async (t) => {
  const h = await buildHarness();
  t.after(h.close);
  await seedCrossDomainFixtures(h);

  const res = await call(h.baseUrl, "GET", "/api/v1/search?q=橋梁", h.adminCred);
  assert.equal(res.status, 200);
  const body = res.json as {
    results: { domain: string; id: string; title: string; summary?: string }[];
    count: number;
  };
  assert.equal(body.count, 4);
  const domains = new Set(body.results.map((r) => r.domain));
  assert.deepEqual(domains, new Set(["daily-report", "contract", "document", "inspection"]));
  for (const r of body.results) {
    assert.ok(r.id);
    // daily-report has no natural "title" field, so the match may only
    // surface in the summary (workContent) rather than the synthesized title.
    assert.ok(r.title.includes("橋梁") || (r.summary !== undefined && r.summary.includes("橋梁")));
  }
});

test("Search API — ?type= restricts to a single domain", async (t) => {
  const h = await buildHarness();
  t.after(h.close);
  await seedCrossDomainFixtures(h);

  const res = await call(h.baseUrl, "GET", "/api/v1/search?q=橋梁&type=contract", h.adminCred);
  assert.equal(res.status, 200);
  const body = res.json as { results: { domain: string }[]; count: number };
  assert.equal(body.count, 1);
  assert.equal(body.results[0]?.domain, "contract");
});

test("Search API — no match returns an empty result set", async (t) => {
  const h = await buildHarness();
  t.after(h.close);
  await seedCrossDomainFixtures(h);

  const res = await call(h.baseUrl, "GET", "/api/v1/search?q=絶対に存在しない文字列", h.adminCred);
  assert.equal(res.status, 200);
  const body = res.json as { results: unknown[]; count: number };
  assert.equal(body.count, 0);
  assert.deepEqual(body.results, []);
});

test("Search API — a scoped credential only sees domains it can read", async (t) => {
  const h = await buildHarness();
  t.after(h.close);
  await seedCrossDomainFixtures(h);

  // No ?type= — silently scoped to the domains the credential can read.
  const res = await call(h.baseUrl, "GET", "/api/v1/search?q=橋梁", h.dailyReportViewerCred);
  assert.equal(res.status, 200);
  const body = res.json as { results: { domain: string }[]; count: number };
  assert.equal(body.count, 1);
  assert.equal(body.results[0]?.domain, "daily-report");
});

test("Search API — 403 when ?type= names a domain the credential cannot read", async (t) => {
  const h = await buildHarness();
  t.after(h.close);
  await seedCrossDomainFixtures(h);

  const res = await call(
    h.baseUrl,
    "GET",
    "/api/v1/search?q=橋梁&type=contract",
    h.dailyReportViewerCred,
  );
  assert.equal(res.status, 403);
});
