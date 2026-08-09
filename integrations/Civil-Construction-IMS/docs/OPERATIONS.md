# ⚙️ 運用ドキュメント

> Civil Construction IMS - 構築・運用・デプロイ手順

---

## 📌 1. 環境構成

| 環境        | 用途         | インフラ                                  |
| ----------- | ------------ | ----------------------------------------- |
| development | ローカル開発 | Docker Compose (PostgreSQL/MinIO/Redis)   |
| staging     | 検証         | コンテナ + マネージド DB                  |
| production  | 本番         | コンテナ + マネージド DB + Object Storage |

---

## 🔧 2. ローカルセットアップ

```bash
# 1. 依存インストール
pnpm install

# 2. 環境変数
cp .env.example .env

# 3. インフラ起動
docker compose up -d

# 4. DB マイグレーション + シード
pnpm db:migrate
pnpm db:seed

# 5. 開発サーバー
pnpm dev
```

| サービス      | URL                                 |
| ------------- | ----------------------------------- |
| Web           | http://localhost:3000               |
| API           | http://localhost:4000               |
| API Docs      | http://localhost:4000/api/docs      |
| Health        | http://localhost:4000/api/v1/health |
| MinIO Console | http://localhost:9001               |

---

## 🔐 3. 環境変数一覧

| 変数                     | 必須 | 説明                                |
| ------------------------ | ---- | ----------------------------------- |
| `DATABASE_URL`           | ✅   | PostgreSQL 接続文字列               |
| `JWT_SECRET`             | ✅   | JWT 署名鍵 (**未設定時は起動失敗**) |
| `NEXTAUTH_URL`           | ✅   | NextAuth コールバック URL           |
| `NEXTAUTH_SECRET`        | ✅   | NextAuth セッション暗号鍵           |
| `AZURE_AD_CLIENT_ID`     | 本番 | Entra ID クライアント ID            |
| `AZURE_AD_CLIENT_SECRET` | 本番 | Entra ID シークレット               |
| `AZURE_AD_TENANT_ID`     | 本番 | Entra ID テナント ID                |
| `S3_ENDPOINT`            | ✅   | オブジェクトストレージ              |
| `SMTP_HOST`              | 任意 | メール通知                          |
| `TEAMS_WEBHOOK_URL`      | 任意 | Teams 通知                          |

> ⚠️ `JWT_SECRET` / `NEXTAUTH_SECRET` は本番で必ずランダムな強固な値に設定すること。

---

## 🐳 4. Docker ビルド

```bash
# API イメージ
docker build -f apps/api/Dockerfile -t civil-ims-api:latest .

# Web イメージ
docker build -f apps/web/Dockerfile -t civil-ims-web:latest .
```

---

## 🚀 5. デプロイ手順 (本番)

> ⚠️ 本番デプロイは**人間（運用担当者）が手動実行**する。CTO/AI は自動実行しない。

```bash
# 1. マイグレーション (本番 DB に対して)
DATABASE_URL=<prod> pnpm --filter=api run db:migrate:deploy

# 2. イメージビルド & プッシュ
docker build -f apps/api/Dockerfile -t <registry>/civil-ims-api:<tag> .
docker push <registry>/civil-ims-api:<tag>

# 3. コンテナ起動 (orchestrator 経由)
# Kubernetes / ECS / Container Apps 等

# 4. ヘルスチェック確認
curl https://<api-host>/api/v1/health/ready
```

### デプロイ前チェックリスト

- [ ] STABLE 判定 (test/lint/build/CI/security 全通過)
- [ ] マイグレーション差分レビュー済み
- [ ] 環境変数 (secrets) 設定済み
- [ ] バックアップ取得済み
- [ ] ロールバック手順確認済み

---

## 💾 6. バックアップ

| 対象                  | 方法                                   | 頻度         |
| --------------------- | -------------------------------------- | ------------ |
| PostgreSQL            | `pg_dump` / マネージド自動バックアップ | 日次         |
| Object Storage        | バージョニング + レプリケーション      | 継続         |
| 監査ログ (AuditTrail) | 長期保管ポリシーに従う                 | 規格要件準拠 |

---

## 📊 7. 監視

| 項目     | 指標                      |
| -------- | ------------------------- |
| 可用性   | `/api/v1/health` 200 応答 |
| DB 接続  | `/api/v1/health/ready`    |
| 応答時間 | 一覧 3秒 / 詳細 5秒 以内  |
| エラー率 | 5xx レート                |

---

## 🔁 8. CI/CD パイプライン

`.github/workflows/ci.yml` — push/PR で以下を実行:

| ジョブ           | 内容                                        |
| ---------------- | ------------------------------------------- |
| TypeScript Check | `pnpm typecheck`                            |
| Lint             | `pnpm lint`                                 |
| API Unit Tests   | PostgreSQL service + migration + `test:cov` |
| Web Unit Tests   | `vitest run`                                |
| Build            | `pnpm build` (typecheck/lint 成功後)        |
| Security Scan    | `pnpm audit` + gitleaks                     |

---

## 🆘 9. トラブルシューティング

| 症状                                 | 対処                                                      |
| ------------------------------------ | --------------------------------------------------------- |
| Prisma `P1002` advisory lock timeout | DB 接続を確認、`pg_advisory_unlock_all()` 実行            |
| bcrypt native module not found       | `npx node-pre-gyp install --fallback-to-build`            |
| JWT_SECRET エラーで起動失敗          | 環境変数 `JWT_SECRET` を設定                              |
| pnpm `ERR_PNPM_BAD_PM_VERSION`       | `packageManager` フィールドと CI version 指定の競合を解消 |
