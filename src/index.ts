/**
 * Construction Enterprise Operating Platform — coordination layer.
 *
 * This package defines the platform's core domain model and the Governance Core
 * that enforces access decisions and records tamper-evident audit evidence.
 * Business applications integrate as adapters; they are never absorbed here.
 */
export { PLATFORM_NAME, PLATFORM_VERSION } from "./version.ts";

export * as domain from "./domain/index.ts";
export * as governance from "./governance/index.ts";
export * as dashboard from "./dashboard/index.ts";
export * as adapters from "./adapters/index.ts";
