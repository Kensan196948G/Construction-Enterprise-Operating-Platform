/**
 * Zero-dependency Prometheus text-format metrics registry (P4).
 *
 * Counters are keyed by (name, sorted label set). Gauges are simple numeric
 * snapshots refreshed at scrape time by the /metrics route handler.
 */

const counters = new Map<string, number>();
const gauges = new Map<string, number>();

function labelKey(name: string, labels: Readonly<Record<string, string>>): string {
  const sorted = Object.keys(labels)
    .sort()
    .map((k) => `${k}="${escapeLabel(labels[k] ?? "")}"`)
    .join(",");
  return sorted === "" ? name : `${name}{${sorted}}`;
}

function escapeLabel(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

export function incrementCounter(
  name: string,
  labels: Readonly<Record<string, string>> = {},
  value = 1,
): void {
  const key = labelKey(name, labels);
  counters.set(key, (counters.get(key) ?? 0) + value);
}

export function setGauge(name: string, value: number): void {
  gauges.set(name, value);
}

/** Record one HTTP request for `ceop_http_requests_total`. */
export function recordRequest(method: string, route: string, status: number): void {
  incrementCounter("ceop_http_requests_total", {
    method,
    route: route === "" ? "/" : route,
    status: String(status),
  });
}

export function renderMetrics(extraGauges: Readonly<Record<string, number>> = {}): string {
  const lines: string[] = [
    "# HELP ceop_http_requests_total Total HTTP requests handled by CEOP.",
    "# TYPE ceop_http_requests_total counter",
  ];
  for (const [key, value] of [...counters.entries()].sort()) {
    lines.push(`${key} ${value}`);
  }
  const allGauges = new Map<string, number>(gauges);
  for (const [name, value] of Object.entries(extraGauges)) {
    allGauges.set(name, value);
  }
  for (const [name, value] of [...allGauges.entries()].sort()) {
    lines.push(`# HELP ${name} CEOP runtime gauge.`);
    lines.push(`# TYPE ${name} gauge`);
    lines.push(`${name} ${value}`);
  }
  return lines.join("\n") + "\n";
}
