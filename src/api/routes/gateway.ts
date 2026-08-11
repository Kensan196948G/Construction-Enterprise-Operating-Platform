/**
 * CEOP integration gateway routes (P1).
 *
 * Registers a wildcard route per configured integration service. CEOP
 * authenticates the caller (JWT or API key), enforces the service's declared
 * read/write permissions, forwards the request through the gateway proxy, and
 * records every attempt in the audit log.
 */

import type { ServerResponse } from "node:http";
import { permissionsForMethod, type GatewayService } from "../../domain/gateway-service.ts";
import { recordAudit } from "../audit.ts";
import { forwardToUpstream } from "../gateway/proxy.ts";
import { writeJson } from "../router.ts";
import { hasPermission } from "./governance.ts";
import type { Router } from "../router.ts";
import type { AppContainer } from "../types.ts";

function gatewayForbidden(res: ServerResponse, serviceId: string): void {
  writeJson(res, 403, {
    error: "Forbidden",
    message: `requires gateway:${serviceId} permissions`,
  });
}

/**
 * Register gateway routes for the given services.
 *
 * Wildcard routes are appended after the platform's own static routes, so
 * exact CEOP API paths always take precedence over proxying.
 */
export function registerGatewayRoutes(
  router: Router,
  container: AppContainer,
  services: readonly GatewayService[],
): void {
  for (const service of services.filter((item) => item.enabled)) {
    router.all(`${service.pathPrefix}/*`, async (req, ctx, res) => {
      if (ctx === null) {
        writeJson(res, 401, {
          error: "Unauthorized",
          message: "a valid Bearer credential is required",
        });
        return;
      }
      const required = permissionsForMethod(service, req.method);
      const authorized = required.every((permission) => {
        const colon = permission.indexOf(":");
        if (colon === -1) return false;
        return hasPermission(ctx, permission.slice(0, colon), permission.slice(colon + 1));
      });
      const suffix = req.params["*"] ?? "";
      if (!authorized) {
        recordAudit(
          container.auditLog,
          ctx,
          `gateway:${service.id}`,
          `${service.pathPrefix}/${suffix}`,
          "denied",
        );
        gatewayForbidden(res, service.id);
        return;
      }

      const status = await forwardToUpstream(service, req, res, ctx, suffix);
      const outcome = status >= 200 && status < 500 ? "success" : "failure";
      recordAudit(
        container.auditLog,
        ctx,
        `gateway:${service.id}`,
        `${service.pathPrefix}/${suffix}`,
        outcome,
        { method: req.method, status: String(status) },
      );
    });
  }
}
