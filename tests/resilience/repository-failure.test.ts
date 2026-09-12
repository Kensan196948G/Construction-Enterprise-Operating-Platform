import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { test } from "node:test";
import { createServer } from "../../src/api/server.ts";
import { createApiKey } from "../../src/api/middleware/auth.ts";
import { AuditLog } from "../../src/governance/audit-log.ts";
import { toPermission } from "../../src/domain/role.ts";
import { createInMemoryRepositories } from "../../src/persistence/in-memory/index.ts";
import { recordEvidence } from "../helpers/evidence.ts";

test("QA-RES-001: repository outage returns indeterminate error and records failure", async (t) => {
  t.mock.method(console, "error", () => undefined);
  const repositories = createInMemoryRepositories();
  const failingProjects = new Proxy(repositories.projects, {
    get(target, property, receiver) {
      if (property === "findAll") return async () => Promise.reject(new Error("database offline"));
      return Reflect.get(target, property, receiver) as unknown;
    },
  });
  const auditLog = new AuditLog();
  const apiKeyStore = new Map();
  const permission = toPermission("project:read");
  assert.ok(permission.ok);
  const key = createApiKey("resilience-test", [permission.value], apiKeyStore);
  const server = createServer(
    { port: 0 },
    { repositories: { ...repositories, projects: failingProjects }, auditLog, apiKeyStore },
  );
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise<void>((resolve) => server.close(() => resolve())));
  const { port } = server.address() as AddressInfo;

  const response = await fetch(`http://127.0.0.1:${port}/api/v1/projects`, {
    headers: { Authorization: `Bearer ${key.key}:${key.secret}` },
  });
  const body = (await response.json()) as Record<string, unknown>;
  assert.equal(response.status, 500);
  assert.equal(body["error"], "Internal Server Error");
  assert.equal(body["decision"], "indeterminate");
  assert.equal(body["action"], "human_review_required");
  assert.equal(body["projects"], undefined, "an outage must never be represented as empty data");
  assert.ok(response.headers.get("x-request-id"));
  assert.ok(auditLog.query((entry) => entry.event.outcome === "failure").length > 0);
  recordEvidence({
    requirementId: "QA-RES-001",
    testId: "QA-RES-001-repository-outage",
    input: { dependency: "project repository", fault: "database offline" },
    expected: { status: 500, decision: "indeterminate", action: "human_review_required" },
    actual: { status: response.status, decision: body["decision"], action: body["action"] },
    tolerance: null,
    testDataVersion: "1.0.0",
    result: "pass",
  });
});
