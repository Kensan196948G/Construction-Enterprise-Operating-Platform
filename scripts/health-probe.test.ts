// FILE: scripts/health-probe.test.ts
/**
 * Tests for the external health probe.
 *
 * The probe's whole reason to exist is the consecutive-failure counter: a
 * stateless `curl` in cron cannot express "alert on 3 consecutive failures",
 * which is the policy MONITORING.md commits to. That counter is real logic
 * living in an operational script, so it is tested rather than asserted.
 *
 * Failures are simulated with a closed port instead of a mock, because the
 * behaviour under test is how the script reacts to a real `curl` exit code.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT = fileURLToPath(new URL("./health-probe.sh", import.meta.url));

/** A port that nothing listens on, so curl fails fast and deterministically. */
const DEAD_URL = "http://127.0.0.1:1/health";

interface ProbeRun {
  exitCode: number;
  /** The line this run appended to the log. */
  line: string;
  /** The consecutive-failure counter after the run. */
  state: string;
}

interface ProbeEnv {
  dir: string;
  log: string;
  stateFile: string;
}

async function makeEnv(): Promise<ProbeEnv> {
  const dir = await mkdtemp(join(tmpdir(), "ceop-probe-"));
  return { dir, log: join(dir, "health.log"), stateFile: join(dir, "probe.state") };
}

function runProbe(env: ProbeEnv, url: string, threshold = "3"): Promise<number> {
  return new Promise((resolve) => {
    execFile(
      SCRIPT,
      [],
      {
        env: {
          ...process.env,
          CEOP_HEALTH_URL: url,
          CEOP_HEALTH_LOG: env.log,
          CEOP_HEALTH_STATE: env.stateFile,
          CEOP_HEALTH_THRESHOLD: threshold,
          CEOP_HEALTH_TIMEOUT: "2",
        },
      },
      (error) => resolve(error === null ? 0 : ((error as { code?: number }).code ?? 1)),
    );
  });
}

async function probe(env: ProbeEnv, url: string, threshold = "3"): Promise<ProbeRun> {
  const before = await readFile(env.log, "utf-8").catch(() => "");
  const exitCode = await runProbe(env, url, threshold);
  const after = await readFile(env.log, "utf-8");
  const state = (await readFile(env.stateFile, "utf-8").catch(() => "")).trim();
  return { exitCode, line: after.slice(before.length).trim(), state };
}

test("health-probe: escalates WARN → ALERT only at the configured threshold", async () => {
  const env = await makeEnv();

  const first = await probe(env, DEAD_URL);
  assert.match(first.line, /^\S+ WARN /, "the first failure is a warning, not a page");
  assert.equal(first.exitCode, 0, "a single blip must not wake anyone");
  assert.equal(first.state, "1");

  const second = await probe(env, DEAD_URL);
  assert.match(second.line, /^\S+ WARN /);
  assert.equal(second.exitCode, 0);
  assert.equal(second.state, "2");

  const third = await probe(env, DEAD_URL);
  assert.match(third.line, /^\S+ ALERT /, "the third consecutive failure is the alert");
  assert.equal(third.exitCode, 1, "exit status must carry the same signal as the log");
  assert.equal(third.state, "3");
});

test("health-probe: a continuing outage does not repeat the ALERT line", async () => {
  const env = await makeEnv();
  for (let i = 0; i < 3; i += 1) await probe(env, DEAD_URL);

  const fourth = await probe(env, DEAD_URL);
  // The transition is what an operator scans for; repeating it once per run
  // would bury the moment the outage began under identical lines.
  assert.match(fourth.line, /^\S+ WARN .*still failing \(4 consecutive\)/);
  assert.equal(fourth.exitCode, 1, "still failing is still a failure");
});

test("health-probe: threshold is configurable", async () => {
  const env = await makeEnv();
  const first = await probe(env, DEAD_URL, "1");
  assert.match(first.line, /^\S+ ALERT /);
  assert.equal(first.exitCode, 1);
});

test("health-probe: a corrupt state file fails open at zero rather than silencing the probe", async () => {
  const env = await makeEnv();
  await writeFile(env.stateFile, "garbage");

  const run = await probe(env, DEAD_URL);
  assert.match(run.line, /^\S+ WARN /);
  assert.equal(run.state, "1", "an unreadable counter must restart, never disable alerting");
});

test("health-probe: success logs OK and resets the counter", async (t) => {
  const env = await makeEnv();
  const { createServer } = await import("node:http");
  const server = createServer((_req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("ok");
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(
    () => new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve()))),
  );
  const { port } = server.address() as { port: number };
  const liveUrl = `http://127.0.0.1:${port}/health`;

  // Cross the threshold first, so recovery has something to recover from.
  for (let i = 0; i < 3; i += 1) await probe(env, DEAD_URL);

  const recovered = await probe(env, liveUrl);
  const lines = recovered.line.split("\n");
  assert.equal(lines.length, 2, "recovery writes both the transition and the new status");
  assert.match(
    lines[0] ?? "",
    /RECOVERED .* after 3 consecutive failures$/,
    "the log must show when the outage ended and how long it ran",
  );
  assert.match(lines[1] ?? "", /^\S+ OK /);
  assert.equal(recovered.exitCode, 0);
  assert.equal(recovered.state, "0");

  // Success is logged on every run: a failure-only log is indistinguishable
  // from a probe that stopped running at all.
  const steady = await probe(env, liveUrl);
  assert.match(steady.line, /^\S+ OK /);
});
