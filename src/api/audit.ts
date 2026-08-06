/**
 * Shared audit-event recording helper for API routes.
 *
 * Every mutating action (CRUD, policy changes, workflow changes, token
 * issuance/revocation) should be recorded in the tamper-evident audit log so
 * the platform's evidence trail is complete. The authenticated subject is
 * always taken from the resolved context, never from the request body.
 */

import { randomUUID } from "node:crypto";
import type { IsoTimestamp } from "../domain/common.ts";
import { createAuditEvent } from "../domain/audit-event.ts";
import type { IAuditLog } from "../governance/audit-log.ts";
import type { ApiKeyContext } from "./types.ts";

export type AuditMetadata = Readonly<Record<string, string>>;

export function recordAudit(
  auditLog: IAuditLog,
  ctx: ApiKeyContext | null,
  action: string,
  resource: string,
  outcome: "success" | "failure" | "denied",
  metadata: AuditMetadata = {},
): void {
  const result = createAuditEvent({
    id: randomUUID(),
    at: new Date().toISOString() as IsoTimestamp,
    actor: ctx?.subject ?? "system",
    action,
    resource,
    outcome,
    metadata,
  });
  if (!result.ok) {
    // Audit failure must never be silent — log for investigation.
    console.error("[audit] failed to create audit event:", result.error);
    return;
  }
  try {
    auditLog.append(result.value);
  } catch (e) {
    console.error("[audit] failed to append audit event:", e);
  }
}
