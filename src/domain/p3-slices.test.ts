/** Unit tests for S-03/S-04/S-05/S-09 domains. */

import { test } from "node:test";
import assert from "node:assert/strict";
import { createPhoto } from "./photo.ts";
import { createSafetyCheck, createQualityInspection } from "./safety.ts";
import { createCostRecord, createWorkHour } from "./cost.ts";
import { createNotificationDelivery } from "./notification.ts";

const NOW = "2026-08-07T06:00:00.000Z";

test("photo domain validates metadata and defaults object key", () => {
  const ok = createPhoto({
    id: "ph-1",
    organizationId: "org",
    projectId: "p-1",
    fileName: "site.jpg",
    originalName: "IMG_001.jpg",
    contentType: "image/jpeg",
    fileSize: 1024,
    createdAt: NOW as never,
  });
  assert.ok(ok.ok);
  assert.equal(ok.value.objectKey, "photos/ph-1");
  assert.equal(ok.value.category, "general");

  const bad = createPhoto({
    id: "ph-2",
    organizationId: "org",
    projectId: "p-1",
    fileName: "",
    originalName: "x",
    contentType: "image/jpeg",
    fileSize: -1,
    createdAt: NOW as never,
  });
  assert.ok(!bad.ok);
});

test("safety check domain enforces item arithmetic and results", () => {
  const ok = createSafetyCheck({
    id: "sc-1",
    organizationId: "org",
    projectId: "p-1",
    checkDate: "2026-08-07",
    itemsTotal: 5,
    itemsOk: 4,
    itemsNg: 1,
    overallResult: "ng",
    createdAt: NOW as never,
  });
  assert.ok(ok.ok);

  const bad = createSafetyCheck({
    id: "sc-2",
    organizationId: "org",
    projectId: "p-1",
    checkDate: "2026-08-07",
    itemsTotal: 3,
    itemsOk: 2,
    itemsNg: 2,
    createdAt: NOW as never,
  });
  assert.ok(!bad.ok);

  const inspection = createQualityInspection({
    id: "qi-1",
    organizationId: "org",
    projectId: "p-1",
    inspectionDate: "2026-08-07",
    inspectionType: "concrete",
    targetItem: "A-1 slab",
    result: "pass",
    createdAt: NOW as never,
  });
  assert.ok(inspection.ok);
});

test("cost domain validates amounts and hours", () => {
  const cost = createCostRecord({
    id: "c-1",
    organizationId: "org",
    projectId: "p-1",
    recordDate: "2026-08-07",
    category: "materials",
    description: "rebar",
    budgetedAmount: 100,
    actualAmount: 90,
    createdAt: NOW as never,
  });
  assert.ok(cost.ok);
  assert.ok(
    !createCostRecord({
      id: "c-2",
      organizationId: "org",
      projectId: "p-1",
      recordDate: "2026-08-07",
      category: "materials",
      description: "x",
      budgetedAmount: -1,
      createdAt: NOW as never,
    }).ok,
  );

  const hours = createWorkHour({
    id: "w-1",
    organizationId: "org",
    projectId: "p-1",
    workDate: "2026-08-07",
    hours: 8,
    createdAt: NOW as never,
  });
  assert.ok(hours.ok);
  assert.ok(
    !createWorkHour({
      id: "w-2",
      organizationId: "org",
      projectId: "p-1",
      workDate: "2026-08-07",
      hours: 25,
      createdAt: NOW as never,
    }).ok,
  );
});

test("notification domain creates a pending delivery", () => {
  const delivery = createNotificationDelivery({
    id: "n-1",
    organizationId: "org",
    userId: "user-1",
    eventKey: "daily-report.submitted",
    channel: "slack",
    createdAt: NOW as never,
  });
  assert.ok(delivery.ok);
  assert.equal(delivery.value.status, "pending");
  assert.equal(delivery.value.attempts, 0);

  const bad = createNotificationDelivery({
    id: "n-2",
    userId: "u",
    eventKey: "e",
    channel: "sms" as never,
    createdAt: NOW as never,
  });
  assert.ok(!bad.ok);
});
