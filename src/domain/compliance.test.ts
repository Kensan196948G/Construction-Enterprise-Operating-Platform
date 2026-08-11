/** Unit tests for compliance/legal evidence domain (ServiceHub S-07). */

import { test } from "node:test";
import assert from "node:assert/strict";
import { createComplianceCheck, createLegalEvidence } from "./compliance.ts";

const NOW = "2026-08-07T06:00:00.000Z";
const HASH = "d".repeat(64);

test("compliance check domain accepts all valid standards and results", () => {
  for (const standard of [
    "kensetsugyo-ho",
    "shitauke-ho",
    "iso-9001",
    "iso-14001",
    "iso-45001",
    "other",
  ] as const) {
    const r = createComplianceCheck({
      id: `cc-${standard}`,
      organizationId: "org",
      projectId: "p-1",
      standard,
      item: "test item",
      result: "pass",
      createdAt: NOW as never,
    });
    assert.ok(r.ok, `standard ${standard} should be valid`);
    assert.equal(r.value.standard, standard);
  }

  for (const result of ["pass", "fail", "pending"] as const) {
    const r = createComplianceCheck({
      id: `cc-r-${result}`,
      organizationId: "org",
      projectId: "p-1",
      item: "test item",
      result,
      createdAt: NOW as never,
    });
    assert.ok(r.ok, `result ${result} should be valid`);
    assert.equal(r.value.result, result);
  }
});

test("compliance check domain validates checkedAt as YYYY-MM-DD", () => {
  const ok = createComplianceCheck({
    id: "cc-date",
    organizationId: "org",
    projectId: "p-1",
    item: "test",
    checkedAt: "2026-08-07",
    createdAt: NOW as never,
  });
  assert.ok(ok.ok);
  assert.equal(ok.value.checkedAt, "2026-08-07");

  const bad = createComplianceCheck({
    id: "cc-bad-date",
    organizationId: "org",
    projectId: "p-1",
    item: "test",
    checkedAt: "2026/08/07",
    createdAt: NOW as never,
  });
  assert.ok(!bad.ok);
});

test("compliance check domain rejects invalid standard", () => {
  const bad = createComplianceCheck({
    id: "cc-bad",
    organizationId: "org",
    projectId: "p-1",
    standard: "unknown" as never,
    item: "test",
    createdAt: NOW as never,
  });
  assert.ok(!bad.ok);
});

test("compliance check domain rejects empty required fields", () => {
  assert.ok(
    !createComplianceCheck({
      id: "",
      organizationId: "org",
      projectId: "p-1",
      item: "test",
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createComplianceCheck({
      id: "cc",
      organizationId: "",
      projectId: "p-1",
      item: "test",
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createComplianceCheck({
      id: "cc",
      organizationId: "org",
      projectId: "",
      item: "test",
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createComplianceCheck({
      id: "cc",
      organizationId: "org",
      projectId: "p-1",
      item: "",
      createdAt: NOW as never,
    }).ok,
  );
});

test("compliance check domain stores optional notes", () => {
  const r = createComplianceCheck({
    id: "cc-notes",
    organizationId: "org",
    projectId: "p-1",
    item: "建設業許可証",
    result: "pass",
    notes: "更新確認済み",
    createdAt: NOW as never,
  });
  assert.ok(r.ok);
  assert.equal(r.value.notes, "更新確認済み");
});

test("legal evidence domain validates evidenceHash as 64-char hex SHA-256", () => {
  const ok = createLegalEvidence({
    id: "le-1",
    organizationId: "org",
    contractId: "contract-1",
    eventType: "contract-signed",
    description: "契約締結",
    evidenceHash: HASH,
    occurredAt: NOW as never,
    createdAt: NOW as never,
  });
  assert.ok(ok.ok);
  assert.equal(ok.value.evidenceHash, HASH);

  // uppercase still valid, normalises to lowercase
  const upper = createLegalEvidence({
    id: "le-upper",
    organizationId: "org",
    contractId: "contract-1",
    eventType: "contract-signed",
    description: "desc",
    evidenceHash: HASH.toUpperCase(),
    occurredAt: NOW as never,
    createdAt: NOW as never,
  });
  assert.ok(upper.ok);
  assert.equal(upper.value.evidenceHash, HASH);

  const badLen = createLegalEvidence({
    id: "le-short",
    organizationId: "org",
    contractId: "contract-1",
    eventType: "e",
    description: "d",
    evidenceHash: "abc",
    occurredAt: NOW as never,
    createdAt: NOW as never,
  });
  assert.ok(!badLen.ok);

  const badChars = createLegalEvidence({
    id: "le-bad-chars",
    organizationId: "org",
    contractId: "contract-1",
    eventType: "e",
    description: "d",
    evidenceHash: "g".repeat(64),
    occurredAt: NOW as never,
    createdAt: NOW as never,
  });
  assert.ok(!badChars.ok);
});

test("legal evidence domain creates without evidenceHash (optional)", () => {
  const ok = createLegalEvidence({
    id: "le-no-hash",
    organizationId: "org",
    contractId: "contract-1",
    eventType: "contract-drafted",
    description: "契約書作成",
    occurredAt: NOW as never,
    createdAt: NOW as never,
  });
  assert.ok(ok.ok);
  assert.equal(ok.value.evidenceHash, undefined);
});

test("legal evidence domain rejects empty required fields", () => {
  assert.ok(
    !createLegalEvidence({
      id: "",
      organizationId: "org",
      contractId: "c-1",
      eventType: "e",
      description: "d",
      occurredAt: NOW as never,
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createLegalEvidence({
      id: "le",
      organizationId: "org",
      contractId: "",
      eventType: "e",
      description: "d",
      occurredAt: NOW as never,
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createLegalEvidence({
      id: "le",
      organizationId: "org",
      contractId: "c-1",
      eventType: "",
      description: "d",
      occurredAt: NOW as never,
      createdAt: NOW as never,
    }).ok,
  );
  assert.ok(
    !createLegalEvidence({
      id: "le",
      organizationId: "org",
      contractId: "c-1",
      eventType: "e",
      description: "",
      occurredAt: NOW as never,
      createdAt: NOW as never,
    }).ok,
  );
});
