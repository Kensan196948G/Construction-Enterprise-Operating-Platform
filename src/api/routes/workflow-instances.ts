/**
 * Workflow instance API — Issue→Approval→Audit runs (integration L-02).
 *
 *   GET  /api/v1/workflow-instances            — paginated, tenant-scoped list
 *   POST /api/v1/workflow-instances            — create from a workflow template
 *   POST /api/v1/workflow-instances/:id/decision — approve/reject a pending run
 *   POST /api/v1/workflow-instances/:id/cancel — withdraw a pending run
 *
 * Authorization: workflow:read for reads, workflow:write for mutations.
 * Every mutation is recorded in the tamper-evident audit log.
 */

import { randomUUID } from "node:crypto";
import type { IsoTimestamp } from "../../domain/common.ts";
import {
  cancelWorkflowInstance,
  createWorkflowInstance,
  decideWorkflowInstance,
  WORKFLOW_DECISIONS,
  WORKFLOW_INSTANCE_STATUSES,
  workflowInstanceId,
} from "../../domain/workflow-instance.ts";
import { workflowId } from "../../domain/workflow.ts";
import { parsePagination, paginate } from "../pagination.ts";
import { recordAudit } from "../audit.ts";
import type { Router } from "../router.ts";
import { writeJson } from "../router.ts";
import { canAccessOrganization, hasPermission } from "./governance.ts";
import { badRequest, forbidden, notFound, nowTs, str } from "./route-helpers.ts";
import type { AppContainer } from "../types.ts";
import { dailyReportId, transitionDailyReport } from "../../domain/daily-report.ts";

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export function registerWorkflowInstanceRoutes(router: Router, container: AppContainer): void {
  const { repositories } = container;

  router.get("/api/v1/workflow-instances", async (req, ctx, res) => {
    if (!hasPermission(ctx, "workflow", "read")) {
      forbidden(res, "workflow:read");
      return;
    }
    const statusFilter = req.query["status"];
    if (
      statusFilter !== undefined &&
      !WORKFLOW_INSTANCE_STATUSES.includes(
        statusFilter as (typeof WORKFLOW_INSTANCE_STATUSES)[number],
      )
    ) {
      badRequest(res, [
        {
          field: "status",
          message: `status must be one of: ${WORKFLOW_INSTANCE_STATUSES.join(", ")}`,
        },
      ]);
      return;
    }

    const all = await repositories.workflowInstances.findAll();
    const scoped = all.filter(
      (i) =>
        (ctx?.organizationId === undefined || i.organizationId === ctx.organizationId) &&
        (statusFilter === undefined || i.status === statusFilter),
    );
    const pg = paginate(scoped, parsePagination(req.query));
    writeJson(res, 200, {
      workflowInstances: pg.items,
      count: pg.count,
      total: pg.total,
      limit: pg.limit,
      offset: pg.offset,
    });
  });

  router.post("/api/v1/workflow-instances", async (req, ctx, res) => {
    if (!hasPermission(ctx, "workflow", "write")) {
      forbidden(res, "workflow:write");
      return;
    }
    const workflowIdRaw = str(req.body, "workflowId");
    if (workflowIdRaw === undefined || workflowIdRaw.length === 0) {
      badRequest(res, [{ field: "workflowId", message: "workflowId is required" }]);
      return;
    }
    const subject = str(req.body, "subject");
    if (subject === undefined || subject.length === 0) {
      badRequest(res, [{ field: "subject", message: "subject is required" }]);
      return;
    }

    const requestedOrgId = str(req.body, "organizationId");
    if (
      ctx?.organizationId !== undefined &&
      requestedOrgId !== undefined &&
      requestedOrgId !== ctx.organizationId
    ) {
      writeJson(res, 403, {
        error: "Forbidden",
        message: "cannot create workflow instances outside your organization",
      });
      return;
    }
    const orgId = ctx?.organizationId ?? requestedOrgId;
    if (orgId === undefined || orgId.length === 0) {
      badRequest(res, [{ field: "organizationId", message: "organizationId is required" }]);
      return;
    }

    const workflow = await repositories.workflows.findById(workflowId(workflowIdRaw));
    if (workflow === null) {
      badRequest(res, [{ field: "workflowId", message: "workflow not found" }]);
      return;
    }
    if (workflow.status !== "active") {
      badRequest(res, [
        { field: "workflowId", message: "workflow must be active to start an instance" },
      ]);
      return;
    }
    const firstStep = workflow.steps[0];
    if (firstStep === undefined) {
      badRequest(res, [{ field: "workflowId", message: "workflow has no steps" }]);
      return;
    }

    const result = createWorkflowInstance({
      id: str(req.body, "id") ?? randomUUID(),
      workflowId: workflow.id as string,
      organizationId: orgId,
      subject,
      stepKey: firstStep.key,
      stepName: firstStep.name,
      requestedAt: nowTs(),
    });
    if (!result.ok) {
      badRequest(res, result.error);
      return;
    }
    await repositories.workflowInstances.save(result.value);
    recordAudit(container.auditLog, ctx, "workflow-instance:create", result.value.id, "success", {
      workflowId: result.value.workflowId,
      subject: result.value.subject,
      stepKey: result.value.stepKey,
    });
    writeJson(res, 201, { workflowInstance: result.value });
  });

  router.post("/api/v1/workflow-instances/:id/decision", async (req, ctx, res) => {
    if (!hasPermission(ctx, "workflow", "write")) {
      forbidden(res, "workflow:write");
      return;
    }
    const instance = await repositories.workflowInstances.findById(
      workflowInstanceId(req.params["id"] ?? ""),
    );
    if (instance === null || !canAccessOrganization(ctx, instance.organizationId)) {
      notFound(res, "workflow instance");
      return;
    }
    const decision = str(req.body, "decision");
    if (
      decision === undefined ||
      !WORKFLOW_DECISIONS.includes(decision as (typeof WORKFLOW_DECISIONS)[number])
    ) {
      badRequest(res, [
        { field: "decision", message: `decision must be one of: ${WORKFLOW_DECISIONS.join(", ")}` },
      ]);
      return;
    }
    const result = decideWorkflowInstance(instance, {
      decision: decision as (typeof WORKFLOW_DECISIONS)[number],
      decidedBy: ctx?.subject ?? "system",
      decidedAt: nowTs(),
      ...(str(req.body, "comment") !== undefined
        ? { comment: str(req.body, "comment") as string }
        : {}),
    });
    if (!result.ok) {
      badRequest(res, result.error);
      return;
    }
    await repositories.workflowInstances.save(result.value);
    if (
      result.value.status === "approved" &&
      result.value.resourceType === "daily-report" &&
      result.value.resourceId !== undefined
    ) {
      const report = await repositories.dailyReports.findById(
        dailyReportId(result.value.resourceId),
      );
      if (report !== null && report.status === "submitted") {
        const approved = transitionDailyReport(
          report,
          "approved",
          new Date().toISOString() as IsoTimestamp,
        );
        if (approved.ok) {
          await repositories.dailyReports.save(approved.value);
          recordAudit(
            container.auditLog,
            ctx,
            "daily-report:workflow-approved",
            `daily-reports/${report.id}`,
            "success",
          );
        }
      }
    }
    recordAudit(container.auditLog, ctx, "workflow-instance:decision", result.value.id, "success", {
      decision: result.value.decision ?? "",
      stepKey: result.value.stepKey,
    });
    writeJson(res, 200, { workflowInstance: result.value });
  });

  router.post("/api/v1/workflow-instances/:id/cancel", async (req, ctx, res) => {
    if (!hasPermission(ctx, "workflow", "write")) {
      forbidden(res, "workflow:write");
      return;
    }
    const instance = await repositories.workflowInstances.findById(
      workflowInstanceId(req.params["id"] ?? ""),
    );
    if (instance === null || !canAccessOrganization(ctx, instance.organizationId)) {
      notFound(res, "workflow instance");
      return;
    }
    const result = cancelWorkflowInstance(instance, nowTs());
    if (!result.ok) {
      badRequest(res, result.error);
      return;
    }
    await repositories.workflowInstances.save(result.value);
    recordAudit(container.auditLog, ctx, "workflow-instance:cancel", result.value.id, "success", {
      stepKey: result.value.stepKey,
    });
    writeJson(res, 200, { workflowInstance: result.value });
  });
}
