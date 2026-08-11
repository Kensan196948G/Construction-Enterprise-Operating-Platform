/**
 * Monitoring routes (P4): Prometheus /metrics endpoint.
 */

import { timingSafeEqual } from "node:crypto";
import type { ServerResponse } from "node:http";
import { renderMetrics } from "../../monitoring/metrics.ts";
import type { Router } from "../router.ts";
import { writeJson } from "../router.ts";
import type { AppContainer } from "../types.ts";

function metricsForbidden(res: ServerResponse): void {
  writeJson(res, 401, { error: "Unauthorized", message: "invalid metrics token" });
}

function timingSafeStrCmp(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function registerMonitoringRoutes(router: Router, container: AppContainer): void {
  const { repositories } = container;
  const metricsToken = process.env["CEOP_METRICS_TOKEN"] ?? "";

  // In production, /metrics MUST be token-protected to prevent information
  // disclosure (queue gauges) and unauthenticated DoS via 6× findAll().
  if (process.env["NODE_ENV"] === "production" && metricsToken === "") {
    throw new Error(
      "CEOP_METRICS_TOKEN is required in production. Generate one with: openssl rand -hex 32",
    );
  }

  router.get(
    "/metrics",
    async (req, _ctx, res) => {
      if (metricsToken !== "") {
        const header = req.headers["authorization"];
        const credential =
          typeof header === "string" && header.startsWith("Bearer ")
            ? header.slice("Bearer ".length).trim()
            : "";
        if (!timingSafeStrCmp(credential, metricsToken)) {
          metricsForbidden(res);
          return;
        }
      }
      const notifications = await repositories.notificationDeliveries.findAll();
      const aiActions = await repositories.aiActions.findAll();
      const workflowInstances = await repositories.workflowInstances.findAll();
      const isoRecords = await repositories.isoRecords.findAll();
      const integrationEvents = await repositories.integrationEvents.findAll();
      const gauges = {
        ceop_audit_log_size: container.auditLog.size,
        ceop_notifications_pending: notifications.filter(
          (n) => n.status === "pending" || n.status === "retry",
        ).length,
        ceop_notifications_failed: notifications.filter((n) => n.status === "failed").length,
        ceop_ai_actions_pending: aiActions.filter((a) => a.status === "pending").length,
        ceop_workflow_instances_pending: workflowInstances.filter((w) => w.status === "pending")
          .length,
        ceop_iso_records_total: isoRecords.length,
        ceop_integration_events_pending: integrationEvents.filter(
          (e) => e.direction === "outbound" && (e.status === "pending" || e.status === "retrying"),
        ).length,
        ceop_gateway_services: container.gatewayServices?.length ?? 0,
      };
      const body = renderMetrics(gauges);
      res.writeHead(200, {
        "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      });
      res.end(body);
    },
    false,
  );
}
