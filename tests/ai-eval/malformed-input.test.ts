import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { createAiAction } from "../../src/domain/ai-action.ts";

interface MalformedDataset {
  readonly cases: readonly {
    readonly id: string;
    readonly promptHash: string;
    readonly piiSensitive: boolean;
    readonly inputRetentionDays: number;
    readonly expectedIssue: string;
  }[];
}

const dataset = JSON.parse(
  readFileSync(new URL("../../testdata/malformed/ai-actions.v1.json", import.meta.url), "utf8"),
) as MalformedDataset;

for (const fixture of dataset.cases) {
  test(`QA-AI-MALFORMED-${fixture.id}: malformed AI request fails validation`, () => {
    const result = createAiAction({
      id: fixture.id,
      requester: "eval-runner",
      model: "fixed-eval-model",
      purpose: "malformed regression evaluation",
      promptHash: fixture.promptHash,
      piiSensitive: fixture.piiSensitive,
      inputRetentionDays: fixture.inputRetentionDays,
      createdAt: "2026-09-12T00:00:00.000Z" as never,
    });
    assert.ok(!result.ok);
    assert.ok(result.error.some((issue) => issue.path === fixture.expectedIssue));
  });
}
