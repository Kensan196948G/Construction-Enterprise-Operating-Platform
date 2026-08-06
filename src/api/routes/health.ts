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

export function registerHealthRoutes(router: Router): void {
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
