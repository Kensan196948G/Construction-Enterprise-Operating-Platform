#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UNIT_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user"
UNIT_FILE="$UNIT_DIR/cdx-portal-webui.service"

mkdir -p "$UNIT_DIR"

cat > "$UNIT_FILE" <<EOF
[Unit]
Description=Construction DX One Platform WebUI
After=default.target

[Service]
Type=oneshot
WorkingDirectory=$ROOT_DIR
ExecStart=$ROOT_DIR/scripts/cdx-portal-up.sh
ExecStop=/usr/bin/docker compose stop cdx-portal
RemainAfterExit=yes
TimeoutStartSec=180

[Install]
WantedBy=default.target
EOF

chmod +x "$ROOT_DIR/scripts/cdx-portal-env.sh" "$ROOT_DIR/scripts/cdx-portal-up.sh" "$ROOT_DIR/scripts/install-cdx-portal-systemd.sh"
systemctl --user daemon-reload
systemctl --user enable cdx-portal-webui.service

if command -v loginctl >/dev/null 2>&1; then
  loginctl enable-linger "$USER" >/dev/null 2>&1 || true
fi

echo "Installed: $UNIT_FILE"
echo "Start now: systemctl --user start cdx-portal-webui.service"
echo "Status:    systemctl --user status cdx-portal-webui.service"
