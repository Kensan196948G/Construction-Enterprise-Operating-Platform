import { randomUUID } from "node:crypto";
import { type Incident, type ItsmPort } from "./ports.ts";

/**
 * In-memory {@link ItsmPort} implementation pre-loaded with sample incidents.
 * Intended for tests and local development.
 */
export class InMemoryItsmAdapter implements ItsmPort {
  readonly #incidents: Map<string, Incident>;

  constructor(incidents?: readonly Incident[]) {
    this.#incidents = new Map((incidents ?? SEED_INCIDENTS).map((inc) => [inc.id, inc]));
  }

  createIncident(input: Omit<Incident, "id" | "status">): Promise<Incident> {
    const incident: Incident = {
      id: randomUUID(),
      status: "open",
      ...input,
    };
    this.#incidents.set(incident.id, incident);
    return Promise.resolve(incident);
  }

  getIncident(id: string): Promise<Incident | null> {
    return Promise.resolve(this.#incidents.get(id) ?? null);
  }

  /** Expose current incident count — useful in tests. */
  get size(): number {
    return this.#incidents.size;
  }
}

const SEED_INCIDENTS: readonly Incident[] = [
  {
    id: "inc-001",
    title: "Field tablet network connectivity issue at Site A",
    severity: "medium",
    status: "investigating",
  },
  {
    id: "inc-002",
    title: "Dust sensor offline — Site A Entry",
    severity: "low",
    status: "open",
  },
];
