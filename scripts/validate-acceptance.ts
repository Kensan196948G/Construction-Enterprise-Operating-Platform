import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export interface AcceptanceCriterion {
  readonly id: string;
  readonly label: string;
}

export interface AcceptanceChecklist {
  readonly version: string;
  readonly requirements: readonly AcceptanceCriterion[];
}

export interface AcceptanceInput {
  readonly status?: string | undefined;
  readonly approver?: string | undefined;
  readonly evidenceRef?: string | undefined;
}

export function validateAcceptance(
  checklist: AcceptanceChecklist,
  input: AcceptanceInput,
): readonly string[] {
  const errors: string[] = [];
  if (checklist.version.trim().length === 0) errors.push("checklist version is required");
  if (checklist.requirements.length === 0)
    errors.push("at least one acceptance criterion is required");
  if (
    new Set(checklist.requirements.map((item) => item.id)).size !== checklist.requirements.length
  ) {
    errors.push("acceptance criterion IDs must be unique");
  }
  if (input.status !== "approved") errors.push("CEOP_ACCEPTANCE_STATUS must be approved");
  if (!input.approver?.trim()) errors.push("CEOP_ACCEPTANCE_APPROVER is required");
  if (!input.evidenceRef?.trim()) errors.push("CEOP_ACCEPTANCE_EVIDENCE_REF is required");
  return errors;
}

function main(): void {
  const path = process.argv[2] ?? "testdata/acceptance/release-checklist.v1.json";
  const checklist = JSON.parse(readFileSync(path, "utf8")) as AcceptanceChecklist;
  const errors = validateAcceptance(checklist, {
    status: process.env["CEOP_ACCEPTANCE_STATUS"],
    approver: process.env["CEOP_ACCEPTANCE_APPROVER"],
    evidenceRef: process.env["CEOP_ACCEPTANCE_EVIDENCE_REF"],
  });
  if (errors.length > 0) {
    errors.forEach((error) => console.error(`[acceptance] ${error}`));
    process.exitCode = 2;
    return;
  }
  console.log(`Human acceptance: PASS (${checklist.requirements.length} criteria)`);
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href)
  main();
