import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync, rmSync, utimesSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { cleanBackups, isRetentionCandidate, retentionCandidates } from "./backup-retention.ts";

test("backup-retention: candidate matcher protects predeploy and manual test files", () => {
  assert.equal(isRetentionCandidate("ceop-20260807.db"), true);
  assert.equal(isRetentionCandidate("ceop-predeploy-v0.6.2-20260807.db"), false);
  assert.equal(isRetentionCandidate("ceop-crontest-20260807.db"), false);
  assert.equal(isRetentionCandidate("other-20260807.db"), false);
  assert.equal(isRetentionCandidate("ceop-20260807.txt"), false);
});

test("backup-retention: only files older than keep-days are candidates", () => {
  const dir = mkdtempSync(join(tmpdir(), "ceop-retention-"));
  try {
    const now = Date.now();
    const oldPath = join(dir, "ceop-old.db");
    const newPath = join(dir, "ceop-new.db");
    const protectedPath = join(dir, "ceop-predeploy-old.db");
    writeFileSync(oldPath, "x");
    writeFileSync(newPath, "x");
    writeFileSync(protectedPath, "x");

    const oldTime = new Date(now - 20 * 86_400_000);
    utimesSync(oldPath, oldTime, oldTime);
    utimesSync(protectedPath, oldTime, oldTime);

    assert.deepEqual(retentionCandidates(dir, 14, now), [oldPath]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("backup-retention: cleanup always preserves the newest snapshot", () => {
  const dir = mkdtempSync(join(tmpdir(), "ceop-retention-keep-"));
  try {
    const now = Date.now();
    const older = join(dir, "ceop-older.db");
    const newer = join(dir, "ceop-newer.db");
    writeFileSync(older, "x");
    writeFileSync(newer, "x");
    const oldTime = new Date(now - 30 * 86_400_000);
    utimesSync(older, oldTime, oldTime);
    utimesSync(newer, new Date(oldTime.getTime() + 60_000), new Date(oldTime.getTime() + 60_000));

    const { deleted } = cleanBackups(dir, 14, now);
    assert.deepEqual(deleted, [older]);
    assert.ok(readFileSync(newer, "utf-8"), "the newest snapshot must survive");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
