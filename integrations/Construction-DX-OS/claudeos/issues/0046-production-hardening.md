---
id: "0046"
title: "Production Hardening — docker-compose.prod.yml + 環境変数バリデーション + HTTPS 手順"
status: done
resolved: "2026-05-14"
resolution_pr: "#39"
priority: P2
phase: "Month 5 Stabilize"
labels: [production, deployment, security, docker]
created: "2026-05-14"
---

## Summary

MVP RC は docker-compose.yml (dev向け) で動作している。
本番環境向けに以下を整備し、Production Release の前提条件を満たす。

## 対応内容

1. `docker-compose.prod.yml` 作成
   - `CDX_WORKER_MOCK=0` (実 live-build ワーカー)
   - `CDX_STORAGE_BACKEND=postgres` 固定
   - MinIO production 設定
   - secrets をファイル経由で渡す設定例

2. 起動時環境変数バリデーション
   - 必須変数未設定時に明確なエラーメッセージで起動失敗
   - `CDX_BOOTSTRAP_SECRET`, `CDX_ADMIN_PASSWORD`, `DATABASE_URL` 等

3. HTTPS/TLS リバースプロキシ設定例
   - nginx + Let's Encrypt (Certbot) の設定例
   - `deployment/nginx/nginx.prod.conf` 追加

4. ヘルスチェックのproduction用調整
   - Docker healthcheck が適切なタイムアウトで設定されているか確認

## Acceptance Criteria

- [x] `docker-compose.prod.yml` が存在し、`docker compose -f docker-compose.prod.yml config` が通る
- [x] 必須環境変数未設定時に起動が明確なエラーで失敗する (docker compose interpolation)
- [x] `deployment/nginx/nginx.prod.conf` が HTTPS + HTTP→HTTPS リダイレクトを含む
- [x] `.env.prod.example` に全必須変数がドキュメント化されている
- [ ] CI green (lint + test)

## 関連

- Issue 0037 (deployment docs) — done
- MVP RC: Loop 84 / PR #37
