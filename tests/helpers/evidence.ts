import { appendFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { PLATFORM_VERSION } from "../../src/version.ts";

export type EvidenceResult = "pass" | "fail";

export interface TestEvidenceInput {
  readonly requirementId: string;
  readonly testId: string;
  readonly input: unknown;
  readonly expected: unknown;
  readonly actual: unknown;
  readonly tolerance: number | null;
  readonly testDataVersion: string;
  readonly result: EvidenceResult;
  readonly log?: string | undefined;
}

export interface TestEvidence extends TestEvidenceInput {
  readonly version: string;
  readonly environment: string;
  readonly timestamp: string;
}

export function withinTolerance(actual: number, expected: number, tolerance: number): boolean {
  return Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance;
}

export function recordEvidence(input: TestEvidenceInput): TestEvidence {
  const evidence: TestEvidence = {
    ...input,
    version: PLATFORM_VERSION,
    environment: process.env["CEOP_TEST_ENVIRONMENT"] ?? process.env["CI"] ?? "local",
    timestamp: new Date().toISOString(),
  };
  const outputPath = process.env["CEOP_TEST_EVIDENCE_FILE"];
  if (outputPath !== undefined && outputPath.length > 0) {
    mkdirSync(dirname(outputPath), { recursive: true });
    appendFileSync(outputPath, `${JSON.stringify(evidence)}\n`, { encoding: "utf8", mode: 0o600 });
  }
  return evidence;
}
