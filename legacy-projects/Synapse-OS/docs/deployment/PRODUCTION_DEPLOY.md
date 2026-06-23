# 📌 Synapse-OS 本番デプロイ手順書

**対象バージョン**: Sprint 10 (全 Governance Gates G1–G6 完了)
**更新日**: 2026-06-06
**担当**: 人間 CTO / システム管理者

> ⚠️ **重要**: デプロイは必ず人間が手動で実行する。AI CTO は手順書の作成と検証のみを担当し、`docker compose up` を自動実行しない。

---

## 📋 目次

1. [前提条件](#1-前提条件)
2. [環境変数の設定](#2-環境変数の設定)
3. [初回デプロイ手順](#3-初回デプロイ手順)
4. [ヘルスチェック・動作確認](#4-ヘルスチェック動作確認)
5. [アップデート手順](#5-アップデート手順)
6. [ロールバック手順](#6-ロールバック手順)
7. [サービス一覧とポートマップ](#7-サービス一覧とポートマップ)
8. [トラブルシューティング](#8-トラブルシューティング)

---

## 1. 前提条件

### 必須ソフトウェア

| ソフトウェア      | 最低バージョン | 確認コマンド             |
| ----------------- | -------------- | ------------------------ |
| Docker Engine     | 24.0+          | `docker version`         |
| Docker Compose v2 | 2.20+          | `docker compose version` |
| Git               | 2.40+          | `git --version`          |

### ハードウェア要件（推奨）

| リソース | 最小    | 推奨    |
| -------- | ------- | ------- |
| CPU      | 2 cores | 4 cores |
| RAM      | 4 GB    | 8 GB    |
| Disk     | 20 GB   | 50 GB   |

### 確認手順

```bash
# Docker が動作していることを確認
docker info | grep -E "Server Version|Total Memory"

# Docker Compose v2 (プラグイン形式) であることを確認
docker compose version
# → Docker Compose version v2.x.x (v1 の docker-compose は非対応)
```

---

## 2. 環境変数の設定

### 2.1 .env ファイルの作成

```bash
cd /path/to/Synapse-OS

# サンプルをコピー
cp .env.sample .env

# エディタで編集
nano .env  # または vi .env
```

### 2.2 必須設定項目（本番では必ず変更する）

```bash
# === PostgreSQL ===
POSTGRES_USER=synapse_prod        # 本番用ユーザー名
POSTGRES_PASSWORD=<強固なパスワード>  # 16文字以上の乱数推奨
POSTGRES_DB=synapse_prod

# === JWT シークレット ===
# 必ず長い乱数文字列に変更すること。漏洩した場合は全セッションが無効化される。
JWT_SECRET=<64文字以上の乱数>

# 生成例:
# openssl rand -hex 64
```

### 2.3 JWT_SECRET 生成コマンド

```bash
openssl rand -hex 64
# 出力例: 3f7a2b9c1d4e8f0a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5
```

> 🔐 **セキュリティ注意**: `.env` ファイルは `.gitignore` に含まれており、Git には含まれない。バックアップは安全な場所 (パスワードマネージャーなど) に保管すること。

---

## 3. 初回デプロイ手順

### ステップ 1: リポジトリ取得

```bash
git clone https://github.com/Kensan196948G/Synapse-OS.git
cd Synapse-OS
git checkout main
git pull origin main
```

### ステップ 2: 環境変数設定

```bash
cp .env.sample .env
# .env を編集して本番値を設定（§2 参照）
```

### ステップ 3: Docker イメージビルド

```bash
# 全サービスのイメージをビルド（初回は 5–10 分かかる）
docker compose build --no-cache

# ビルド結果の確認
docker compose config --quiet && echo "設定 OK"
```

### ステップ 4: サービス起動

```bash
# バックグラウンドで全サービスを起動
docker compose up -d

# 起動ログをリアルタイム確認（Ctrl+C で抜ける）
docker compose logs -f --tail=50
```

### ステップ 5: ヘルスチェック待機

```bash
# 全サービスが healthy になるまで待機（最大 2 分）
echo "全サービスの起動を待機中..."
until docker compose ps --format json | python3 -c "
import sys, json
services = [json.loads(l) for l in sys.stdin if l.strip()]
unhealthy = [s['Name'] for s in services if s.get('Health','') not in ('healthy','')]
if not unhealthy: print('✅ 全サービス起動完了')
else: sys.exit(1)
" 2>/dev/null; do
  echo "待機中... $(docker compose ps --format '{{.Name}}: {{.Health}}' 2>/dev/null | grep -v healthy | wc -l) サービス未就緒"
  sleep 10
done
```

> ℹ️ postgres → policy/object サービスの順でヘルスチェックが通過する。依存関係が連鎖しているため、postgres が healthy になるまで約 30 秒かかる。

---

## 4. ヘルスチェック・動作確認

### 4.1 サービス状態確認

```bash
# 全サービスの状態一覧
docker compose ps

# 期待する出力:
# NAME                      IMAGE     COMMAND   SERVICE        STATUS         PORTS
# synapse-os-postgres-1     ...       ...       postgres       Up (healthy)   0.0.0.0:5436->5432/tcp
# synapse-os-web-1          ...       ...       web            Up             0.0.0.0:3000->3000/tcp
# ... (全11サービスが Up または Up (healthy))
```

### 4.2 各サービスのヘルスエンドポイント確認

```bash
# スクリプトで一括確認
for port in 8001 8002 8003 8004 8005 8006 8007 8008; do
  status=$(curl -sf http://localhost:${port}/healthz | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('status','?'))" 2>/dev/null || echo "FAIL")
  echo "port ${port}: ${status}"
done

# Web フロントエンド確認
curl -sf -o /dev/null -w "web (3000): HTTP %{http_code}\n" http://localhost:3000/
```

期待する出力:

```text
port 8001: ok
port 8002: ok
port 8003: ok
port 8004: ok
port 8005: ok
port 8006: ok
port 8007: ok
port 8008: ok
web (3000): HTTP 200
```

### 4.3 Web UI アクセス確認

ブラウザで以下の URL にアクセス:

| URL                               | 説明                           |
| --------------------------------- | ------------------------------ |
| `http://localhost:3000`           | メイン Web UI (ログインページ) |
| `http://localhost:3000/dashboard` | ダッシュボード (ログイン後)    |

ログイン確認 (デフォルト管理者アカウント):

```text
Username: admin
Password: admin_password  # 初回ログイン後に必ず変更すること
```

### 4.4 Audit Export エンドポイント確認 (G6 Governance Gate)

```bash
# CSV 形式で監査証跡エクスポート
curl -sf http://localhost:8003/audit-events/export?format=csv | head -5

# JSON 形式で監査証跡エクスポート
curl -sf http://localhost:8003/audit-events/export?format=json | python3 -m json.tool | head -20
```

---

## 5. アップデート手順

### 5.1 コードアップデート (停止最小化)

```bash
# 1. 最新コードを取得
git pull origin main

# 2. 変更されたサービスのみリビルド
docker compose build

# 3. ローリング再起動 (サービスごとに順次再起動)
docker compose up -d --no-deps --build <service-name>
# 例: docker compose up -d --no-deps --build web

# 4. 全サービス再起動 (ダウンタイムあり)
docker compose up -d
```

### 5.2 設定変更のみの場合

```bash
# .env を編集後
docker compose up -d  # 変更された環境変数を持つサービスのみ再起動される
```

---

## 6. ロールバック手順

### 6.1 直前バージョンへのロールバック

```bash
# 1. 現在のコミット SHA を記録
git log --oneline -5

# 2. 直前のコミットに戻す (ステージング環境で先に確認すること)
git checkout <前のコミット SHA>

# 3. イメージリビルドと再起動
docker compose build --no-cache
docker compose up -d

# 4. ヘルスチェック確認 (§4.2 参照)
```

### 6.2 データベースのロールバック

> ⚠️ **注意**: DB スキーマ変更を伴う場合は必ず事前にバックアップを取得すること。

```bash
# バックアップ取得
docker compose exec postgres pg_dump \
  -U ${POSTGRES_USER:-synapse} \
  ${POSTGRES_DB:-synapse} \
  > backup_$(date +%Y%m%d_%H%M%S).sql

# バックアップからリストア (緊急時のみ)
docker compose exec -T postgres psql \
  -U ${POSTGRES_USER:-synapse} \
  ${POSTGRES_DB:-synapse} \
  < backup_YYYYMMDD_HHMMSS.sql
```

### 6.3 完全リセット (最終手段)

```bash
# 全コンテナ・ボリューム削除 (データが消える — 要確認)
docker compose down -v

# 再デプロイ
docker compose up -d
```

---

## 7. サービス一覧とポートマップ

| サービス名        | 内部ポート | 外部公開        | 役割                         | 依存サービス                   |
| ----------------- | ---------- | --------------- | ---------------------------- | ------------------------------ |
| `postgres`        | 5432       | 5436            | PostgreSQL DB                | —                              |
| `tenant-identity` | 8001       | なし (内部のみ) | JWT 認証・テナント管理       | —                              |
| `policy`          | 8002       | なし            | AI ガバナンスポリシー管理    | postgres                       |
| `audit`           | 8003       | なし            | 監査証跡 (G6 Export)         | —                              |
| `object`          | 8004       | なし            | オブジェクト管理 (ABAC)      | postgres, policy, audit        |
| `workflow`        | 8005       | なし            | ワークフロー管理             | object, policy, audit          |
| `ai-gateway`      | 8006       | なし            | AI SDK 集中管理 (ADR-001/G5) | policy, audit                  |
| `federation`      | 8007       | なし            | フェデレーション管理 (G4)    | audit                          |
| `knowledge`       | 8008       | なし            | ナレッジ管理                 | audit                          |
| `dashboard`       | 8009       | なし            | ダッシュボード集約           | object, workflow, audit        |
| `web`             | 3000       | **3000**        | Next.js フロントエンド       | tenant-identity, object, audit |

> 🔐 **ネットワーク設計**: 外部に公開するポートは `3000` (Web UI) のみ。バックエンド API サービスは Docker 内部ネットワーク経由でのみ通信する。PostgreSQL の `5436` は管理用途にのみ使用し、本番ではファイアウォールで制限すること。

---

## 8. トラブルシューティング

### postgres サービスが healthy にならない

```bash
docker compose logs postgres --tail=30
# → "database system is ready to accept connections" が出るまで待機
```

### Web UI にアクセスできない

```bash
# web サービスのログ確認
docker compose logs web --tail=50

# コンテナが起動しているか確認
docker compose ps web
```

### JWT 認証エラー (401 Unauthorized)

```bash
# tenant-identity サービスに JWT_SECRET が正しく渡されているか確認
docker compose exec tenant-identity env | grep JWT_SECRET
```

### audit サービスのデータが消えた

```bash
# audit-data ボリュームが残っているか確認
docker volume ls | grep audit-data

# ボリュームのパスを確認
docker volume inspect synapse-os_audit-data
```

### サービスが再起動ループする

```bash
# restart: unless-stopped により自動再起動する
# ループの原因を確認
docker compose logs <service-name> --tail=100 | grep -i error
```

---

## 📊 Governance Gates チェックリスト (デプロイ前確認)

| Gate  | 内容                 | 確認方法                                                     |
| ----- | -------------------- | ------------------------------------------------------------ |
| ✅ G1 | CI パイプライン      | GitHub Actions 全 job 成功確認                               |
| ✅ G2 | PR レビュー統合      | CodeRabbit + Codex レビュー完了                              |
| ✅ G3 | PostgreSQL 移行      | `docker compose exec postgres pg_isready`                    |
| ✅ G4 | Federation デモ      | `curl http://localhost:8007/healthz`                         |
| ✅ G5 | AI Direct Access CI  | `python -m pytest tests/governance/ -v`                      |
| ✅ G6 | 監査証跡エクスポート | `curl http://localhost:8003/audit-events/export?format=json` |

---

_本手順書は Sprint 10 (2026-06-06) 時点の構成に基づく。_
_次回更新: アーキテクチャ変更・新 Governance Gate 追加時。_
