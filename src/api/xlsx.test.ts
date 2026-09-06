// FILE: src/api/xlsx.test.ts
import assert from "node:assert/strict";
import test from "node:test";
import { toXlsx } from "./xlsx.ts";

test("xlsx: produces a valid ZIP/OOXML package starting with the PK signature", () => {
  const buf = toXlsx(["id", "name"], [{ id: "1", name: "テスト" }]);
  assert.deepEqual([...buf.subarray(0, 4)], [0x50, 0x4b, 0x03, 0x04]);
  assert.ok(buf.includes(Buffer.from([0x50, 0x4b, 0x01, 0x02]))); // central directory
  assert.ok(buf.includes(Buffer.from([0x50, 0x4b, 0x05, 0x06]))); // end of central directory
});

test("xlsx: embeds the required OOXML parts", () => {
  const buf = toXlsx(["id"], [{ id: "1" }]);
  const text = buf.toString("utf-8");
  assert.ok(text.includes("[Content_Types].xml"));
  assert.ok(text.includes("xl/workbook.xml"));
  assert.ok(text.includes("xl/worksheets/sheet1.xml"));
  assert.ok(text.includes("<worksheet"));
});

test("xlsx: header row and data rows are written as inline-string or numeric cells", () => {
  const buf = toXlsx(["id", "label", "amount"], [{ id: "1", label: "資材A", amount: "1500" }]);
  const text = buf.toString("utf-8");
  // Header row (row 1): text cells.
  assert.ok(text.includes('<c r="A1" t="inlineStr"><is><t xml:space="preserve">id</t></is></c>'));
  // Data row (row 2): id="1" looks numeric -> <v>, label is text -> inlineStr, amount numeric -> <v>.
  assert.ok(text.includes('<c r="A2"><v>1</v></c>'));
  assert.ok(
    text.includes('<c r="B2" t="inlineStr"><is><t xml:space="preserve">資材A</t></is></c>'),
  );
  assert.ok(text.includes('<c r="C2"><v>1500</v></c>'));
});

test("xlsx: blank values are written as empty cells, not inline strings", () => {
  const buf = toXlsx(["id", "notes"], [{ id: "1", notes: "" }]);
  const text = buf.toString("utf-8");
  assert.ok(text.includes('<c r="B2"/>'));
});

test("xlsx: a formula-like value is stored as literal text, not prefixed", () => {
  // Unlike CSV export, xlsx cells are explicitly typed (t="inlineStr"), so
  // Excel never re-interprets the leading '=' as a formula trigger — no
  // apostrophe-prefixing is applied (and none is needed).
  const buf = toXlsx(["formula"], [{ formula: "=SUM(A1:A9)" }]);
  const text = buf.toString("utf-8");
  assert.ok(
    text.includes('<c r="A2" t="inlineStr"><is><t xml:space="preserve">=SUM(A1:A9)</t></is></c>'),
  );
  assert.ok(!text.includes("'=SUM(A1:A9)"));
});

test("xlsx: XML special characters in text cells are escaped", () => {
  const buf = toXlsx(["note"], [{ note: `a & b < c > d "e" 'f'` }]);
  const text = buf.toString("utf-8");
  assert.ok(text.includes("a &amp; b &lt; c &gt; d &quot;e&quot; &apos;f&apos;"));
});

test("xlsx: missing keys for a header render as blank cells (mirrors toCsv's contract)", () => {
  const buf = toXlsx(["id", "missing"], [{ id: "1" }]);
  const text = buf.toString("utf-8");
  assert.ok(text.includes('<c r="B2"/>'));
});

test("xlsx: multiple rows are laid out on successive row numbers", () => {
  const buf = toXlsx(["id"], [{ id: "1" }, { id: "2" }, { id: "3" }]);
  const text = buf.toString("utf-8");
  assert.ok(text.includes('<row r="1">'));
  assert.ok(text.includes('<row r="2">'));
  assert.ok(text.includes('<row r="3">'));
  assert.ok(text.includes('<row r="4">'));
});
