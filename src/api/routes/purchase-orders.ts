/**
 * Purchase order API (Enterprise-OS E-05 / ERP).
 */

import { randomUUID } from "node:crypto";
import type { ServerResponse } from "node:http";
import type { IsoTimestamp } from "../../domain/common.ts";
import { projectId } from "../../domain/project.ts";
import {
  PURCHASE_ORDER_STATUSES,
  createPurchaseOrder,
  purchaseOrderId,
} from "../../domain/purchase-order.ts";
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

function forbidden(res: ServerResponse, perm: string): void {
  writeJson(res, 403, { error: "Forbidden", message: `requires '${perm}' permission` });
}

function notFound(res: ServerResponse): void {
  writeJson(res, 404, { error: "Not Found", message: "purchase order not found" });
}

function badRequest(res: ServerResponse, details: unknown): void {
  writeJson(res, 400, { error: "Bad Request", message: "validation failed", details });
}

function nowTs(): IsoTimestamp {
  return new Date().toISOString() as IsoTimestamp;
}

export function registerPurchaseOrderRoutes(router: Router, container: AppContainer): void {
  const { repositories } = container;

  router.get("/api/v1/projects/:projectId/purchase-orders", async (req, ctx, res) => {
    if (!hasPermission(ctx, "purchase-order", "read")) {
      forbidden(res, "purchase-order:read");
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
    const page = paginate(
      await repositories.purchaseOrders.findByProject(project.id),
      parsePagination(req.query),
    );
    writeJson(res, 200, {
      purchaseOrders: page.items,
      count: page.count,
      total: page.total,
      limit: page.limit,
      offset: page.offset,
    });
  });

  router.post("/api/v1/projects/:projectId/purchase-orders", async (req, ctx, res) => {
    if (!hasPermission(ctx, "purchase-order", "write")) {
      forbidden(res, "purchase-order:write");
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
    const orderNumber = str(req.body, "orderNumber") ?? "";
    const duplicate = await repositories.purchaseOrders.findByNumber(orderNumber);
    if (duplicate !== null) {
      badRequest(res, [{ field: "orderNumber", message: "orderNumber already exists" }]);
      return;
    }
    const status = str(req.body, "status");
    if (status !== undefined && !PURCHASE_ORDER_STATUSES.includes(status as never)) {
      badRequest(res, [
        {
          field: "status",
          message: `status must be one of: ${PURCHASE_ORDER_STATUSES.join(", ")}`,
        },
      ]);
      return;
    }
    const created = createPurchaseOrder({
      id: `purchase-order-${randomUUID()}`,
      organizationId: project.organizationId,
      projectId: project.id as string,
      orderNumber,
      supplier: str(req.body, "supplier") ?? "",
      item: str(req.body, "item") ?? "",
      quantity: num(req.body, "quantity") ?? 0,
      unitPrice: num(req.body, "unitPrice") ?? 0,
      status: status as never,
      notes: str(req.body, "notes"),
      createdAt: nowTs(),
    });
    if (!created.ok) {
      badRequest(res, created.error);
      return;
    }
    await repositories.purchaseOrders.save(created.value);
    recordAudit(
      container.auditLog,
      ctx,
      "purchase-order:create",
      `purchase-orders/${created.value.id}`,
      "success",
    );
    writeJson(res, 201, { purchaseOrder: created.value });
  });

  router.get("/api/v1/purchase-orders/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "purchase-order", "read")) {
      forbidden(res, "purchase-order:read");
      return;
    }
    const order = await repositories.purchaseOrders.findById(
      purchaseOrderId(req.params["id"] ?? ""),
    );
    if (
      order === null ||
      (ctx?.organizationId !== undefined && order.organizationId !== ctx.organizationId)
    ) {
      notFound(res);
      return;
    }
    writeJson(res, 200, { purchaseOrder: order });
  });
}
