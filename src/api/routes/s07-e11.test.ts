/** Integration tests for S-07 and E-11 APIs. */

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
  const adminKV = createApiKey("admin-subject", resolvePermissions([adminRole]), apiKeyStore);
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test helper reads arbitrary JSON
  return { status: res.status, json: (await res.json().catch(() => ({}))) as any };
}

test("S-07 compliance/evidence + E-11 templates/read APIs", async (t) => {
  const h = await buildHarness();
  t.after(h.close);

  const project = await call(h.baseUrl, "POST", "/api/v1/projects", h.adminCred, {
    organizationId: "org-hq",
    projectCode: "S07-1",
    name: "compliance project",
  });
  const pid = project.json.project.id as string;

  const check = await call(
    h.baseUrl,
    "POST",
    `/api/v1/projects/${pid}/compliance-checks`,
    h.adminCred,
    {
      standard: "kensetsugyo-ho",
      item: "建設業許可証",
      result: "pass",
    },
  );
  assert.equal(check.status, 201);
  const checkId = check.json.complianceCheck.id as string;
  assert.equal(
    (await call(h.baseUrl, "GET", `/api/v1/compliance-checks/${checkId}`, h.adminCred)).status,
    200,
  );

  const contract = await call(h.baseUrl, "POST", `/api/v1/projects/${pid}/contracts`, h.adminCred, {
    contractNumber: "S07-C1",
    title: "契約",
  });
  const cid = contract.json.contract.id as string;
  const evidence = await call(
    h.baseUrl,
    "POST",
    `/api/v1/contracts/${cid}/legal-evidence`,
    h.adminCred,
    {
      eventType: "contract-signed",
      description: "契約締結",
      evidenceHash: "e".repeat(64),
    },
  );
  assert.equal(evidence.status, 201);
  const eid = evidence.json.legalEvidence.id as string;
  assert.equal(
    (await call(h.baseUrl, "GET", `/api/v1/legal-evidence/${eid}`, h.adminCred)).status,
    200,
  );

  const template = await call(h.baseUrl, "POST", "/api/v1/notification-templates", h.adminCred, {
    templateKey: "daily-report.submitted",
    subject: "日報提出",
    body: "日報が提出されました",
    channel: "email",
  });
  assert.equal(template.status, 201);
  const templateId = template.json.notificationTemplate.id as string;
  assert.equal(
    (await call(h.baseUrl, "GET", `/api/v1/notification-templates/${templateId}`, h.adminCred))
      .status,
    200,
  );

  const notification = await call(h.baseUrl, "POST", "/api/v1/notifications", h.adminCred, {
    organizationId: "org-hq",
    userId: "user-1",
    eventKey: "test",
    channel: "email",
  });
  assert.equal(notification.status, 201);
  const nid = notification.json.notification.id as string;
  const unread = await call(h.baseUrl, "GET", "/api/v1/notifications/unread-count", h.adminCred);
  assert.equal(unread.status, 200);
  assert.ok(unread.json.unreadCount >= 1);
  const read = await call(h.baseUrl, "PATCH", `/api/v1/notifications/${nid}/read`, h.adminCred);
  assert.equal(read.status, 200);
  assert.ok(read.json.notification.readAt);

  const audits = h.audit.query((e) =>
    ["compliance:", "legal:", "notification-template:", "notification:read"].some((p) =>
      e.event.action.startsWith(p),
    ),
  );
  assert.ok(audits.some((e) => e.event.action === "compliance:create"));
  assert.ok(audits.some((e) => e.event.action === "legal:create"));
  assert.ok(audits.some((e) => e.event.action === "notification-template:create"));
  assert.ok(audits.some((e) => e.event.action === "notification:read"));
});
