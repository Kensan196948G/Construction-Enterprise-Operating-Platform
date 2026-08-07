/**
 * CLI entry point for the notification dispatcher.
 *
 * Usage:
 *   node --experimental-strip-types scripts/run-notification-dispatcher.ts
 *
 * Reads CEOP_NOTIFICATION_WEBHOOK_URL / CEOP_NOTIFICATION_SLACK_WEBHOOK_URL
 * from the environment and dispatches pending deliveries once.
 */

import { createApp } from "../src/app.ts";
import { dispatchPendingDeliveries } from "../src/notifications/dispatcher.ts";

const container = await createApp();
const result = await dispatchPendingDeliveries(container.repositories, {
  webhookUrl: process.env["CEOP_NOTIFICATION_WEBHOOK_URL"],
  slackWebhookUrl: process.env["CEOP_NOTIFICATION_SLACK_WEBHOOK_URL"],
  smtp:
    process.env["CEOP_SMTP_HOST"] !== undefined && process.env["CEOP_SMTP_HOST"] !== ""
      ? {
          host: process.env["CEOP_SMTP_HOST"],
          port: Number(process.env["CEOP_SMTP_PORT"] ?? "465"),
          secure: (process.env["CEOP_SMTP_SECURE"] ?? "true") === "true",
          ...(process.env["CEOP_SMTP_USER"] !== undefined
            ? { user: process.env["CEOP_SMTP_USER"] }
            : {}),
          ...(process.env["CEOP_SMTP_PASSWORD"] !== undefined
            ? { password: process.env["CEOP_SMTP_PASSWORD"] }
            : {}),
          from: process.env["CEOP_SMTP_FROM"] ?? "ceop@example.local",
        }
      : undefined,
});
console.error(
  `[dispatcher] attempted=${result.attempted} sent=${result.sent} failed=${result.failed}`,
);
