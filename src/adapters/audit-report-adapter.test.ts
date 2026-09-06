/**
 * Unit tests for the quarterly audit summary aggregation and PDF rendering
 * (issue #85).
 *
 * These pin the aggregation against a hand-built dataset so that the counts
 * baked into the PDF can be checked against the source records directly,
 * independent of the HTTP route that wires tenant scoping around it (see
 * `src/api/routes/audit-report.test.ts` for the end-to-end coverage).
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import { PDFDocument } from "pdf-lib";

import {
  buildAuditReportSummary,
  currentReportPeriod,
  parseReportPeriod,
  periodToString,
  renderAuditReportPdf,
} from "./audit-report-adapter.ts";
import { AuditLog } from "../governance/audit-log.ts";
import { createAuditEvent } from "../domain/audit-event.ts";
import { createComplianceCheck } from "../domain/compliance.ts";
import { createManagementReview } from "../domain/management-review.ts";
import type { IsoTimestamp, Result } from "../domain/common.ts";

function unwrap<T>(r: Result<T>): T {
  if (!r.ok) throw new Error(JSON.stringify(r.error));
  return r.value;
}

function iso(s: string): IsoTimestamp {
  return s as IsoTimestamp;
}

// ---------------------------------------------------------------------------
// parseReportPeriod / currentReportPeriod
// ---------------------------------------------------------------------------

test("parseReportPeriod: accepts a well-formed YYYY-Q# string", () => {
  const result = parseReportPeriod("2026-Q3");
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.deepEqual(result.value, { year: 2026, quarter: 3 });
  }
});

test("parseReportPeriod: rejects malformed input", () => {
  for (const bad of ["2026", "2026-Q5", "2026-Q0", "Q3-2026", "2026Q3", ""]) {
    const result = parseReportPeriod(bad);
    assert.equal(result.ok, false, `expected "${bad}" to be rejected`);
  }
});

test("currentReportPeriod: maps a fixed date to the correct quarter", () => {
  assert.deepEqual(currentReportPeriod(new Date("2026-01-15T00:00:00.000Z")), {
    year: 2026,
    quarter: 1,
  });
  assert.deepEqual(currentReportPeriod(new Date("2026-08-10T00:00:00.000Z")), {
    year: 2026,
    quarter: 3,
  });
  assert.deepEqual(currentReportPeriod(new Date("2026-12-31T23:59:59.999Z")), {
    year: 2026,
    quarter: 4,
  });
});

test("periodToString: round-trips through parseReportPeriod", () => {
  const period = unwrap(parseReportPeriod("2026-Q2"));
  assert.equal(periodToString(period), "2026-Q2");
});

// ---------------------------------------------------------------------------
// buildAuditReportSummary
// ---------------------------------------------------------------------------

test("buildAuditReportSummary: rejects an invalid period before touching any data", () => {
  const result = buildAuditReportSummary({
    period: "not-a-period",
    generatedAt: iso("2026-10-01T00:00:00.000Z"),
    auditEntries: [],
    complianceChecks: [],
    managementReviews: [],
    integrityValid: true,
  });
  assert.equal(result.ok, false);
});

test("buildAuditReportSummary: counts audit outcomes and actions restricted to the quarter", () => {
  const log = new AuditLog();
  // In range (Q3 2026 == Jul 1 – Sep 30 2026).
  log.append(
    unwrap(
      createAuditEvent({
        id: "e1",
        at: iso("2026-07-15T00:00:00.000Z"),
        actor: "user-1",
        action: "policy:update",
        resource: "policy-1",
        outcome: "success",
      }),
    ),
  );
  log.append(
    unwrap(
      createAuditEvent({
        id: "e2",
        at: iso("2026-08-01T00:00:00.000Z"),
        actor: "user-1",
        action: "policy:update",
        resource: "policy-2",
        outcome: "denied",
      }),
    ),
  );
  log.append(
    unwrap(
      createAuditEvent({
        id: "e3",
        at: iso("2026-09-29T23:59:59.000Z"),
        actor: "user-2",
        action: "audit:export",
        resource: "governance:audit-log",
        outcome: "success",
      }),
    ),
  );
  // Out of range: before the quarter starts and on the exclusive end boundary.
  log.append(
    unwrap(
      createAuditEvent({
        id: "e4",
        at: iso("2026-06-30T23:59:59.999Z"),
        actor: "user-1",
        action: "policy:update",
        resource: "policy-3",
        outcome: "success",
      }),
    ),
  );
  log.append(
    unwrap(
      createAuditEvent({
        id: "e5",
        at: iso("2026-10-01T00:00:00.000Z"),
        actor: "user-1",
        action: "policy:update",
        resource: "policy-4",
        outcome: "success",
      }),
    ),
  );

  const result = buildAuditReportSummary({
    period: "2026-Q3",
    generatedAt: iso("2026-10-02T00:00:00.000Z"),
    auditEntries: log.entries,
    complianceChecks: [],
    managementReviews: [],
    integrityValid: true,
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.value.period, "2026-Q3");
  assert.equal(result.value.auditLog.totalEvents, 3, "only the 3 in-range events count");
  assert.equal(result.value.auditLog.byOutcome.success, 2);
  assert.equal(result.value.auditLog.byOutcome.denied, 1);
  assert.equal(result.value.auditLog.byOutcome.failure, 0);
  assert.equal(result.value.auditLog.integrityValid, true);
  assert.deepEqual(
    result.value.auditLog.topActions.find((a) => a.action === "policy:update"),
    { action: "policy:update", count: 2 },
  );
  assert.deepEqual(
    result.value.auditLog.topActions.find((a) => a.action === "audit:export"),
    { action: "audit:export", count: 1 },
  );
});

test("buildAuditReportSummary: aggregates compliance checks by result and standard", () => {
  const inRange = unwrap(
    createComplianceCheck({
      id: "c1",
      organizationId: "org-a",
      projectId: "proj-1",
      standard: "iso-9001",
      item: "Document control review",
      result: "pass",
      checkedAt: "2026-08-05",
      createdAt: iso("2026-08-05T00:00:00.000Z"),
    }),
  );
  const alsoInRange = unwrap(
    createComplianceCheck({
      id: "c2",
      organizationId: "org-a",
      projectId: "proj-1",
      standard: "iso-9001",
      item: "Nonconformance follow-up",
      result: "fail",
      checkedAt: "2026-09-20",
      createdAt: iso("2026-09-20T00:00:00.000Z"),
    }),
  );
  const outOfRange = unwrap(
    createComplianceCheck({
      id: "c3",
      organizationId: "org-a",
      projectId: "proj-1",
      standard: "kensetsugyo-ho",
      item: "Q2 review",
      result: "pass",
      checkedAt: "2026-05-01",
      createdAt: iso("2026-05-01T00:00:00.000Z"),
    }),
  );

  const result = buildAuditReportSummary({
    period: "2026-Q3",
    generatedAt: iso("2026-10-02T00:00:00.000Z"),
    auditEntries: [],
    complianceChecks: [inRange, alsoInRange, outOfRange],
    managementReviews: [],
    integrityValid: true,
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.value.compliance.totalChecks, 2);
  assert.equal(result.value.compliance.byResult.pass, 1);
  assert.equal(result.value.compliance.byResult.fail, 1);
  assert.equal(result.value.compliance.byResult.pending, 0);
  assert.equal(result.value.compliance.byStandard["iso-9001"], 2);
  assert.equal(result.value.compliance.byStandard["kensetsugyo-ho"], 0);
});

test("buildAuditReportSummary: falls back to createdAt when a compliance check has no checkedAt", () => {
  const noCheckedAt = unwrap(
    createComplianceCheck({
      id: "c4",
      organizationId: "org-a",
      projectId: "proj-1",
      standard: "iso-14001",
      item: "Pending review",
      result: "pending",
      createdAt: iso("2026-08-12T00:00:00.000Z"),
    }),
  );

  const result = buildAuditReportSummary({
    period: "2026-Q3",
    generatedAt: iso("2026-10-02T00:00:00.000Z"),
    auditEntries: [],
    complianceChecks: [noCheckedAt],
    managementReviews: [],
    integrityValid: true,
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.compliance.totalChecks, 1);
  assert.equal(result.value.compliance.byResult.pending, 1);
});

test("buildAuditReportSummary: aggregates management reviews by status and sorts items by date", () => {
  const later = unwrap(
    createManagementReview({
      id: "mr-2",
      organizationId: "org-a",
      title: "Q3 review, second session",
      status: "completed",
      reviewDate: "2026-09-25",
      createdAt: iso("2026-09-25T00:00:00.000Z"),
    }),
  );
  const earlier = unwrap(
    createManagementReview({
      id: "mr-1",
      organizationId: "org-a",
      title: "Q3 review, kickoff",
      status: "scheduled",
      reviewDate: "2026-07-10",
      nextReviewDate: "2026-10-10",
      createdAt: iso("2026-07-10T00:00:00.000Z"),
    }),
  );
  const outOfRange = unwrap(
    createManagementReview({
      id: "mr-3",
      organizationId: "org-a",
      title: "Q2 review",
      status: "completed",
      reviewDate: "2026-04-01",
      createdAt: iso("2026-04-01T00:00:00.000Z"),
    }),
  );

  const result = buildAuditReportSummary({
    period: "2026-Q3",
    generatedAt: iso("2026-10-02T00:00:00.000Z"),
    auditEntries: [],
    complianceChecks: [],
    managementReviews: [later, earlier, outOfRange],
    integrityValid: true,
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.value.managementReviews.total, 2);
  assert.equal(result.value.managementReviews.byStatus.completed, 1);
  assert.equal(result.value.managementReviews.byStatus.scheduled, 1);
  assert.deepEqual(
    result.value.managementReviews.items.map((i) => i.id),
    ["mr-1", "mr-2"],
    "items must be sorted by reviewDate ascending",
  );
  assert.equal(result.value.managementReviews.items[0]?.nextReviewDate, "2026-10-10");
});

test("buildAuditReportSummary: records the organizationId it was given verbatim", () => {
  const result = buildAuditReportSummary({
    period: "2026-Q3",
    organizationId: "org-a",
    generatedAt: iso("2026-10-02T00:00:00.000Z"),
    auditEntries: [],
    complianceChecks: [],
    managementReviews: [],
    integrityValid: false,
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.organizationId, "org-a");
  assert.equal(result.value.auditLog.integrityValid, false);
});

// ---------------------------------------------------------------------------
// renderAuditReportPdf
// ---------------------------------------------------------------------------

test("renderAuditReportPdf: renders a loadable, non-empty PDF", async () => {
  const summary = unwrap(
    buildAuditReportSummary({
      period: "2026-Q3",
      organizationId: "org-a",
      generatedAt: iso("2026-10-02T00:00:00.000Z"),
      auditEntries: [],
      complianceChecks: [],
      managementReviews: [],
      integrityValid: true,
    }),
  );

  const bytes = await renderAuditReportPdf(summary);
  assert.equal(bytes.length > 0, true);
  assert.equal(Buffer.from(bytes.slice(0, 5)).toString("latin1"), "%PDF-");

  // A malformed PDF would throw here — this is the cheapest structural check
  // that pdf-lib actually produced a well-formed document.
  const doc = await PDFDocument.load(bytes);
  assert.ok(doc.getPageCount() >= 1);
});
