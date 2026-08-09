/** Integration tests for CSV export endpoints (Excel-compatible). */

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

async function buildHarness() {
  const apiKeyStore: ApiKeyStore = new Map();
  const role = unwrap(
    createRole({
      id: "r-admin",
      name: "Admin",
      description: "",
      scope: "global",
      permissions: ["*:*"],
    }),
  );
  const cred = createApiKey("admin", resolvePermissions([role]), apiKeyStore);
  const server = createServer(
    { port: 0 },
    { repositories: createInMemoryRepositories(), auditLog: new AuditLog(), apiKeyStore },
  );
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    cred: `${cred.key}:${cred.secret}`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

async function call(
  baseUrl: string,
  method: string,
  path: string,
  credential: string,
  body?: unknown,
) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${credential}`,
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  return res;
}

test("daily report and ISO records export as CSV", async (t) => {
  const h = await buildHarness();
  t.after(h.close);

  const projectRes = await call(h.baseUrl, "POST", "/api/v1/projects", h.cred, {
    organizationId: "org-hq",
    projectCode: "P-EXPORT-1",
    name: "輸出テスト工事",
  });
  assert.equal(projectRes.status, 201);
  const project = (await projectRes.json()) as { project: { id: string } };

  const reportRes = await call(
    h.baseUrl,
    "POST",
    `/api/v1/projects/${project.project.id}/daily-reports`,
    h.cred,
    { reportDate: "2026-08-10", workContent: "床版コンクリート打設" },
  );
  assert.equal(reportRes.status, 201);

  const csvRes = await call(
    h.baseUrl,
    "GET",
    `/api/v1/projects/${project.project.id}/daily-reports/export.csv`,
    h.cred,
  );
  assert.equal(csvRes.status, 200);
  assert.match(csvRes.headers.get("content-type") ?? "", /text\/csv/);
  const csv = await csvRes.text();
  assert.match(csv, /^id,reportDate,weather,/);
  assert.match(csv, /2026-08-10/);

  const isoRes = await call(h.baseUrl, "POST", "/api/v1/iso", h.cred, {
    kind: "asset",
    organizationId: "org-hq",
    title: "輸出用重機",
    name: "重機1",
    assetType: "equipment",
  });
  assert.equal(isoRes.status, 201);
  const isoCsvRes = await call(h.baseUrl, "GET", "/api/v1/iso/export.csv", h.cred);
  assert.equal(isoCsvRes.status, 200);
  assert.match(isoCsvRes.headers.get("content-type") ?? "", /text\/csv/);
  const isoCsv = await isoCsvRes.text();
  assert.match(isoCsv, /^id,kind,organizationId,/);
  assert.match(isoCsv, /輸出用重機/);
});
