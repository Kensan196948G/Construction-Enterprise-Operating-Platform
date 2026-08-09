/** Unit tests for the outbound integration dispatcher. */

import { test } from "node:test";
import assert from "node:assert/strict";
import { dispatchPendingEvents } from "./run-integration-dispatcher.ts";
import { createInMemoryRepositories } from "../src/persistence/in-memory/index.ts";
import { createIntegrationEvent, integrationEventId } from "../src/domain/integration.ts";

const NOW = "2026-08-09T06:00:00.000Z" as never;

test("dispatcher sends pending outbound events and persists status", async () => {
  const repositories = createInMemoryRepositories();
  const created = createIntegrationEvent({
    id: "evt-1",
    system: "photo-logger",
    eventType: "photo.captured",
    direction: "outbound",
    idempotencyKey: "photo-1",
    organizationId: "org-1",
    payload: { outboundUrl: "http://127.0.0.1:1/events" },
    createdAt: NOW,
  });
  assert.ok(created.ok);
  await repositories.integrationEvents.save(created.value);

  const received: string[] = [];
  const fetchImpl = (async (url: string | URL | Request) => {
    received.push(String(url));
    return new Response('{"ok":true}', { status: 200 });
  }) as typeof fetch;

  const result = await dispatchPendingEvents(repositories, fetchImpl);
  assert.equal(result.sent, 1);
  assert.equal(result.failed, 0);
  const persisted = await repositories.integrationEvents.findById(integrationEventId("evt-1"));
  assert.equal(persisted?.status, "sent");
});

test("dispatcher leaves no pending events when queue is empty", async () => {
  const repositories = createInMemoryRepositories();
  const result = await dispatchPendingEvents(repositories);
  assert.equal(result.sent, 0);
  assert.equal(result.events.length, 0);
});
