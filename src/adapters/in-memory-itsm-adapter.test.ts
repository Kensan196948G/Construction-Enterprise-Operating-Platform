import { test } from "node:test";
import assert from "node:assert/strict";

import { InMemoryItsmAdapter } from "./in-memory-itsm-adapter.ts";

test("pre-loaded incidents are accessible by id", async () => {
  const adapter = new InMemoryItsmAdapter();

  const inc = await adapter.getIncident("inc-001");
  assert.ok(inc !== null, "expected inc-001 to exist");
  assert.equal(inc.id, "inc-001");
  assert.equal(inc.severity, "medium");
  assert.equal(inc.status, "investigating");
});

test("getIncident returns null for unknown id", async () => {
  const adapter = new InMemoryItsmAdapter();
  const result = await adapter.getIncident("does-not-exist");
  assert.equal(result, null);
});

test("createIncident assigns a UUID and sets status to open", async () => {
  const adapter = new InMemoryItsmAdapter();
  const created = await adapter.createIncident({
    title: "Test incident",
    severity: "high",
  });

  assert.match(
    created.id,
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    "id should be a UUID",
  );
  assert.equal(created.status, "open");
  assert.equal(created.title, "Test incident");
  assert.equal(created.severity, "high");
});

test("created incident is retrievable via getIncident", async () => {
  const adapter = new InMemoryItsmAdapter();
  const created = await adapter.createIncident({
    title: "Retrievable incident",
    severity: "low",
  });

  const fetched = await adapter.getIncident(created.id);
  assert.deepEqual(fetched, created);
});

test("each createIncident call produces a unique id", async () => {
  const adapter = new InMemoryItsmAdapter();
  const [a, b] = await Promise.all([
    adapter.createIncident({ title: "A", severity: "low" }),
    adapter.createIncident({ title: "B", severity: "low" }),
  ]);
  assert.notEqual(a.id, b.id);
});

test("size reflects seed plus created incidents", async () => {
  const adapter = new InMemoryItsmAdapter();
  const seedSize = adapter.size; // 2 from SEED_INCIDENTS
  await adapter.createIncident({ title: "Extra", severity: "critical" });
  assert.equal(adapter.size, seedSize + 1);
});
