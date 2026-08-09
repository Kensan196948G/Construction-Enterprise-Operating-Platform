/**
 * Outbound integration event dispatcher.
 *
 * Sends queued (`pending`) and retrying outbound integration events to their
 * target systems using the contract timeout/retry policy. Intended to run on a
 * schedule (systemd timer / cron) so cross-system delivery does not depend on
 * an interactive retry call.
 *
 * Usage:
 *   node --experimental-strip-types scripts/run-integration-dispatcher.ts [--db /data/ceop.db]
 *
 * Exit codes: 0 = dispatch completed (failures are persisted as retrying/failed),
 *             1 = argument error, 2 = storage error.
 */

import { createSqliteRepositories } from "../src/persistence/sqlite/index.ts";
import type { Repositories } from "../src/persistence/ports.ts";
import type { IntegrationEvent } from "../src/domain/integration.ts";
import { sendIntegrationEvent } from "../src/integrations/sender.ts";

export async function dispatchPendingEvents(
  repositories: Repositories,
  fetchImpl: typeof fetch = fetch,
): Promise<{ sent: number; failed: number; events: readonly IntegrationEvent[] }> {
  const all = await repositories.integrationEvents.findByDirection("outbound");
  const candidates = all.filter((event) => event.status === "pending" || event.status === "retrying");
  const events: IntegrationEvent[] = [];
  let failed = 0;
  for (const event of candidates) {
    const updated = await sendIntegrationEvent(event, repositories.integrationEvents, fetchImpl);
    events.push(updated);
    if (updated.status === "failed") failed++;
  }
  return { sent: events.filter((e) => e.status === "sent").length, failed, events };
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const dbIndex = args.indexOf("--db");
  const dbPath = dbIndex >= 0 ? args[dbIndex + 1] : undefined;
  if (dbIndex >= 0 && dbPath === undefined) {
    console.error("--db requires a path");
    process.exit(1);
  }
  const repositories =
    dbPath !== undefined
      ? createSqliteRepositories(dbPath)
      : createSqliteRepositories(process.env["CEOP_SQLITE_FILE"] ?? "/data/ceop.db");
  const result = await dispatchPendingEvents(repositories);
  console.error(
    `[integration-dispatch] sent=${result.sent} failed=${result.failed} total=${result.events.length}`,
  );
}

export { main as dispatchMain };

if (process.argv[1] !== undefined && import.meta.url === new URL(process.argv[1], import.meta.url).href) {
  await main();
}
