#!/usr/bin/env bash
# FILE: scripts/health-probe.sh
#
# Production liveness/readiness probe for cron.
#
# MONITORING.md specifies "3 consecutive failures alert". A stateless probe
# cannot express that: each run only sees its own result. This script keeps a
# consecutive-failure counter on disk so the documented policy is actually
# implemented rather than merely described.
#
# It deliberately distinguishes three log severities, because an operator
# skimming the log needs to tell "one blip" from "the service is down":
#
#   OK     — probe succeeded; the counter resets
#   WARN   — probe failed, but below the alert threshold
#   ALERT  — the threshold was reached; this is the line worth paging on
#
# ALERT is emitted once per crossing, not once per failed run, so a long
# outage does not bury the transition in identical lines.
#
# Exit status: 0 when healthy or merely warning, 1 when in ALERT state, so a
# supervisor that checks exit codes sees the same signal as the log reader.

set -uo pipefail

URL="${CEOP_HEALTH_URL:-https://ceop.mirai-dx-platform.com/health/ready}"
LOG="${CEOP_HEALTH_LOG:-/home/kensan/.ceop/health.log}"
STATE="${CEOP_HEALTH_STATE:-/home/kensan/.ceop/health-probe.state}"
THRESHOLD="${CEOP_HEALTH_THRESHOLD:-3}"
TIMEOUT="${CEOP_HEALTH_TIMEOUT:-10}"

now() { date -u +%Y-%m-%dT%H:%M:%SZ; }
log() { printf '%s %s\n' "$(now)" "$1" >>"$LOG"; }

mkdir -p "$(dirname "$LOG")" "$(dirname "$STATE")"

# Previous consecutive-failure count; absent or corrupt state starts at 0
# rather than failing, so a wiped disk cannot silence the probe.
fails=$(cat "$STATE" 2>/dev/null || echo 0)
case "$fails" in (*[!0-9]*|'') fails=0 ;; esac

# -f: non-2xx is a failure. -s -S: quiet, but keep the error text.
if body=$(curl -fsS --max-time "$TIMEOUT" "$URL" 2>&1); then
  if [ "$fails" -ge "$THRESHOLD" ]; then
    log "RECOVERED ${URL} after ${fails} consecutive failures"
  fi
  echo 0 >"$STATE"
  # Success is logged too: a log that only records failures is
  # indistinguishable from a probe that stopped running.
  log "OK ${URL}"
  exit 0
fi

fails=$((fails + 1))
echo "$fails" >"$STATE"

# Truncate the captured error: curl can emit long TLS diagnostics, and the
# response body of a failing endpoint may carry operational detail we do not
# want duplicated into an unrotated log.
detail=$(printf '%s' "$body" | head -c 200 | tr '\n' ' ')

if [ "$fails" -eq "$THRESHOLD" ]; then
  log "ALERT ${URL} failed ${fails} consecutive probes — ${detail}"
  exit 1
elif [ "$fails" -gt "$THRESHOLD" ]; then
  log "WARN ${URL} still failing (${fails} consecutive) — ${detail}"
  exit 1
else
  log "WARN ${URL} failed (${fails}/${THRESHOLD}) — ${detail}"
  exit 0
fi
