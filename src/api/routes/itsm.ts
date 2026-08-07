/**
 * ITSM adapter API (ServiceHub S-08).
 *
 * Exposes the {@link ItsmPort} adapter behind CEOP auth/audit. The default
 * adapter is in-memory; a real ITSM adapter can be wired through AppContainer.
 */

import type { ServerResponse } from "node:http";
import { InMemoryItsmAdapter } from "../../adapters/in-memory-itsm-adapter.ts";
import { recordAudit } from "../audit.ts";
import type { Router } from "../router.ts";
import { writeJson } from "../router.ts";
import { hasPermission } from "./governance.ts";
import type { AppContainer } from "../types.ts";

function str(body: unknown, key: string): string | undefined {
  if (typeof body !== "object" || body === null) return undefined;
  const v = (body as Record<string, unknown>)[key];
  return typeof v === "string" ? v : undefined;
}

function forbidden(res: ServerResponse, perm: string): void {
  writeJson(res, 403, { error: "Forbidden", message: `requires '${perm}' permission` });
}

function notFound(res: ServerResponse): void {
  writeJson(res, 404, { error: "Not Found", message: "incident not found" });
}

function badRequest(res: ServerResponse, details: unknown): void {
  writeJson(res, 400, { error: "Bad Request", message: "validation failed", details });
}

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
      notFound(res);
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
