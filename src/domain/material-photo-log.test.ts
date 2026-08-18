/** Unit tests for the material photo log domain. */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MATERIAL_INSPECTION_STATUSES,
  MATERIAL_PHOTO_LOG_CSV_COLUMNS,
  MATERIAL_TRANSACTION_TYPES,
  createMaterialPhotoLog,
  materialPhotoLogToCsvRow,
  updateMaterialPhotoLog,
} from "./material-photo-log.ts";

const NOW = "2026-08-10T08:00:00.000Z";

test("material photo log creates with defaults", () => {
  const r = createMaterialPhotoLog({
    id: "pl-1",
    organizationId: "org",
    projectCode: "DEMO-2026-001",
    materialName: "鉄筋 D16",
    createdAt: NOW as never,
  });
  assert.ok(r.ok);
  assert.equal(r.value.transactionType, "received");
  assert.equal(r.value.inspectionStatus, "pending");
  assert.equal(r.value.needsReview, false);
});

test("material photo log accepts all transaction/inspection statuses", () => {
  for (const t of MATERIAL_TRANSACTION_TYPES) {
    const r = createMaterialPhotoLog({
      id: `pl-t-${t}`,
      organizationId: "org",
      projectCode: "P",
      materialName: "x",
      transactionType: t,
      createdAt: NOW as never,
    });
    assert.ok(r.ok, `${t} should be valid`);
  }
  for (const s of MATERIAL_INSPECTION_STATUSES) {
    const r = createMaterialPhotoLog({
      id: `pl-s-${s}`,
      organizationId: "org",
      projectCode: "P",
      materialName: "x",
      inspectionStatus: s,
      createdAt: NOW as never,
    });
    assert.ok(r.ok, `${s} should be valid`);
  }
});

test("material photo log validates required fields and coordinates", () => {
  assert.ok(
    !createMaterialPhotoLog({
      id: "",
      organizationId: "org",
      projectCode: "P",
      materialName: "x",
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createMaterialPhotoLog({
      id: "p",
      organizationId: "org",
      projectCode: "",
      materialName: "x",
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createMaterialPhotoLog({
      id: "p",
      organizationId: "org",
      projectCode: "P",
      materialName: "",
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createMaterialPhotoLog({
      id: "p",
      organizationId: "org",
      projectCode: "P",
      materialName: "x",
      quantity: -1,
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createMaterialPhotoLog({
      id: "p",
      organizationId: "org",
      projectCode: "P",
      materialName: "x",
      latitude: 91,
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createMaterialPhotoLog({
      id: "p",
      organizationId: "org",
      projectCode: "P",
      materialName: "x",
      longitude: -181,
      createdAt: NOW as never,
    }).ok,
  );
});

test("material photo log keeps optional fields", () => {
  const r = createMaterialPhotoLog({
    id: "pl-2",
    organizationId: "org",
    projectCode: "DEMO-2026-002",
    materialName: "手すり",
    materialCategory: "金属",
    quantity: 40,
    unit: "本",
    storagePlace: "B ヤード",
    memo: "要確認",
    transactionType: "received",
    inspectionStatus: "review",
    needsReview: true,
    capturedAt: "2026-08-13T09:05:00.000Z" as never,
    latitude: 35.68,
    longitude: 139.76,
    objectKey: "photos/x.jpg",
    createdAt: NOW as never,
  });
  assert.ok(r.ok);
  assert.equal(r.value.quantity, 40);
  assert.equal(r.value.needsReview, true);
  assert.equal(r.value.storagePlace, "B ヤード");
});

test("material photo log update merges", () => {
  const base = createMaterialPhotoLog({
    id: "pl-1",
    organizationId: "org",
    projectCode: "P",
    materialName: "鉄筋",
    createdAt: NOW as never,
  });
  assert.ok(base.ok);
  const updated = updateMaterialPhotoLog(base.value, {
    inspectionStatus: "passed",
    quantity: 120,
    updatedAt: NOW as never,
  });
  assert.ok(updated.ok);
  assert.equal(updated.value.inspectionStatus, "passed");
  assert.equal(updated.value.quantity, 120);
});

test("material photo log update rejects invalid", () => {
  const base = createMaterialPhotoLog({
    id: "pl-1",
    organizationId: "org",
    projectCode: "P",
    materialName: "x",
    createdAt: NOW as never,
  });
  assert.ok(base.ok);
  assert.ok(
    !updateMaterialPhotoLog(base.value, {
      inspectionStatus: "bogus" as never,
      updatedAt: NOW as never,
    }).ok,
  );
  assert.ok(!updateMaterialPhotoLog(base.value, { latitude: 99, updatedAt: NOW as never }).ok);
});

test("csv row serialization", () => {
  const log = createMaterialPhotoLog({
    id: "pl-1",
    organizationId: "org",
    projectCode: "DEMO-2026-001",
    materialName: "鉄筋 D16",
    quantity: 120,
    unit: "本",
    storagePlace: "A ヤード",
    memo: "ロット R-2026-0712",
    transactionType: "received",
    inspectionStatus: "passed",
    createdAt: NOW as never,
  });
  assert.ok(log.ok);
  const row = materialPhotoLogToCsvRow(log.value);
  assert.ok(row.startsWith("pl-1,DEMO-2026-001,鉄筋 D16,"));
  assert.ok(row.includes("120"));
  assert.ok(row.includes("received"));
  // CSV columns order is stable and complete
  assert.equal(MATERIAL_PHOTO_LOG_CSV_COLUMNS.length, 14);
});
