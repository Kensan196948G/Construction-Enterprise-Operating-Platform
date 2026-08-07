#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_DIR="/etc/construction-enterprise-os"
UNIT_SRC="${ROOT_DIR}/infra/systemd/construction-enterprise-os-webui.service"
UNIT_DST="/etc/systemd/system/construction-enterprise-os-webui.service"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run with sudo: sudo scripts/webui/install-systemd.sh" >&2
  exit 1
fi

install -d "${ENV_DIR}"
cat >"${ENV_DIR}/webui.env" <<ENV
CONSTRUCTION_OS_HOME=${ROOT_DIR}
WEBUI_PORT_START=3100
WEBUI_PORT_END=3199
ENV

install -m 0644 "${UNIT_SRC}" "${UNIT_DST}"
systemctl daemon-reload
systemctl enable construction-enterprise-os-webui.service
systemctl restart construction-enterprise-os-webui.service
systemctl --no-pager --full status construction-enterprise-os-webui.service
