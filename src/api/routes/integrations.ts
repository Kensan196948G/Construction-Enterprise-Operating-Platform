/**
 * Cross-system integration API.
 *
 * Inbound:   POST /api/v1/integrations/webhooks/:system
 * Outbound:  POST /api/v1/integrations/events, POST /api/v1/integrations/events/:id/retry
 * Observability: GET /api/v1/integrations/events, GET /api/v1/integrations/contracts
 *
 * Inbound webhooks are authenticated by CEOP API key/JWT (`integration:write`)
 * and, when `CEOP_INTEGRATION_SHARED_SECRET` is set, by the
 * `X-Integration-Token` header. Idempotency is enforced per system + key.
 */

import { randomUUID, timingSafeEqual } from "node:crypto";
import type { ServerResponse } from "node:http";
import type { IsoTimestamp } from "../../domain/common.ts";
import {
  INTEGRATION_CONTRACTS,
  contractForSystem,
  createIntegrationEvent,
  integrationEventId,
  integrationSystem,
  type IntegrationEvent,
} from "../../domain/integration.ts";
import { sendIntegrationEvent } from "../../integrations/sender.ts";
import { recordAudit } from "../audit.ts";
import { parsePagination, paginate } from "../pagination.ts";
import type { Router } from "../router.ts";
import { writeJson } from "../router.ts";
import { hasPermission } from "./governance.ts";
import type { ApiKeyContext, AppContainer } from "../types.ts";

const PERM_RESOURCE = "integration";

function str(body: unknown, key: string): string | undefined {
  if (typeof body !== "object" || body === null) return undefined;
  const value = (body as Record<string, unknown>)[key];
  return typeof value === "string" ? value : undefined;
}

function nowTs(): IsoTimestamp {
  return new Date().toISOString() as IsoTimestamp;
}

function forbidden(res: ServerResponse, perm: string): void {
  writeJson(res, 403, { error: "Forbidden", message: `requires '${perm}' permission` });
}

function badRequest(res: ServerResponse, details: unknown): void {
  writeJson(res, 400, { error: "Bad Request", message: "validation failed", details });
}

function notFound(res: ServerResponse, resource: string): void {
  writeJson(res, 404, { error: "Not Found", message: `${resource} not found` });
}

function audit(
  container: AppContainer,
  ctx: ApiKeyContext | null,
  action: string,
  resource: string,
  metadata: Record<string, string> = {},
): void {
  recordAudit(container.auditLog, ctx, action, resource, "success", metadata);
}

function sharedSecretValid(req: {
  readonly headers: Readonly<Record<string, string | string[] | undefined>>;
}): boolean {
  const configured = process.env["CEOP_INTEGRATION_SHARED_SECRET"];
  if (configured === undefined || configured === "") return true; // optional in dev
  const header = req.headers["x-integration-token"];
  const token = typeof header === "string" ? header : "";
  if (configured.length !== token.length) return false;
  try {
    return timingSafeEqual(Buffer.from(configured), Buffer.from(token));
  } catch {
    return false;
  }
}

function scopedEvents(
  container: AppContainer,
  ctx: ApiKeyContext | null,
): Promise<readonly IntegrationEvent[]> {
  return container.repositories.integrationEvents.findAll().then((events) => {
    if (ctx?.organizationId === undefined) return events;
    return events.filter((event) => event.organizationId === ctx.organizationId);
  });
}

export function registerIntegrationRoutes(router: Router, container: AppContainer): void {
  router.post("/api/v1/integrations/webhooks/:system", async (req, ctx, res) => {
    if (!hasPermission(ctx, PERM_RESOURCE, "write")) {
      forbidden(res, "integration:write");
      return;
    }
    if (!sharedSecretValid(req)) {
      writeJson(res, 401, { error: "Unauthorized", message: "invalid integration token" });
      return;
    }
    const system = integrationSystem(req.params["system"] ?? "");
    if (system === null) {
      badRequest(res, [{ field: "system", message: "unknown integration system" }]);
      return;
    }
    const idempotencyKey = str(req.body, "idempotencyKey");
    if (idempotencyKey === undefined || idempotencyKey === "") {
      badRequest(res, [{ field: "idempotencyKey", message: "idempotencyKey is required" }]);
      return;
    }
    const existing = await container.repositories.integrationEvents.findByIdempotencyKey(
      system,
      idempotencyKey,
    );
    if (existing !== null) {
      writeJson(res, 200, { event: existing, duplicated: true });
      return;
    }
    const eventType = str(req.body, "eventType") ?? "unknown";
    const contract = contractForSystem(system);
    if (contract !== undefined && !contract.eventTypes.includes(eventType)) {
      badRequest(res, [
        {
          field: "eventType",
          message: `eventType must be one of: ${contract.eventTypes.join(", ")}`,
        },
      ]);
      return;
    }
    const created = createIntegrationEvent({
      id: `evt-${randomUUID()}`,
      system,
      eventType,
      direction: "inbound",
      idempotencyKey,
      ...(ctx?.organizationId !== undefined ? { organizationId: ctx.organizationId } : {}),
      payload:
        typeof req.body === "object" && req.body !== null
          ? (req.body as Record<string, unknown>)
          : {},
      createdAt: nowTs(),
    });
    if (!created.ok) {
      badRequest(res, created.error);
      return;
    }
    await container.repositories.integrationEvents.save(created.value);
    audit(container, ctx, "integration.receive", `integration:${system}`, {
      eventId: created.value.id,
      eventType,
    });
    writeJson(res, 202, { event: created.value });
  });

  router.get("/api/v1/integrations/events", async (req, ctx, res) => {
    if (!hasPermission(ctx, PERM_RESOURCE, "read")) {
      forbidden(res, "integration:read");
      return;
    }
    let events = await scopedEvents(container, ctx);
    const system = req.query["system"];
    const direction = req.query["direction"];
    const status = req.query["status"];
    if (system !== undefined) events = events.filter((e) => e.system === system);
    if (direction !== undefined) events = events.filter((e) => e.direction === direction);
    if (status !== undefined) events = events.filter((e) => e.status === status);
    const page = paginate(events, parsePagination(req.query));
    writeJson(res, 200, {
      events: page.items,
      count: page.count,
      total: page.total,
      limit: page.limit,
      offset: page.offset,
    });
  });

  router.post("/api/v1/integrations/events", async (req, ctx, res) => {
    if (!hasPermission(ctx, PERM_RESOURCE, "write")) {
      forbidden(res, "integration:write");
      return;
    }
    const system = integrationSystem(str(req.body, "system") ?? "");
    if (system === null) {
      badRequest(res, [{ field: "system", message: "unknown integration system" }]);
      return;
    }
    const idempotencyKey = str(req.body, "idempotencyKey") ?? `out-${randomUUID()}`;
    const existing = await container.repositories.integrationEvents.findByIdempotencyKey(
      system,
      idempotencyKey,
    );
    if (existing !== null) {
      writeJson(res, 200, { event: existing, duplicated: true });
      return;
    }
    const eventType = str(req.body, "eventType") ?? "custom";
    const contract = contractForSystem(system);
    if (contract !== undefined && !contract.eventTypes.includes(eventType)) {
      badRequest(res, [
        {
          field: "eventType",
          message: `eventType must be one of: ${contract.eventTypes.join(", ")}`,
        },
      ]);
      return;
    }
    const payload =
      typeof req.body === "object" && req.body !== null
        ? (req.body as Record<string, unknown>)
        : {};
    const created = createIntegrationEvent({
      id: `evt-${randomUUID()}`,
      system,
      eventType,
      direction: "outbound",
      idempotencyKey,
      ...(ctx?.organizationId !== undefined ? { organizationId: ctx.organizationId } : {}),
      payload,
      createdAt: nowTs(),
    });
    if (!created.ok) {
      badRequest(res, created.error);
      return;
    }
    await container.repositories.integrationEvents.save(created.value);
    audit(container, ctx, "integration.queue", `integration:${system}`, {
      eventId: created.value.id,
      eventType,
    });
    writeJson(res, 201, { event: created.value });
  });

  router.post("/api/v1/integrations/events/:id/retry", async (req, ctx, res) => {
    if (!hasPermission(ctx, PERM_RESOURCE, "write")) {
      forbidden(res, "integration:write");
      return;
    }
    const event = await container.repositories.integrationEvents.findById(
      integrationEventId(req.params["id"] ?? ""),
    );
    if (event === null) {
      notFound(res, "integration event");
      return;
    }
    if (ctx?.organizationId !== undefined && event.organizationId !== ctx.organizationId) {
      notFound(res, "integration event");
      return;
    }
    const updated = await sendIntegrationEvent(event, container.repositories.integrationEvents);
    audit(container, ctx, "integration.retry", `integration:${event.system}`, {
      eventId: event.id,
    });
    writeJson(res, 200, { event: updated });
  });

  router.get("/api/v1/integrations/contracts", async (_req, ctx, res) => {
    if (!hasPermission(ctx, PERM_RESOURCE, "read")) {
      forbidden(res, "integration:read");
      return;
    }
    writeJson(res, 200, { contracts: INTEGRATION_CONTRACTS });
  });
}
