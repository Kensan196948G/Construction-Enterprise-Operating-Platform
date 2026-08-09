/** SQLite round-trip tests for ISO + integration event repositories. */

import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import assert from "node:assert/strict";

import { applyMigrations } from "../../../scripts/migrate.ts";
import { createIsoRecord, isoRecordId } from "../../domain/iso.ts";
import { createIntegrationEvent, integrationEventId } from "../../domain/integration.ts";
import { SqliteIsoRecordRepository, SqliteIntegrationEventRepository } from "./iso-repositories.ts";

const NOW = "2026-08-09T06:00:00.000Z" as never;

function openDb(): { db: DatabaseSync; dir: string } {
  const dir = mkdtempSync(join(tmpdir(), "ceop-iso-sqlite-"));
  const db = new DatabaseSync(join(dir, "ceop.db"));
  db.exec("PRAGMA journal_mode=WAL");
  db.exec("PRAGMA foreign_keys=ON");
  applyMigrations(db);
  return { db, dir };
}

test("iso record repository round-trips with org/kind/project filters", async () => {
  const { db, dir } = openDb();
  try {
    const repo = new SqliteIsoRecordRepository(db);
    const created = createIsoRecord({
      id: "iso-1",
      kind: "quality-plan",
      organizationId: "org-1",
      projectId: "p-1",
      title: "品質計画",
      payload: { planNo: "QP-1" },
      createdBy: "u-1",
      createdAt: NOW,
    });
    assert.ok(created.ok);
    await repo.save(created.value);

    assert.equal((await repo.findById(isoRecordId("iso-1")))?.title, "品質計画");
    assert.equal((await repo.findByOrganization("org-1")).length, 1);
    assert.equal((await repo.findByKind("quality-plan")).length, 1);
    assert.equal((await repo.findByProject("p-1")).length, 1);
    assert.equal((await repo.findByStatus("draft")).length, 1);
  } finally {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("integration event repository enforces idempotency key lookup", async () => {
  const { db, dir } = openDb();
  try {
    const repo = new SqliteIntegrationEventRepository(db);
    const created = createIntegrationEvent({
      id: "evt-1",
      system: "dx-idea",
      eventType: "idea.submitted",
      direction: "inbound",
      idempotencyKey: "k-1",
      organizationId: "org-1",
      payload: { ideaId: "i-1" },
      createdAt: NOW,
    });
    assert.ok(created.ok);
    await repo.save(created.value);

    assert.equal((await repo.findById(integrationEventId("evt-1")))?.id, "evt-1");
    assert.equal((await repo.findBySystem("dx-idea")).length, 1);
    assert.equal((await repo.findByDirection("inbound")).length, 1);
  } finally {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
