// FILE: src/api/csv.test.ts
import assert from "node:assert/strict";
import test from "node:test";
import { escapeCsvField, neutralizeFormula, toCsv } from "./csv.ts";

test("csv: plain values pass through unquoted", () => {
  assert.equal(escapeCsvField("user-42"), "user-42");
  assert.equal(escapeCsvField("2026-08-07T00:00:00.000Z"), "2026-08-07T00:00:00.000Z");
  assert.equal(escapeCsvField(""), "");
});

test("csv: RFC 4180 quoting for delimiters, quotes and newlines", () => {
  assert.equal(escapeCsvField("a,b"), '"a,b"');
  assert.equal(escapeCsvField('say "hi"'), '"say ""hi"""');
  assert.equal(escapeCsvField("line1\nline2"), '"line1\nline2"');
});

test("csv: every formula trigger is neutralized", () => {
  // Each of these opens a formula in Excel / LibreOffice / Google Sheets.
  for (const trigger of ["=", "+", "-", "@", "\t", "\r"]) {
    const payload = `${trigger}cmd|'/c calc'!A1`;
    assert.equal(
      neutralizeFormula(payload),
      `'${payload}`,
      `leading ${JSON.stringify(trigger)} must be neutralized`,
    );
  }
});

test("csv: neutralization preserves the original value after the marker", () => {
  // The export is evidence: it must not silently rewrite what was recorded.
  const recorded = "=SUM(A1:A9)";
  assert.equal(neutralizeFormula(recorded).slice(1), recorded);
});

test("csv: a formula containing a delimiter gets both escapes", () => {
  // Prefixing alone would break the record; quoting alone would leave a live
  // formula. Both must apply, in that order.
  assert.equal(escapeCsvField('=HYPERLINK("http://x","y")'), `"'=HYPERLINK(""http://x"",""y"")"`);
});

test("csv: interior triggers are left alone", () => {
  // Only the leading character starts a formula; rewriting the interior would
  // corrupt legitimate values such as ISO durations or negative deltas.
  assert.equal(escapeCsvField("a=b"), "a=b");
  assert.equal(escapeCsvField("id-with-dash"), "id-with-dash");
});

test("csv: toCsv emits a header row and CRLF-terminated records", () => {
  const csv = toCsv(
    ["at", "actor"],
    [
      { at: "2026-08-07T00:00:00.000Z", actor: "svc-a" },
      { at: "2026-08-07T00:00:01.000Z", actor: "svc-b" },
    ],
  );
  assert.equal(
    csv,
    "at,actor\r\n2026-08-07T00:00:00.000Z,svc-a\r\n2026-08-07T00:00:01.000Z,svc-b\r\n",
  );
});

test("csv: a missing key yields an empty cell, never a shifted record", () => {
  // Column count must stay constant or downstream parsers silently misalign.
  const csv = toCsv(["a", "b", "c"], [{ a: "1", c: "3" }]);
  assert.equal(csv, "a,b,c\r\n1,,3\r\n");
});

test("csv: header names are escaped too", () => {
  assert.equal(toCsv(["=evil", "ok"], []), "'=evil,ok\r\n");
});
