/**
 * Notification dispatcher (ServiceHub S-09 / Enterprise-OS E-11).
 *
 * Processes pending/retry notification deliveries:
 *   - webhook -> POST to CEOP_NOTIFICATION_WEBHOOK_URL
 *   - slack   -> POST to CEOP_NOTIFICATION_SLACK_WEBHOOK_URL
 *   - email   -> failed with failureKind "not-configured" (SMTP later)
 *
 * On success the delivery becomes `sent`; on failure it becomes `failed` with
 * `failureKind: "transient"` so a later retry pass can pick it up.
 */

import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import type { NotificationDelivery } from "../domain/notification.ts";
import type { Repositories } from "../persistence/ports.ts";

export interface DispatcherConfig {
  readonly webhookUrl?: string | undefined;
  readonly slackWebhookUrl?: string | undefined;
  readonly timeoutMs?: number | undefined;
}

export interface DispatchResult {
  readonly attempted: number;
  readonly sent: number;
  readonly failed: number;
}

function postJson(url: string, payload: unknown, timeoutMs: number): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    let target: URL;
    try {
      target = new URL(url);
    } catch {
      reject(new Error("invalid webhook URL"));
      return;
    }
    if (target.protocol !== "https:" && target.protocol !== "http:") {
      reject(new Error("webhook URL must use http(s)"));
      return;
    }
    const transport = target.protocol === "https:" ? httpsRequest : httpRequest;
    const body = JSON.stringify(payload);
    const req = transport(
      target,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
          "User-Agent": "ceop-notification-dispatcher/1",
        },
      },
      (res) => {
        res.resume();
        res.on("end", () => {
          if (res.statusCode !== undefined && res.statusCode >= 200 && res.statusCode < 300) {
            resolve();
          } else {
            reject(new Error(`webhook returned HTTP ${res.statusCode ?? "unknown"}`));
          }
        });
      },
    );
    const timer = setTimeout(() => {
      req.destroy(new Error("webhook timeout"));
      reject(new Error("webhook timeout"));
    }, timeoutMs);
    timer.unref();
    req.on("error", (e) => {
      clearTimeout(timer);
      reject(e);
    });
    req.end(body);
  });
}

function updateDelivery(
  delivery: NotificationDelivery,
  patch: Record<string, unknown>,
): NotificationDelivery {
  return { ...delivery, ...patch } as unknown as NotificationDelivery;
}

/**
 * Dispatch all pending/retry deliveries. Returns counts. Never throws for a
 * single delivery failure — the failure is recorded on the delivery itself.
 */
export async function dispatchPendingDeliveries(
  repositories: Repositories,
  config: DispatcherConfig,
  nowIso: string = new Date().toISOString(),
): Promise<DispatchResult> {
  const timeoutMs = config.timeoutMs ?? 10_000;
  const candidates = (await repositories.notificationDeliveries.findAll()).filter(
    (d) => d.status === "pending" || d.status === "retry",
  );
  let sent = 0;
  let failed = 0;

  for (const delivery of candidates) {
    let url: string | undefined;
    if (delivery.channel === "webhook") {
      url = config.webhookUrl;
    } else if (delivery.channel === "slack") {
      url = config.slackWebhookUrl;
    }
    if (url === undefined || url === "") {
      await repositories.notificationDeliveries.save(
        updateDelivery(delivery, {
          status: "failed",
          failureKind: "not-configured",
          errorDetail: `no webhook URL configured for channel '${delivery.channel}'`,
          attempts: delivery.attempts + 1,
          updatedAt: nowIso,
        }),
      );
      failed += 1;
      continue;
    }
    try {
      await postJson(
        url,
        {
          id: delivery.id,
          userId: delivery.userId,
          eventKey: delivery.eventKey,
          channel: delivery.channel,
          subject: delivery.subject ?? "",
          bodyPreview: delivery.bodyPreview ?? "",
        },
        timeoutMs,
      );
      await repositories.notificationDeliveries.save(
        updateDelivery(delivery, {
          status: "sent",
          sentAt: nowIso,
          attempts: delivery.attempts + 1,
          errorDetail: undefined,
          failureKind: undefined,
          updatedAt: nowIso,
        }),
      );
      sent += 1;
    } catch (e) {
      await repositories.notificationDeliveries.save(
        updateDelivery(delivery, {
          status: "failed",
          failureKind: "transient",
          errorDetail: e instanceof Error ? e.message : String(e),
          attempts: delivery.attempts + 1,
          updatedAt: nowIso,
        }),
      );
      failed += 1;
    }
  }

  return { attempted: candidates.length, sent, failed };
}
