# Backup & Restore Guide

cdx-os-server が依存する PostgreSQL を `pg_dump` ベースで定期バックアップし、
任意の時点へ復旧するための手順です。Phase 2 以降は Postgres 必須のため、
本ガイドは本番運用の **必須準備項目** に分類されます。

> 関連: [`../postgres/README.md`](../postgres/README.md) | [`../README.md`](../README.md)

---

## 前提

- Postgres 17 系（Docker / ホストインストールいずれも可）
- バックアップ保管先: ローカルディスク / NFS / S3 互換 object storage のいずれか
- バックアップ容量見積: dump サイズは生 DB の 30〜50%（gzip 後）
- 保持ポリシー: 日次 14 世代 + 週次 8 世代 + 月次 12 世代（GFS）を推奨

---

## 何をバックアップするか

| 対象 | 方法 | 必須 |
|---|---|---|
| `cdx` データベース | `pg_dump -Fc` | ✅ |
| `alembic_version` テーブル | DB に同梱 | ✅（dump で自動含有） |
| ISO 成果物（MinIO） | MinIO 側のバックアップ機能 | ⭕ ISO Builder 利用時 |
| `/etc/cdx-os/server.env` | rsync / 構成管理ツール | ✅（秘匿情報のため別経路で暗号化保管） |
| `cdx-os-server` ログ | `journalctl --user --since` 等で別途 | ⭕ 監査要件次第 |

> ローテーション中の WAL を取りたい場合は `pg_basebackup` + `archive_command` 構成を
> 別途検討すること。本ガイドは論理 dump 中心。

---

## バックアップ（pg_dump）

### A. ホストインストール Postgres

```bash
sudo -u postgres pg_dump \
    --format=custom \
    --no-owner \
    --no-privileges \
    --dbname=cdx \
    --file=/var/backups/cdx/cdx-$(date -u +%Y%m%dT%H%M%SZ).dump

# サイズ確認
ls -lh /var/backups/cdx/ | tail -3
```

### B. Docker Compose Postgres

```bash
TS=$(date -u +%Y%m%dT%H%M%SZ)
docker compose exec -T postgres \
    pg_dump --format=custom --no-owner --no-privileges --dbname=cdx \
    > /var/backups/cdx/cdx-${TS}.dump
gzip -9 /var/backups/cdx/cdx-${TS}.dump      # 任意（custom 形式は既に圧縮済）
```

### C. 整合性チェック（必須）

dump を取った直後に必ずヘッダ検証する：

```bash
pg_restore --list /var/backups/cdx/cdx-*.dump | head -5
# → リビジョン情報・テーブル一覧が読めれば OK
```

---

## 自動化: cron / systemd timer

### `/etc/cron.daily/cdx-pg-dump`

```bash
#!/bin/bash
set -euo pipefail

BACKUP_DIR=/var/backups/cdx
RETENTION_DAYS=14
TS=$(date -u +%Y%m%dT%H%M%SZ)

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

# Dump (custom format = compressed)
docker compose -f /opt/cdx-os/docker-compose.yml exec -T postgres \
    pg_dump --format=custom --no-owner --no-privileges --dbname=cdx \
    > "$BACKUP_DIR/cdx-${TS}.dump"

# Validate header
pg_restore --list "$BACKUP_DIR/cdx-${TS}.dump" > /dev/null

# Retain only last N days
find "$BACKUP_DIR" -name 'cdx-*.dump' -mtime +${RETENTION_DAYS} -delete

# Optional: copy to remote
# aws s3 cp "$BACKUP_DIR/cdx-${TS}.dump" s3://cdx-backups/postgres/
```

```bash
sudo install -m 700 cdx-pg-dump /etc/cron.daily/cdx-pg-dump
# 動作確認
sudo /etc/cron.daily/cdx-pg-dump
```

### systemd timer 版（推奨）

`/etc/systemd/system/cdx-backup.service`:

```ini
[Unit]
Description=cdx-os PostgreSQL nightly dump
After=network-online.target

[Service]
Type=oneshot
ExecStart=/usr/local/sbin/cdx-pg-dump
User=root
PrivateTmp=yes
ProtectSystem=strict
ReadWritePaths=/var/backups/cdx
```

`/etc/systemd/system/cdx-backup.timer`:

```ini
[Unit]
Description=Run cdx-pg-dump nightly

[Timer]
OnCalendar=*-*-* 02:30:00 UTC
Persistent=true

[Install]
WantedBy=timers.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now cdx-backup.timer
systemctl list-timers cdx-backup.timer
```

---

## 暗号化（推奨）

dump にはユーザー識別子・端末イベント等の業務データが含まれるため、保管前に暗号化する。

### age を使った例

```bash
# 受信者鍵（公開鍵）を保管側で生成し、バックアップサーバーに公開鍵だけを置く
age-keygen -o /root/.cdx-backup-key.txt   # 復旧時のみ必要
public_key=$(grep 'public key:' /root/.cdx-backup-key.txt | awk '{print $4}')

# dump を暗号化
age -r "$public_key" \
    -o "$BACKUP_DIR/cdx-${TS}.dump.age" \
    "$BACKUP_DIR/cdx-${TS}.dump"
shred -u "$BACKUP_DIR/cdx-${TS}.dump"
```

> 秘密鍵 (`/root/.cdx-backup-key.txt`) は **同じサーバーに置かない**。
> オフサイト（YubiKey / 紙保管 / KMS）が原則。

---

## リストア手順

### 1. 事前確認

```bash
# 既存 DB を上書きする前に必ず別名 DB に restore して中身を確認する
sudo -u postgres createdb cdx_restore_test
sudo -u postgres pg_restore \
    --no-owner --no-privileges --jobs=2 \
    --dbname=cdx_restore_test \
    /var/backups/cdx/cdx-20260506T023000Z.dump

# 件数チェック
sudo -u postgres psql -d cdx_restore_test -c "
SELECT 'device' AS t, COUNT(*) FROM device
UNION ALL SELECT 'device_event', COUNT(*) FROM device_event
UNION ALL SELECT 'iso_build_job', COUNT(*) FROM iso_build_job
UNION ALL SELECT 'audit_log',     COUNT(*) FROM audit_log;
"
```

### 2. 本番リストア（破壊的・要メンテナンス窓）

```bash
# 1. cdx-os-server を停止
sudo systemctl stop cdx-os-server

# 2. 既存 DB を退避
sudo -u postgres pg_dump -Fc cdx > /var/backups/cdx/pre-restore-$(date -u +%Y%m%dT%H%M%SZ).dump

# 3. DB を作り直す
sudo -u postgres dropdb cdx
sudo -u postgres createdb cdx -O cdx

# 4. リストア
sudo -u postgres pg_restore \
    --no-owner --no-privileges --jobs=4 \
    --dbname=cdx \
    /var/backups/cdx/cdx-20260506T023000Z.dump

# 5. Alembic リビジョン確認（dump に含まれているはず）
cd /opt/cdx-os/server/api
.venv/bin/alembic current

# 6. cdx-os-server 再起動
sudo systemctl start cdx-os-server
curl -fsS http://localhost:8300/api/v1/healthz
```

### 3. リストアドリル（年 1 回以上）

「バックアップは取れているのに復旧できない」を防ぐため、**ステージング環境で
年 1 回以上、実際に dump からの復旧を実施する**。日付・所要時間・件数差分を
記録すること（本番障害時の SLA 試算に使う）。

---

## トラブルシュート

| 症状 | 切り分け |
|---|---|
| `role "cdx" does not exist` | リストア先 DB に `cdx` ロール未作成。`postgres/README.md` の role 作成を先に実行 |
| `permission denied for schema public` | `--no-owner --no-privileges` を付けて再 restore |
| `relation already exists` | 既存 DB へ追記しようとしている。`dropdb` → `createdb` してから restore |
| `pg_restore: error: could not read from input file` | dump ファイル破損 / 転送中切断。サイズと SHA256 を取り直す |
| dump 容量が急増 | `device_event` の保持期間を見直す（partitioning 検討） |

---

## 運用ポリシー（テンプレ）

| 項目 | 推奨値 | 備考 |
|---|---|---|
| バックアップ頻度 | 日次（02:30 UTC） | システム負荷の少ない時間帯 |
| 保持期間 | 日次 14 / 週次 8 / 月次 12 | 監査要件に合わせて調整 |
| 保管先冗長 | local + S3 互換 2 箇所 | 同一データセンター集中を避ける |
| 暗号化 | age または KMS-managed | 鍵はオフサイトで管理 |
| 動作試験 | 年 1 回以上 | リストアドリル実施記録を残す |
| 通知 | 失敗時 Slack/メール | systemd timer の OnFailure= を活用 |

---

## 参考

- PostgreSQL 公式: https://www.postgresql.org/docs/17/app-pgdump.html
- age（暗号化）: https://github.com/FiloSottile/age
- 関連 Issue: `claudeos/issues/0037-deployment-doc.md`
