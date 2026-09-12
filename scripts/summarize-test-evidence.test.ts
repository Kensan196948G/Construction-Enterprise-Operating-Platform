import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveEvidencePaths, summarizeEvidence } from "./summarize-test-evidence.ts";

test("summarizeEvidence requires evidence and reports failures", () => {
  const empty = summarizeEvidence("empty", "");
  assert.ok(empty.ok);
  assert.equal(empty.value.releaseReady, false);
  const result = summarizeEvidence(
    "fixture",
    [
      JSON.stringify({
        requirementId: "REQ-1",
        testId: "TEST-1",
        testDataVersion: "1.0.0",
        result: "pass",
      }),
      JSON.stringify({
        requirementId: "REQ-2",
        testId: "TEST-2",
        testDataVersion: "1.0.0",
        result: "fail",
      }),
    ].join("\n"),
  );
  assert.ok(result.ok);
  assert.equal(result.value.total, 2);
  assert.equal(result.value.passed, 1);
  assert.equal(result.value.failed, 1);
  assert.equal(result.value.releaseReady, false);
});

test("resolveEvidencePaths ignores pnpm's argument separator", () => {
  assert.deepEqual(resolveEvidencePaths(["--", "input.jsonl", "summary.json"]), {
    source: "input.jsonl",
    destination: "summary.json",
  });
});

test("summarizeEvidence returns errors for malformed or duplicate evidence", () => {
  assert.ok(!summarizeEvidence("fixture", "{").ok);
  const record = JSON.stringify({
    requirementId: "REQ-1",
    testId: "TEST-1",
    testDataVersion: "1.0.0",
    result: "pass",
  });
  const duplicate = summarizeEvidence("fixture", `${record}\n${record}`);
  assert.ok(!duplicate.ok);
  assert.match(duplicate.error, /duplicate evidence testId/);
});
