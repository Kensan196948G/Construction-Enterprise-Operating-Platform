# CEOP 本番運用 Runbook

## 1. 構成

- アプリ: Node.js 22+ / TypeScript（ランタイム依存ゼロ）
- 永続化: SQLite（WAL、`/data/ceop.db`）
- 配布: Docker イメージ（GHCR `ghcr.io/<owner>/construction-eop`）
- ヘルス: `GET /health`（liveness）、`GET /health/ready`（readiness）
- ログ: stdout/stderr（json-file ローテーション 10 MiB × 3）

## 2. デプロイ手順（初回）

```bash
# 1. シークレット生成（値は Secrets 管理へ）
openssl rand -hex 32   # CEOP_JWT_SECRET

# 2. イメージ取得
docker pull ghcr.io/<owner>/construction-eop:v0.6.0

# 3. .env 作成（.env.example を複製し CEOP_JWT_SECRET 等を設定）
# 4. マイグレーション
docker run --rm -v ceop-data:/data -e CEOP_SQLITE_FILE=/data/ceop.db \
  -e CEOP_JWT_SECRET=<secret> ghcr.io/<owner>/construction-eop:v0.6.0 \
  node --experimental-strip-types scripts/migrate.ts

# 5. API キー発行（出力は Secrets 管理へ）
docker run --rm -v ceop-data:/data -e CEOP_SQLITE_FILE=/data/ceop.db \
  ghcr.io/<owner>/construction-eop:v0.6.0 \
  node --experimental-strip-types scripts/provision-api-key.ts \
  --subject admin --permissions "*:*"

# 6. 起動
docker compose -f docker-compose.prod.yml up -d

# 7. 確認
curl -fsS http://localhost:3000/health
curl -fsS http://localhost:3000/health/ready
```

## 3. 更新手順

1. 新バージョンを pull し、`docker compose -f docker-compose.prod.yml pull`
2. バックアップ取得（`docs/operations/BACKUP_RESTORE.md`）
3. `docker compose up -d`（migration は起動前コマンドで実施）
4. `/health/ready` とスモークテスト（トークン取得 → 監査ログ取得）を確認
5. 異常があれば直前イメージへ `docker compose up -d <old-image>` で rollback

## 4. Rollback

- コンテナ/イメージ: 旧タグへ差し替え（データベースは維持）
- DB: マイグレーションは後方互換を維持する方針。万一 004 以降で問題があれば
  バックアップから復元（`BACKUP_RESTORE.md`）
- 判断基準: `/health/ready` 5xx が 3 回以上、エラー率 > 5%、認証不能、監査ログ異常

## 5. インシデント対応

1. 影響確認（ヘルス、ログ、DB、ネットワーク）
2. 切り分け（アプリ / DB / ネットワーク / 設定）
3. 対応（rollback / 再起動 / リストア）— 作業ログを運用台帳へ記録
4. 復旧確認（health/ready + スモーク）
5. 事後報告（原因、影響範囲、再発防止、対応時刻）

重大（P0）: データ漏えい・破損・認証全停止 → `SECURITY_RESPONSE.md` の手順を最優先。
