import { type ImsPort, type ManagementControl } from "./ports.ts";

/**
 * In-memory {@link ImsPort} implementation pre-loaded with ISO and J-SOX
 * management controls. Intended for tests and local development.
 */
export class InMemoryImsAdapter implements ImsPort {
  readonly #controls: readonly ManagementControl[];

  constructor(controls?: readonly ManagementControl[]) {
    this.#controls = controls ?? SEED_CONTROLS;
  }

  listControls(standard?: string): Promise<readonly ManagementControl[]> {
    const result =
      standard === undefined
        ? this.#controls
        : this.#controls.filter((c) => c.standard === standard);
    return Promise.resolve(result);
  }
}

const SEED_CONTROLS: readonly ManagementControl[] = [
  // ISO 9001 — Quality Management
  {
    id: "iso9001-4.1",
    standard: "ISO 9001",
    satisfied: true,
  },
  {
    id: "iso9001-8.1",
    standard: "ISO 9001",
    satisfied: true,
  },
  {
    id: "iso9001-9.1",
    standard: "ISO 9001",
    satisfied: false,
  },
  // ISO 45001 — Occupational Health & Safety
  {
    id: "iso45001-6.1",
    standard: "ISO 45001",
    satisfied: true,
  },
  {
    id: "iso45001-8.1",
    standard: "ISO 45001",
    satisfied: false,
  },
  // J-SOX — Internal Controls over Financial Reporting
  {
    id: "jsox-it-gc-01",
    standard: "J-SOX",
    satisfied: true,
  },
  {
    id: "jsox-it-gc-02",
    standard: "J-SOX",
    satisfied: true,
  },
  {
    id: "jsox-it-gc-03",
    standard: "J-SOX",
    satisfied: false,
  },
];
