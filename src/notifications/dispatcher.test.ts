/** Integration tests for the notification dispatcher (S-09/E-11). */

import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer as httpCreateServer } from "node:http";
import type { AddressInfo } from "node:net";

import { createInMemoryRepositories } from "../persistence/in-memory/index.ts";
import { createNotificationDelivery } from "../domain/notification.ts";
import { dispatchPendingDeliveries } from "./dispatcher.ts";

const NOW = "2026-08-07T06:00:00.000Z";

function seed(repositories: ReturnType<typeof createInMemoryRepositories>, channel: string) {
  const delivery = createNotificationDelivery({
    id: `notification-test-${channel}`,
    organizationId: "org-hq",
    userId: "user-1",
    eventKey: "test.event",
    channel: channel as never,
    subject: "test",
    createdAt: NOW as never,
  });
  assert.ok(delivery.ok);
  return repositories.notificationDeliveries.save(delivery.value);
}

test("dispatcher sends webhook deliveries and marks them sent", async (t) => {
  let received: unknown = null;
  const upstream = httpCreateServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => chunks.push(c));
    req.on("end", () => {
      received = JSON.parse(Buffer.concat(chunks).toString("utf-8"));
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end("{}");
    });
  });
  await new Promise<void>((resolve) => upstream.listen(0, "127.0.0.1", resolve));
  const { port } = upstream.address() as AddressInfo;
  t.after(() => new Promise<void>((resolve) => upstream.close(() => resolve())));

  const repositories = createInMemoryRepositories();
  await seed(repositories, "webhook");
  const result = await dispatchPendingDeliveries(repositories, {
    webhookUrl: `http://127.0.0.1:${port}/hooks`,
  });
  assert.deepEqual(result, { attempted: 1, sent: 1, failed: 0 });
  assert.ok(received !== null);
  const all = await repositories.notificationDeliveries.findAll();
  const delivered = all[0];
  assert.ok(delivered);
  assert.equal(delivered.status, "sent");
  assert.ok(delivered.sentAt);
  assert.equal(delivered.attempts, 1);
});

test("dispatcher marks unconfigured and failing channels as failed", async (t) => {
  const upstream = httpCreateServer((_req, res) => {
    res.writeHead(500);
    res.end();
  });
  await new Promise<void>((resolve) => upstream.listen(0, "127.0.0.1", resolve));
  const { port } = upstream.address() as AddressInfo;
  t.after(() => new Promise<void>((resolve) => upstream.close(() => resolve())));

  const repositories = createInMemoryRepositories();
  await seed(repositories, "email");
  await seed(repositories, "slack");
  const result = await dispatchPendingDeliveries(repositories, {
    slackWebhookUrl: `http://127.0.0.1:${port}/bad`,
  });
  assert.equal(result.attempted, 2);
  assert.equal(result.sent, 0);
  assert.equal(result.failed, 2);
  const all = await repositories.notificationDeliveries.findAll();
  const email = all.find((d) => d.channel === "email");
  const slack = all.find((d) => d.channel === "slack");
  assert.equal(email?.failureKind, "not-configured");
  assert.equal(slack?.failureKind, "transient");
  assert.equal(slack?.attempts, 1);
});
