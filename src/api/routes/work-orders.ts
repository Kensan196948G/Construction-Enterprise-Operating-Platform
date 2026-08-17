/**
 * Site work order API (Civil-Construction-Management-Platform 作業指示).
 */

import { randomUUID } from "node:crypto";
import { projectId } from "../../domain/project.ts";
import {
  WORK_ORDER_STATUSES,
  createWorkOrder,
  updateWorkOrder,
  workOrderId,
} from "../../domain/work-order.ts";
import type { IsoTimestamp } from "../../domain/common.ts";
import { parsePagination, paginate } from "../pagination.ts";
import { recordAudit } from "../audit.ts";
import type { Router } from "../router.ts";
import { writeJson } from "../router.ts";
import { hasPermission } from "./governance.ts";
import { badRequest, forbidden, noContent, notFound, nowTs, str } from "./route-helpers.ts";
import type { AppContainer } from "../types.ts";

export function registerWorkOrderRoutes(router: Router, container: AppContainer): void {
  const { repositories } = container;

  router.get("/api/v1/work-orders", async (req, ctx, res) => {
    if (!hasPermission(ctx, "work-order", "read")) {
      forbidden(res, "work-order:read");
      return;
    }
    const orgId = ctx?.organizationId;
    const all =
      orgId !== undefined
        ? (await repositories.workOrders.findAll()).filter((w) => w.organizationId === orgId)
        : await repositories.workOrders.findAll();
    const page = paginate(all, parsePagination(req.query));
    writeJson(res, 200, {
      workOrders: page.items,
      count: page.count,
      total: page.total,
      limit: page.limit,
      offset: page.offset,
    });
  });

  router.get("/api/v1/projects/:projectId/work-orders", async (req, ctx, res) => {
    if (!hasPermission(ctx, "work-order", "read")) {
      forbidden(res, "work-order:read");
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
    const page = paginate(
      await repositories.workOrders.findByProject(project.id),
      parsePagination(req.query),
    );
    writeJson(res, 200, {
      workOrders: page.items,
      count: page.count,
      total: page.total,
      limit: page.limit,
      offset: page.offset,
    });
  });

  router.post("/api/v1/projects/:projectId/work-orders", async (req, ctx, res) => {
    if (!hasPermission(ctx, "work-order", "write")) {
      forbidden(res, "work-order:write");
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
    const status = str(req.body, "status");
    if (status !== undefined && !WORK_ORDER_STATUSES.includes(status as never)) {
      badRequest(res, [
        { field: "status", message: `status must be one of: ${WORK_ORDER_STATUSES.join(", ")}` },
      ]);
      return;
    }
    const created = createWorkOrder({
      id: `work-order-${randomUUID()}`,
      organizationId: project.organizationId,
      projectId: project.id as string,
      title: str(req.body, "title") ?? "",
      description: str(req.body, "description"),
      status: status as never,
      dueDate: str(req.body, "dueDate"),
      assigneeId: str(req.body, "assigneeId"),
      createdAt: nowTs(),
    });
    if (!created.ok) {
      badRequest(res, created.error);
      return;
    }
    await repositories.workOrders.save(created.value);
    recordAudit(
      container.auditLog,
      ctx,
      "work-order:create",
      `work-orders/${created.value.id}`,
      "success",
    );
    writeJson(res, 201, { workOrder: created.value });
  });

  router.get("/api/v1/work-orders/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "work-order", "read")) {
      forbidden(res, "work-order:read");
      return;
    }
    const order = await repositories.workOrders.findById(workOrderId(req.params["id"] ?? ""));
    if (
      order === null ||
      (ctx?.organizationId !== undefined && order.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "work order");
      return;
    }
    writeJson(res, 200, { workOrder: order });
  });

  router.put("/api/v1/work-orders/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "work-order", "write")) {
      forbidden(res, "work-order:write");
      return;
    }
    const existing = await repositories.workOrders.findById(workOrderId(req.params["id"] ?? ""));
    if (
      existing === null ||
      (ctx?.organizationId !== undefined && existing.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "work order");
      return;
    }
    const status = str(req.body, "status");
    if (status !== undefined && !WORK_ORDER_STATUSES.includes(status as never)) {
      badRequest(res, [
        { field: "status", message: `status must be one of: ${WORK_ORDER_STATUSES.join(", ")}` },
      ]);
      return;
    }
    const completedAt = str(req.body, "completedAt");
    const updated = updateWorkOrder(existing, {
      title: str(req.body, "title"),
      description: str(req.body, "description"),
      status: status as never,
      dueDate: str(req.body, "dueDate"),
      ...(completedAt !== undefined ? { completedAt: completedAt as IsoTimestamp } : {}),
      assigneeId: str(req.body, "assigneeId"),
      updatedAt: nowTs(),
    });
    if (!updated.ok) {
      badRequest(res, updated.error);
      return;
    }
    await repositories.workOrders.save(updated.value);
    recordAudit(
      container.auditLog,
      ctx,
      "work-order:update",
      `work-orders/${updated.value.id}`,
      "success",
    );
    writeJson(res, 200, { workOrder: updated.value });
  });

  router.delete("/api/v1/work-orders/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "work-order", "write")) {
      forbidden(res, "work-order:write");
      return;
    }
    const existing = await repositories.workOrders.findById(workOrderId(req.params["id"] ?? ""));
    if (
      existing === null ||
      (ctx?.organizationId !== undefined && existing.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "work order");
      return;
    }
    await repositories.workOrders.delete(existing.id);
    recordAudit(
      container.auditLog,
      ctx,
      "work-order:delete",
      `work-orders/${existing.id}`,
      "success",
    );
    noContent(res);
  });
}
