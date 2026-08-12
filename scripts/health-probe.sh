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
NOTIFY_URL="${CEOP_ALERT_WEBHOOK_URL:-}"
NOTIFY_FORMAT="${CEOP_ALERT_FORMAT:-auto}"

now() { date -u +%Y-%m-%dT%H:%M:%SZ; }
log() { printf '%s %s\n' "$(now)" "$1" >>"$LOG"; }

mkdir -p "$(dirname "$LOG")" "$(dirname "$STATE")"

# Optional alert delivery. The webhook URL lives in the environment (cron or
# a service manager), never in the repository; when unset the probe is a
# log/exit-code signal only, exactly as before. A webhook failure must not
# change the probe's own outcome — the log records the delivery attempt.
notify() {
  # $1: event (ALERT|RECOVERED), $2: consecutive failures
  [ -z "$NOTIFY_URL" ] && return 0
  safe_url=$(printf '%s' "$URL" | sed 's/\\/\\\\/g; s/"/\\"/g')
  # Slack expects {"text": ...}; Teams expects MessageCard JSON. Both are
  # detected from the URL so operators can paste the standard webhook URL
  # without writing a custom payload. Anything else keeps the generic JSON.
  # Format selection: explicit CEOP_ALERT_FORMAT (slack|teams|generic) wins;
  # otherwise the URL is inspected for the standard Slack/Teams hosts.
  case "$NOTIFY_FORMAT" in
    slack|teams|generic) ;;
    auto)
      case "$NOTIFY_URL" in
        *hooks.slack.com*) NOTIFY_FORMAT=slack ;;
        *webhookb2*) NOTIFY_FORMAT=teams ;;
        *) NOTIFY_FORMAT=generic ;;
      esac
      ;;
    *)
      log "NOTIFY_FAILED unknown CEOP_ALERT_FORMAT=${NOTIFY_FORMAT} event=$1 failures=$2"
      return 0
      ;;
  esac
  case "$NOTIFY_FORMAT" in
    slack)
      text=$(printf 'CEOP %s: %s（連続失敗 %s 回）' "$1" "$safe_url" "$2")
      payload=$(printf '{"text":"%s"}' "$text")
      ;;
    teams)
      payload=$(printf '{"@type":"MessageCard","@context":"http://schema.org/extensions","summary":"CEOP %s","title":"CEOP %s","text":"対象: %s（連続失敗 %s 回）"}' "$1" "$1" "$safe_url" "$2")
      ;;
    *)
      payload=$(printf '{"event":"%s","target":"%s","consecutiveFailures":%s,"timestamp":"%s"}' "$1" "$safe_url" "$2" "$(now)")
      ;;
  esac
  if curl -fsS --max-time 10 -H 'Content-Type: application/json' -d "$payload" "$NOTIFY_URL" >>"$LOG" 2>&1; then
    log "NOTIFY_OK ${URL} event=$1 failures=$2"
  else
    log "NOTIFY_FAILED ${URL} event=$1 failures=$2"
  fi
}

# Previous consecutive-failure count; absent or corrupt state starts at 0
# rather than failing, so a wiped disk cannot silence the probe.
fails=$(cat "$STATE" 2>/dev/null || echo 0)
case "$fails" in (*[!0-9]*|'') fails=0 ;; esac

# -f: non-2xx is a failure. -s -S: quiet, but keep the error text.
if body=$(curl -fsS --max-time "$TIMEOUT" "$URL" 2>&1); then
  if [ "$fails" -ge "$THRESHOLD" ]; then
    log "RECOVERED ${URL} after ${fails} consecutive failures"
    notify RECOVERED "$fails"
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
  notify ALERT "$fails"
  exit 1
elif [ "$fails" -gt "$THRESHOLD" ]; then
  log "WARN ${URL} still failing (${fails} consecutive) — ${detail}"
  exit 1
else
  log "WARN ${URL} failed (${fails}/${THRESHOLD}) — ${detail}"
  exit 0
fi
