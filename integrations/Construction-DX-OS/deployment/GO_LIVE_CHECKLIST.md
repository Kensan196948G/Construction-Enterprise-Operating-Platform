# 建設DX OS — 本番稼働前チェックリスト (Go-Live Checklist)

このチェックリストを実行してから本番環境への Go-Live を行うこと。
すべての項目が ✅ になるまでデプロイを進めないこと。

---

## 1. インフラ / Docker

- [ ] `.env.prod` を `.env.prod.example` からコピーし、全必須変数を設定した
  - CDX_DOMAIN=`your-domain.example.com`
  - CDX_REGISTRATION_TOKEN=`<random-hex-32>`
  - CDX_ADMIN_PASSWORD=`<strong-password>`
  - CDX_BOOTSTRAP_SECRET=`<random-hex-32>`
  - POSTGRES_PASSWORD=`<random-hex-24>`
  - GRAFANA_ADMIN_PASSWORD=`<strong-password>`
- [ ] `.env.prod` のパーミッションを `chmod 600` に設定した
- [ ] TLS 証明書を `deployment/nginx/certs/fullchain.pem` と `privkey.pem` に配置した
- [ ] `make prod-validate` がエラーなく通る
- [ ] `docker compose -f docker-compose.prod.yml --env-file .env.prod pull` を実行した

## 2. データベース

- [ ] `cdx-migrate` サービスが `alembic upgrade head` を正常完了する
- [ ] `docker exec cdx-postgres psql -U cdx -c "\dt"` でテーブルが存在する
- [ ] 初回バックアップを `deployment/backup/README.md` に従って設定した
- [ ] `pg_dump` のスモークテストを実施した

## 3. セキュリティ確認

- [ ] `CDX_REGISTRATION_TOKEN` は本番専用の値（開発環境と共有しない）
- [ ] `CDX_BOOTSTRAP_SECRET` は本番専用の値
- [ ] Grafana の admin パスワードを初回ログイン後に変更した
- [ ] nginx の TLS 設定を `curl -sI https://your-domain/health` で確認
  - `HTTP/2 200` が返る
  - `strict-transport-security` ヘッダが含まれる
  - `content-security-policy` ヘッダに `nonce-*` が含まれる
- [ ] `curl http://your-domain/health` が HTTPS にリダイレクト (301/302) される
- [ ] `curl https://your-domain/health` が `{"status":"ok"}` を返す

## 4. 監視 / アラート

- [ ] Prometheus の `https://your-domain/prometheus/` にアクセスできる
- [ ] Grafana の `https://your-domain/grafana/` にアクセスできる
- [ ] Grafana ダッシュボードに cdx-server メトリクスが表示される
- [ ] Grafana アラートルールが「Pending/Normal」状態である
  - HeartbeatStopped
  - ISOBuildFailureRate
  - RateLimitSpike
- [ ] `https://your-domain/metrics` が Prometheus metricsを返す

## 5. API / 機能スモークテスト

```bash
BASE=https://your-domain
TOKEN=<CDX_REGISTRATION_TOKEN>
ADMIN_PASS=<CDX_ADMIN_PASSWORD>

# Health check
curl -sf $BASE/health | jq .

# Dashboard
curl -sf $BASE/api/v1/dashboard | jq .

# Admin UI (要 Basic Auth)
curl -sf -u admin:$ADMIN_PASS $BASE/admin | grep -q "端末一覧"
echo "admin UI: OK"

# Admin SPA
curl -sf $BASE/admin-spa/ | grep -q "建設DX OS"
echo "admin SPA: OK"
```

- [ ] `/health` が `{"status":"ok","redis":"ok"}` を返す（Redis 稼働時）
- [ ] `/api/v1/dashboard` が正常な JSON を返す
- [ ] `/admin` に Basic Auth でアクセスできる
- [ ] `/admin-spa/` が Admin SPA HTML を返す

## 6. PXE / デバイス登録 (実機テスト)

> PXE は実機環境が必要。仮想環境での確認でも可。

- [ ] `POST /api/v1/devices/registration-tokens` が `X-CDX-Bootstrap-Secret` で認可される
- [ ] 1台のテスト端末で PXE ブートが完了する
- [ ] 登録後に `GET /api/v1/devices` にデバイスが表示される
- [ ] ハートビートが `GET /admin` でオンライン表示される

## 7. バックアップ

- [ ] PostgreSQL 自動バックアップが `deployment/backup/README.md` に従って設定済み
- [ ] バックアップのリストアテストを実施した
- [ ] バックアップ先の容量が十分である（ISO 1-3GB/件 × 想定件数）

## 8. ドキュメント / 運用引き継ぎ

- [ ] 運用担当者に `deployment/README.md` を共有した
- [ ] Grafana ダッシュボードの見方を運用担当者に説明した
- [ ] 緊急連絡先・エスカレーションフローを定めた
- [ ] README.md の最終バージョンが最新状態である

---

## Go-Live 判定

全チェック項目が ✅ になった場合にのみ Go-Live を許可する。

```
CTO 署名: _________________ 日付: _________________
```

---

> 参考: `CHANGELOG.md` — v0.1.0 MVP RC 機能一覧
> 参考: `deployment/README.md` — デプロイ詳細手順
