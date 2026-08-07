---
id: "0026"
title: "API ドキュメント整備 (OpenAPI descriptions + examples)"
status: done
priority: P3
phase: "Phase 9"
labels: [docs, api, quality]
created: "2026-05-06"
---

## Summary

現在の OpenAPI スキーマには description / example が不足している。
Swagger UI (`/docs`) を見るだけで API の使い方が分かるレベルに引き上げる。

## 対象

- 全エンドポイントに summary + description を追加
- 主要なリクエスト/レスポンスモデルに `json_schema_extra` で example を追加
- `tags` の description を `app.py` で設定

## Acceptance Criteria

- [ ] `/docs` を開いた時に各エンドポイントの説明が読める
- [ ] リクエストボディに example が表示される
- [ ] `scripts/generate_openapi.py --check` が引き続き通る
