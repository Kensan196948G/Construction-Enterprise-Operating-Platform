/**
 * Photo/document metadata API (ServiceHub S-03).
 *
 * Object storage upload is out of scope; clients register metadata and the
 * object key defaults to `photos/<id>` unless provided.
 */

import { randomUUID } from "node:crypto";
import type { ServerResponse } from "node:http";
import type { IsoTimestamp } from "../../domain/common.ts";
import { PHOTO_CATEGORIES, createPhoto, photoId } from "../../domain/photo.ts";
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

function forbidden(res: ServerResponse, perm: string): void {
  writeJson(res, 403, { error: "Forbidden", message: `requires '${perm}' permission` });
}

function notFound(res: ServerResponse): void {
  writeJson(res, 404, { error: "Not Found", message: "photo not found" });
}

function badRequest(res: ServerResponse, details: unknown): void {
  writeJson(res, 400, { error: "Bad Request", message: "validation failed", details });
}

function nowTs(): IsoTimestamp {
  return new Date().toISOString() as IsoTimestamp;
}

export function registerPhotoRoutes(router: Router, container: AppContainer): void {
  const { repositories } = container;

  router.get("/api/v1/projects/:projectId/photos", async (req, ctx, res) => {
    if (!hasPermission(ctx, "photo", "read")) {
      forbidden(res, "photo:read");
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
      await repositories.photos.findByProject(project.id),
      parsePagination(req.query),
    );
    writeJson(res, 200, {
      photos: page.items,
      count: page.count,
      total: page.total,
      limit: page.limit,
      offset: page.offset,
    });
  });

  router.post("/api/v1/projects/:projectId/photos", async (req, ctx, res) => {
    if (!hasPermission(ctx, "photo", "write")) {
      forbidden(res, "photo:write");
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
    const id = `photo-${randomUUID()}`;
    const category = str(req.body, "category");
    if (category !== undefined && !PHOTO_CATEGORIES.includes(category as never)) {
      badRequest(res, [
        { field: "category", message: `category must be one of: ${PHOTO_CATEGORIES.join(", ")}` },
      ]);
      return;
    }
    const created = createPhoto({
      id,
      organizationId: project.organizationId,
      projectId: project.id as string,
      fileName: str(req.body, "fileName") ?? "",
      originalName: str(req.body, "originalName") ?? "",
      contentType: str(req.body, "contentType") ?? "",
      fileSize: num(req.body, "fileSize") ?? 0,
      objectKey: str(req.body, "objectKey"),
      category: category as never,
      caption: str(req.body, "caption"),
      takenAt: str(req.body, "takenAt"),
      createdAt: nowTs(),
    });
    if (!created.ok) {
      badRequest(res, created.error);
      return;
    }
    await repositories.photos.save(created.value);
    recordAudit(container.auditLog, ctx, "photo:create", `photos/${created.value.id}`, "success");
    writeJson(res, 201, { photo: created.value });
  });

  router.get("/api/v1/photos/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "photo", "read")) {
      forbidden(res, "photo:read");
      return;
    }
    const photo = await repositories.photos.findById(photoId(req.params["id"] ?? ""));
    if (
      photo === null ||
      (ctx?.organizationId !== undefined && photo.organizationId !== ctx.organizationId)
    ) {
      notFound(res);
      return;
    }
    writeJson(res, 200, { photo });
  });

  router.delete("/api/v1/photos/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "photo", "write")) {
      forbidden(res, "photo:write");
      return;
    }
    const photo = await repositories.photos.findById(photoId(req.params["id"] ?? ""));
    if (
      photo === null ||
      (ctx?.organizationId !== undefined && photo.organizationId !== ctx.organizationId)
    ) {
      notFound(res);
      return;
    }
    await repositories.photos.delete(photo.id);
    recordAudit(container.auditLog, ctx, "photo:delete", `photos/${photo.id}`, "success");
    writeJson(res, 200, { deleted: true });
  });
}
