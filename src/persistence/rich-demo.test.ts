/** Tests for the fictional rich demo dataset: integrity, idempotency, audit chain. */

import { test } from "node:test";
import assert from "node:assert/strict";
import { AuditLog } from "../governance/audit-log.ts";
import { createInMemoryRepositories } from "./in-memory/index.ts";
import { seedRichDemo } from "./rich-demo.ts";

test("rich demo dataset is non-empty and referentially consistent", async () => {
  const repos = createInMemoryRepositories();
  const summary = await seedRichDemo(repos);

  assert.ok(summary.organizations >= 5, "organizations seeded");
  assert.ok(summary.roles >= 8, "roles seeded");
  assert.ok(summary.users >= 10, "users seeded");
  assert.ok(summary.projects >= 5, "projects seeded");
  assert.ok(summary.dailyReports >= 6, "daily reports seeded");
  assert.ok(summary.isoRecords >= 30, "ISO records seeded");
  assert.ok(summary.integrationEvents >= 6, "integration events seeded");

  const projects = await repos.projects.findAll();
  const projectIds = new Set(projects.map((p) => p.id as string));
  for (const entity of await repos.dailyReports.findAll()) {
    assert.ok(projectIds.has(entity.projectId as string), `daily report ${entity.id}`);
  }
  for (const entity of await repos.contracts.findAll()) {
    assert.ok(projectIds.has(entity.projectId as string), `contract ${entity.id}`);
  }
  for (const entity of await repos.purchaseOrders.findAll()) {
    assert.ok(projectIds.has(entity.projectId as string), `purchase order ${entity.id}`);
  }
  for (const entity of await repos.photos.findAll()) {
    assert.ok(projectIds.has(entity.projectId as string), `photo ${entity.id}`);
  }
  for (const entity of await repos.safetyChecks.findAll()) {
    assert.ok(projectIds.has(entity.projectId as string), `safety check ${entity.id}`);
  }
  for (const entity of await repos.qualityInspections.findAll()) {
    assert.ok(projectIds.has(entity.projectId as string), `quality inspection ${entity.id}`);
  }
  for (const entity of await repos.costRecords.findAll()) {
    assert.ok(projectIds.has(entity.projectId as string), `cost record ${entity.id}`);
  }
  for (const entity of await repos.workHours.findAll()) {
    assert.ok(projectIds.has(entity.projectId as string), `work hour ${entity.id}`);
  }
  for (const entity of await repos.workSchedules.findAll()) {
    assert.ok(projectIds.has(entity.projectId as string), `work schedule ${entity.id}`);
  }
  for (const entity of await repos.complianceChecks.findAll()) {
    assert.ok(projectIds.has(entity.projectId as string), `compliance check ${entity.id}`);
  }

  const contracts = await repos.contracts.findAll();
  const contractIds = new Set(contracts.map((c) => c.id as string));
  for (const entity of await repos.legalEvidences.findAll()) {
    assert.ok(contractIds.has(entity.contractId as string), `legal evidence ${entity.id}`);
  }

  const users = await repos.users.findAll();
  const userIds = new Set(users.map((u) => u.id as string));
  for (const entity of await repos.workHours.findAll()) {
    if (entity.workerId !== undefined) {
      assert.ok(userIds.has(entity.workerId as string), `work hour ${entity.id} worker`);
    }
  }
  for (const entity of await repos.notificationPreferences.findAll()) {
    assert.ok(userIds.has(entity.userId), `notification preference ${entity.id}`);
  }
  for (const entity of await repos.notificationDeliveries.findAll()) {
    assert.ok(userIds.has(entity.userId), `notification delivery ${entity.id}`);
  }

  const roles = new Set((await repos.roles.findAll()).map((r) => r.id as string));
  for (const user of users) {
    for (const roleId of user.roleIds) {
      assert.ok(roles.has(roleId as string), `user ${user.id} role ${roleId}`);
    }
  }

  const orgs = await repos.organizations.findAll();
  const orgIds = new Set(orgs.map((o) => o.id as string));
  for (const org of orgs) {
    if (org.parentId !== undefined) {
      assert.ok(orgIds.has(org.parentId as string), `org ${org.id} parent`);
    }
  }
  for (const user of users) {
    assert.ok(orgIds.has(user.organizationId as string), `user ${user.id} org`);
  }

  const workflows = new Set((await repos.workflows.findAll()).map((w) => w.id as string));
  for (const instance of await repos.workflowInstances.findAll()) {
    assert.ok(workflows.has(instance.workflowId as string), `workflow instance ${instance.id}`);
  }

  const aiActionIds = new Set((await repos.aiActions.findAll()).map((a) => a.id as string));
  for (const article of await repos.knowledgeArticles.findAll()) {
    if (article.aiGenerated) {
      assert.ok(article.aiActionId !== undefined, `AI article ${article.id} has aiActionId`);
      assert.ok(aiActionIds.has(article.aiActionId as string), `AI article ${article.id} source`);
    }
  }

  const isoRecords = await repos.isoRecords.findAll();
  const isoIds = new Set(isoRecords.map((r) => r.id as string));
  for (const record of isoRecords) {
    if (record.parentId !== undefined) {
      assert.ok(isoIds.has(record.parentId), `ISO record ${record.id} parent`);
    }
  }

  // Natural keys remain unique (the same guarantee enforced at the DB level).
  assert.equal(new Set(projects.map((p) => p.projectCode)).size, projects.length);
  assert.equal(new Set(contracts.map((c) => c.contractNumber)).size, contracts.length);
  const purchaseOrders = await repos.purchaseOrders.findAll();
  assert.equal(new Set(purchaseOrders.map((p) => p.orderNumber)).size, purchaseOrders.length);
});

test("re-seeding the dataset is idempotent", async () => {
  const repos = createInMemoryRepositories();
  const first = await seedRichDemo(repos);
  const second = await seedRichDemo(repos);
  assert.deepEqual(second, first);
});

test("audit history is sealed and the tamper-evident chain verifies", async () => {
  const repos = createInMemoryRepositories();
  const audit = new AuditLog();
  const summary = await seedRichDemo(repos, { auditLog: audit });
  assert.equal(summary.auditEvents, 10);
  assert.ok(audit.size >= 10);
  assert.equal(audit.verify().valid, true);

  // Re-seeding must not break the chain (duplicate ids are tolerated).
  await seedRichDemo(repos, { auditLog: audit });
  assert.equal(audit.verify().valid, true);
  assert.ok(audit.size >= 10);
});
