/**
 * Purchase order API (Enterprise-OS E-05 / ERP).
 */

import { randomUUID } from "node:crypto";
import { projectId } from "../../domain/project.ts";
import {
  PURCHASE_ORDER_STATUSES,
  createPurchaseOrder,
  purchaseOrderId,
} from "../../domain/purchase-order.ts";
import type { PurchaseOrder } from "../../domain/purchase-order.ts";
import { toCsv } from "../csv.ts";
import { csvNum, csvStr, parseCsv } from "../csv-import.ts";
import { toXlsx } from "../xlsx.ts";
import { parsePagination, paginate } from "../pagination.ts";
import { recordAudit } from "../audit.ts";
import type { Router } from "../router.ts";
import { writeBinaryAttachment, writeJson } from "../router.ts";
import { hasPermission } from "./governance.ts";
import { badRequest, forbidden, notFound, nowTs, num, rowErrors, str } from "./route-helpers.ts";
import type { AppContainer } from "../types.ts";

const PURCHASE_ORDER_CSV_HEADERS = [
  "id",
  "orderNumber",
  "supplier",
  "item",
  "quantity",
  "unitPrice",
  "amount",
  "status",
  "notes",
  "createdAt",
  "updatedAt",
] as const;

function purchaseOrderExportRow(o: PurchaseOrder): Record<string, string> {
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    supplier: o.supplier,
    item: o.item,
    quantity: String(o.quantity),
    unitPrice: String(o.unitPrice),
    amount: String(o.amount),
    status: o.status,
    notes: o.notes ?? "",
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
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
      notFound(res, "purchase order");
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

  router.get("/api/v1/projects/:projectId/purchase-orders/export.csv", async (req, ctx, res) => {
    if (!hasPermission(ctx, "purchase-order", "read")) {
      forbidden(res, "purchase-order:read");
      return;
    }
    const project = await repositories.projects.findById(projectId(req.params["projectId"] ?? ""));
    if (
      project === null ||
      (ctx?.organizationId !== undefined && project.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "purchase order");
      return;
    }
    const items = await repositories.purchaseOrders.findByProject(project.id);
    const csv = toCsv(PURCHASE_ORDER_CSV_HEADERS, items.map(purchaseOrderExportRow));
    res.writeHead(200, {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="purchase-orders-${project.id}.csv"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(csv);
  });

  router.get("/api/v1/projects/:projectId/purchase-orders/export.xlsx", async (req, ctx, res) => {
    if (!hasPermission(ctx, "purchase-order", "read")) {
      forbidden(res, "purchase-order:read");
      return;
    }
    const project = await repositories.projects.findById(projectId(req.params["projectId"] ?? ""));
    if (
      project === null ||
      (ctx?.organizationId !== undefined && project.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "purchase order");
      return;
    }
    const items = await repositories.purchaseOrders.findByProject(project.id);
    const xlsx = toXlsx(
      PURCHASE_ORDER_CSV_HEADERS,
      items.map(purchaseOrderExportRow),
      "PurchaseOrders",
    );
    writeBinaryAttachment(
      res,
      200,
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      `purchase-orders-${project.id}.xlsx`,
      xlsx,
    );
  });

  // CSV bulk import — additive to the single-record POST below. Body:
  // `{ "csv": "orderNumber,supplier,item,quantity,unitPrice,...\n..." }`. All
  // rows are validated (including orderNumber uniqueness, both within the
  // file and against existing records) before any are saved.
  router.post("/api/v1/projects/:projectId/purchase-orders/import.csv", async (req, ctx, res) => {
    if (!hasPermission(ctx, "purchase-order", "write")) {
      forbidden(res, "purchase-order:write");
      return;
    }
    const project = await repositories.projects.findById(projectId(req.params["projectId"] ?? ""));
    if (
      project === null ||
      (ctx?.organizationId !== undefined && project.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "purchase order");
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

    const created: PurchaseOrder[] = [];
    const errors: ReturnType<typeof rowErrors> = [];
    const numbersSeen = new Set<string>();
    for (const [i, row] of rows.entries()) {
      const rowNum = i + 1;
      const orderNumber = csvStr(row, "orderNumber") ?? "";
      if (orderNumber !== "") {
        if (numbersSeen.has(orderNumber)) {
          errors.push({
            row: rowNum,
            path: "orderNumber",
            message: "orderNumber duplicated within the import file",
          });
          continue;
        }
        numbersSeen.add(orderNumber);
        const duplicate = await repositories.purchaseOrders.findByNumber(orderNumber);
        if (duplicate !== null) {
          errors.push({
            row: rowNum,
            path: "orderNumber",
            message: "orderNumber already exists",
          });
          continue;
        }
      }
      const status = csvStr(row, "status");
      if (status !== undefined && !PURCHASE_ORDER_STATUSES.includes(status as never)) {
        errors.push({
          row: rowNum,
          path: "status",
          message: `status must be one of: ${PURCHASE_ORDER_STATUSES.join(", ")}`,
        });
        continue;
      }
      const result = createPurchaseOrder({
        id: `purchase-order-${randomUUID()}`,
        organizationId: project.organizationId,
        projectId: project.id as string,
        orderNumber,
        supplier: csvStr(row, "supplier") ?? "",
        item: csvStr(row, "item") ?? "",
        quantity: csvNum(row, "quantity") ?? 0,
        unitPrice: csvNum(row, "unitPrice") ?? 0,
        status: status as never,
        notes: csvStr(row, "notes"),
        createdAt: nowTs(),
      });
      if (!result.ok) {
        errors.push(...rowErrors(rowNum, result.error));
        continue;
      }
      created.push(result.value);
    }
    if (errors.length > 0) {
      badRequest(res, errors);
      return;
    }
    for (const order of created) {
      await repositories.purchaseOrders.save(order);
    }
    recordAudit(
      container.auditLog,
      ctx,
      "purchase-order:import",
      `projects/${project.id}/purchase-orders/import`,
      "success",
      { count: String(created.length) },
    );
    writeJson(res, 201, { imported: created.length, purchaseOrders: created });
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
      notFound(res, "purchase order");
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
      notFound(res, "purchase order");
      return;
    }
    writeJson(res, 200, { purchaseOrder: order });
  });
}
