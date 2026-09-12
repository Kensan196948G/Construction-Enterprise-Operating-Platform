import assert from "node:assert/strict";
import { test } from "node:test";
import { type AcceptanceChecklist, validateAcceptance } from "./validate-acceptance.ts";

const checklist: AcceptanceChecklist = {
  version: "1.0.0",
  requirements: [{ id: "HA-001", label: "usable" }],
};

test("validateAcceptance fails closed without explicit attestation", () => {
  assert.ok(validateAcceptance(checklist, {}).length > 0);
});

test("validateAcceptance accepts a complete attestation", () => {
  assert.deepEqual(
    validateAcceptance(checklist, {
      status: "approved",
      approver: "reviewer",
      evidenceRef: "session-1",
    }),
    [],
  );
});
