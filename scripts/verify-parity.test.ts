/** Unit tests for the P5 parity inventory parser. */

import { test } from "node:test";
import assert from "node:assert/strict";
import { findMissingCoreDomains, parseInventory } from "./verify-parity.ts";

const SAMPLE = `
| #    | 機能        | 内容   | CEOP 対応              | 状態 |
| ---- | ----------- | ------ | ---------------------- | ---- |
| S-01 | 案件        | x      | 📦 project ドメイン    | ✅   |
| S-02 | 日報        | x      | 📦 daily-report ドメイン | ⬜  |
| E-10 | ロボティクス | x      | ⬜ 対象外（外部連携）   | ⬜   |
`;

test("parseInventory extracts table rows", () => {
  const rows = parseInventory(SAMPLE);
  assert.equal(rows.length, 3);
  assert.deepEqual(rows[0]?.id, "S-01");
});

test("findMissingCoreDomains flags only planned-but-unimplemented domains", () => {
  const rows = parseInventory(SAMPLE);
  const missing = findMissingCoreDomains(rows);
  assert.equal(missing.length, 1);
  assert.equal(missing[0]?.id, "S-02");
});
