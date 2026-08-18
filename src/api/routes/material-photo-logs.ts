/**
 * Material photo log API (Civil-Material-Photo-Logger).
 *
 * CRUD for material photo evidence metadata plus a CSV export endpoint in
 * the fixed column order used by the photo-logger app.
 */

import { randomUUID } from "node:crypto";
import {
  MATERIAL_INSPECTION_STATUSES,
  MATERIAL_PHOTO_LOG_CSV_COLUMNS,
  MATERIAL_TRANSACTION_TYPES,
  createMaterialPhotoLog,
  materialPhotoLogId,
  materialPhotoLogToCsvRow,
  updateMaterialPhotoLog,
} from "../../domain/material-photo-log.ts";
import type { IsoTimestamp } from "../../domain/common.ts";
import { parsePagination, paginate } from "../pagination.ts";
import { recordAudit } from "../audit.ts";
import type { Router } from "../router.ts";
import { writeAttachment, writeJson } from "../router.ts";
import { hasPermission } from "./governance.ts";
import { badRequest, forbidden, noContent, notFound, nowTs, num, str } from "./route-helpers.ts";
import type { AppContainer } from "../types.ts";

export function registerMaterialPhotoLogRoutes(router: Router, container: AppContainer): void {
  const { repositories } = container;

  router.get("/api/v1/material-photo-logs", async (req, ctx, res) => {
    if (!hasPermission(ctx, "material-photo-log", "read")) {
      forbidden(res, "material-photo-log:read");
      return;
    }
    const orgId = ctx?.organizationId;
    const all =
      orgId !== undefined
        ? await repositories.materialPhotoLogs.findByOrganization(orgId)
        : await repositories.materialPhotoLogs.findAll();
    const page = paginate(all, parsePagination(req.query));
    writeJson(res, 200, {
      materialPhotoLogs: page.items,
      count: page.count,
      total: page.total,
      limit: page.limit,
      offset: page.offset,
    });
  });

  router.post("/api/v1/material-photo-logs", async (req, ctx, res) => {
    if (!hasPermission(ctx, "material-photo-log", "write")) {
      forbidden(res, "material-photo-log:write");
      return;
    }
    const bodyOrg = str(req.body, "organizationId");
    if (
      ctx?.organizationId !== undefined &&
      bodyOrg !== undefined &&
      bodyOrg !== ctx.organizationId
    ) {
      badRequest(res, [
        { field: "organizationId", message: "organization mismatch with credential scope" },
      ]);
      return;
    }
    const organizationId = ctx?.organizationId ?? bodyOrg;
    if (organizationId === undefined) {
      badRequest(res, [{ field: "organizationId", message: "organizationId is required" }]);
      return;
    }
    const transactionType = str(req.body, "transactionType");
    if (
      transactionType !== undefined &&
      !MATERIAL_TRANSACTION_TYPES.includes(transactionType as never)
    ) {
      badRequest(res, [
        {
          field: "transactionType",
          message: `transactionType must be one of: ${MATERIAL_TRANSACTION_TYPES.join(", ")}`,
        },
      ]);
      return;
    }
    const inspectionStatus = str(req.body, "inspectionStatus");
    if (
      inspectionStatus !== undefined &&
      !MATERIAL_INSPECTION_STATUSES.includes(inspectionStatus as never)
    ) {
      badRequest(res, [
        {
          field: "inspectionStatus",
          message: `inspectionStatus must be one of: ${MATERIAL_INSPECTION_STATUSES.join(", ")}`,
        },
      ]);
      return;
    }
    const capturedAt = str(req.body, "capturedAt");
    const created = createMaterialPhotoLog({
      id: `material-photo-log-${randomUUID()}`,
      organizationId,
      projectCode: str(req.body, "projectCode") ?? "",
      materialName: str(req.body, "materialName") ?? "",
      materialCategory: str(req.body, "materialCategory"),
      quantity: num(req.body, "quantity"),
      unit: str(req.body, "unit"),
      storagePlace: str(req.body, "storagePlace"),
      memo: str(req.body, "memo"),
      transactionType: transactionType as never,
      inspectionStatus: inspectionStatus as never,
      needsReview:
        req.body !== undefined && typeof req.body === "object"
          ? (req.body as Record<string, unknown>)["needsReview"] === true
          : false,
      ...(capturedAt !== undefined ? { capturedAt: capturedAt as IsoTimestamp } : {}),
      latitude: num(req.body, "latitude"),
      longitude: num(req.body, "longitude"),
      objectKey: str(req.body, "objectKey"),
      createdAt: nowTs(),
    });
    if (!created.ok) {
      badRequest(res, created.error);
      return;
    }
    await repositories.materialPhotoLogs.save(created.value);
    recordAudit(
      container.auditLog,
      ctx,
      "material-photo-log:create",
      `material-photo-logs/${created.value.id}`,
      "success",
    );
    writeJson(res, 201, { materialPhotoLog: created.value });
  });

  // CSV export — same fixed column order as the offline app's export.
  // Registered before the :id route so "export.csv" is not captured as an id.
  router.get("/api/v1/material-photo-logs/export.csv", async (_req, ctx, res) => {
    if (!hasPermission(ctx, "material-photo-log", "read")) {
      forbidden(res, "material-photo-log:read");
      return;
    }
    const orgId = ctx?.organizationId;
    const all =
      orgId !== undefined
        ? await repositories.materialPhotoLogs.findByOrganization(orgId)
        : await repositories.materialPhotoLogs.findAll();
    const header = MATERIAL_PHOTO_LOG_CSV_COLUMNS.join(",");
    const body = [header, ...all.map((log) => materialPhotoLogToCsvRow(log))].join("\n");
    writeAttachment(res, 200, "text/csv; charset=utf-8", "material-photo-logs.csv", body);
  });

  router.get("/api/v1/material-photo-logs/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "material-photo-log", "read")) {
      forbidden(res, "material-photo-log:read");
      return;
    }
    const log = await repositories.materialPhotoLogs.findById(
      materialPhotoLogId(req.params["id"] ?? ""),
    );
    if (
      log === null ||
      (ctx?.organizationId !== undefined && log.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "material photo log");
      return;
    }
    writeJson(res, 200, { materialPhotoLog: log });
  });

  router.put("/api/v1/material-photo-logs/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "material-photo-log", "write")) {
      forbidden(res, "material-photo-log:write");
      return;
    }
    const existing = await repositories.materialPhotoLogs.findById(
      materialPhotoLogId(req.params["id"] ?? ""),
    );
    if (
      existing === null ||
      (ctx?.organizationId !== undefined && existing.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "material photo log");
      return;
    }
    const transactionType = str(req.body, "transactionType");
    if (
      transactionType !== undefined &&
      !MATERIAL_TRANSACTION_TYPES.includes(transactionType as never)
    ) {
      badRequest(res, [
        {
          field: "transactionType",
          message: `transactionType must be one of: ${MATERIAL_TRANSACTION_TYPES.join(", ")}`,
        },
      ]);
      return;
    }
    const inspectionStatus = str(req.body, "inspectionStatus");
    if (
      inspectionStatus !== undefined &&
      !MATERIAL_INSPECTION_STATUSES.includes(inspectionStatus as never)
    ) {
      badRequest(res, [
        {
          field: "inspectionStatus",
          message: `inspectionStatus must be one of: ${MATERIAL_INSPECTION_STATUSES.join(", ")}`,
        },
      ]);
      return;
    }
    const capturedAt = str(req.body, "capturedAt");
    const needsReview =
      req.body !== undefined && typeof req.body === "object"
        ? (req.body as Record<string, unknown>)["needsReview"]
        : undefined;
    const updated = updateMaterialPhotoLog(existing, {
      materialName: str(req.body, "materialName"),
      materialCategory: str(req.body, "materialCategory"),
      quantity: num(req.body, "quantity"),
      unit: str(req.body, "unit"),
      storagePlace: str(req.body, "storagePlace"),
      memo: str(req.body, "memo"),
      transactionType: transactionType as never,
      inspectionStatus: inspectionStatus as never,
      ...(needsReview !== undefined ? { needsReview: needsReview === true } : {}),
      ...(capturedAt !== undefined ? { capturedAt: capturedAt as IsoTimestamp } : {}),
      latitude: num(req.body, "latitude"),
      longitude: num(req.body, "longitude"),
      objectKey: str(req.body, "objectKey"),
      updatedAt: nowTs(),
    });
    if (!updated.ok) {
      badRequest(res, updated.error);
      return;
    }
    await repositories.materialPhotoLogs.save(updated.value);
    recordAudit(
      container.auditLog,
      ctx,
      "material-photo-log:update",
      `material-photo-logs/${updated.value.id}`,
      "success",
    );
    writeJson(res, 200, { materialPhotoLog: updated.value });
  });

  router.delete("/api/v1/material-photo-logs/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "material-photo-log", "write")) {
      forbidden(res, "material-photo-log:write");
      return;
    }
    const existing = await repositories.materialPhotoLogs.findById(
      materialPhotoLogId(req.params["id"] ?? ""),
    );
    if (
      existing === null ||
      (ctx?.organizationId !== undefined && existing.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "material photo log");
      return;
    }
    await repositories.materialPhotoLogs.delete(existing.id);
    recordAudit(
      container.auditLog,
      ctx,
      "material-photo-log:delete",
      `material-photo-logs/${existing.id}`,
      "success",
    );
    noContent(res);
  });
}
