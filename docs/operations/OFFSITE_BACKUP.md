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

| 場所         | 保持期間                           | 世代数目安 |
| ------------ | ---------------------------------- | ---------: |
| ローカル     | 14 日（既存 backup-retention.ts）  |         14 |
| R2           | 90 日（rclone `--min-age` で整理） |         90 |
| R2 `latest/` | 常に最新 1 件                      |          1 |

## 3. 必要となるもの（ユーザー提供）

| 項目                  | 説明                                         | 取得場所                            |
| --------------------- | -------------------------------------------- | ----------------------------------- |
| Cloudflare Account ID | `r2.dev` と API トークンに必要               | Cloudflare Dashboard                |
| R2 API Token          | `Object Read & Write` 権限・対象バケット限定 | Dashboard → My Profile → API Tokens |
| バケット名            | 例: `ceop-backup`                            | R2 コンソールで作成                 |

## 4. セットアップ手順（トークン到着後に実施）

```bash
# 1. rclone インストール（済みの場合はスキップ）
sudo apt-get install -y rclone

# 2. 設定ヘルパーを実行（R2 API トークンの 3 項目を環境変数で渡す）
sudo -E env \
  R2_ACCOUNT_ID=<ACCOUNT_ID> \
  R2_ACCESS_KEY_ID=<ACCESS_KEY_ID> \
  R2_SECRET_ACCESS_KEY=<SECRET_ACCESS_KEY> \
  bash scripts/setup-r2-backup.sh

# 3. 一度だけ全量アップロード（転送後に verify-restore で検証される）
sudo bash scripts/r2-backup.sh
```

`scripts/setup-r2-backup.sh` は rclone リモート `ceop-r2` の作成（S3/Cloudflare 互換・
endpoint 自動設定）・config の 600 化・バケット接続確認・systemd タイマーの有効化まで行います。

> 本スクリプトは実機のローカルリモート（`ceop-test-local`）を使った転送 → 検証 → 保持の
> エンドツーエンド動作確認済みです（2026-08-12）。R2 は同一手順の S3 互換先として動きます。

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
