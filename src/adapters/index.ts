/**
 * Adapter ports and reference implementations.
 *
 * Ports define the contracts for integrating CMDB, ITSM, IMS, LegalOps, BCP, and
 * document generation. Business systems connect as adapters; they are never
 * absorbed into the platform core.
 */
export * from "./ports.ts";
export * from "./in-memory-document-adapter.ts";
