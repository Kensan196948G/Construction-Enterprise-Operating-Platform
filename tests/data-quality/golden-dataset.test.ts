import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

interface GoldenDataset {
  readonly datasetId: string;
  readonly version: string;
  readonly source: string;
  readonly asOf: string;
  readonly validUntil: string;
  readonly toleranceSpec: string;
  readonly purchaseOrders: readonly Record<string, unknown>[];
  readonly laborCosts: readonly Record<string, unknown>[];
}

const dataset = JSON.parse(
  readFileSync(
    new URL("../../testdata/golden/construction-costs.v1.json", import.meta.url),
    "utf8",
  ),
) as GoldenDataset;

test("QA-DATA-001: golden dataset has traceable source, version and freshness", () => {
  assert.match(dataset.datasetId, /^[a-z][a-z0-9-]+$/);
  assert.match(dataset.version, /^\d+\.\d+\.\d+$/);
  assert.ok(dataset.source.trim().length > 0);
  assert.match(dataset.asOf, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(dataset.validUntil, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(Date.parse(dataset.validUntil) >= Date.parse(dataset.asOf));
  assert.equal(dataset.toleranceSpec, "QA-TOL-001");
});

test("QA-DATA-002: golden cases have unique IDs, finite ranges and explicit tolerance", () => {
  const all = [...dataset.purchaseOrders, ...dataset.laborCosts];
  const ids = all.map((fixture) => fixture["id"]);
  assert.equal(new Set(ids).size, ids.length, "fixture IDs must be unique across the dataset");
  for (const fixture of all) {
    assert.equal(typeof fixture["id"], "string");
    assert.equal(typeof fixture["expectedAmount"], "number");
    assert.ok(Number.isFinite(fixture["expectedAmount"]));
    assert.equal(typeof fixture["tolerance"], "number");
    assert.ok(Number.isFinite(fixture["tolerance"]));
    assert.ok((fixture["tolerance"] as number) >= 0);
  }
});

test("QA-DATA-003: data version date is not stale at the current release date", () => {
  const releaseDate = Date.parse("2026-09-12");
  assert.ok(Date.parse(dataset.asOf) <= releaseDate);
  assert.ok(Date.parse(dataset.validUntil) >= releaseDate);
});
