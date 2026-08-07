/** Unit tests for S-07 compliance/evidence and E-11 template domains. */

import { test } from "node:test";
import assert from "node:assert/strict";
import { createComplianceCheck, createLegalEvidence } from "./compliance.ts";
import { createNotificationTemplate } from "./notification-template.ts";

const NOW = "2026-08-07T06:00:00.000Z";
const HASH = "d".repeat(64);

test("compliance check domain validates standard/result/date", () => {
  const ok = createComplianceCheck({
    id: "cc-1",
    organizationId: "org",
    projectId: "p-1",
    standard: "kensetsugyo-ho",
    item: "建設業許可証",
    result: "pass",
    checkedAt: "2026-08-07",
    createdAt: NOW as never,
  });
  assert.ok(ok.ok);

  const badStandard = createComplianceCheck({
    id: "cc-2",
    organizationId: "org",
    projectId: "p-1",
    standard: "unknown" as never,
    item: "x",
    createdAt: NOW as never,
  });
  assert.ok(!badStandard.ok);
});

test("legal evidence domain validates evidence hash", () => {
  const ok = createLegalEvidence({
    id: "le-1",
    organizationId: "org",
    contractId: "contract-1",
    eventType: "contract-signed",
    description: "契約締結",
    evidenceHash: HASH.toUpperCase(),
    occurredAt: NOW as never,
    createdAt: NOW as never,
  });
  assert.ok(ok.ok);
  assert.equal(ok.value.evidenceHash, HASH);

  const bad = createLegalEvidence({
    id: "le-2",
    organizationId: "org",
    contractId: "contract-1",
    eventType: "e",
    description: "d",
    evidenceHash: "nope",
    occurredAt: NOW as never,
    createdAt: NOW as never,
  });
  assert.ok(!bad.ok);
});

test("notification template domain validates channel", () => {
  const ok = createNotificationTemplate({
    id: "nt-1",
    organizationId: "org",
    templateKey: "daily-report.submitted",
    subject: "日報提出",
    body: "日報が提出されました",
    channel: "email",
    createdAt: NOW as never,
  });
  assert.ok(ok.ok);

  const bad = createNotificationTemplate({
    id: "nt-2",
    templateKey: "k",
    subject: "s",
    body: "b",
    channel: "sms" as never,
    createdAt: NOW as never,
  });
  assert.ok(!bad.ok);
});
