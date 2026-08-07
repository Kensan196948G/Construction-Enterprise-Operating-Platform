/**
 * WebUI access logging to Neon PostgreSQL over its SQL-over-HTTP endpoint.
 *
 * The WebUI server is a zero-dependency static file host, so instead of a
 * postgres driver we use Neon's HTTP query API (`POST https://<host>/sql`
 * with a `Neon-Connection-String` header) via the built-in `fetch`.
 *
 * Entries are batched (size- and time-triggered) and flushed fire-and-forget:
 * a Neon outage must never block or fail page delivery. Static asset hits
 * are filtered out by the server; only page/health/API-shaped requests reach
 * this logger, keeping row volume proportional to real user activity.
 */

export interface AccessLogEntry {
  readonly method: string;
  readonly path: string;
  readonly statusCode: number;
  readonly durationMs: number;
  readonly remoteAddr?: string;
  readonly userAgent?: string;
}

export interface AccessLogger {
  log(entry: AccessLogEntry): void;
  /** Flush pending entries; used by tests and graceful shutdown. */
  flush(): Promise<void>;
}

export interface NeonAccessLoggerOptions {
  /** Rows per INSERT batch before an immediate flush (default 20). */
  readonly batchSize?: number;
  /** Max milliseconds an entry may wait before a timed flush (default 5000). */
  readonly flushIntervalMs?: number;
  /** Reported in the `instance` column (default "ceop-webui"). */
  readonly instance?: string;
  /** Injectable fetch for tests. */
  readonly fetchImpl?: typeof fetch;
}

/** No-op logger used when no Neon connection string is configured. */
export const nullAccessLogger: AccessLogger = {
  log: () => undefined,
  flush: () => Promise.resolve(),
};

/**
 * Build one multi-row parameterised INSERT. Neon's /sql endpoint accepts a
 * single statement with a params array, so rows are packed as ($1..$7),(...).
 */
export function buildInsert(
  entries: readonly AccessLogEntry[],
  instance: string,
): { query: string; params: (string | number | null)[] } {
  const columns = 7;
  const tuples = entries.map((_, row) => {
    const base = row * columns;
    const refs = Array.from({ length: columns }, (_, i) => `$${base + i + 1}`);
    return `(${refs.join(", ")})`;
  });
  const params = entries.flatMap((e) => [
    e.method,
    e.path,
    e.statusCode,
    e.durationMs,
    e.remoteAddr ?? null,
    e.userAgent ?? null,
    instance,
  ]);
  return {
    query:
      "INSERT INTO webui_access_log " +
      "(method, path, status_code, duration_ms, remote_addr, user_agent, instance) " +
      `VALUES ${tuples.join(", ")}`,
    params,
  };
}

export function createNeonAccessLogger(
  connectionString: string,
  options: NeonAccessLoggerOptions = {},
): AccessLogger {
  const batchSize = options.batchSize ?? 20;
  const flushIntervalMs = options.flushIntervalMs ?? 5000;
  const instance = options.instance ?? "ceop-webui";
  const fetchImpl = options.fetchImpl ?? fetch;

  // Endpoint host is embedded in the connection string: postgresql://user:pw@HOST/db
  const hostMatch = /@([^/]+)\//.exec(connectionString);
  if (hostMatch?.[1] === undefined) {
    console.error("[webui] invalid Neon connection string shape; access log disabled");
    return nullAccessLogger;
  }
  const endpoint = `https://${hostMatch[1]}/sql`;

  let queue: AccessLogEntry[] = [];
  let timer: NodeJS.Timeout | undefined;

  async function flushNow(): Promise<void> {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
    if (queue.length === 0) return;
    const batch = queue;
    queue = [];
    try {
      const { query, params } = buildInsert(batch, instance);
      const res = await fetchImpl(endpoint, {
        method: "POST",
        headers: {
          "Neon-Connection-String": connectionString,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, params }),
      });
      if (!res.ok) {
        // Drop the batch: access logs are best-effort, never retried into
        // unbounded memory growth. Do not print response bodies (may echo SQL).
        console.error(
          `[webui] access-log flush failed: HTTP ${res.status} (${batch.length} rows dropped)`,
        );
      }
    } catch (e) {
      console.error(
        `[webui] access-log flush error: ${e instanceof Error ? e.message : String(e)} (${batch.length} rows dropped)`,
      );
    }
  }

  return {
    log(entry: AccessLogEntry): void {
      queue.push(entry);
      if (queue.length >= batchSize) {
        void flushNow();
      } else if (timer === undefined) {
        timer = setTimeout(() => void flushNow(), flushIntervalMs);
        // A pending log flush must not keep the process alive on shutdown.
        timer.unref();
      }
    },
    flush: flushNow,
  };
}
