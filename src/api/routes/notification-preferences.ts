/**
 * Notification preference API (Enterprise-OS E-11 / ServiceHub S-09).
 */

import { randomUUID } from "node:crypto";
import {
  createNotificationPreference,
  updateNotificationPreference,
} from "../../domain/notification-preference.ts";
import { recordAudit } from "../audit.ts";
import type { Router } from "../router.ts";
import { writeJson } from "../router.ts";
import { hasPermission } from "./governance.ts";
import { badRequest, bool, forbidden, notFound, nowTs, str } from "./route-helpers.ts";
import type { AppContainer } from "../types.ts";

export function registerNotificationPreferenceRoutes(
  router: Router,
  container: AppContainer,
): void {
  const { repositories } = container;

  router.get("/api/v1/notification-preferences/:userId", async (req, ctx, res) => {
    if (!hasPermission(ctx, "notification", "read")) {
      forbidden(res, "notification:read");
      return;
    }
    const userId = req.params["userId"] ?? "";
    const preference = await repositories.notificationPreferences.findByUserId(userId);
    if (
      preference === null ||
      (ctx?.organizationId !== undefined && preference.organizationId !== ctx.organizationId)
    ) {
      notFound(res, "notification preference");
      return;
    }
    writeJson(res, 200, { notificationPreference: preference });
  });

  router.put("/api/v1/notification-preferences/:userId", async (req, ctx, res) => {
    if (!hasPermission(ctx, "notification", "write")) {
      forbidden(res, "notification:write");
      return;
    }
    const userId = req.params["userId"] ?? "";
    const existing = await repositories.notificationPreferences.findByUserId(userId);
    if (existing === null) {
      const created = createNotificationPreference({
        id: `notification-pref-${randomUUID()}`,
        organizationId: ctx?.organizationId,
        userId,
        emailEnabled: bool(req.body, "emailEnabled"),
        slackEnabled: bool(req.body, "slackEnabled"),
        slackWebhookUrl: str(req.body, "slackWebhookUrl"),
        createdAt: nowTs(),
      });
      if (!created.ok) {
        badRequest(res, created.error);
        return;
      }
      await repositories.notificationPreferences.save(created.value);
      recordAudit(
        container.auditLog,
        ctx,
        "notification-preference:create",
        `notification-preferences/${userId}`,
        "success",
      );
      writeJson(res, 201, { notificationPreference: created.value });
      return;
    }
    if (ctx?.organizationId !== undefined && existing.organizationId !== ctx.organizationId) {
      notFound(res, "notification preference");
      return;
    }
    const updated = updateNotificationPreference(existing, {
      emailEnabled: bool(req.body, "emailEnabled"),
      slackEnabled: bool(req.body, "slackEnabled"),
      slackWebhookUrl: str(req.body, "slackWebhookUrl"),
      updatedAt: nowTs(),
    });
    if (!updated.ok) {
      badRequest(res, updated.error);
      return;
    }
    await repositories.notificationPreferences.save(updated.value);
    recordAudit(
      container.auditLog,
      ctx,
      "notification-preference:update",
      `notification-preferences/${userId}`,
      "success",
    );
    writeJson(res, 200, { notificationPreference: updated.value });
  });
}
