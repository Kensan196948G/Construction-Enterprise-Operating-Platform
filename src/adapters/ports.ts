/**
 * Integration ports (hexagonal architecture).
 *
 * The platform coordinates external systems through these contracts and never
 * absorbs their implementations. Concrete adapters live behind each port, so the
 * core depends on the interface, not the vendor.
 */
import { type IsoTimestamp } from "../domain/common.ts";

/** Configuration Management Database — the source of truth for assets. */
export interface ConfigurationItem {
  readonly id: string;
  readonly type: string;
  readonly name: string;
  readonly attributes: Readonly<Record<string, string>>;
}

export interface CmdbPort {
  getItem(id: string): Promise<ConfigurationItem | null>;
  listItems(type?: string): Promise<readonly ConfigurationItem[]>;
}

/** IT Service Management — incidents and service requests. */
export interface Incident {
  readonly id: string;
  readonly title: string;
  readonly severity: "low" | "medium" | "high" | "critical";
  readonly status: "open" | "investigating" | "resolved";
}

export interface ItsmPort {
  createIncident(input: Omit<Incident, "id" | "status">): Promise<Incident>;
  getIncident(id: string): Promise<Incident | null>;
  listIncidents(): Promise<readonly Incident[]>;
}

/** Integrated Management System — compliance controls (ISO / J-SOX). */
export interface ManagementControl {
  readonly id: string;
  readonly standard: string;
  readonly satisfied: boolean;
}

export interface ImsPort {
  listControls(standard?: string): Promise<readonly ManagementControl[]>;
}

/** Legal operations — obligations and their fulfilment state. */
export interface LegalObligation {
  readonly id: string;
  readonly description: string;
  readonly dueDate: IsoTimestamp;
  readonly fulfilled: boolean;
}

export interface LegalOpsPort {
  listObligations(): Promise<readonly LegalObligation[]>;
}

/** Business Continuity Planning — recovery plans and readiness. */
export interface ContinuityPlan {
  readonly id: string;
  readonly name: string;
  readonly readiness: "ready" | "draft" | "stale";
}

export interface BcpPort {
  listPlans(): Promise<readonly ContinuityPlan[]>;
}

/** Document control — regulation / procedure / audit-evidence generation. */
export interface DocumentSpec {
  readonly template: string;
  readonly title: string;
  readonly variables: Readonly<Record<string, string>>;
}

export interface DocumentArtifact {
  readonly id: string;
  readonly title: string;
  readonly content: string;
  readonly generatedAt: IsoTimestamp;
}

export interface DocumentPort {
  generate(spec: DocumentSpec): Promise<DocumentArtifact>;
}
