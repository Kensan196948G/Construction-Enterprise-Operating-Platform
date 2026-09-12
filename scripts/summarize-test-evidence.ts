import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { err, ok, type Result } from "../src/domain/common.ts";
import type { TestEvidence } from "../tests/helpers/evidence.ts";

export interface EvidenceSummary {
  readonly generatedAt: string;
  readonly source: string;
  readonly total: number;
  readonly passed: number;
  readonly failed: number;
  readonly requirements: readonly string[];
  readonly releaseReady: boolean;
}

export function summarizeEvidence(source: string, raw: string): Result<EvidenceSummary, string> {
  const records: TestEvidence[] = [];
  const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0);
  for (const [index, line] of lines.entries()) {
    try {
      records.push(JSON.parse(line) as TestEvidence);
    } catch {
      return err(`invalid evidence JSON at line ${index + 1}`);
    }
  }
  const testIds = new Set<string>();
  for (const record of records) {
    if (
      typeof record.requirementId !== "string" ||
      typeof record.testId !== "string" ||
      typeof record.testDataVersion !== "string" ||
      (record.result !== "pass" && record.result !== "fail")
    ) {
      return err(`invalid evidence record: ${JSON.stringify(record)}`);
    }
    if (testIds.has(record.testId)) return err(`duplicate evidence testId: ${record.testId}`);
    testIds.add(record.testId);
  }
  const failed = records.filter((record) => record.result === "fail").length;
  return ok({
    generatedAt: new Date().toISOString(),
    source,
    total: records.length,
    passed: records.length - failed,
    failed,
    requirements: [...new Set(records.map((record) => record.requirementId))].sort(),
    releaseReady: records.length > 0 && failed === 0,
  });
}

export function resolveEvidencePaths(
  argv: readonly string[],
  environmentPath?: string,
): { readonly source: string; readonly destination: string } {
  const args = argv[0] === "--" ? argv.slice(1) : argv;
  return {
    source: args[0] ?? environmentPath ?? "artifacts/evidence.jsonl",
    destination: args[1] ?? "artifacts/evidence-summary.json",
  };
}

function main(): void {
  const { source, destination } = resolveEvidencePaths(
    process.argv.slice(2),
    process.env["CEOP_TEST_EVIDENCE_FILE"],
  );
  const result = summarizeEvidence(source, readFileSync(source, "utf8"));
  if (!result.ok) {
    console.error(`[evidence] ${result.error}`);
    process.exitCode = 2;
    return;
  }
  writeFileSync(destination, `${JSON.stringify(result.value, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(result.value));
  if (!result.value.releaseReady) process.exitCode = 2;
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href)
  main();
