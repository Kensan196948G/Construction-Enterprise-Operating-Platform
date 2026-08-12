/**
 * Zero-dependency leveled logger.
 *
 * Writes to stderr with ISO-8601 timestamps and scoped tag prefixes so
 * structured API responses on stdout remain unpolluted and safe for piping
 * to JSON processors.
 *
 * Levels (descending verbosity):
 *   debug=3  —  everything
 *   info=2   —  standard operational events
 *   warn=1   —  non-fatal anomalies
 *   error=0  —  fatal or integrity-breaking events
 *
 * Set `LOG_LEVEL` to one of `debug`, `info`, `warn`, or `error` (default: `info`).
 */

const LEVEL_VALUES: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
} as const;

type LogLevel = "error" | "warn" | "info" | "debug";

interface Logger {
  /** Fatal or integrity-breaking events (always emitted). */
  error(msg: string, ...args: unknown[]): void;
  /** Non-fatal anomalies. */
  warn(msg: string, ...args: unknown[]): void;
  /** Standard operational events. */
  info(msg: string, ...args: unknown[]): void;
  /** Verbose diagnostic output (only when LOG_LEVEL=debug). */
  debug(msg: string, ...args: unknown[]): void;
}

/** Resolved once on first `createLogger()` call; never changed afterwards. */
let resolvedLevel: LogLevel | undefined;
let resolvedValue: number = LEVEL_VALUES.info;

function resolveLevel(): void {
  if (resolvedLevel !== undefined) return;
  const raw = process.env["LOG_LEVEL"]?.trim().toLowerCase();
  if (raw === "debug" || raw === "info" || raw === "warn" || raw === "error") {
    resolvedLevel = raw;
    resolvedValue = LEVEL_VALUES[raw];
    return;
  }
  resolvedLevel = "info";
  resolvedValue = LEVEL_VALUES.info;
  if (raw !== undefined && raw !== "") {
    // Emit the fallback warning on first invalid value to avoid duplicate
    // warnings when multiple createLogger() calls are made.
    const now = new Date().toISOString();
    process.stderr.write(
      `${now} [logger] invalid LOG_LEVEL "${process.env["LOG_LEVEL"]}", falling back to "info"\n`,
    );
  }
}

function canLog(level: LogLevel): boolean {
  resolveLevel();
  return LEVEL_VALUES[level] <= resolvedValue;
}

function formatOutput(scope: string, _level: LogLevel, msg: string, args: unknown[]): string {
  const timestamp = new Date().toISOString();
  const tail = args.length > 0 ? ` ${args.map(String).join(" ")}` : "";
  return `${timestamp} [${scope}] ${msg}${tail}\n`;
}

/**
 * Create a scoped logger.
 *
 * @param scope - A short tag identifying the subsystem (e.g. `"audit"`, `"router"`).
 */
export function createLogger(scope: string): Logger {
  return {
    error(msg, ...args) {
      process.stderr.write(formatOutput(scope, "error", msg, args));
    },
    warn(msg, ...args) {
      if (canLog("warn")) {
        process.stderr.write(formatOutput(scope, "warn", msg, args));
      }
    },
    info(msg, ...args) {
      if (canLog("info")) {
        process.stderr.write(formatOutput(scope, "info", msg, args));
      }
    },
    debug(msg, ...args) {
      if (canLog("debug")) {
        process.stderr.write(formatOutput(scope, "debug", msg, args));
      }
    },
  };
}
