// FILE: src/monitoring/ops-health.ts
/**
 * Ops health aggregation (Issue #89).
 *
 * Collects real signals already produced by existing subsystems into one
 * snapshot for the `/api/v1/ops/health` endpoint and the `/ops-health` SSR
 * dashboard. Nothing here is synthesized: a subsystem with no observable
 * signal reports itself as unconfigured/unknown rather than a
 * plausible-looking placeholder.
 *
 *  - process:     Node.js process liveness (uptime, memory, pid, versions) —
 *                 read directly from the running process.
 *  - database:    persistence-layer readiness, using the same probe as
 *                 GET /health/ready (a cheap read against the active tier).
 *  - healthProbe: latest results from scripts/health-probe.sh's log/state
 *                 files — the cron-driven external liveness probe documented
 *                 in MONITORING.md. Absent files mean the probe has not run
 *                 on this host, not that it failed.
 *  - gateway:     registered integration gateway services (P1), if the
 *                 deployment configured any.
 */

import { readFile } from "node:fs/promises";
import { PLATFORM_VERSION } from "../version.ts";
import type { AppContainer } from "../api/types.ts";

export type DatabaseStatus = "connected" | "error" | "unknown";
export type ProbeSeverity = "OK" | "WARN" | "ALERT" | "RECOVERED";

export interface OpsProcessInfo {
  readonly pid: number;
  readonly uptimeSeconds: number;
  readonly nodeVersion: string;
  readonly platform: string;
  readonly platformVersion: string;
  readonly environment: string;
  readonly memoryMb: {
    readonly rss: number;
    readonly heapUsed: number;
    readonly heapTotal: number;
  };
}

export interface OpsDatabaseInfo {
  readonly tier: "in-memory" | "file" | "sqlite" | "unknown";
  readonly status: DatabaseStatus;
  readonly latencyMs?: number;
  readonly error?: string;
}

export interface OpsHealthProbeLogEntry {
  readonly timestamp: string;
  readonly severity: ProbeSeverity;
  readonly message: string;
}

export interface OpsHealthProbeInfo {
  /** False when neither a state file nor a log file could be read. */
  readonly configured: boolean;
  readonly consecutiveFailures?: number;
  readonly lastSeverity?: ProbeSeverity;
  readonly lastCheckedAt?: string;
  readonly recentEntries: readonly OpsHealthProbeLogEntry[];
  readonly note?: string;
}

export interface OpsGatewayServiceSummary {
  readonly id: string;
  readonly name: string;
  readonly enabled: boolean;
}

export interface OpsGatewayInfo {
  readonly configured: boolean;
  readonly services: readonly OpsGatewayServiceSummary[];
}

export interface OpsHealthSnapshot {
  readonly generatedAt: string;
  readonly process: OpsProcessInfo;
  readonly database: OpsDatabaseInfo;
  readonly healthProbe: OpsHealthProbeInfo;
  readonly gateway: OpsGatewayInfo;
}

const BYTES_PER_MB = 1024 * 1024;
/** How many trailing log lines to surface — enough context without unbounded payloads. */
const MAX_LOG_ENTRIES = 10;

function toMb(bytes: number): number {
  return Math.round((bytes / BYTES_PER_MB) * 10) / 10;
}

function collectProcessInfo(): OpsProcessInfo {
  const mem = process.memoryUsage();
  return {
    pid: process.pid,
    uptimeSeconds: Math.round(process.uptime()),
    nodeVersion: process.version,
    platform: process.platform,
    platformVersion: PLATFORM_VERSION,
    environment: process.env["NODE_ENV"] ?? "development",
    memoryMb: {
      rss: toMb(mem.rss),
      heapUsed: toMb(mem.heapUsed),
      heapTotal: toMb(mem.heapTotal),
    },
  };
}

/**
 * Exercise the persistence layer exactly like GET /health/ready does, timing
 * the call so operators can see latency drift, not just up/down.
 */
async function collectDatabaseInfo(container?: AppContainer): Promise<OpsDatabaseInfo> {
  const tier = container?.storageTier ?? "unknown";
  if (container === undefined) {
    return { tier, status: "unknown" };
  }
  const startedAt = process.hrtime.bigint();
  try {
    await container.repositories.organizations.findAll();
    const latencyMs = Number((process.hrtime.bigint() - startedAt) / 1_000_000n);
    return { tier, status: "connected", latencyMs };
  } catch (e) {
    return { tier, status: "error", error: e instanceof Error ? e.message : String(e) };
  }
}

/** Parse one scripts/health-probe.sh log line: "<ISO ts> <SEVERITY> <message...>". */
function parseProbeLogLine(line: string): OpsHealthProbeLogEntry | null {
  const match = /^(\S+)\s+(OK|WARN|ALERT|RECOVERED)\b\s*(.*)$/.exec(line.trim());
  if (match === null) return null;
  const [, timestamp, severity, message] = match;
  return {
    timestamp: timestamp ?? "",
    severity: severity as ProbeSeverity,
    message: message ?? "",
  };
}

/**
 * Read the consecutive-failure counter and trailing log lines written by
 * scripts/health-probe.sh. Both files are optional — the probe runs via cron
 * on the production host and may not exist in dev/CI, which is reported as
 * `configured: false` rather than an error.
 */
async function collectHealthProbeInfo(): Promise<OpsHealthProbeInfo> {
  const logPath = process.env["CEOP_HEALTH_LOG"] ?? "/home/kensan/.ceop/health.log";
  const statePath = process.env["CEOP_HEALTH_STATE"] ?? "/home/kensan/.ceop/health-probe.state";

  let consecutiveFailures: number | undefined;
  try {
    const raw = (await readFile(statePath, "utf-8")).trim();
    const parsed = Number.parseInt(raw, 10);
    consecutiveFailures = Number.isNaN(parsed) ? undefined : parsed;
  } catch {
    // No state file yet — the probe has not run (or logs to a different path).
  }

  let recentEntries: OpsHealthProbeLogEntry[] = [];
  try {
    const raw = await readFile(logPath, "utf-8");
    const lines = raw.split("\n").filter((line) => line.trim() !== "");
    recentEntries = lines
      .slice(-MAX_LOG_ENTRIES)
      .map(parseProbeLogLine)
      .filter((entry): entry is OpsHealthProbeLogEntry => entry !== null);
  } catch {
    // No log file yet.
  }

  if (consecutiveFailures === undefined && recentEntries.length === 0) {
    return {
      configured: false,
      recentEntries: [],
      note: "未接続（scripts/health-probe.sh の実行ログが見つかりません。cron 未設定、または別ホストで実行中の可能性があります）",
    };
  }

  const last = recentEntries.at(-1);
  return {
    configured: true,
    ...(consecutiveFailures !== undefined ? { consecutiveFailures } : {}),
    ...(last !== undefined ? { lastSeverity: last.severity, lastCheckedAt: last.timestamp } : {}),
    recentEntries,
  };
}

function collectGatewayInfo(container?: AppContainer): OpsGatewayInfo {
  const services = container?.gatewayServices;
  if (services === undefined) {
    return { configured: false, services: [] };
  }
  return {
    configured: true,
    services: services.map((s) => ({ id: s.id, name: s.name, enabled: s.enabled })),
  };
}

/** Build the full ops-health snapshot from live subsystem state. */
export async function collectOpsHealthSnapshot(
  container?: AppContainer,
): Promise<OpsHealthSnapshot> {
  const [database, healthProbe] = await Promise.all([
    collectDatabaseInfo(container),
    collectHealthProbeInfo(),
  ]);
  return {
    generatedAt: new Date().toISOString(),
    process: collectProcessInfo(),
    database,
    healthProbe,
    gateway: collectGatewayInfo(container),
  };
}
