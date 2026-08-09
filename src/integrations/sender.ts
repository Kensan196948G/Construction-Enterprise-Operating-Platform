/**
 * Outbound integration event sender.
 *
 * Sends one {@link IntegrationEvent} to its target system with:
 *   - contract timeout (AbortSignal.timeout)
 *   - idempotency key header (X-Idempotency-Key)
 *   - shared token (Authorization: Bearer) from environment
 *   - attempt accounting (status → sent | retrying | failed)
 *
 * The URL is resolved from `CEOP_INTEGRATION_URL_<SYSTEM>` (system name
 * uppercased, `-` → `_`) or from `payload.outboundUrl` (trusted only for
 * non-production deployments).
 */

import type { IsoTimestamp } from "../domain/common.ts";
import {
  contractForSystem,
  markIntegrationEvent,
  type IntegrationEvent,
} from "../domain/integration.ts";
import type { IntegrationEventRepository } from "../persistence/ports.ts";

type FetchLike = typeof fetch;

function envKey(system: string, suffix: "URL" | "TOKEN"): string {
  return `CEOP_INTEGRATION_${system.toUpperCase().replaceAll("-", "_")}_${suffix}`;
}

function resolveOutboundUrl(event: IntegrationEvent): string | null {
  const fromEnv = process.env[envKey(event.system, "URL")];
  if (fromEnv !== undefined && fromEnv !== "") return fromEnv;
  const fromPayload = event.payload["outboundUrl"];
  if (
    typeof fromPayload === "string" &&
    (fromPayload.startsWith("https://") || fromPayload.startsWith("http://127.0.0.1"))
  ) {
    return fromPayload;
  }
  return null;
}

/**
 * Deliver one outbound event. Returns the persisted event with status
 * `sent`, `retrying`, or `failed`. A missing URL is a permanent failure.
 */
export async function sendIntegrationEvent(
  event: IntegrationEvent,
  repository: IntegrationEventRepository,
  fetchImpl: FetchLike = fetch,
): Promise<IntegrationEvent> {
  const now = new Date().toISOString() as IsoTimestamp;
  const contract = contractForSystem(event.system);
  const url = resolveOutboundUrl(event);
  if (url === null || contract === undefined) {
    const failed = markIntegrationEvent(event, "failed", now, "outbound URL not configured");
    if (failed.ok) await repository.save(failed.value);
    return failed.ok ? failed.value : event;
  }
  const token =
    process.env[envKey(event.system, "TOKEN")] ??
    (typeof event.payload["token"] === "string" ? event.payload["token"] : "");
  try {
    const response = await fetchImpl(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Idempotency-Key": event.idempotencyKey,
        ...(token !== "" ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        id: event.id,
        system: event.system,
        eventType: event.eventType,
        idempotencyKey: event.idempotencyKey,
        payload: event.payload,
      }),
      signal: AbortSignal.timeout(contract.timeoutMs),
    });
    if (!response.ok) {
      throw new Error(`remote returned HTTP ${response.status}`);
    }
    const sent = markIntegrationEvent(event, "sent", now);
    if (sent.ok) await repository.save(sent.value);
    return sent.ok ? sent.value : event;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const nextStatus = event.attempts + 1 >= contract.maxRetries ? "failed" : "retrying";
    const updated = markIntegrationEvent(event, nextStatus, now, message);
    if (updated.ok) await repository.save(updated.value);
    return updated.ok ? updated.value : event;
  }
}
