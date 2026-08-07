/**
 * Drawing/document API (Enterprise-OS E-03).
 */

import { randomUUID } from "node:crypto";
import type { ServerResponse } from "node:http";
import type { IsoTimestamp } from "../../domain/common.ts";
import {
  DOCUMENT_STATUSES,
  DOCUMENT_TYPES,
  createDocument,
  documentId,
} from "../../domain/document.ts";
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
  writeJson(res, 404, { error: "Not Found", message: "document not found" });
}

function badRequest(res: ServerResponse, details: unknown): void {
  writeJson(res, 400, { error: "Bad Request", message: "validation failed", details });
}

function nowTs(): IsoTimestamp {
  return new Date().toISOString() as IsoTimestamp;
}

export function registerDocumentRoutes(router: Router, container: AppContainer): void {
  const { repositories } = container;

  router.get("/api/v1/documents", async (req, ctx, res) => {
    if (!hasPermission(ctx, "document", "read")) {
      forbidden(res, "document:read");
      return;
    }
    let items =
      ctx?.organizationId !== undefined
        ? await repositories.documents.findByOrganization(ctx.organizationId)
        : await repositories.documents.findAll();
    const type = req.query["type"];
    if (type !== undefined) {
      if (!DOCUMENT_TYPES.includes(type as never)) {
        badRequest(res, [
          { field: "type", message: `type must be one of: ${DOCUMENT_TYPES.join(", ")}` },
        ]);
        return;
      }
      items = items.filter((d) => d.documentType === type);
    }
    const page = paginate(items, parsePagination(req.query));
    writeJson(res, 200, {
      documents: page.items,
      count: page.count,
      total: page.total,
      limit: page.limit,
      offset: page.offset,
    });
  });

  router.post("/api/v1/documents", async (req, ctx, res) => {
    if (!hasPermission(ctx, "document", "write")) {
      forbidden(res, "document:write");
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
    const type = str(req.body, "documentType");
    if (type !== undefined && !DOCUMENT_TYPES.includes(type as never)) {
      badRequest(res, [
        {
          field: "documentType",
          message: `documentType must be one of: ${DOCUMENT_TYPES.join(", ")}`,
        },
      ]);
      return;
    }
    const status = str(req.body, "status");
    if (status !== undefined && !DOCUMENT_STATUSES.includes(status as never)) {
      badRequest(res, [
        { field: "status", message: `status must be one of: ${DOCUMENT_STATUSES.join(", ")}` },
      ]);
      return;
    }
    const created = createDocument({
      id: `document-${randomUUID()}`,
      organizationId,
      projectId: str(req.body, "projectId"),
      title: str(req.body, "title") ?? "",
      documentType: type as never,
      revision: num(req.body, "revision"),
      status: status as never,
      fileUrl: str(req.body, "fileUrl"),
      fileSize: num(req.body, "fileSize"),
      createdAt: nowTs(),
    });
    if (!created.ok) {
      badRequest(res, created.error);
      return;
    }
    await repositories.documents.save(created.value);
    recordAudit(
      container.auditLog,
      ctx,
      "document:create",
      `documents/${created.value.id}`,
      "success",
    );
    writeJson(res, 201, { document: created.value });
  });

  router.get("/api/v1/documents/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "document", "read")) {
      forbidden(res, "document:read");
      return;
    }
    const document = await repositories.documents.findById(documentId(req.params["id"] ?? ""));
    if (
      document === null ||
      (ctx?.organizationId !== undefined && document.organizationId !== ctx.organizationId)
    ) {
      notFound(res);
      return;
    }
    writeJson(res, 200, { document });
  });

  router.delete("/api/v1/documents/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "document", "write")) {
      forbidden(res, "document:write");
      return;
    }
    const document = await repositories.documents.findById(documentId(req.params["id"] ?? ""));
    if (
      document === null ||
      (ctx?.organizationId !== undefined && document.organizationId !== ctx.organizationId)
    ) {
      notFound(res);
      return;
    }
    await repositories.documents.delete(document.id);
    recordAudit(container.auditLog, ctx, "document:delete", `documents/${document.id}`, "success");
    writeJson(res, 200, { deleted: true });
  });
}
