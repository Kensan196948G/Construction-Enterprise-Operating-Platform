# Deployment Guide — Construction DX OS

本番運用に向けた **Construction DX OS** のデプロイ手順をまとめたインデックスです。
各コンポーネントの詳細手順はサブディレクトリの README に記載しています。

> 関連 Issue: [`claudeos/issues/0037-deployment-doc.md`](../claudeos/issues/0037-deployment-doc.md)

---

## 全体構成

```
                        ┌─────────────────────────────┐
                        │  Operator / Engineer        │
                        │  (CLI, browser, deploy job) │
                        └──────────────┬──────────────┘
                                       │
                                       ▼
            ┌──────────────────────────────────────────────────┐
            │  cdx-os-server  (FastAPI / Uvicorn / port 8300)  │
            │  ─ /api/v1/devices, /iso-builds, /admin, ...     │
            │  ─ /metrics (Prometheus exposition)              │
            └──────┬─────────────────────────────────┬─────────┘
                   │                                 │
                   │ asyncpg                         │ /metrics
                   ▼                                 ▼
        ┌────────────────────┐              ┌────────────────────┐
        │  PostgreSQL 17     │              │  Prometheus 3.3    │
        │  (cdx DB / 5432)   │              │  (port 9090)       │
        │  Alembic migrate   │              └─────────┬──────────┘
        └────────┬───────────┘                        │ scrape
                 │                                    ▼
                 │ pg_dump                  ┌────────────────────┐
                 ▼                          │  Grafana 11        │
        ┌────────────────────┐              │  (port 3000)       │
        │  Backup target     │              │  dashboards/       │
        │  (S3 / NFS / disk) │              └────────────────────┘
        └────────────────────┘
```

主要な依存:

| コンポーネント | 役割 | 既定ポート | 必須 |
|---|---|---|---|
| **cdx-os-server** | API / WebUI / 認証ゲート | 8300 | ✅ |
| **PostgreSQL 17** | 永続ストレージ（Phase 2 以降必須） | 5432 | ✅ |
| **Redis 7** | RQ キュー（ISO ビルド非同期実行） | 6379 | ⭕ ISO Builder 利用時 |
| **MinIO** | ISO 成果物の object storage | 9000 | ⭕ ISO Builder 利用時 |
| **Prometheus** | `/metrics` を 15s 間隔で scrape | 9090 | ⭕ 監視運用時 |
| **Grafana** | Prometheus を可視化 | 3000 | ⭕ 監視運用時 |

---

## デプロイ方式

### 方式 A: Docker Compose (推奨 — 本番環境)

最もシンプルな本番デプロイ方法です。nginx TLS終端 + 全サービス含む。

```bash
# 1. 事前準備
cp .env.prod.example .env.prod
# .env.prod を編集して全必須変数を設定

# 2. TLS 証明書を配置
# Let's Encrypt の場合:
#   certbot certonly --nginx -d your-domain.example.com
#   cp /etc/letsencrypt/live/your-domain/fullchain.pem deployment/nginx/certs/
#   cp /etc/letsencrypt/live/your-domain/privkey.pem   deployment/nginx/certs/

# 3. 起動
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d

# 4. スモークテスト
curl -f https://your-domain.example.com/health
```

> nginx 設定は `deployment/nginx/nginx.prod.conf` を参照。
> SSE ログストリーミング・Grafana・Prometheus へのリバースプロキシを含む。

### 方式 B: systemd + PostgreSQL (オンプレミス)

コンテナなしでホスト OS に直接インストールする場合。

```
1. PostgreSQL 起動         → postgres/README.md
2. cdx-os-server (systemd) → systemd/README.md
3. Monitoring              → monitoring/README.md
4. バックアップ自動化       → backup/README.md
```

## サブガイド

| パス | 用途 | 想定読者 |
|---|---|---|
| [`nginx.prod.conf`](nginx/nginx.prod.conf) | nginx TLS リバースプロキシ設定 (方式 A) | SRE / 構築担当 |
| [`systemd/README.md`](systemd/README.md) | cdx-os-server を systemd サービスとして常駐させる | SRE / 構築担当 |
| [`postgres/README.md`](postgres/README.md) | PostgreSQL 17 を本番構成で立ち上げ、Alembic マイグレーションを実行する | DBA / 構築担当 |
| [`monitoring/README.md`](monitoring/README.md) | Prometheus + Grafana の compose 起動とダッシュボード prov | 監視担当 |
| [`backup/README.md`](backup/README.md) | `pg_dump` ベースのバックアップ手順 / リストア手順 | 運用担当 |

> 各 README は他ガイドへの依存なしに**単独で完結**するよう記述しています。

---

## 環境変数のソースオブトゥルース

| ファイル | 用途 |
|---|---|
| `.env.prod.example` | 本番用 — 全必須変数のテンプレート |
| `.env.example` | 開発用 — ローカル開発・テスト用 |

**本番必須変数** (docker-compose.prod.yml が起動時に検証):

| 変数 | 説明 |
|---|---|
| `CDX_DOMAIN` | FQDN (例: `cdx.example.com`) |
| `CDX_REGISTRATION_TOKEN` | デバイス登録トークン |
| `CDX_ADMIN_PASSWORD` | Admin UI パスワード |
| `CDX_BOOTSTRAP_SECRET` | PXE bootstrap secret |
| `POSTGRES_PASSWORD` | PostgreSQL パスワード |
| `GRAFANA_ADMIN_PASSWORD` | Grafana admin パスワード |

`.env.prod` ファイルは **必ず** `chmod 600` に設定し、リポジトリには絶対に含めない。
(`*.env` は `.gitignore` で除外済み)

---

## トラブルシュート索引

| 症状 | 原因切り分け | 参照 |
|---|---|---|
| cdx-os-server が起動直後に exit | `DATABASE_URL` 不一致 / Postgres 未起動 | systemd, postgres |
| `/metrics` が 404 | Prometheus からのみアクセス可。bind / firewall を確認 | monitoring |
| Grafana ダッシュボードが空 | Prometheus datasource 未 provision | monitoring |
| Alembic upgrade で `permission denied` | DB role に `CREATE` / `ALTER` 権限なし | postgres |
| pg_dump が `role does not exist` | Postgres コンテナ vs ホストインストールで peer auth 差 | backup |

---

## リリース要件との対応

- 本ドキュメント整備 = Issue 0037 (P3, Month 4 Quality) の Acceptance Criteria 達成
- 6 ヶ月後の本番リリース (2026-10-10) までに **systemd + postgres + monitoring + backup** の
  4 ガイドが最小完備されている状態を目指す
- 各 README は変更時に同 PR でレビューする（Codex / CodeRabbit / docs hygiene CI）
