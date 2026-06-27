import { type IsoTimestamp } from "../domain/common.ts";
import { type LegalObligation, type LegalOpsPort } from "./ports.ts";

/**
 * In-memory {@link LegalOpsPort} implementation pre-loaded with sample legal
 * obligations. Intended for tests and local development.
 */
export class InMemoryLegalOpsAdapter implements LegalOpsPort {
  readonly #obligations: readonly LegalObligation[];

  constructor(obligations?: readonly LegalObligation[]) {
    this.#obligations = obligations ?? SEED_OBLIGATIONS;
  }

  listObligations(): Promise<readonly LegalObligation[]> {
    return Promise.resolve(this.#obligations.map((o) => ({ ...o })));
  }
}

const SEED_OBLIGATIONS: readonly LegalObligation[] = [
  {
    id: "legal-001",
    description: "Labor Standards Act — annual paid leave audit submission",
    dueDate: "2026-09-30T00:00:00.000Z" as IsoTimestamp,
    fulfilled: false,
  },
  {
    id: "legal-002",
    description: "Act on Protection of Personal Information — privacy impact assessment",
    dueDate: "2026-07-31T00:00:00.000Z" as IsoTimestamp,
    fulfilled: false,
  },
  {
    id: "legal-003",
    description: "Construction Business Act — annual license renewal documentation",
    dueDate: "2026-03-31T00:00:00.000Z" as IsoTimestamp,
    fulfilled: true,
  },
];
