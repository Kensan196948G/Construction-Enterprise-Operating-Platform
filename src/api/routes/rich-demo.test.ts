/** Integration tests for the rich demo flag wired through the app container. */

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApp } from "../../app.ts";

test("CEOP_SEED_RICH_DEMO seeds the full dataset through createApp", async () => {
  const previous = process.env["CEOP_SEED_RICH_DEMO"];
  process.env["CEOP_SEED_RICH_DEMO"] = "true";
  try {
    const app = await createApp();
    assert.equal(app.storageTier, "in-memory");
    assert.ok((await app.repositories.projects.findAll()).length >= 5);
    assert.ok((await app.repositories.dailyReports.findAll()).length >= 6);
    assert.ok((await app.repositories.isoRecords.findAll()).length >= 33);
    assert.ok((await app.repositories.contracts.findAll()).length >= 6);
    assert.ok((await app.repositories.workflowInstances.findAll()).length >= 4);
    assert.ok((await app.repositories.integrationEvents.findAll()).length >= 6);
    assert.ok(app.auditLog.size >= 10, "audit trail seeded");
    assert.equal(app.auditLog.verify().valid, true);
  } finally {
    if (previous === undefined) {
      delete process.env["CEOP_SEED_RICH_DEMO"];
    } else {
      process.env["CEOP_SEED_RICH_DEMO"] = previous;
    }
  }
});

test("CEOP_SEED_RICH_DEMO is refused in production", async () => {
  const previousNodeEnv = process.env["NODE_ENV"];
  const previousFlag = process.env["CEOP_SEED_RICH_DEMO"];
  const previousSqlite = process.env["CEOP_SQLITE_FILE"];
  const previousJwt = process.env["CEOP_JWT_SECRET"];
  const tempDir = mkdtempSync(join(tmpdir(), "ceop-rich-demo-test-"));
  process.env["NODE_ENV"] = "production";
  process.env["CEOP_SEED_RICH_DEMO"] = "true";
  process.env["CEOP_SQLITE_FILE"] = join(tempDir, "ceop.db");
  process.env["CEOP_JWT_SECRET"] = "a".repeat(64);
  try {
    await assert.rejects(() => createApp(), /CEOP_SEED_RICH_DEMO must not be set in production/);
  } finally {
    if (previousNodeEnv === undefined) {
      delete process.env["NODE_ENV"];
    } else {
      process.env["NODE_ENV"] = previousNodeEnv;
    }
    if (previousFlag === undefined) {
      delete process.env["CEOP_SEED_RICH_DEMO"];
    } else {
      process.env["CEOP_SEED_RICH_DEMO"] = previousFlag;
    }
    if (previousSqlite === undefined) {
      delete process.env["CEOP_SQLITE_FILE"];
    } else {
      process.env["CEOP_SQLITE_FILE"] = previousSqlite;
    }
    if (previousJwt === undefined) {
      delete process.env["CEOP_JWT_SECRET"];
    } else {
      process.env["CEOP_JWT_SECRET"] = previousJwt;
    }
    rmSync(tempDir, { recursive: true, force: true });
  }
});
