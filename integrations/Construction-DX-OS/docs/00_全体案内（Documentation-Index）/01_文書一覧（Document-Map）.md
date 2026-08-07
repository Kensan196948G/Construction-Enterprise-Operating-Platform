# 01_文書一覧（Document-Map）

## 目的

`docs` 配下の情報を探しやすくするためのインデックスです。

## 文書群

- `00_全体案内`: 文書運用、用語、参照ルール
- `01_構想・戦略`: ビジョン、価値、ロードマップ
- `02_要件定義`: 要件、非機能、制約、ユースケース
- `03_プロダクト設計`: UX、ランチャ、利用モード
- `04_アーキテクチャ`: システム構成、責務、データ、API
- `05_クライアントOS`: Debian/XFCE、配布、更新、repo 構造
- `06_cdx-agent`: agent 仕様、同期、収集、systemd
- `07_中央管理基盤`: API、WebUI、**ISO Builder UI**、監視、保存
- `08_セキュリティ・統制`: SSO、権限、監査、通信制御
- `09_運用・保守`: 障害対応、ライフサイクル、運用モデル
- `10_開発・品質管理`: 計画、テスト、CI/CD、リスク

## 重要文書

- [詳細要件定義書](../詳細要件定義書.md)
- [repo初期構成](../repo初期構成.md)
- [live-build構成案](../live-build構成案.md)
- [cdx-agent仕様書](../cdx-agent仕様書.md)
- [Phase 9 async FastAPI 設計](../phase9-async-fastapi-design.md)
- 🆕 [Phase 2 ISO Builder UI 設計](../07_中央管理基盤（Central-Platform）/05_ISO-Builder-UI設計（ISO-Builder-UI-Design）.md)

## Phase 別主要設計

| Phase | 主成果物 | 設計文書 |
|---|---|---|
| Phase 1 ✅ | 最小 ISO + cdx-agent + 管理 WebUI MVP | `05_クライアントOS/03_live-build構成案`, `07_中央管理基盤/02_APIサーバ設計` |
| Phase 2 🔜 | **ISO Builder UI**, 更新基盤, 同期制御 | 🆕 [`07_中央管理基盤/05_ISO-Builder-UI設計`](../07_中央管理基盤（Central-Platform）/05_ISO-Builder-UI設計（ISO-Builder-UI-Design）.md) |
| Phase 3 🔜 | 現場検証、リング配信 | `05_クライアントOS/05_更新管理設計` |
| Phase 4 🔜 | 総合試験・リリース | `10_開発・品質管理` |
