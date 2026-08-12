# CEOP オフサイトバックアップ設計（Cloudflare R2 + rclone）

## 1. 目的と現状

現状のバックアップは同一ホストの `/home/kensan/.ceop/backups/` に日次保存されており、
ホスト障害・ディスク故障時にバックアップも同時に失われるリスクがあります。
本設計は、Cloudflare R2（S3 互換 API）へ暗号化して転送し、バックアップを
**ホスト外に保持**することを目的とします。

## 2. 構成

```text
cron 02:15  ── scripts/sqlite-backup.ts ──▶ /home/kensan/.ceop/backups/ceop-YYYYMMDD.db
                                              │
systemd 03:00 ── scripts/r2-backup.sh ────────┤
   （rclone copy --checksum）                ▼
                                  Cloudflare R2: ceop-backup
                                  ├── sqlite/ceop-YYYYMMDD.db
                                  └── latest/
```

保持方針:

| 場所 | 保持期間 | 世代数目安 |
|---|---|---:|
| ローカル | 14 日（既存 backup-retention.ts） | 14 |
| R2 | 90 日（rclone `--min-age` で整理） | 90 |
| R2 `latest/` | 常に最新 1 件 | 1 |

## 3. 必要となるもの（ユーザー提供）

| 項目 | 説明 | 取得場所 |
|---|---|---|
| Cloudflare Account ID | `r2.dev` と API トークンに必要 | Cloudflare Dashboard |
| R2 API Token | `Object Read & Write` 権限・対象バケット限定 | Dashboard → My Profile → API Tokens |
| バケット名 | 例: `ceop-backup` | R2 コンソールで作成 |

## 4. セットアップ手順（トークン到着後に実施）

```bash
# 1. rclone インストール
sudo apt-get install -y rclone

# 2. rclone 設定（対話式。以下は最小項目）
rclone config
#   n) New remote → 名前: ceop-r2
#   type: s3
#   provider: Cloudflare
#   access_key_id / secret_access_key: R2 API トークン
#   endpoint: https://<ACCOUNT_ID>.r2.cloudflarestorage.com
#   region: auto

# 3. 設定ファイルを root のみ読める場所へ
sudo chmod 600 ~/.config/rclone/rclone.conf

# 4. 動作確認
rclone lsd ceop-r2:

# 5. 一度だけ全量アップロード
sudo bash scripts/r2-backup.sh --full
```

## 5. スクリプト（scripts/r2-backup.sh）

実装済みスクリプトは以下を行います。

1. 最新のローカルバックアップを検出
2. `rclone copy` で R2 へ転送（`--checksum`・`--transfers 1`）
3. 90 日より古い R2 オブジェクトを削除（`--min-age 90d`）
4. 転送直後に `scripts/verify-restore.ts` で R2 上の DB を検証（監査チェーン含む）
5. 失敗時は非 0 で終了し journald に記録

## 6. systemd タイマー（毎日 03:00）

```bash
sudo cp deploy/systemd/ceop-r2-backup.service deploy/systemd/ceop-r2-backup.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now ceop-r2-backup.timer
```

## 7. 復元手順

```bash
# リストア対象を確認
rclone ls ceop-r2:sqlite/

# 一時ディレクトリへ取得して検証
rclone copy ceop-r2:sqlite/ceop-20260812.db /tmp/restore/
node --experimental-strip-types scripts/verify-restore.ts /tmp/restore/ceop-20260812.db

# 本番 DB を置き換える場合は RUNBOOK §4（Rollback）に従い、事前に現行 DB を退避
```

## 8. 四半期復元試験（必須）

- 毎四半期 1 回、上記の復元手順を実施し、`verify-restore` が OK になることを確認
- 実施日・結果を `docs/operations/OPERATIONS_LEDGER.md` に記録
- 初回試験は R2 導入後 1 か月以内に実施すること
