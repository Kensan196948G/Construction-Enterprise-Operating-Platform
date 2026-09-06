// FILE: src/api/csv-import.test.ts
import assert from "node:assert/strict";
import test from "node:test";
import { csvBool, csvNum, csvStr, parseCsv } from "./csv-import.ts";

test("csv-import: basic header + rows", () => {
  const parsed = parseCsv("id,name\r\n1,Alice\r\n2,Bob\r\n");
  assert.deepEqual(parsed.headers, ["id", "name"]);
  assert.deepEqual(parsed.rows, [
    { id: "1", name: "Alice" },
    { id: "2", name: "Bob" },
  ]);
});

test("csv-import: quoted fields with embedded commas, quotes and newlines", () => {
  const parsed = parseCsv('a,b\r\n"1,2","say ""hi"""\r\n"line1\nline2",ok\r\n');
  assert.deepEqual(parsed.rows, [
    { a: "1,2", b: 'say "hi"' },
    { a: "line1\nline2", b: "ok" },
  ]);
});

test("csv-import: bare LF line endings and no trailing newline", () => {
  const parsed = parseCsv("a,b\n1,2\n3,4");
  assert.deepEqual(parsed.rows, [
    { a: "1", b: "2" },
    { a: "3", b: "4" },
  ]);
});

test("csv-import: strips a leading UTF-8 BOM", () => {
  const parsed = parseCsv("﻿a,b\n1,2\n");
  assert.deepEqual(parsed.headers, ["a", "b"]);
  assert.deepEqual(parsed.rows, [{ a: "1", b: "2" }]);
});

test("csv-import: header-only document yields no rows", () => {
  const parsed = parseCsv("a,b\n");
  assert.deepEqual(parsed.headers, ["a", "b"]);
  assert.deepEqual(parsed.rows, []);
});

test("csv-import: empty document yields no headers or rows", () => {
  const parsed = parseCsv("");
  assert.deepEqual(parsed.headers, []);
  assert.deepEqual(parsed.rows, []);
});

test("csv-import: row shorter than header pads missing columns with empty string", () => {
  const parsed = parseCsv("a,b,c\n1,2\n");
  assert.deepEqual(parsed.rows, [{ a: "1", b: "2", c: "" }]);
});

test("csv-import: does not strip a leading apostrophe added by csv export neutralization", () => {
  // Round-tripping our own export is not a goal — a value the caller submits
  // for import is taken literally.
  const parsed = parseCsv("note\n'=SUM(A1:A9)\n");
  assert.equal(parsed.rows[0]?.["note"], "'=SUM(A1:A9)");
});

test("csv-import: field coercion helpers", () => {
  const row = { name: "Alice", age: "42", bad: "abc", active: "true", inactive: "0", blank: "" };
  assert.equal(csvStr(row, "name"), "Alice");
  assert.equal(csvStr(row, "blank"), undefined);
  assert.equal(csvNum(row, "age"), 42);
  assert.ok(Number.isNaN(csvNum(row, "bad")));
  assert.equal(csvNum(row, "blank"), undefined);
  assert.equal(csvBool(row, "active"), true);
  assert.equal(csvBool(row, "inactive"), false);
  assert.equal(csvBool(row, "blank"), undefined);
});
