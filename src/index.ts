/**
 * Construction Enterprise Operating Platform — coordination layer.
 *
 * This package defines the platform's core domain model and the Governance Core
 * that enforces access decisions and records tamper-evident audit evidence.
 * Business applications integrate as adapters; they are never absorbed here.
 */
export const PLATFORM_NAME = "Construction Enterprise Operating Platform";
export const PLATFORM_VERSION = "0.1.0";

export * as domain from "./domain/index.ts";
export * as governance from "./governance/index.ts";
