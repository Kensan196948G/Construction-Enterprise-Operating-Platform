---
id: "0039"
title: "Admin SPA: Anthropic Design Canvas 設計バンドル統合 (Phase 1: 静的配信)"
status: done
priority: P2
phase: "Phase 3"
labels: [webui, admin, design, spa]
created: "2026-05-06"
---

## Summary

Anthropic Design Canvas (claude.ai/design) で設計された「建設DX OS 管理WebUI」を
本プロジェクトの管理コンソールとして統合する。Phase 1 では既存 Jinja2 テンプレートを
触らず、新規 SPA を `server/api/static/admin-spa/` に並列インストールして配信する。

設計ソース: `https://api.anthropic.com/v1/design/h/NxV0inm-6ylqHbzfn2dCEA`
- バンドル: README + chats/chat1.md (1133行) + project/*.jsx (9 ファイル)
- 設計仕様: 白背景 / ブルー系アクセント / Plus Jakarta Sans + Noto Sans JP
- 構成: Variant A (サイドバー + ダッシュボード)、8 ページ
  ダッシュボード / 端末管理 / ISO配布 / 更新リング / セキュリティ・ポリシー / 監査ログ / システム設定

## Scope (Phase 1)

- [x] 設計バンドル取得・解析
- [ ] `server/api/static/admin-spa/` ディレクトリ作成
- [ ] `index.html` + 9 個の JSX ファイルをコピー
- [ ] `cdx_server/app.py` に StaticFiles マウント追加 (`/admin-spa/`)
- [ ] `routers/admin.py` に `GET /admin/spa` ルート追加 (auth-gated, リダイレクト)
- [ ] README.md にデザイン由来と新 SPA URL を追記
- [ ] テスト 3 件以上 (静的配信 200, index.html 内容, auth 要否)

## Out of Scope (Phase 2 別 Issue)

- proto-data.jsx のモックを実 API 連携に置き換え
- 既存 Jinja2 テンプレート (`templates/admin/*.html`) の置換
- レスポンシブ実機検証 (タブレット/モバイル)

## Acceptance Criteria

- [ ] `GET /admin-spa/index.html` で 200 + Content-Type: text/html
- [ ] 設計バンドル 9 JSX が全て配信できる
- [ ] 既存 `/admin/devices`, `/admin/iso-builds` は無変更で動作継続
- [ ] CI green (lint + test + coverage)
