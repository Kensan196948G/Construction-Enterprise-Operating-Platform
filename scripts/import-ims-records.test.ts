/** Unit tests for the IMS data import helper. */

import { test } from "node:test";
import assert from "node:assert/strict";
import { importRecords } from "./import-ims-records.ts";
import { createInMemoryRepositories } from "../src/persistence/in-memory/index.ts";

test("importRecords persists valid records and reports invalid ones", async () => {
  const repositories = createInMemoryRepositories();
  const result = await importRecords(
    [
      {
        kind: "asset",
        organizationId: "org-1",
        title: "橋梁A",
        name: "橋梁A",
        assetType: "structure",
      },
      {
        kind: "quality-plan",
        organizationId: "org-1",
        title: "品質計画",
      },
      {
        kind: "nope",
        organizationId: "org-1",
        title: "invalid",
      },
    ],
    repositories,
  );
  assert.equal(result.imported, 1);
  assert.equal(result.errors.length, 2);
  assert.equal((await repositories.isoRecords.findByOrganization("org-1")).length, 1);
});
