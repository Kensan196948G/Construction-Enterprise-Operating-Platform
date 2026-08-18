// FILE: src/api/server.ts
/**
 * HTTP server factory.
 *
 * Wires the router, route groups, and DI container into a single node:http
 * Server. The factory is pure: it does not bind to a port — the caller controls
 * lifecycle via `server.listen()`.
 */

import { createServer as httpCreateServer } from "node:http";
import type { IncomingMessage, Server, ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import { Router } from "./router.ts";
import { clientIpFromRequest } from "./client-ip.ts";
import { createRateLimiter } from "./middleware/rate-limiter.ts";
import { registerAuthRoutes } from "./routes/auth.ts";
import { registerHealthRoutes } from "./routes/health.ts";
import { registerGovernanceRoutes } from "./routes/governance.ts";
import { registerDashboardRoutes } from "./routes/dashboard.ts";
import { registerWebRoutes } from "./routes/web.ts";
import { registerEntityCrudRoutes } from "./routes/entity-crud.ts";
import { registerWorkflowRoutes } from "./routes/workflows.ts";
import { registerWorkflowInstanceRoutes } from "./routes/workflow-instances.ts";
import { registerGatewayRoutes } from "./routes/gateway.ts";
import { registerAiActionRoutes } from "./routes/ai-actions.ts";
import { registerDeviceIngestRoutes } from "./routes/device-ingest.ts";
import { registerProjectRoutes } from "./routes/projects.ts";
import { registerDailyReportRoutes } from "./routes/daily-reports.ts";
import { registerPhotoRoutes } from "./routes/photos.ts";
import { registerSafetyRoutes } from "./routes/safety.ts";
import { registerCostRoutes } from "./routes/cost.ts";
import { registerNotificationRoutes } from "./routes/notifications.ts";
import { registerKnowledgeRoutes } from "./routes/knowledge.ts";
import { registerContractRoutes } from "./routes/contracts.ts";
import { registerItsmRoutes } from "./routes/itsm.ts";
import { registerDocumentRoutes } from "./routes/documents.ts";
import { registerWorkScheduleRoutes } from "./routes/work-schedules.ts";
import { registerPurchaseOrderRoutes } from "./routes/purchase-orders.ts";
import { registerNotificationPreferenceRoutes } from "./routes/notification-preferences.ts";
import { registerComplianceRoutes } from "./routes/compliance.ts";
import { registerNotificationTemplateRoutes } from "./routes/notification-templates.ts";
import { registerMonitoringRoutes } from "./routes/monitoring.ts";
import { registerPortalRoute } from "./routes/portal.ts";
import { registerDailyReportUiRoutes } from "./routes/daily-reports-ui.ts";
import { registerIsoRoutes } from "./routes/iso.ts";
import { registerIntegrationRoutes } from "./routes/integrations.ts";
import { registerDemoLoginRoutes } from "./routes/demo-login.ts";
import { registerWorkOrderRoutes } from "./routes/work-orders.ts";
import { registerInspectionRoutes } from "./routes/inspections.ts";
import { registerSupplierEvaluationRoutes } from "./routes/suppliers.ts";
import { registerQualityObjectiveRoutes } from "./routes/quality-objectives.ts";
import { registerRiskRoutes } from "./routes/risks.ts";
import { registerManagementReviewRoutes } from "./routes/management-reviews.ts";
import { registerAiBuildProjectRoutes } from "./routes/ai-build-projects.ts";
import { registerDxProjectRoutes } from "./routes/dx-projects.ts";
import { registerMaterialPhotoLogRoutes } from "./routes/material-photo-logs.ts";
import type { GatewayService } from "../domain/gateway-service.ts";
import type { AppContainer } from "./types.ts";

export interface ServerConfig {
  readonly port: number;
  readonly host?: string;
  readonly corsOrigin?: string;
  /** Optional global API rate limit (per socket IP). Defaults from env or 300 req/min. */
  readonly rateLimit?: { readonly maxRequests: number; readonly windowMs: number };
  /** Integration services to expose through the CEOP gateway (P1). */
  readonly gatewayServices?: readonly GatewayService[];
}

export function createServer(config: ServerConfig, container: AppContainer): Server {
  // CORS is opt-in: only emit Access-Control-* headers when an explicit origin is
  // provided via config or the CEOP_CORS_ORIGIN environment variable.
  // Defaulting to "*" would allow any origin to read authenticated API responses.
  const corsOrigin = config.corsOrigin ?? process.env["CEOP_CORS_ORIGIN"];
  const rateLimitMaxRaw = Number(process.env["CEOP_RATE_LIMIT_MAX"] ?? "300");
  const rateLimitWindowRaw = Number(process.env["CEOP_RATE_LIMIT_WINDOW_MS"] ?? "60000");
  const rateLimit =
    config.rateLimit ??
    (Number.isSafeInteger(rateLimitMaxRaw) &&
    rateLimitMaxRaw > 0 &&
    Number.isSafeInteger(rateLimitWindowRaw) &&
    rateLimitWindowRaw > 0
      ? { maxRequests: rateLimitMaxRaw, windowMs: rateLimitWindowRaw }
      : { maxRequests: 300, windowMs: 60_000 });
  const apiRateLimiter = createRateLimiter({
    maxRequests: rateLimit.maxRequests,
    windowMs: rateLimit.windowMs,
  });
  const router = new Router({
    apiKeyStore: container.apiKeyStore,
    ...(container.jwtIssuer !== undefined ? { jwtIssuer: container.jwtIssuer } : {}),
    auditLog: container.auditLog,
  });
  registerHealthRoutes(router, container);
  // Demo-only browser login is registered only in development/demo mode so a
  // production container can never expose a credential-accepting form.
  const demoMode =
    process.env["NODE_ENV"]?.toLowerCase() !== "production" &&
    (process.env["CEOP_SEED_DEMO"] === "true" || process.env["CEOP_SEED_RICH_DEMO"] === "true");
  if (demoMode) {
    registerDemoLoginRoutes(router, container);
  }
  if (container.jwtIssuer !== undefined) {
    registerAuthRoutes(
      router,
      container.apiKeyStore,
      container.jwtIssuer,
      container.auditLog,
      container.apiKeyRepository,
    );
  }
  registerGovernanceRoutes(router, container);
  registerDashboardRoutes(router, container);
  registerEntityCrudRoutes(router, container);
  registerWorkflowRoutes(router, container);
  registerWorkflowInstanceRoutes(router, container);
  if (config.gatewayServices !== undefined) {
    registerGatewayRoutes(router, container, config.gatewayServices);
  }
  registerAiActionRoutes(router, container);
  registerDeviceIngestRoutes(router, container);
  registerProjectRoutes(router, container);
  registerDailyReportRoutes(router, container);
  registerPhotoRoutes(router, container);
  registerSafetyRoutes(router, container);
  registerCostRoutes(router, container);
  registerNotificationRoutes(router, container);
  registerKnowledgeRoutes(router, container);
  registerContractRoutes(router, container);
  registerItsmRoutes(router, container);
  registerDocumentRoutes(router, container);
  registerWorkScheduleRoutes(router, container);
  registerPurchaseOrderRoutes(router, container);
  registerNotificationPreferenceRoutes(router, container);
  registerComplianceRoutes(router, container);
  registerNotificationTemplateRoutes(router, container);
  registerMonitoringRoutes(router, container);
  registerIsoRoutes(router, container);
  registerIntegrationRoutes(router, container);
  registerPortalRoute(router);
  registerDailyReportUiRoutes(router, container);
  registerWorkOrderRoutes(router, container);
  registerInspectionRoutes(router, container);
  registerSupplierEvaluationRoutes(router, container);
  registerQualityObjectiveRoutes(router, container);
  registerRiskRoutes(router, container);
  registerManagementReviewRoutes(router, container);
  registerAiBuildProjectRoutes(router, container);
  registerDxProjectRoutes(router, container);
  registerMaterialPhotoLogRoutes(router, container);
  registerWebRoutes(router, container);

  const server = httpCreateServer((req: IncomingMessage, res: ServerResponse): void => {
    res.setHeader("X-Request-Id", randomUUID());
    if (corsOrigin !== undefined) {
      res.setHeader("Access-Control-Allow-Origin", corsOrigin);
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
      res.setHeader("Access-Control-Max-Age", "86400");
    }

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    // Global API rate limit (per socket IP) — applies to all /api/v1/* paths.
    const pathOnly = (req.url ?? "/").split("?")[0] ?? "/";
    if (pathOnly.startsWith("/api/v1/")) {
      const clientIp = clientIpFromRequest(req);
      const rl = apiRateLimiter.check(clientIp);
      res.setHeader("X-RateLimit-Limit", String(rateLimit.maxRequests));
      res.setHeader("X-RateLimit-Remaining", String(rl.remaining));
      res.setHeader("X-RateLimit-Reset", String(Math.ceil(rl.resetAt / 1000)));
      if (!rl.allowed) {
        res.writeHead(429, {
          "Content-Type": "application/json; charset=utf-8",
          "X-Content-Type-Options": "nosniff",
          "X-Frame-Options": "DENY",
          "Referrer-Policy": "no-referrer",
          "Cache-Control": "no-store",
          "Strict-Transport-Security": "max-age=63072000; includeSubDomains",
        });
        res.end(JSON.stringify({ error: "Too Many Requests", message: "rate limit exceeded" }));
        return;
      }
    }

    router.handle(req, res).catch((e: unknown) => {
      const message = e instanceof Error ? e.message : String(e);
      console.error("[server] fatal dispatch error:", message);
      if (!res.headersSent && !res.writableEnded) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Internal Server Error" }));
      } else if (!res.writableEnded) {
        res.end();
      }
    });
  });

  // Production hardening against slowloris-style socket exhaustion.
  server.headersTimeout = 60_000;
  server.requestTimeout = 30_000;
  server.keepAliveTimeout = 5_000;
  return server;
}
