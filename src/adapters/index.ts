/**
 * Adapter ports and reference implementations.
 *
 * Ports define the contracts for integrating CMDB, ITSM, IMS, LegalOps, BCP, and
 * document generation. Business systems connect as adapters; they are never
 * absorbed into the platform core.
 */
export * from "./ports.ts";
export * from "./in-memory-document-adapter.ts";
export * from "./in-memory-cmdb-adapter.ts";
export * from "./in-memory-itsm-adapter.ts";
export * from "./in-memory-ims-adapter.ts";
export * from "./in-memory-legalops-adapter.ts";
export * from "./in-memory-bcp-adapter.ts";

import { type IsoTimestamp } from "../domain/common.ts";
import { type BcpPort, type CmdbPort, type DocumentPort, type ImsPort, type ItsmPort, type LegalOpsPort } from "./ports.ts";
import { InMemoryBcpAdapter } from "./in-memory-bcp-adapter.ts";
import { InMemoryCmdbAdapter } from "./in-memory-cmdb-adapter.ts";
import { InMemoryDocumentAdapter } from "./in-memory-document-adapter.ts";
import { InMemoryImsAdapter } from "./in-memory-ims-adapter.ts";
import { InMemoryItsmAdapter } from "./in-memory-itsm-adapter.ts";
import { InMemoryLegalOpsAdapter } from "./in-memory-legalops-adapter.ts";

/** Aggregates all integration port adapters used by the platform. */
export interface AdapterRegistry {
  readonly cmdb: CmdbPort;
  readonly itsm: ItsmPort;
  readonly ims: ImsPort;
  readonly legalOps: LegalOpsPort;
  readonly bcp: BcpPort;
  readonly document: DocumentPort;
}

/**
 * Factory that wires up all in-memory adapters.
 *
 * @param now - Optional clock injection (defaults to `Date.now`-based ISO string).
 *              Pass a fixed clock in tests for deterministic timestamps.
 */
export function createInMemoryAdapters(now?: () => IsoTimestamp): AdapterRegistry {
  const clock = now ?? ((): IsoTimestamp => new Date().toISOString() as IsoTimestamp);
  return {
    cmdb: new InMemoryCmdbAdapter(),
    itsm: new InMemoryItsmAdapter(),
    ims: new InMemoryImsAdapter(),
    legalOps: new InMemoryLegalOpsAdapter(),
    bcp: new InMemoryBcpAdapter(),
    document: new InMemoryDocumentAdapter(clock),
  };
}
