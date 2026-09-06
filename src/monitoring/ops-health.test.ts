// FILE: src/monitoring/ops-health.test.ts
/**
 * Unit tests for the ops-health aggregator (Issue #89).
 *
 * These tests pin the "no fabricated data" contract: every field either
 * reflects a real signal (process, persistence probe, parsed log lines) or
 * is explicitly reported as unconfigured/unknown.
 *
 * CEOP_HEALTH_LOG/CEOP_HEALTH_STATE are ALWAYS overridden to a scratch
 * directory here, even in tests that don't care about the probe fields.
 * Without that, the aggregator falls back to its production defaults
 * (/home/kensan/.ceop/health*.log|state), and on a host that also runs the
 * real cron probe (as this repo's dev machine does), tests would silently
 * read live operational data instead of exercising the code under test.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { collectOpsHealthSnapshot } from "./ops-health.ts";
import { createInMemoryRepositories } from "../persistence/in-memory/index.ts";
import { AuditLog } from "../governance/audit-log.ts";
import type { AppContainer } from "../api/types.ts";
import type { GatewayService } from "../domain/gateway-service.ts";

function buildContainer(overrides: Partial<AppContainer> = {}): AppContainer {
  return {
    repositories: createInMemoryRepositories(),
    auditLog: new AuditLog(),
    apiKeyStore: new Map(),
    ...overrides,
  };
}

async function withEnv<T>(
  vars: Readonly<Record<string, string | undefined>>,
  fn: () => Promise<T>,
): Promise<T> {
  const previous: Record<string, string | undefined> = {};
  for (const key of Object.keys(vars)) {
    previous[key] = process.env[key];
  }
  try {
    for (const [key, value] of Object.entries(vars)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    return await fn();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

/** Run `fn` with CEOP_HEALTH_LOG/STATE pointed at a fresh, empty scratch dir. */
async function withScratchHealthProbeEnv<T>(
  fn: (dir: string) => Promise<T>,
  overrides: Readonly<Record<string, string | undefined>> = {},
): Promise<T> {
  const dir = await mkdtemp(join(tmpdir(), "ceop-ops-health-"));
  try {
    return await withEnv(
      {
        CEOP_HEALTH_LOG: join(dir, "health.log"),
        CEOP_HEALTH_STATE: join(dir, "health-probe.state"),
        ...overrides,
      },
      () => fn(dir),
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test("ops-health: process info reflects the real running process", async () => {
  const snapshot = await withScratchHealthProbeEnv(() =>
    collectOpsHealthSnapshot(buildContainer()),
  );
  assert.equal(snapshot.process.pid, process.pid);
  assert.equal(snapshot.process.nodeVersion, process.version);
  assert.ok(snapshot.process.uptimeSeconds >= 0);
  assert.ok(snapshot.process.memoryMb.rss > 0);
});

test("ops-health: database status is 'connected' when the readiness probe succeeds", async () => {
  const container = buildContainer({ storageTier: "in-memory" });
  const snapshot = await withScratchHealthProbeEnv(() => collectOpsHealthSnapshot(container));
  assert.equal(snapshot.database.tier, "in-memory");
  assert.equal(snapshot.database.status, "connected");
  assert.ok(typeof snapshot.database.latencyMs === "number");
});

test("ops-health: database status is 'error' when the persistence probe throws", async () => {
  const container = buildContainer();
  const failing = {
    ...container.repositories,
    organizations: {
      ...container.repositories.organizations,
      findAll: async () => {
        throw new Error("connection refused");
      },
    },
  };
  const snapshot = await withScratchHealthProbeEnv(() =>
    collectOpsHealthSnapshot({ ...container, repositories: failing }),
  );
  assert.equal(snapshot.database.status, "error");
  assert.match(snapshot.database.error ?? "", /connection refused/);
});

test("ops-health: database is 'unknown' with no container (no fabricated status)", async () => {
  const snapshot = await withScratchHealthProbeEnv(() => collectOpsHealthSnapshot());
  assert.equal(snapshot.database.tier, "unknown");
  assert.equal(snapshot.database.status, "unknown");
});

test("ops-health: health probe reports unconfigured when no log/state files exist", async () => {
  const snapshot = await withScratchHealthProbeEnv(() =>
    collectOpsHealthSnapshot(buildContainer()),
  );
  assert.equal(snapshot.healthProbe.configured, false);
  assert.equal(snapshot.healthProbe.recentEntries.length, 0);
  assert.ok(snapshot.healthProbe.note !== undefined && snapshot.healthProbe.note.length > 0);
});

test("ops-health: health probe parses real log/state files written by scripts/health-probe.sh", async () => {
  const snapshot = await withScratchHealthProbeEnv(async (dir) => {
    await writeFile(
      join(dir, "health.log"),
      [
        "2026-09-01T00:00:00Z OK https://ceop.example.com/health/ready",
        "2026-09-01T00:01:00Z WARN https://ceop.example.com/health/ready failed (1/3)",
        "2026-09-01T00:02:00Z ALERT https://ceop.example.com/health/ready failed 3 consecutive probes",
      ].join("\n") + "\n",
    );
    await writeFile(join(dir, "health-probe.state"), "3\n");
    return collectOpsHealthSnapshot(buildContainer());
  });

  assert.equal(snapshot.healthProbe.configured, true);
  assert.equal(snapshot.healthProbe.consecutiveFailures, 3);
  assert.equal(snapshot.healthProbe.lastSeverity, "ALERT");
  assert.equal(snapshot.healthProbe.lastCheckedAt, "2026-09-01T00:02:00Z");
  assert.equal(snapshot.healthProbe.recentEntries.length, 3);
  assert.equal(snapshot.healthProbe.recentEntries[0]?.severity, "OK");
});

test("ops-health: health probe caps recent entries and tolerates a corrupt state file", async () => {
  const snapshot = await withScratchHealthProbeEnv(async (dir) => {
    const lines = Array.from(
      { length: 15 },
      (_, i) => `2026-09-01T00:${String(i).padStart(2, "0")}:00Z OK https://example.com/health`,
    );
    await writeFile(join(dir, "health.log"), lines.join("\n") + "\n");
    await writeFile(join(dir, "health-probe.state"), "garbage");
    return collectOpsHealthSnapshot(buildContainer());
  });

  assert.equal(snapshot.healthProbe.configured, true);
  assert.equal(snapshot.healthProbe.consecutiveFailures, undefined);
  assert.ok(snapshot.healthProbe.recentEntries.length <= 10);
});

test("ops-health: gateway is 'unconfigured' when no services are registered", async () => {
  const snapshot = await withScratchHealthProbeEnv(() =>
    collectOpsHealthSnapshot(buildContainer()),
  );
  assert.equal(snapshot.gateway.configured, false);
  assert.deepEqual(snapshot.gateway.services, []);
});

test("ops-health: gateway summarises registered services without leaking secrets", async () => {
  const gatewayServices: readonly GatewayService[] = [
    {
      id: "svc-1",
      name: "Example Service",
      baseUrl: "https://upstream.example.com",
      pathPrefix: "/svc",
      readPermissions: [],
      writePermissions: [],
      timeoutMs: 10_000,
      upstreamTokenEnv: "SVC_TOKEN",
      enabled: true,
    },
  ];
  const snapshot = await withScratchHealthProbeEnv(() =>
    collectOpsHealthSnapshot(buildContainer({ gatewayServices })),
  );
  assert.equal(snapshot.gateway.configured, true);
  assert.deepEqual(snapshot.gateway.services, [
    { id: "svc-1", name: "Example Service", enabled: true },
  ]);
  assert.ok(!JSON.stringify(snapshot).includes("upstream.example.com"));
});
