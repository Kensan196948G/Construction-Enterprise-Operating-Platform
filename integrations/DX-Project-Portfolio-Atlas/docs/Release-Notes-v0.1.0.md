# Release Notes v0.1.0（Phase 1 MVP）

公開日: 2026-07-31（予定）

## 🚀 2026-08-01 追補（Phase 1 本番化・公開）

### WebUI 刷新（スタンドアロンHTML 100%適用）
- ルートの「DX Project Atlas WebUI (standalone).html」を仕様として全画面を React 実装へ移植
- ホーム/KPI・プロジェクト台帳（ドロワー/全画面）・詳細6タブ+運用メッセージ・2D/3D Atlas・
  レビューキュー・同期・通知・管理設定・監査ログ（実API・認証・RBACは維持）

### 本番データ投入（Neon）
- Neon プロジェクト「DX-Project-Portfolio-Atlas」を新規作成し migration + 本番シード投入
- 社外向け18件（Projects/Mirai-DX-Project）・社内向け2件（Projects/Mirai-Project）＝ **20プロジェクト**
- GitHub 実メタデータ（visibility / language / default branch / pushed_at / Issue・PR件数）を反映

### 自動更新・運用データ
- 台帳の「今すぐ更新」（手動）と「自動更新」（既定30分間隔・ON/OFF）を追加
- Issue / Pull Request / GitHub Actions / プロジェクトごとの運用メッセージを同期・表示・記載可能に
- GitHub Token（PAT暫定）を管理設定から保存・テスト可能にし、**実権限を検出して即時表示**
- リポジトリ重複防止（実 node_id への統合）、同期結果の部分成功表示、未分類リポジトリの自動レビュー登録

### Cloudflare 公開（ドメイン・Tunnel・Access）
- サブドメイン **dx-atlas.mirai-dx-platform.com** を DNS（CNAME Proxied）+ Tunnel（dx-project-atlas）で公開
- Cloudflare Access で制限（mirai-const.co.jp ドメイン / 管理者メール）。未認証は Access ログインへ
- API は `Cf-Access-Jwt-Assertion` の Access JWT を検証し email でユーザー引当（SSO + アプリ内 RBAC）
- Tunnel は systemd サービス化（再起動後も自動起動）

## 🎉 新機能

- プロジェクト台帳: 一覧・検索・複合フィルター・ソート・cursor ページング・CSV 出力
- KPI ダッシュボード: 6 カード + 4 チャート（ライフサイクル / 区分 / 領域 / 30 日活動）
- プロジェクト詳細: 概要 / GitHub 観測 / Issue・PR・CI / 関係性 / 履歴・承認 / データ品質
- 2D 関係図: Cytoscape.js（Dagre/Cose、候補=破線・承認=実線、キーボード選択、詳細ドロワー）
- レビューキュー、同期・ジョブ管理（手動同期・再試行）、監査ログ、管理設定
- RBAC（viewer / portfolio_manager / operator / administrator / auditor）+ Cloudflare Access JWT 検証
- 同期基盤: ジョブキュー（SKIP LOCKED・冪等・バックオフ）、Webhook 署名検証・重複排除
- GitHub クライアント（mock/実 API 切替、ETag、rate limit 対応）
- 監視: /api/v1/metrics + Prometheus 設定 + SLO アラート
- 運用: Docker Compose / systemd / バックアップ・復元スクリプト / 各種 Runbook
- E2E テスト（Playwright）: KPI / 一覧→詳細→承認値編集 / 2D 関係図 / レビューキュー解決 / 同期実行
- 変更系 API レート制限（60 秒 30 回）、OpenAPI 公開制限（本番は administrator のみ）

## 🛠 修正・改善

- PATCH /projects/{id} で approved_progress（Decimal）を JSON カラムへ保存できず 500 になる不具合を修正
  （E2E テストで検出。Decimal → float 正規化 + レスポンス数値化）
- 一覧 API の N+1 クエリ最適化（p95 1,607ms → 85ms @500 プロジェクト）

## ⚠️ 既知の問題・制約

| 項目 | 内容 |
| --- | --- |
| OI-001 | GitHub App 未導入（PAT暫定で実同期稼働中）。App 導入範囲の承認が必要 |
| OI-002 | Private リポジトリは administrator のみ閲覧（ポリシー未確定） |
| OI-003 | ✅ 解決: サブドメイン `dx-atlas.mirai-dx-platform.com` を決定・公開（DNS+Tunnel+Access） |
| OI-004 | 通知アダプター未実装（Phase 3） |
| OI-005 | RPO 24h / RTO 8h は初期案 |
| OI-006 | 活動閾値（7/30/90 日）は初期値 |
| OI-007 | README 保存範囲・AI 利用は未決定 |
| 非機能 | ✅ 3D Atlas 実装済み（補助表示・2Dへ誘導）。性能試験（500 ノード）は PoC 時に実施 |
| 依存監査 | ✅ `react-router` 8.3.0（RSC CSRF 修正版）+ React 19 へ移行し解消 |
| 依存監査 | `brace-expansion`（eslint→minimatch 経由・dev 限定）の DoS アドバイザリ 1 件は、override すると eslint が起動不能になるため保留。攻撃経路は「信頼できない glob パターンを eslint に渡す」場合に限られ、本リポジトリの利用形態では非該当。eslint が minimatch 10（依存なし）へ移行した時点で自動解消 |

## 🔒 セキュリティ

- 秘密情報はコード・ログ・ドキュメントに含めない（secret scan を CI で実施）
- Webhook 署名検証・CSV 注入対策・楽観ロック・監査ログを実装

## 📦 構成

- FastAPI + SQLAlchemy 2 + Alembic（PostgreSQL / Neon）
- React + Vite + Cytoscape.js
- Docker Compose + Prometheus + GitHub Actions
