import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  createAiAction,
  decideAiAction,
  setAiOperationStatus,
} from "../../src/domain/ai-action.ts";
import { recordEvidence } from "../helpers/evidence.ts";

interface EvalDataset {
  readonly version: string;
  readonly cases: readonly {
    readonly id: string;
    readonly evidenceRefs: readonly string[];
    readonly wrongAnswerMitigation: string | null;
    readonly operationStatus: "operational" | "stopped";
    readonly expectedApproved: boolean;
  }[];
}

const dataset = JSON.parse(
  readFileSync(new URL("../../testdata/regression/ai-approval.v1.json", import.meta.url), "utf8"),
) as EvalDataset;
const NOW = "2026-09-12T00:00:00.000Z";

for (const fixture of dataset.cases) {
  test(`QA-AI-${fixture.id}: independent rules gate AI approval`, () => {
    const created = createAiAction({
      id: fixture.id,
      requester: "eval-runner",
      model: "fixed-eval-model",
      purpose: "fixed regression evaluation",
      promptHash: "a".repeat(64),
      evidenceRefs: fixture.evidenceRefs,
      ...(fixture.wrongAnswerMitigation !== null
        ? { wrongAnswerMitigation: fixture.wrongAnswerMitigation }
        : {}),
      createdAt: NOW as never,
    });
    assert.ok(created.ok);
    let action = created.value;
    if (fixture.operationStatus === "stopped") {
      const stopped = setAiOperationStatus(action, {
        status: "stopped",
        actor: "eval-runner",
        at: NOW as never,
        reason: "simulated provider outage",
      });
      assert.ok(stopped.ok);
      action = stopped.value;
    }
    const decision = decideAiAction(action, {
      decision: "approved",
      decidedBy: "eval-approver",
      decidedAt: NOW as never,
    });
    const actualApproved = decision.ok;
    recordEvidence({
      requirementId: "QA-AI-001",
      testId: `QA-AI-${fixture.id}`,
      input: fixture,
      expected: { approved: fixture.expectedApproved },
      actual: { approved: actualApproved },
      tolerance: null,
      testDataVersion: dataset.version,
      result: actualApproved === fixture.expectedApproved ? "pass" : "fail",
      log: "Programmatic rules evaluate grounding, human review and operation status",
    });
    assert.equal(actualApproved, fixture.expectedApproved);
  });
}
