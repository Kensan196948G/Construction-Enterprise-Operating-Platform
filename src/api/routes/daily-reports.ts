/**
 * Daily report API (ServiceHub S-02).
 *
 * Reports are nested under a project and enforce the same tenant scope.
 * Lifecycle: DRAFT → SUBMITTED → APPROVED.
 */

import { randomUUID } from "node:crypto";
import type { ServerResponse } from "node:http";
import type { IsoTimestamp } from "../../domain/common.ts";
import {
  DAILY_REPORT_STATUSES,
  createDailyReport,
  dailyReportId,
  transitionDailyReport,
  updateDailyReport,
} from "../../domain/daily-report.ts";
import { projectId } from "../../domain/project.ts";
import { parsePagination, paginate } from "../pagination.ts";
import { recordAudit } from "../audit.ts";
import type { Router } from "../router.ts";
import { writeJson } from "../router.ts";
import { hasPermission } from "./governance.ts";
import type { AppContainer } from "../types.ts";

function str(body: unknown, key: string): string | undefined {
  if (typeof body !== "object" || body === null) return undefined;
  const v = (body as Record<string, unknown>)[key];
  return typeof v === "string" ? v : undefined;
}

function num(body: unknown, key: string): number | undefined {
  if (typeof body !== "object" || body === null) return undefined;
  const v = (body as Record<string, unknown>)[key];
  return typeof v === "number" ? v : undefined;
}

function bool(body: unknown, key: string): boolean | undefined {
  if (typeof body !== "object" || body === null) return undefined;
  const v = (body as Record<string, unknown>)[key];
  return typeof v === "boolean" ? v : undefined;
}

function forbidden(res: ServerResponse, perm: string): void {
  writeJson(res, 403, { error: "Forbidden", message: `requires '${perm}' permission` });
}

function notFound(res: ServerResponse): void {
  writeJson(res, 404, { error: "Not Found", message: "daily report not found" });
}

function badRequest(res: ServerResponse, details: unknown): void {
  writeJson(res, 400, { error: "Bad Request", message: "validation failed", details });
}

function nowTs(): IsoTimestamp {
  return new Date().toISOString() as IsoTimestamp;
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
      notFound(res);
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
      notFound(res);
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
      notFound(res);
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
      notFound(res);
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
      notFound(res);
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
