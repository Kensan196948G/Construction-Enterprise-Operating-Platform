/**
 * Notification template API (Enterprise-OS E-11).
 */

import { randomUUID } from "node:crypto";
import type { ServerResponse } from "node:http";
import type { IsoTimestamp } from "../../domain/common.ts";
import { NOTIFICATION_CHANNELS } from "../../domain/notification.ts";
import {
  createNotificationTemplate,
  notificationTemplateId,
} from "../../domain/notification-template.ts";
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

function forbidden(res: ServerResponse, perm: string): void {
  writeJson(res, 403, { error: "Forbidden", message: `requires '${perm}' permission` });
}

function notFound(res: ServerResponse): void {
  writeJson(res, 404, { error: "Not Found", message: "notification template not found" });
}

function badRequest(res: ServerResponse, details: unknown): void {
  writeJson(res, 400, { error: "Bad Request", message: "validation failed", details });
}

function nowTs(): IsoTimestamp {
  return new Date().toISOString() as IsoTimestamp;
}

export function registerNotificationTemplateRoutes(router: Router, container: AppContainer): void {
  const { repositories } = container;

  router.get("/api/v1/notification-templates", async (req, ctx, res) => {
    if (!hasPermission(ctx, "notification", "read")) {
      forbidden(res, "notification:read");
      return;
    }
    let items =
      ctx?.organizationId !== undefined
        ? (await repositories.notificationTemplates.findAll()).filter(
            (t) => t.organizationId === ctx.organizationId,
          )
        : await repositories.notificationTemplates.findAll();
    const channel = req.query["channel"];
    if (channel !== undefined) {
      if (!NOTIFICATION_CHANNELS.includes(channel as never)) {
        badRequest(res, [
          {
            field: "channel",
            message: `channel must be one of: ${NOTIFICATION_CHANNELS.join(", ")}`,
          },
        ]);
        return;
      }
      items = items.filter((t) => t.channel === channel);
    }
    const page = paginate(items, parsePagination(req.query));
    writeJson(res, 200, {
      notificationTemplates: page.items,
      count: page.count,
      total: page.total,
      limit: page.limit,
      offset: page.offset,
    });
  });

  router.post("/api/v1/notification-templates", async (req, ctx, res) => {
    if (!hasPermission(ctx, "notification", "write")) {
      forbidden(res, "notification:write");
      return;
    }
    const templateKey = str(req.body, "templateKey") ?? "";
    const existing = await repositories.notificationTemplates.findByKey(templateKey);
    if (existing !== null) {
      badRequest(res, [{ field: "templateKey", message: "templateKey already exists" }]);
      return;
    }
    const channel = str(req.body, "channel");
    if (channel !== undefined && !NOTIFICATION_CHANNELS.includes(channel as never)) {
      badRequest(res, [
        {
          field: "channel",
          message: `channel must be one of: ${NOTIFICATION_CHANNELS.join(", ")}`,
        },
      ]);
      return;
    }
    const created = createNotificationTemplate({
      id: `notification-template-${randomUUID()}`,
      organizationId: ctx?.organizationId,
      templateKey,
      subject: str(req.body, "subject") ?? "",
      body: str(req.body, "body") ?? "",
      channel: channel as never,
      createdAt: nowTs(),
    });
    if (!created.ok) {
      badRequest(res, created.error);
      return;
    }
    await repositories.notificationTemplates.save(created.value);
    recordAudit(
      container.auditLog,
      ctx,
      "notification-template:create",
      `notification-templates/${created.value.id}`,
      "success",
    );
    writeJson(res, 201, { notificationTemplate: created.value });
  });

  router.get("/api/v1/notification-templates/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "notification", "read")) {
      forbidden(res, "notification:read");
      return;
    }
    const template = await repositories.notificationTemplates.findById(
      notificationTemplateId(req.params["id"] ?? ""),
    );
    if (
      template === null ||
      (ctx?.organizationId !== undefined && template.organizationId !== ctx.organizationId)
    ) {
      notFound(res);
      return;
    }
    writeJson(res, 200, { notificationTemplate: template });
  });
}
