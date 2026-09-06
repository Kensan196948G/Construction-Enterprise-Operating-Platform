// FILE: src/api/routes/ops-health.ts
/**
 * Ops health aggregation endpoint (Issue #89).
 *
 * Exposes GET /api/v1/ops/health, backing the /ops-health SSR dashboard. The
 * route itself only authenticates and serializes — all data collection lives
 * in src/monitoring/ops-health.ts so the aggregation logic is independently
 * unit-testable without spinning up an HTTP server.
 */

import type { Router } from "../router.ts";
import { writeJson } from "../router.ts";
import type { AppContainer } from "../types.ts";
import { collectOpsHealthSnapshot } from "../../monitoring/ops-health.ts";

export function registerOpsHealthRoutes(router: Router, container: AppContainer): void {
  // GET /api/v1/ops/health — any authenticated subject may view (same
  // authorization posture as /system: this is operational visibility, not a
  // governance-scoped resource).
  router.get("/api/v1/ops/health", async (_req, ctx, res) => {
    if (ctx === null) {
      writeJson(res, 401, { error: "Unauthorized", message: "authentication required" });
      return;
    }
    const snapshot = await collectOpsHealthSnapshot(container);
    writeJson(res, 200, snapshot);
  });
}
