# debian/ — packaging artifacts for cdx-agent

このディレクトリは Debian package 化 (debhelper) と systemd 統合のための
テンプレート集です。実ファイルとして配置されるパスは下記。

| File | 配置先 |
|---|---|
| `cdx-agent.service` | `/etc/systemd/system/cdx-agent.service` |
| `cdx-agent.timer` | `/etc/systemd/system/cdx-agent.timer` |
| `cdx-agent-inventory.service` | `/etc/systemd/system/cdx-agent-inventory.service` |
| `cdx-agent-inventory.timer` | `/etc/systemd/system/cdx-agent-inventory.timer` |
| `agent.env.example` | `/etc/cdx-agent/agent.env` (operator が編集) |

## デザインメモ

- `cdx-agent.service` は `Type=oneshot` の "enqueue heartbeat → drain" コンボ。
  systemd timer が 1 分毎に起動するため daemon ループは持たない。
- 失敗時は `Restart=` を使わず timer 任せ。`OnUnitActiveSec=1min` が次回起動を保証。
- inventory は別 timer で 1 時間毎。bucket 化 (3600s) と一致。
- ユーザーは `cdx-agent` (システムユーザー)。`useradd --system` で provisioning。
- spool は `/var/lib/cdx-agent/spool/`。systemd の `StateDirectory=` で自動作成。
- `EnvironmentFile=-/etc/cdx-agent/agent.env` の "-" prefix で
  ファイル不在でも起動失敗しない (provisioning 中の race を許容)。

## Phase 2 計画

- `debian/changelog`, `debian/control`, `debian/rules` を加えて `dpkg-buildpackage` で
  `.deb` を生成
- AppArmor profile を `/etc/apparmor.d/usr.bin.cdx-agent` に追加
- audit log path を `/var/log/cdx-agent/` に集約
