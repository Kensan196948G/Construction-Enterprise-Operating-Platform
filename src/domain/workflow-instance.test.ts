import { test } from "node:test";
import assert from "node:assert/strict";

import {
  cancelWorkflowInstance,
  createWorkflowInstance,
  decideWorkflowInstance,
  type WorkflowInstance,
} from "./workflow-instance.ts";

const BASE = {
  id: "wi-1",
  workflowId: "wf-approval-01",
  organizationId: "org-hq",
  subject: "user-requester",
  stepKey: "approve",
  stepName: "承認",
  requestedAt: "2026-08-07T00:00:00.000Z",
};

function pending(): WorkflowInstance {
  const result = createWorkflowInstance(BASE);
  if (!result.ok) throw new Error(JSON.stringify(result.error));
  return result.value;
}

test("workflow-instance: create returns a pending instance", () => {
  const result = createWorkflowInstance(BASE);
  assert.ok(result.ok);
  assert.equal(result.value.status, "pending");
  assert.equal(result.value.stepKey, "approve");
});

test("workflow-instance: create rejects empty required fields", () => {
  const result = createWorkflowInstance({ ...BASE, subject: "" });
  assert.ok(!result.ok);
  assert.ok(result.error.some((e) => e.path === "subject"));
});

test("workflow-instance: approve transitions pending → approved with actor", () => {
  const instance = pending();
  const result = decideWorkflowInstance(instance, {
    decision: "approve",
    decidedBy: "user-approver",
    decidedAt: "2026-08-07T01:00:00.000Z",
    comment: "OK",
  });
  assert.ok(result.ok);
  assert.equal(result.value.status, "approved");
  assert.equal(result.value.decidedBy, "user-approver");
  assert.equal(result.value.comment, "OK");
});

test("workflow-instance: reject transitions pending → rejected", () => {
  const instance = pending();
  const result = decideWorkflowInstance(instance, {
    decision: "reject",
    decidedBy: "user-approver",
    decidedAt: "2026-08-07T01:00:00.000Z",
  });
  assert.ok(result.ok);
  assert.equal(result.value.status, "rejected");
});

test("workflow-instance: decision on a decided instance is rejected", () => {
  const instance = pending();
  const decided = decideWorkflowInstance(instance, {
    decision: "approve",
    decidedBy: "user-approver",
    decidedAt: "2026-08-07T01:00:00.000Z",
  });
  if (!decided.ok) throw new Error("setup failed");
  const second = decideWorkflowInstance(decided.value, {
    decision: "reject",
    decidedBy: "user-approver",
    decidedAt: "2026-08-07T02:00:00.000Z",
  });
  assert.ok(!second.ok);
  assert.ok(second.error.some((e) => e.path === "status"));
});

test("workflow-instance: cancel transitions pending → cancelled", () => {
  const instance = pending();
  const result = cancelWorkflowInstance(instance, "2026-08-07T01:00:00.000Z");
  assert.ok(result.ok);
  assert.equal(result.value.status, "cancelled");
});

test("workflow-instance: cancel on a decided instance is rejected", () => {
  const instance = pending();
  const decided = decideWorkflowInstance(instance, {
    decision: "approve",
    decidedBy: "user-approver",
    decidedAt: "2026-08-07T01:00:00.000Z",
  });
  if (!decided.ok) throw new Error("setup failed");
  const result = cancelWorkflowInstance(decided.value, "2026-08-07T02:00:00.000Z");
  assert.ok(!result.ok);
});
