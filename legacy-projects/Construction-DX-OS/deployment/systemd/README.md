# CDX-OS Server — systemd デプロイメント

## サービス: `cdx-os-server`

| 項目 | 値 |
|---|---|
| サービス名 | `cdx-os-server` |
| ユニットファイル | `/etc/systemd/system/cdx-os-server.service` |
| バインドアドレス | `0.0.0.0:8300` |
| LAN アクセス | `http://192.168.0.185:8300` |
| 管理 WebUI | `http://192.168.0.185:8300/admin` |
| ヘルス確認 | `http://192.168.0.185:8300/health` |
| API ドキュメント | `http://192.168.0.185:8300/docs` |

## インストール手順

```bash
# 1. .env を生成（初回のみ）
cp .env.example .env
# CDX_REGISTRATION_TOKEN を設定（必須）
python3 -c "import secrets; print(secrets.token_hex(32))"

# 2. 仮想環境セットアップ
cd server/api
python3 -m venv .venv
.venv/bin/pip install -e ".[dev]"

# 3. systemd ユニット登録
sudo cp deployment/systemd/cdx-os-server.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable cdx-os-server
sudo systemctl start cdx-os-server

# 4. 起動確認
sudo systemctl status cdx-os-server
curl http://localhost:8300/health
```

## 運用コマンド

```bash
sudo systemctl status cdx-os-server      # 状態確認
sudo journalctl -u cdx-os-server -f      # ログ追跡
sudo systemctl restart cdx-os-server     # 再起動
sudo systemctl stop cdx-os-server        # 停止
```

## 既存 CDX サービスとのポート競合なし

| サービス | ポート |
|---|---|
| cdx-bcp-backend | 8105 |
| cdx-cab-backend | 8104 |
| cdx-cgrc-backend | 8103 |
| cdx-siem-backend | 8102 |
| cdx-ztig-backend | 8101 |
| **cdx-os-server** | **8300** (本サービス) |

## EnvironmentFile

サービスは `/home/kensan/Projects/Construction-DX-OS/.env` を読み込みます。
このファイルは `.gitignore` に含まれており、リポジトリには含まれません。
`.env.example` を参照して生成してください。

`EnvironmentFile=` に `-` プレフィックスを付けているため、`.env` が存在しなくても
サービス起動は失敗しません（CI 環境などで活用）。

## PostgreSQL 永続化 (Loop 69 / Issue 0029)

`.env` に `DATABASE_URL` を設定すると、`storage_backend` が
`InMemoryStorage` から `PostgresStorage` に自動切り替えされます。
再起動後もデバイス・ハートビート・インベントリが保持されます。

```bash
# DB 作成（初回のみ）
sudo -u postgres psql -c "CREATE ROLE cdxos WITH LOGIN PASSWORD 'change-me';"
sudo -u postgres psql -c "CREATE DATABASE cdxos OWNER cdxos;"

# .env に追加
DATABASE_URL=postgresql+asyncpg://cdxos:change-me@localhost/cdxos

# Alembic マイグレーション
cd server/api
.venv/bin/alembic upgrade head   # asyncpg→psycopg2 自動変換 (Loop 70)

# サービス再起動 → PostgresStorage に切替
sudo systemctl restart cdx-os-server
curl http://localhost:8300/health
# → "storage_backend":"PostgresStorage"
```

## systemd セキュリティ Hardening (Loop 66 / Codex review H-2)

ユニットファイルには以下のセキュリティディレクティブが設定されています:
- `NoNewPrivileges=yes` — setuid/setgid 昇格を禁止
- `PrivateTmp=yes` — /tmp を namespace で分離
- `ProtectSystem=strict` — / と /usr を read-only マウント
- `ProtectHome=read-only` — /home を read-only マウント
- `ReadWritePaths=/home/kensan/Projects/Construction-DX-OS` — プロジェクトディレクトリのみ書き込み許可
- `TimeoutStopSec=30` — graceful shutdown 30秒待機
