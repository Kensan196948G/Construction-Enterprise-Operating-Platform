// FILE: src/api/routes/health.ts
/**
 * Public, unauthenticated liveness and build-info endpoints.
 *
 * Kept open so load-balancers and Kubernetes probes can reach them without
 * API key management.
 */

import type { Router } from "../router.ts";
import { writeJson } from "../router.ts";
import { PLATFORM_VERSION } from "../../version.ts";
import type { AppContainer } from "../types.ts";

export function registerHealthRoutes(router: Router, container?: AppContainer): void {
  router.get(
    "/health",
    async (_req, _ctx, res) => {
      writeJson(res, 200, {
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    },
    false,
  );

  // GET /health/ready — readiness probe: verifies the persistence layer responds.
  router.get(
    "/health/ready",
    async (_req, _ctx, res) => {
      try {
        // A cheap read against the active persistence tier. For SQLite this
        // also exercises the WAL connection and the database file.
        await container?.repositories.organizations.findAll();
        writeJson(res, 200, {
          status: "ready",
          storage: container?.storageTier ?? "in-memory",
          timestamp: new Date().toISOString(),
        });
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        console.error("[health] readiness probe failed:", message);
        writeJson(res, 503, {
          status: "not_ready",
          storage: container?.storageTier ?? "unknown",
          timestamp: new Date().toISOString(),
        });
      }
    },
    false,
  );

  router.get(
    "/api/v1/info",
    async (_req, _ctx, res) => {
      writeJson(res, 200, {
        name: "construction-eop",
        version: PLATFORM_VERSION,
      });
    },
    false,
  );
}
