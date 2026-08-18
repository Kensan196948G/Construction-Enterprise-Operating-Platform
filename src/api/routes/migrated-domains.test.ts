/**
 * Integration tests for the migrated construction-enterprise domain APIs:
 *   work-orders, inspections, supplier-evaluations, quality-objectives,
 *   risks, management-reviews, ai-build-projects, dx-projects,
 *   material-photo-logs (+ CSV export).
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
      permissions: ["work-order:read", "inspection:read"],
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
      new Promise<void>((resolve) => {
        server.close(() => resolve());
      }),
  };
}

async function seedProject(h: Harness): Promise<string> {
  const res = await fetch(`${h.baseUrl}/api/v1/projects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${h.adminCred}`,
    },
    body: JSON.stringify({
      organizationId: "org-demo",
      projectCode: "DEMO-2026-001",
      name: "デモ案件",
      status: "in_progress",
    }),
  });
  assert.equal(res.status, 201);
  const body = (await res.json()) as { project: { id: string } };
  return body.project.id;
}

async function seedOrg(h: Harness): Promise<void> {
  const res = await fetch(`${h.baseUrl}/api/v1/organizations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${h.adminCred}`,
    },
    body: JSON.stringify({ id: "org-demo", name: "デモ組織", type: "headquarters" }),
  });
  assert.equal(res.status, 201);
}

test("work-orders CRUD + auth", async () => {
  const h = await buildHarness();
  try {
    await seedOrg(h);
    const projectId = await seedProject(h);
    const auth = { Authorization: `Bearer ${h.adminCred}` };

    // viewer has read only
    const forbiddenRes = await fetch(`${h.baseUrl}/api/v1/projects/${projectId}/work-orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${h.viewerCred}`,
      },
      body: JSON.stringify({ title: "x" }),
    });
    assert.equal(forbiddenRes.status, 403);

    const created = await fetch(`${h.baseUrl}/api/v1/projects/${projectId}/work-orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...auth },
      body: JSON.stringify({ title: "基礎配筋検査", status: "in_progress", dueDate: "2026-08-20" }),
    });
    assert.equal(created.status, 201);
    const createdBody = (await created.json()) as { workOrder: { id: string } };
    const id = createdBody.workOrder.id;

    const listed = await fetch(`${h.baseUrl}/api/v1/projects/${projectId}/work-orders`, {
      headers: auth,
    });
    assert.equal(listed.status, 200);
    const listBody = (await listed.json()) as { workOrders: unknown[]; total: number };
    assert.equal(listBody.total, 1);

    // organisation-scoped list endpoint
    const orgListed = await fetch(`${h.baseUrl}/api/v1/work-orders`, { headers: auth });
    assert.equal(orgListed.status, 200);
    const orgListBody = (await orgListed.json()) as { total: number };
    assert.equal(orgListBody.total, 1);

    const got = await fetch(`${h.baseUrl}/api/v1/work-orders/${id}`, { headers: auth });
    assert.equal(got.status, 200);

    const updated = await fetch(`${h.baseUrl}/api/v1/work-orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...auth },
      body: JSON.stringify({ status: "completed", completedAt: "2026-08-15T09:00:00.000Z" }),
    });
    assert.equal(updated.status, 200);
    const updatedBody = (await updated.json()) as { workOrder: { status: string } };
    assert.equal(updatedBody.workOrder.status, "completed");

    const deleted = await fetch(`${h.baseUrl}/api/v1/work-orders/${id}`, {
      method: "DELETE",
      headers: auth,
    });
    assert.equal(deleted.status, 204);
  } finally {
    await h.close();
  }
});

test("inspections CRUD + checklist derivation", async () => {
  const h = await buildHarness();
  try {
    await seedOrg(h);
    const projectId = await seedProject(h);
    const auth = { Authorization: `Bearer ${h.adminCred}` };

    const created = await fetch(`${h.baseUrl}/api/v1/projects/${projectId}/inspections`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...auth },
      body: JSON.stringify({
        title: "鉄筋検査",
        checklistItems: [
          { label: "主筋間隔", passed: true },
          { label: "かぶり厚", passed: true },
        ],
      }),
    });
    assert.equal(created.status, 201);
    const createdBody = (await created.json()) as { inspection: { id: string; result: string } };
    assert.equal(createdBody.inspection.result, "pass");

    const listed = await fetch(`${h.baseUrl}/api/v1/projects/${projectId}/inspections`, {
      headers: auth,
    });
    assert.equal(listed.status, 200);

    // organisation-scoped list endpoint
    const orgListed = await fetch(`${h.baseUrl}/api/v1/inspections`, { headers: auth });
    assert.equal(orgListed.status, 200);

    // invalid checklist rejected
    const bad = await fetch(`${h.baseUrl}/api/v1/projects/${projectId}/inspections`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...auth },
      body: JSON.stringify({ title: "x", checklistItems: [{ label: "", passed: true }] }),
    });
    assert.equal(bad.status, 400);
  } finally {
    await h.close();
  }
});

test("supplier-evaluations CRUD", async () => {
  const h = await buildHarness();
  try {
    await seedOrg(h);
    const auth = { Authorization: `Bearer ${h.adminCred}` };

    const created = await fetch(`${h.baseUrl}/api/v1/supplier-evaluations`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...auth },
      body: JSON.stringify({
        organizationId: "org-demo",
        supplierName: "デモ生コン",
        evaluationDate: "2026-07-01",
        score: 88,
      }),
    });
    assert.equal(created.status, 201);
    const createdBody = (await created.json()) as {
      supplierEvaluation: { id: string; status: string };
    };
    assert.equal(createdBody.supplierEvaluation.status, "pending");

    const listed = await fetch(`${h.baseUrl}/api/v1/supplier-evaluations`, { headers: auth });
    assert.equal(listed.status, 200);
    const listBody = (await listed.json()) as { total: number };
    assert.equal(listBody.total, 1);

    // org-scoped credentials are required
    const bad = await fetch(`${h.baseUrl}/api/v1/supplier-evaluations`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...auth },
      body: JSON.stringify({ supplierName: "", evaluationDate: "2026-07-01" }),
    });
    assert.equal(bad.status, 400);
  } finally {
    await h.close();
  }
});

test("quality-objectives + risks + management-reviews CRUD", async () => {
  const h = await buildHarness();
  try {
    await seedOrg(h);
    const auth = { Authorization: `Bearer ${h.adminCred}` };

    const objective = await fetch(`${h.baseUrl}/api/v1/quality-objectives`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...auth },
      body: JSON.stringify({ organizationId: "org-demo", title: "合格率 100%", targetValue: 100 }),
    });
    assert.equal(objective.status, 201);
    const objectiveBody = (await objective.json()) as { qualityObjective: { id: string } };
    const objectiveId = objectiveBody.qualityObjective.id;

    const risk = await fetch(`${h.baseUrl}/api/v1/risks`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...auth },
      body: JSON.stringify({
        organizationId: "org-demo",
        objectiveId,
        title: "暑中品質低下",
        likelihood: 4,
        impact: 5,
      }),
    });
    assert.equal(risk.status, 201);
    const riskBody = (await risk.json()) as { risk: { riskLevel: string } };
    assert.equal(riskBody.risk.riskLevel, "very_high");

    const review = await fetch(`${h.baseUrl}/api/v1/management-reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...auth },
      body: JSON.stringify({
        organizationId: "org-demo",
        title: "Q1 レビュー",
        reviewDate: "2026-07-10",
      }),
    });
    assert.equal(review.status, 201);

    const riskList = await fetch(`${h.baseUrl}/api/v1/risks`, { headers: auth });
    assert.equal(riskList.status, 200);
    const objectiveList = await fetch(`${h.baseUrl}/api/v1/quality-objectives`, { headers: auth });
    assert.equal(objectiveList.status, 200);
    const reviewList = await fetch(`${h.baseUrl}/api/v1/management-reviews`, { headers: auth });
    assert.equal(reviewList.status, 200);
  } finally {
    await h.close();
  }
});

test("ai-build-projects CRUD", async () => {
  const h = await buildHarness();
  try {
    await seedOrg(h);
    const auth = { Authorization: `Bearer ${h.adminCred}` };

    const created = await fetch(`${h.baseUrl}/api/v1/ai-build-projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...auth },
      body: JSON.stringify({
        organizationId: "org-demo",
        name: "bridge-inspection",
        theme: "橋梁点検 DX",
      }),
    });
    assert.equal(created.status, 201);
    const createdBody = (await created.json()) as {
      aiBuildProject: { id: string; status: string };
    };
    assert.equal(createdBody.aiBuildProject.status, "generated");
    const id = createdBody.aiBuildProject.id;

    const updated = await fetch(`${h.baseUrl}/api/v1/ai-build-projects/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...auth },
      body: JSON.stringify({ status: "archived" }),
    });
    assert.equal(updated.status, 200);

    const listed = await fetch(`${h.baseUrl}/api/v1/ai-build-projects`, { headers: auth });
    assert.equal(listed.status, 200);
  } finally {
    await h.close();
  }
});

test("dx-projects CRUD + unique slug conflict", async () => {
  const h = await buildHarness();
  try {
    await seedOrg(h);
    const auth = { Authorization: `Bearer ${h.adminCred}` };

    const created = await fetch(`${h.baseUrl}/api/v1/dx-projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...auth },
      body: JSON.stringify({
        organizationId: "org-demo",
        slug: "ceop",
        nameJa: "基盤",
        lifecycleState: "production",
      }),
    });
    assert.equal(created.status, 201);

    const conflict = await fetch(`${h.baseUrl}/api/v1/dx-projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...auth },
      body: JSON.stringify({ organizationId: "org-demo", slug: "ceop", nameJa: "重複" }),
    });
    assert.equal(conflict.status, 409);

    const listed = await fetch(`${h.baseUrl}/api/v1/dx-projects`, { headers: auth });
    assert.equal(listed.status, 200);
    const listBody = (await listed.json()) as { dxProjects: { slug: string }[] };
    assert.equal(listBody.dxProjects[0]?.slug, "ceop");
  } finally {
    await h.close();
  }
});

test("material-photo-logs CRUD + CSV export", async () => {
  const h = await buildHarness();
  try {
    await seedOrg(h);
    const auth = { Authorization: `Bearer ${h.adminCred}` };

    const created = await fetch(`${h.baseUrl}/api/v1/material-photo-logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...auth },
      body: JSON.stringify({
        organizationId: "org-demo",
        projectCode: "DEMO-2026-001",
        materialName: "鉄筋 D16",
        quantity: 120,
        unit: "本",
        storagePlace: "A ヤード",
      }),
    });
    assert.equal(created.status, 201);

    const csv = await fetch(`${h.baseUrl}/api/v1/material-photo-logs/export.csv`, {
      headers: auth,
    });
    assert.equal(csv.status, 200);
    const csvText = await csv.text();
    assert.ok(csvText.startsWith("id,projectCode,materialName"));
    assert.ok(csvText.includes("DEMO-2026-001"));
    const contentType = csv.headers.get("content-type");
    assert.ok(contentType?.includes("text/csv"));

    const listed = await fetch(`${h.baseUrl}/api/v1/material-photo-logs`, { headers: auth });
    assert.equal(listed.status, 200);
    const listBody = (await listed.json()) as { total: number };
    assert.equal(listBody.total, 1);
  } finally {
    await h.close();
  }
});

test("new domains respect audit logging", async () => {
  const h = await buildHarness();
  try {
    await seedOrg(h);
    const auth = { Authorization: `Bearer ${h.adminCred}` };

    await fetch(`${h.baseUrl}/api/v1/risks`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...auth },
      body: JSON.stringify({ organizationId: "org-demo", title: "監査対象リスク" }),
    });
    const events = await fetch(`${h.baseUrl}/api/v1/governance/audit`, { headers: auth });
    assert.equal(events.status, 200);
  } finally {
    await h.close();
  }
});
