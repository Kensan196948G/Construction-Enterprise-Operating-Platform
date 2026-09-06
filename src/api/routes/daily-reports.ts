/**
 * Daily report API (ServiceHub S-02).
 *
 * Reports are nested under a project and enforce the same tenant scope.
 * Lifecycle: DRAFT → SUBMITTED → APPROVED.
 */

import { randomUUID } from "node:crypto";
import {
  DAILY_REPORT_STATUSES,
  createDailyReport,
  dailyReportId,
  transitionDailyReport,
  updateDailyReport,
} from "../../domain/daily-report.ts";
import type { DailyReport } from "../../domain/daily-report.ts";
import { projectId } from "../../domain/project.ts";
import { createWorkflowInstance } from "../../domain/workflow-instance.ts";
import { toCsv } from "../csv.ts";
import { csvBool, csvNum, csvStr, parseCsv } from "../csv-import.ts";
import { toXlsx } from "../xlsx.ts";
import { parsePagination, paginate } from "../pagination.ts";
import { recordAudit } from "../audit.ts";
import type { Router } from "../router.ts";
import { writeBinaryAttachment, writeJson } from "../router.ts";
import { hasPermission } from "./governance.ts";
import {
  badRequest,
  bool,
  forbidden,
  notFound,
  nowTs,
  num,
  rowErrors,
  str,
} from "./route-helpers.ts";
import type { AppContainer } from "../types.ts";

const DAILY_REPORT_CSV_HEADERS = [
  "id",
  "reportDate",
  "weather",
  "temperature",
  "workerCount",
  "workContent",
  "progressRate",
  "safetyCheck",
  "safetyNotes",
  "issues",
  "status",
  "createdAt",
  "updatedAt",
] as const;

/** Shared row shape for both CSV and Excel export — keeps the two in lockstep. */
function dailyReportExportRow(r: DailyReport): Record<string, string> {
  return {
    id: r.id,
    reportDate: r.reportDate,
    weather: r.weather ?? "",
    temperature: r.temperature !== undefined ? String(r.temperature) : "",
    workerCount: r.workerCount !== undefined ? String(r.workerCount) : "",
    workContent: r.workContent ?? "",
    progressRate: r.progressRate !== undefined ? String(r.progressRate) : "",
    safetyCheck: r.safetyCheck !== undefined ? String(r.safetyCheck) : "",
    safetyNotes: r.safetyNotes ?? "",
    issues: r.issues ?? "",
    status: r.status,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

export function registerDailyReportRoutes(router: Router, container: AppContainer): void {
  const { repositories } = container;

  router.get("/api/v1/projects/:projectId/daily-reports", async (req, ctx, res) => {
    if (!hasPermission(ctx, "daily-report", "read")) {
      forbidden(res, "daily-report:read");
      return;
    }
    const project = await repositories.projects.findById(projectId(req.params["projectId"] ?? ""));
    if (
      project === null ||
      (ctx?.organizationId !== undefined && project.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "project");
      return;
    }
    let items = await repositories.dailyReports.findByProject(project.id);
    const statusFilter = req.query["status"];
    if (statusFilter !== undefined) {
      if (!DAILY_REPORT_STATUSES.includes(statusFilter as never)) {
        badRequest(res, [
          {
            field: "status",
            message: `status must be one of: ${DAILY_REPORT_STATUSES.join(", ")}`,
          },
        ]);
        return;
      }
      items = items.filter((r) => r.status === statusFilter);
    }
    const page = paginate(items, parsePagination(req.query));
    writeJson(res, 200, {
      dailyReports: page.items,
      count: page.count,
      total: page.total,
      limit: page.limit,
      offset: page.offset,
    });
  });

  router.get("/api/v1/projects/:projectId/daily-reports/export.csv", async (req, ctx, res) => {
    if (!hasPermission(ctx, "daily-report", "read")) {
      forbidden(res, "daily-report:read");
      return;
    }
    const project = await repositories.projects.findById(projectId(req.params["projectId"] ?? ""));
    if (
      project === null ||
      (ctx?.organizationId !== undefined && project.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "project");
      return;
    }
    const items = await repositories.dailyReports.findByProject(project.id);
    const csv = toCsv(DAILY_REPORT_CSV_HEADERS, items.map(dailyReportExportRow));
    res.writeHead(200, {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="daily-reports-${project.id}.csv"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(csv);
  });

  router.get("/api/v1/projects/:projectId/daily-reports/export.xlsx", async (req, ctx, res) => {
    if (!hasPermission(ctx, "daily-report", "read")) {
      forbidden(res, "daily-report:read");
      return;
    }
    const project = await repositories.projects.findById(projectId(req.params["projectId"] ?? ""));
    if (
      project === null ||
      (ctx?.organizationId !== undefined && project.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "project");
      return;
    }
    const items = await repositories.dailyReports.findByProject(project.id);
    const xlsx = toXlsx(DAILY_REPORT_CSV_HEADERS, items.map(dailyReportExportRow), "DailyReports");
    writeBinaryAttachment(
      res,
      200,
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      `daily-reports-${project.id}.xlsx`,
      xlsx,
    );
  });

  // CSV bulk import — additive to the single-record POST below. Body:
  // `{ "csv": "reportDate,weather,...\n2026-01-01,sunny,...\n" }`. All rows
  // are validated before any are saved (all-or-nothing), so a partially
  // invalid file never produces a partially imported project.
  router.post("/api/v1/projects/:projectId/daily-reports/import.csv", async (req, ctx, res) => {
    if (!hasPermission(ctx, "daily-report", "write")) {
      forbidden(res, "daily-report:write");
      return;
    }
    const project = await repositories.projects.findById(projectId(req.params["projectId"] ?? ""));
    if (
      project === null ||
      (ctx?.organizationId !== undefined && project.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "project");
      return;
    }
    const csvText = str(req.body, "csv");
    if (csvText === undefined) {
      badRequest(res, [{ path: "csv", message: "csv (string) is required" }]);
      return;
    }
    const { rows } = parseCsv(csvText);
    if (rows.length === 0) {
      badRequest(res, [{ path: "csv", message: "csv must contain at least one data row" }]);
      return;
    }

    const created: DailyReport[] = [];
    const errors: ReturnType<typeof rowErrors> = [];
    rows.forEach((row, i) => {
      const weather = csvStr(row, "weather");
      const result = createDailyReport({
        id: `daily-report-${randomUUID()}`,
        organizationId: project.organizationId,
        projectId: project.id as string,
        reportDate: csvStr(row, "reportDate") ?? "",
        ...(weather !== undefined ? { weather: weather as never } : {}),
        temperature: csvNum(row, "temperature"),
        workerCount: csvNum(row, "workerCount"),
        workContent: csvStr(row, "workContent"),
        safetyCheck: csvBool(row, "safetyCheck"),
        safetyNotes: csvStr(row, "safetyNotes"),
        progressRate: csvNum(row, "progressRate"),
        issues: csvStr(row, "issues"),
        createdAt: nowTs(),
      });
      if (!result.ok) {
        errors.push(...rowErrors(i + 1, result.error));
        return;
      }
      created.push(result.value);
    });
    if (errors.length > 0) {
      badRequest(res, errors);
      return;
    }
    for (const report of created) {
      await repositories.dailyReports.save(report);
    }
    recordAudit(
      container.auditLog,
      ctx,
      "daily-report:import",
      `projects/${project.id}/daily-reports/import`,
      "success",
      { count: String(created.length) },
    );
    writeJson(res, 201, { imported: created.length, dailyReports: created });
  });

  router.post("/api/v1/projects/:projectId/daily-reports", async (req, ctx, res) => {
    if (!hasPermission(ctx, "daily-report", "write")) {
      forbidden(res, "daily-report:write");
      return;
    }
    const project = await repositories.projects.findById(projectId(req.params["projectId"] ?? ""));
    if (
      project === null ||
      (ctx?.organizationId !== undefined && project.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "project");
      return;
    }
    const created = createDailyReport({
      id: `daily-report-${randomUUID()}`,
      organizationId: project.organizationId,
      projectId: project.id as string,
      reportDate: str(req.body, "reportDate") ?? "",
      ...(str(req.body, "weather") !== undefined
        ? { weather: str(req.body, "weather") as never }
        : {}),
      temperature: num(req.body, "temperature"),
      workerCount: num(req.body, "workerCount"),
      workContent: str(req.body, "workContent"),
      safetyCheck: bool(req.body, "safetyCheck"),
      safetyNotes: str(req.body, "safetyNotes"),
      progressRate: num(req.body, "progressRate"),
      issues: str(req.body, "issues"),
      createdAt: nowTs(),
    });
    if (!created.ok) {
      badRequest(res, created.error);
      return;
    }
    await repositories.dailyReports.save(created.value);
    recordAudit(
      container.auditLog,
      ctx,
      "daily-report:create",
      `daily-reports/${created.value.id}`,
      "success",
    );
    writeJson(res, 201, { dailyReport: created.value });
  });

  router.get("/api/v1/daily-reports/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "daily-report", "read")) {
      forbidden(res, "daily-report:read");
      return;
    }
    const report = await repositories.dailyReports.findById(dailyReportId(req.params["id"] ?? ""));
    if (
      report === null ||
      (ctx?.organizationId !== undefined && report.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "daily report");
      return;
    }
    writeJson(res, 200, { dailyReport: report });
  });

  router.patch("/api/v1/daily-reports/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "daily-report", "write")) {
      forbidden(res, "daily-report:write");
      return;
    }
    const report = await repositories.dailyReports.findById(dailyReportId(req.params["id"] ?? ""));
    if (
      report === null ||
      (ctx?.organizationId !== undefined && report.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "daily report");
      return;
    }
    const updated = updateDailyReport(report, {
      ...(str(req.body, "weather") !== undefined
        ? { weather: str(req.body, "weather") as never }
        : {}),
      temperature: num(req.body, "temperature"),
      workerCount: num(req.body, "workerCount"),
      workContent: str(req.body, "workContent"),
      safetyCheck: bool(req.body, "safetyCheck"),
      safetyNotes: str(req.body, "safetyNotes"),
      progressRate: num(req.body, "progressRate"),
      issues: str(req.body, "issues"),
      updatedAt: nowTs(),
    });
    if (!updated.ok) {
      badRequest(res, updated.error);
      return;
    }
    await repositories.dailyReports.save(updated.value);
    recordAudit(
      container.auditLog,
      ctx,
      "daily-report:update",
      `daily-reports/${report.id}`,
      "success",
    );
    writeJson(res, 200, { dailyReport: updated.value });
  });

  router.post("/api/v1/daily-reports/:id/transition", async (req, ctx, res) => {
    if (!hasPermission(ctx, "daily-report", "write")) {
      forbidden(res, "daily-report:write");
      return;
    }
    const report = await repositories.dailyReports.findById(dailyReportId(req.params["id"] ?? ""));
    if (
      report === null ||
      (ctx?.organizationId !== undefined && report.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "daily report");
      return;
    }
    const status = str(req.body, "status");
    if (status === undefined || !DAILY_REPORT_STATUSES.includes(status as never)) {
      badRequest(res, [
        { field: "status", message: `status must be one of: ${DAILY_REPORT_STATUSES.join(", ")}` },
      ]);
      return;
    }
    const transitioned = transitionDailyReport(report, status as never, nowTs());
    if (!transitioned.ok) {
      badRequest(res, transitioned.error);
      return;
    }
    await repositories.dailyReports.save(transitioned.value);
    if (transitioned.value.status === "submitted") {
      const instance = createWorkflowInstance({
        id: `wf-${randomUUID()}`,
        workflowId: "workflow-daily-report-approval",
        organizationId: report.organizationId,
        subject: ctx?.subject ?? "system",
        stepKey: "approve",
        stepName: "日報承認",
        requestedAt: nowTs(),
        resourceType: "daily-report",
        resourceId: report.id as string,
      });
      if (instance.ok) {
        await repositories.workflowInstances.save(instance.value);
      }
    }
    recordAudit(
      container.auditLog,
      ctx,
      "daily-report:transition",
      `daily-reports/${report.id}`,
      "success",
      {
        status: transitioned.value.status,
      },
    );
    writeJson(res, 200, { dailyReport: transitioned.value });
  });
}
