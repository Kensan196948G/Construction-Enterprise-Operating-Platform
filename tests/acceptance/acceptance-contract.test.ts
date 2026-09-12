import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { type AcceptanceChecklist, validateAcceptance } from "../../scripts/validate-acceptance.ts";

const checklist = JSON.parse(
  readFileSync(
    new URL("../../testdata/acceptance/release-checklist.v1.json", import.meta.url),
    "utf8",
  ),
) as AcceptanceChecklist;

test("QA-HA-001: release acceptance rejects missing human evidence", () => {
  assert.ok(validateAcceptance(checklist, {}).length > 0);
});

test("QA-HA-002: release acceptance accepts complete human attestation", () => {
  assert.deepEqual(
    validateAcceptance(checklist, {
      status: "approved",
      approver: "qualified-reviewer",
      evidenceRef: "acceptance-session-2026-09-12",
    }),
    [],
  );
});
