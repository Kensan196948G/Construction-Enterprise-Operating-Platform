import { type BcpPort, type ContinuityPlan } from "./ports.ts";

/**
 * In-memory {@link BcpPort} implementation pre-loaded with construction
 * company continuity plans. Intended for tests and local development.
 */
export class InMemoryBcpAdapter implements BcpPort {
  readonly #plans: readonly ContinuityPlan[];

  constructor(plans?: readonly ContinuityPlan[]) {
    this.#plans = plans ?? SEED_PLANS;
  }

  listPlans(): Promise<readonly ContinuityPlan[]> {
    return Promise.resolve(this.#plans);
  }
}

const SEED_PLANS: readonly ContinuityPlan[] = [
  {
    id: "bcp-001",
    name: "Earthquake Response Plan",
    readiness: "ready",
  },
  {
    id: "bcp-002",
    name: "Pandemic Response Plan",
    readiness: "draft",
  },
];
