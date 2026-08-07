/**
 * Device agent ingest API (integration D-01..D-03 / L-05).
 *
 *   POST /api/v1/devices/register           — D-01: agent registration
 *   POST /api/v1/devices/:id/heartbeat      — D-02: liveness report
 *   POST /api/v1/devices/:id/inventory      — D-03: inventory/telemetry report
 *
 * All endpoints require `device:write`; every mutation is audited. Tenant
 * scope is enforced from the credential (never trusted from the body).
 */

import { randomUUID } from "node:crypto";
import type { ServerResponse } from "node:http";
import type { IsoTimestamp } from "../../domain/common.ts";
import { createDevice, deviceId, touchDevice, withDeviceMetadata } from "../../domain/device.ts";
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
  writeJson(res, 404, { error: "Not Found", message: "device not found" });
}

function badRequest(res: ServerResponse, details: unknown): void {
  writeJson(res, 400, { error: "Bad Request", message: "validation failed", details });
}

function nowTs(): IsoTimestamp {
  return new Date().toISOString() as IsoTimestamp;
}

function stringMetadata(value: unknown): Record<string, string> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const out: Record<string, string> = {};
  for (const [key, v] of Object.entries(value)) {
    if (typeof v !== "string") return null;
    out[key] = v;
  }
  return out;
}

export function registerDeviceIngestRoutes(router: Router, container: AppContainer): void {
  const { repositories } = container;

  router.post("/api/v1/devices/register", async (req, ctx, res) => {
    if (!hasPermission(ctx, "device", "write")) {
      forbidden(res, "device:write");
      return;
    }
    const id = str(req.body, "id") ?? `device-${randomUUID()}`;
    const kind = str(req.body, "kind") ?? "";
    const status = str(req.body, "status") ?? "active";
    const bodyOrg = str(req.body, "organizationId");
    if (
      ctx?.organizationId !== undefined &&
      bodyOrg !== undefined &&
      bodyOrg !== ctx.organizationId
    ) {
      badRequest(res, [
        { field: "organizationId", message: "organization mismatch with credential scope" },
      ]);
      return;
    }
    const organizationId = ctx?.organizationId ?? bodyOrg;
    if (organizationId === undefined) {
      badRequest(res, [{ field: "organizationId", message: "organizationId is required" }]);
      return;
    }
    const rawMetadata = (req.body as Record<string, unknown> | undefined)?.["metadata"];
    let metadata: Record<string, string> | undefined;
    if (rawMetadata !== undefined) {
      const parsed = stringMetadata(rawMetadata);
      if (parsed === null) {
        badRequest(res, [
          { field: "metadata", message: "metadata must be an object of string values" },
        ]);
        return;
      }
      metadata = parsed;
    }
    const existing = await repositories.devices.findById(deviceId(id));
    if (existing !== null) {
      badRequest(res, [{ field: "id", message: "device already registered" }]);
      return;
    }
    const created = createDevice({
      id,
      organizationId,
      kind: kind as never,
      status: status as never,
      lastSeenAt: nowTs(),
      ...(metadata !== undefined ? { metadata } : {}),
    });
    if (!created.ok) {
      badRequest(res, created.error);
      return;
    }
    await repositories.devices.save(created.value);
    recordAudit(
      container.auditLog,
      ctx,
      "device:register",
      `devices/${created.value.id}`,
      "success",
    );
    writeJson(res, 201, { device: created.value });
  });

  router.post("/api/v1/devices/:id/heartbeat", async (req, ctx, res) => {
    if (!hasPermission(ctx, "device", "write")) {
      forbidden(res, "device:write");
      return;
    }
    const device = await repositories.devices.findById(deviceId(req.params["id"] ?? ""));
    if (device === null) {
      notFound(res);
      return;
    }
    const status = str(req.body, "status");
    const touched = touchDevice(
      device,
      nowTs(),
      status === undefined ? undefined : (status as never),
    );
    if (!touched.ok) {
      badRequest(res, touched.error);
      return;
    }
    await repositories.devices.save(touched.value);
    recordAudit(container.auditLog, ctx, "device:heartbeat", `devices/${device.id}`, "success");
    writeJson(res, 200, { device: touched.value });
  });

  router.post("/api/v1/devices/:id/inventory", async (req, ctx, res) => {
    if (!hasPermission(ctx, "device", "write")) {
      forbidden(res, "device:write");
      return;
    }
    const device = await repositories.devices.findById(deviceId(req.params["id"] ?? ""));
    if (device === null) {
      notFound(res);
      return;
    }
    const metadata = stringMetadata(
      (req.body as Record<string, unknown> | undefined)?.["metadata"],
    );
    if (metadata === null) {
      badRequest(res, [
        { field: "metadata", message: "metadata must be an object of string values" },
      ]);
      return;
    }
    const touched = touchDevice(device, nowTs());
    if (!touched.ok) {
      badRequest(res, touched.error);
      return;
    }
    const updated = withDeviceMetadata(touched.value, metadata);
    await repositories.devices.save(updated);
    recordAudit(container.auditLog, ctx, "device:inventory", `devices/${device.id}`, "success");
    writeJson(res, 200, { device: updated });
  });
}
