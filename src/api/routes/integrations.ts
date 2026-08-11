/**
 * Cross-system integration API.
 *
 * Inbound:   POST /api/v1/integrations/webhooks/:system
 * Outbound:  POST /api/v1/integrations/events, POST /api/v1/integrations/events/:id/retry
 * Observability: GET /api/v1/integrations/events, GET /api/v1/integrations/contracts
 *
 * Inbound webhooks are authenticated by CEOP API key/JWT (`integration:write`)
 * and, when `CEOP_INTEGRATION_SHARED_SECRET` is set, by the
 * `X-Integration-Token` header and the `X-CEOP-Signature` HMAC-SHA256 over the
 * raw body. Idempotency is enforced per system + key.
 */

import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
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
import { badRequest, forbidden, notFound, nowTs, str } from "./route-helpers.ts";
import type { ApiKeyContext, AppContainer } from "../types.ts";

const PERM_RESOURCE = "integration";

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
  // In production the shared secret is mandatory — fail-closed so webhooks
  // are not silently downgraded to API-key-only auth when the env is missing.
  if (configured === undefined || configured === "") {
    if (process.env["NODE_ENV"] === "production") return false;
    return true; // dev/test: optional
  }
  const header = req.headers["x-integration-token"];
  const token = typeof header === "string" ? header : "";
  if (configured.length !== token.length) return false;
  try {
    return timingSafeEqual(Buffer.from(configured), Buffer.from(token));
  } catch {
    return false;
  }
}

/**
 * Verify the HMAC-SHA256 request signature (`X-CEOP-Signature`) over the raw
 * body. When no shared secret is configured the check is skipped (dev mode);
 * in production the secret must be set and the signature is mandatory.
 */
function signatureValid(
  req: { readonly headers: Readonly<Record<string, string | string[] | undefined>> },
  rawBody: string | undefined,
  fallbackBody: unknown,
): boolean {
  const secret = process.env["CEOP_INTEGRATION_SHARED_SECRET"];
  // In production the shared secret is mandatory — fail-closed so signature
  // verification is not silently skipped when the env is missing.
  if (secret === undefined || secret === "") {
    if (process.env["NODE_ENV"] === "production") return false;
    return true;
  }
  const header = req.headers["x-ceop-signature"];
  if (typeof header !== "string") return false;
  const raw = rawBody ?? (fallbackBody !== undefined ? JSON.stringify(fallbackBody) : "");
  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(header);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
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
    if (!signatureValid(req, req.rawBody, req.body)) {
      writeJson(res, 401, {
        error: "Unauthorized",
        message: "invalid X-CEOP-Signature (HMAC-SHA256)",
      });
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
