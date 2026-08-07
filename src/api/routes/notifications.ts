/**
 * Notification delivery API (ServiceHub S-09).
 *
 * Records notification intent (pending). Actual sending is performed by a
 * dispatcher (out of scope); status transitions are internal.
 */

import { randomUUID } from "node:crypto";
import type { ServerResponse } from "node:http";
import type { IsoTimestamp } from "../../domain/common.ts";
import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_STATUSES,
  createNotificationDelivery,
  notificationDeliveryId,
} from "../../domain/notification.ts";
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
  writeJson(res, 404, { error: "Not Found", message: "notification not found" });
}

function badRequest(res: ServerResponse, details: unknown): void {
  writeJson(res, 400, { error: "Bad Request", message: "validation failed", details });
}

function nowTs(): IsoTimestamp {
  return new Date().toISOString() as IsoTimestamp;
}

export function registerNotificationRoutes(router: Router, container: AppContainer): void {
  const { repositories } = container;

  router.get("/api/v1/notifications", async (req, ctx, res) => {
    if (!hasPermission(ctx, "notification", "read")) {
      forbidden(res, "notification:read");
      return;
    }
    const statusFilter = req.query["status"];
    if (statusFilter !== undefined && !NOTIFICATION_STATUSES.includes(statusFilter as never)) {
      badRequest(res, [
        { field: "status", message: `status must be one of: ${NOTIFICATION_STATUSES.join(", ")}` },
      ]);
      return;
    }
    let items =
      ctx?.organizationId !== undefined
        ? (await repositories.notificationDeliveries.findAll()).filter(
            (n) => n.organizationId === ctx.organizationId,
          )
        : await repositories.notificationDeliveries.findAll();
    if (statusFilter !== undefined) {
      items = items.filter((n) => n.status === statusFilter);
    }
    const page = paginate(items, parsePagination(req.query));
    writeJson(res, 200, {
      notifications: page.items,
      count: page.count,
      total: page.total,
      limit: page.limit,
      offset: page.offset,
    });
  });

  router.post("/api/v1/notifications", async (req, ctx, res) => {
    if (!hasPermission(ctx, "notification", "write")) {
      forbidden(res, "notification:write");
      return;
    }
    const channel = str(req.body, "channel");
    if (channel === undefined || !NOTIFICATION_CHANNELS.includes(channel as never)) {
      badRequest(res, [
        {
          field: "channel",
          message: `channel must be one of: ${NOTIFICATION_CHANNELS.join(", ")}`,
        },
      ]);
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
    const created = createNotificationDelivery({
      id: `notification-${randomUUID()}`,
      organizationId: ctx?.organizationId ?? bodyOrg,
      userId: str(req.body, "userId") ?? ctx?.subject ?? "system",
      eventKey: str(req.body, "eventKey") ?? "",
      channel: channel as never,
      subject: str(req.body, "subject"),
      bodyPreview: str(req.body, "bodyPreview"),
      createdAt: nowTs(),
    });
    if (!created.ok) {
      badRequest(res, created.error);
      return;
    }
    await repositories.notificationDeliveries.save(created.value);
    recordAudit(
      container.auditLog,
      ctx,
      "notification:create",
      `notifications/${created.value.id}`,
      "success",
    );
    writeJson(res, 201, { notification: created.value });
  });

  router.get("/api/v1/notifications/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "notification", "read")) {
      forbidden(res, "notification:read");
      return;
    }
    const notification = await repositories.notificationDeliveries.findById(
      notificationDeliveryId(req.params["id"] ?? ""),
    );
    if (
      notification === null ||
      (ctx?.organizationId !== undefined && notification.organizationId !== ctx.organizationId)
    ) {
      notFound(res);
      return;
    }
    writeJson(res, 200, { notification });
  });
}
