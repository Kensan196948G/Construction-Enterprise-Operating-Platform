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
});
console.error(
  `[dispatcher] attempted=${result.attempted} sent=${result.sent} failed=${result.failed}`,
);
