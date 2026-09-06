// FILE: src/adapters/audit-report-adapter.ts
/**
 * Quarterly audit summary report adapter (issue #85).
 *
 * Auditors need a single printable document summarizing a calendar quarter's
 * governance evidence rather than three separate raw exports (audit log,
 * compliance checks, management reviews). This adapter aggregates those three
 * record types over one quarter and renders the result as a PDF, reusing the
 * same font-embedding / page-layout primitives the single-record PDF exports
 * (`pdf-report-adapter.ts`, issue #71) use — see `pdf-writer.ts` for the
 * shared machinery and its extraction rationale.
 *
 * Tenant scoping is the caller's responsibility: `buildAuditReportSummary`
 * only does time-window filtering and counting over whatever collections it
 * is handed. The HTTP route (`governance.ts`) is what applies
 * `scopeAuditEntries` / `organizationId` filters before calling in, exactly
 * as the existing `/audit` and `/audit/export` routes do for the raw log.
 */

import { type Result, err, ok } from "../domain/common.ts";
import type { IsoTimestamp } from "../domain/common.ts";
import { AUDIT_OUTCOMES, type AuditOutcome } from "../domain/audit-event.ts";
import type { AuditLogEntry } from "../governance/audit-log.ts";
import {
  COMPLIANCE_RESULTS,
  COMPLIANCE_STANDARDS,
  type ComplianceCheck,
  type ComplianceResult,
  type ComplianceStandard,
} from "../domain/compliance.ts";
import {
  MANAGEMENT_REVIEW_STATUSES,
  type ManagementReview,
  type ManagementReviewStatus,
} from "../domain/management-review.ts";
import {
  BODY_SIZE,
  LINE_HEIGHT,
  MARGIN,
  createWriter,
  ensureSpace,
  writeField,
  writeMultilineField,
  writeSectionHeading,
  writeTitle,
} from "./pdf-writer.ts";

// ---------------------------------------------------------------------------
// Period parsing
// ---------------------------------------------------------------------------

/** A calendar quarter, e.g. `{ year: 2026, quarter: 3 }` == "2026-Q3". */
export interface ReportPeriod {
  readonly year: number;
  readonly quarter: 1 | 2 | 3 | 4;
}

const PERIOD_PATTERN = /^(\d{4})-Q([1-4])$/;

export function periodToString(period: ReportPeriod): string {
  return `${period.year}-Q${period.quarter}`;
}

/** Parse a `YYYY-Q#` period string (e.g. `2026-Q3`). */
export function parseReportPeriod(raw: string): Result<ReportPeriod> {
  const match = PERIOD_PATTERN.exec(raw);
  if (match === null) {
    return err([{ path: "period", message: "period must use the format YYYY-Q# (e.g. 2026-Q3)" }]);
  }
  const year = Number.parseInt(match[1] as string, 10);
  const quarter = Number.parseInt(match[2] as string, 10) as 1 | 2 | 3 | 4;
  return ok({ year, quarter });
}

/** The quarter containing `now` (defaults to the current time). */
export function currentReportPeriod(now: Date = new Date()): ReportPeriod {
  const year = now.getUTCFullYear();
  const quarter = (Math.floor(now.getUTCMonth() / 3) + 1) as 1 | 2 | 3 | 4;
  return { year, quarter };
}

/** Half-open `[start, end)` UTC instant range covering a calendar quarter. */
function periodRange(period: ReportPeriod): { readonly start: string; readonly end: string } {
  const startMonth = (period.quarter - 1) * 3;
  const start = new Date(Date.UTC(period.year, startMonth, 1));
  const end = new Date(Date.UTC(period.year, startMonth + 3, 1));
  return { start: start.toISOString(), end: end.toISOString() };
}

/** True when a `YYYY-MM-DD` or full ISO timestamp string falls in `[start, end)`. */
function withinRange(dateLike: string, start: string, end: string): boolean {
  const t = new Date(dateLike).getTime();
  if (Number.isNaN(t)) return false;
  return t >= new Date(start).getTime() && t < new Date(end).getTime();
}

function zeroCountsFor<T extends string>(keys: readonly T[]): Record<T, number> {
  const out = {} as Record<T, number>;
  for (const key of keys) out[key] = 0;
  return out;
}

// ---------------------------------------------------------------------------
// Aggregation
// ---------------------------------------------------------------------------

export interface AuditReportSummary {
  readonly period: string;
  readonly organizationId?: string;
  readonly generatedAt: IsoTimestamp;
  readonly rangeStart: string;
  readonly rangeEnd: string;
  readonly auditLog: {
    readonly totalEvents: number;
    readonly byOutcome: Record<AuditOutcome, number>;
    readonly topActions: readonly { readonly action: string; readonly count: number }[];
    readonly integrityValid: boolean;
  };
  readonly compliance: {
    readonly totalChecks: number;
    readonly byResult: Record<ComplianceResult, number>;
    readonly byStandard: Record<ComplianceStandard, number>;
  };
  readonly managementReviews: {
    readonly total: number;
    readonly byStatus: Record<ManagementReviewStatus, number>;
    readonly items: readonly {
      readonly id: string;
      readonly title: string;
      readonly status: ManagementReviewStatus;
      readonly reviewDate: string;
      readonly nextReviewDate?: string | undefined;
    }[];
  };
}

export interface BuildAuditReportSummaryInput {
  /** Raw `YYYY-Q#` period string; validated internally. */
  readonly period: string;
  /** Recorded verbatim on the summary; callers already scoped the collections to it. */
  readonly organizationId?: string | undefined;
  readonly generatedAt: IsoTimestamp;
  readonly auditEntries: readonly AuditLogEntry[];
  readonly complianceChecks: readonly ComplianceCheck[];
  readonly managementReviews: readonly ManagementReview[];
  /** Result of `IAuditLog.verify()`, taken by the caller at the same time as the entries snapshot. */
  readonly integrityValid: boolean;
}

/**
 * Aggregate audit-log, compliance-check and management-review records over
 * one calendar quarter into the shape {@link renderAuditReportPdf} consumes.
 *
 * Every collection is filtered to the quarter's date range here; only the
 * *tenant* scoping is left to the caller (see the file-level comment).
 */
export function buildAuditReportSummary(
  input: BuildAuditReportSummaryInput,
): Result<AuditReportSummary> {
  const parsedPeriod = parseReportPeriod(input.period);
  if (!parsedPeriod.ok) {
    return parsedPeriod;
  }
  const { start, end } = periodRange(parsedPeriod.value);

  const auditInRange = input.auditEntries.filter((entry) =>
    withinRange(entry.event.at, start, end),
  );
  const byOutcome = zeroCountsFor(AUDIT_OUTCOMES);
  const actionCounts = new Map<string, number>();
  for (const entry of auditInRange) {
    byOutcome[entry.event.outcome] += 1;
    actionCounts.set(entry.event.action, (actionCounts.get(entry.event.action) ?? 0) + 1);
  }
  const topActions = [...actionCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 10)
    .map(([action, count]) => ({ action, count }));

  const complianceInRange = input.complianceChecks.filter((check) =>
    withinRange(check.checkedAt ?? check.createdAt, start, end),
  );
  const complianceByResult = zeroCountsFor(COMPLIANCE_RESULTS);
  const complianceByStandard = zeroCountsFor(COMPLIANCE_STANDARDS);
  for (const check of complianceInRange) {
    complianceByResult[check.result] += 1;
    complianceByStandard[check.standard] += 1;
  }

  const reviewsInRange = input.managementReviews.filter((review) =>
    withinRange(review.reviewDate, start, end),
  );
  const reviewsByStatus = zeroCountsFor(MANAGEMENT_REVIEW_STATUSES);
  for (const review of reviewsInRange) {
    reviewsByStatus[review.status] += 1;
  }

  return ok({
    period: periodToString(parsedPeriod.value),
    ...(input.organizationId !== undefined ? { organizationId: input.organizationId } : {}),
    generatedAt: input.generatedAt,
    rangeStart: start,
    rangeEnd: end,
    auditLog: {
      totalEvents: auditInRange.length,
      byOutcome,
      topActions,
      integrityValid: input.integrityValid,
    },
    compliance: {
      totalChecks: complianceInRange.length,
      byResult: complianceByResult,
      byStandard: complianceByStandard,
    },
    managementReviews: {
      total: reviewsInRange.length,
      byStatus: reviewsByStatus,
      items: reviewsInRange
        .slice()
        .sort((a, b) => a.reviewDate.localeCompare(b.reviewDate))
        .map((review) => ({
          id: review.id,
          title: review.title,
          status: review.status,
          reviewDate: review.reviewDate,
          ...(review.nextReviewDate !== undefined ? { nextReviewDate: review.nextReviewDate } : {}),
        })),
    },
  });
}

// ---------------------------------------------------------------------------
// PDF rendering
// ---------------------------------------------------------------------------

/** Render a quarterly audit summary (issue #85) as a printable PDF. */
export async function renderAuditReportPdf(summary: AuditReportSummary): Promise<Uint8Array> {
  const writer = await createWriter();
  writeTitle(writer, "Quarterly Audit Summary Report / 四半期監査サマリ");
  writeField(writer, "Period", summary.period);
  writeField(writer, "Organization", summary.organizationId ?? "(all)");
  writeField(writer, "Generated At", summary.generatedAt);
  writeField(writer, "Range Start", summary.rangeStart);
  writeField(writer, "Range End", summary.rangeEnd);

  writeSectionHeading(writer, "Audit Log / 監査ログ");
  writeField(writer, "Total Events", summary.auditLog.totalEvents);
  writeField(writer, "Chain Integrity", summary.auditLog.integrityValid ? "valid" : "BROKEN");
  for (const outcome of AUDIT_OUTCOMES) {
    writeField(writer, `Outcome: ${outcome}`, summary.auditLog.byOutcome[outcome]);
  }
  writeMultilineField(
    writer,
    "Top Actions",
    summary.auditLog.topActions.length === 0
      ? undefined
      : summary.auditLog.topActions.map((a) => `${a.action} (${a.count})`).join(", "),
  );

  writeSectionHeading(writer, "Compliance Checks / コンプライアンスチェック");
  writeField(writer, "Total Checks", summary.compliance.totalChecks);
  for (const result of COMPLIANCE_RESULTS) {
    writeField(writer, `Result: ${result}`, summary.compliance.byResult[result]);
  }
  for (const standard of COMPLIANCE_STANDARDS) {
    writeField(writer, `Standard: ${standard}`, summary.compliance.byStandard[standard]);
  }

  writeSectionHeading(writer, "Management Reviews / マネジメントレビュー");
  writeField(writer, "Total Reviews", summary.managementReviews.total);
  for (const status of MANAGEMENT_REVIEW_STATUSES) {
    writeField(writer, `Status: ${status}`, summary.managementReviews.byStatus[status]);
  }
  if (summary.managementReviews.items.length === 0) {
    ensureSpace(writer, 1);
    writer.page.drawText("-", { x: MARGIN + 12, y: writer.y, size: BODY_SIZE, font: writer.font });
    writer.y -= LINE_HEIGHT;
  } else {
    for (const review of summary.managementReviews.items) {
      writeField(writer, review.reviewDate, `${review.title} [${review.status}]`);
    }
  }

  return writer.doc.save();
}
