/**
 * ITSM adapter API (ServiceHub S-08).
 *
 * Exposes the {@link ItsmPort} adapter behind CEOP auth/audit. The default
 * adapter is in-memory; a real ITSM adapter can be wired through AppContainer.
 */

import { InMemoryItsmAdapter } from "../../adapters/in-memory-itsm-adapter.ts";
import { recordAudit } from "../audit.ts";
import type { Router } from "../router.ts";
import { writeJson } from "../router.ts";
import { hasPermission } from "./governance.ts";
import { badRequest, forbidden, notFound, str } from "./route-helpers.ts";
import type { AppContainer } from "../types.ts";

export function registerItsmRoutes(router: Router, container: AppContainer): void {
  // Default in-memory adapter; production can inject a real ITSM adapter later.
  const itsm = new InMemoryItsmAdapter();

  router.get("/api/v1/itsm/incidents", async (_req, ctx, res) => {
    if (!hasPermission(ctx, "itsm", "read")) {
      forbidden(res, "itsm:read");
      return;
    }
    writeJson(res, 200, { incidents: await itsm.listIncidents() });
  });

  router.get("/api/v1/itsm/incidents/:id", async (req, ctx, res) => {
    if (!hasPermission(ctx, "itsm", "read")) {
      forbidden(res, "itsm:read");
      return;
    }
    const incident = await itsm.getIncident(req.params["id"] ?? "");
    if (incident === null) {
      notFound(res, "incident");
      return;
    }
    writeJson(res, 200, { incident });
  });

  router.post("/api/v1/itsm/incidents", async (req, ctx, res) => {
    if (!hasPermission(ctx, "itsm", "write")) {
      forbidden(res, "itsm:write");
      return;
    }
    const severity = str(req.body, "severity");
    if (severity === undefined || !["low", "medium", "high", "critical"].includes(severity)) {
      badRequest(res, [
        { field: "severity", message: "severity must be one of: low, medium, high, critical" },
      ]);
      return;
    }
    const title = str(req.body, "title") ?? "";
    if (title.trim().length === 0) {
      badRequest(res, [{ field: "title", message: "title is required" }]);
      return;
    }
    const incident = await itsm.createIncident({
      title,
      severity: severity as never,
    });
    recordAudit(container.auditLog, ctx, "itsm:create", `itsm/incidents/${incident.id}`, "success");
    writeJson(res, 201, { incident });
  });
}
