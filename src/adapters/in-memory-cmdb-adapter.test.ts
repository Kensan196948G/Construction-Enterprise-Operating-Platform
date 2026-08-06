import { test } from "node:test";
import assert from "node:assert/strict";

import { InMemoryCmdbAdapter } from "./in-memory-cmdb-adapter.ts";
import { type ConfigurationItem } from "./ports.ts";

test("listItems returns all pre-loaded items when no type filter is given", async () => {
  const adapter = new InMemoryCmdbAdapter();
  const items = await adapter.listItems();
  assert.ok(items.length >= 10, `expected at least 10 seed items, got ${items.length}`);
});

test("listItems filters by type correctly", async () => {
  const adapter = new InMemoryCmdbAdapter();
  const servers = await adapter.listItems("server");
  assert.ok(servers.length >= 2, `expected at least 2 server items, got ${servers.length}`);
  for (const item of servers) {
    assert.equal(item.type, "server");
  }
});

test("listItems returns empty array for unknown type", async () => {
  const adapter = new InMemoryCmdbAdapter();
  const result = await adapter.listItems("unknown-type");
  assert.deepEqual(result, []);
});

test("getItem returns the correct item by id", async () => {
  const adapter = new InMemoryCmdbAdapter();
  const item = await adapter.getItem("ci-001");
  assert.ok(item !== null, "expected ci-001 to exist");
  assert.equal(item.id, "ci-001");
  assert.equal(item.type, "server");
  assert.equal(item.name, "Field Management Server");
});

test("getItem returns null for non-existent id", async () => {
  const adapter = new InMemoryCmdbAdapter();
  const item = await adapter.getItem("does-not-exist");
  assert.equal(item, null);
});

test("addItem makes item retrievable", async () => {
  const adapter = new InMemoryCmdbAdapter();
  const newItem: ConfigurationItem = {
    id: "ci-999",
    type: "tablet",
    name: "Test Tablet",
    attributes: { status: "active", location: "Test Site" },
  };
  adapter.addItem(newItem);

  const retrieved = await adapter.getItem("ci-999");
  assert.deepEqual(retrieved, newItem);
});

test("addItem replaces an existing item with the same id", async () => {
  const adapter = new InMemoryCmdbAdapter();
  const updated: ConfigurationItem = {
    id: "ci-001",
    type: "server",
    name: "Updated Server",
    attributes: { status: "maintenance" },
  };
  adapter.addItem(updated);

  const item = await adapter.getItem("ci-001");
  assert.ok(item !== null);
  assert.equal(item.name, "Updated Server");
});

test("pre-loaded items include sensors, tablets, and applications", async () => {
  const adapter = new InMemoryCmdbAdapter();

  const [sensors, tablets, apps] = await Promise.all([
    adapter.listItems("sensor"),
    adapter.listItems("tablet"),
    adapter.listItems("application"),
  ]);

  assert.ok(sensors.length >= 1, "expected at least 1 sensor");
  assert.ok(tablets.length >= 1, "expected at least 1 tablet");
  assert.ok(apps.length >= 1, "expected at least 1 application");
});
