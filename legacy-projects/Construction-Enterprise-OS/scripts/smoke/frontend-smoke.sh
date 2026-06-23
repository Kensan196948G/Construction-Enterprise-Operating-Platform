#!/usr/bin/env bash
#
# Frontend E2E smoke test (HTTP-level, browserless).
#
# Verifies that the running Next.js WebUI serves its core routes: each route
# must return HTTP 200 AND contain the shared site title, proving the page was
# server-rendered successfully (not a 404 / 500 / error boundary).
#
# Usage:
#   BASE_URL=http://localhost:3100 scripts/smoke/frontend-smoke.sh
#   # default BASE_URL targets the systemd/docker WebUI on the dev host
#
# Exit code: 0 if all routes pass, 1 if any route fails.

set -uo pipefail

BASE_URL="${BASE_URL:-http://localhost:3100}"
TITLE_MARKER="建設業統合OS"   # rendered by the shared dashboard layout
TIMEOUT="${TIMEOUT:-10}"

# Core MVP routes exercised by the smoke suite.
ROUTES=(
  /dashboard
  /projects
  /documents
  /gis
  /iot
  /bim
  /ai/ocr
  /workflows
  /safety
)

pass=0
fail=0
failed_routes=()

echo "🔎 Frontend smoke test against ${BASE_URL}"
echo "------------------------------------------------------------"

for route in "${ROUTES[@]}"; do
  body="$(curl -s --max-time "${TIMEOUT}" -w $'\n%{http_code}' "${BASE_URL}${route}" 2>/dev/null)"
  code="$(printf '%s' "${body}" | tail -n1)"
  html="$(printf '%s' "${body}" | sed '$d')"

  if [ "${code}" = "200" ] && printf '%s' "${html}" | grep -q "${TITLE_MARKER}"; then
    echo "✅ ${route} → 200 (title OK)"
    pass=$((pass + 1))
  else
    title_hit="no"
    printf '%s' "${html}" | grep -q "${TITLE_MARKER}" && title_hit="yes"
    echo "❌ ${route} → status=${code} title=${title_hit}"
    fail=$((fail + 1))
    failed_routes+=("${route}")
  fi
done

echo "------------------------------------------------------------"
echo "📊 passed=${pass} failed=${fail} total=$((pass + fail))"

if [ "${fail}" -gt 0 ]; then
  echo "🔴 Failed routes: ${failed_routes[*]}"
  exit 1
fi

echo "🟢 All frontend smoke checks passed"
exit 0
