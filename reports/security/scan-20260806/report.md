# CEOP Security Review — 2026-08-06

> 単一パス・レポジトリスコープのセキュリティレビュー（Codex CLI 環境で実施）。
> 専任サブエージェントのメッセージ配信が環境不具合で利用できなかったため、主任エージェントが
> 手順を順次実行した。成果物は本レポート + `findings/` + `hardening/`。

## スコープ

- 本番デプロイ対象: `src/`, `scripts/`, ルート設定（package.json, tsconfig*, eslint.config.js,
  .env.example, Dockerfile, docker-compose*.yml, .github/workflows/）, `docs/openapi.yaml`
- スコープ外: `legacy-projects/`（設計参照コード。秘密スキャンのみ実施）

## スレットモデル（要約）

### 資産

- 認証情報（API キー秘密、JWT 署名鍵、API キーハッシュ DB）
- 監査証跡（改ざん検知ハッシュチェーン）
- 業務データ（組織・ユーザー・ロール・デバイス・アプリケーション・ポリシー・ワークフロー）
- HTTP API / SSR UI / SQLite データベース / Docker イメージ

### 信頼境界

1. インターネット ⇔ HTTP サーバ（認証・レート制限・ボディ制限）
2. 認証済みクライアント ⇔ ビジネスルート（RBAC/ABAC 権限ゲート）
3. アプリ ⇔ SQLite（FK・WAL・マイグレーション）
4. 開発者/CI ⇔ リポジトリ・イメージ（シークレット・サプライチェーン）

### 主要脅威

- 認証情報の総当たり/辞書攻撃（レート制限で緩和）
- JWT 偽造・alg 混乱・期限操作（HS256 固定・HMAC 検証・iat/exp 検証で緩和）
- 認可バイパス（deny-overrides + 属性 spread 順序修正で緩和）
- 監査ログ改ざん（SHA-256 チェーン + verify() で検知）
- インジェクション（SQL 識別子ホワイトリスト・HTML エスケープ・CSP）
- DoS（ボディ 1 MiB・グローバル/認証レート制限・bucket cap）
- サプライチェーン（devDependencies 監査、Actions 権限、ブランチ保護）

## カバレッジ台帳

| 領域 | 確認内容 | 結果 |
|---|---|---|
| 認証 | API key HMAC 定数時間比較、JWT HS256/検証/失効/期限 | ✅ 問題の指摘分は修正済み |
| 認可 | 全ルートの権限ゲート、ABAC deny-overrides | ✅ 監査（dashboard/audit 情報漏洩は M16 で修正済み） |
| 監査 | evaluate + mutation 全記録、改ざん検知、actor 詐称防止 | ✅ v0.6.0 で mutation 網羅 |
| 入力検証 | ドメインファクトリ、ボディ 1 MiB、URL デコード | ✅ |
| HTTP セキュリティ | CSP/HSTS/ヘッダ/CORS opt-in | ✅ v0.6.0 で API ヘッダ追加 |
| レート制限 | auth 10/min + グローバル 300/min、bucket cap | ✅ |
| 永続化 | FK、WAL、migration 冪等性、識別子検証 | ✅ migration 004 + テスト |
| シークレット | 履歴/ツリーのスキャン、.env 例の確認 | ✅ 検出なし |
| 依存関係 | pnpm audit --audit-level=high | ✅ 0 vulnerabilities |
| CI/CD | workflows の権限、セキュリティ job | ✅（Actions 権限の絞り込みは GitHub 設定で対応予定） |
| インフラ | Docker non-root/HEALTHCHECK/Compose | ✅ |

## Findings

### 修正済み（v0.6.0 に含む）

| ID | 重大度 | 内容 | 根拠 | 対策 |
|---|---|---|---|---|
| SEC-001 | P1 | devDependencies 経由の high 脆弱性 7 件（brace-expansion, js-yaml） | `pnpm audit` | pnpm overrides + lockfile 更新 → 0 件 |
| SEC-002 | P1 | 本番マイグレーションに FK 制約が無い（README/state の主張と不一致） | `scripts/migrate.ts` 001 と `base-sqlite-repository.ts` の差分 | migration 004 で再構築 + `foreign_key_check` + テスト |
| SEC-003 | P1 | CRUD/認証イベントが監査ログ未記録 | `rg auditLog` で evaluate のみ | `src/api/audit.ts` で全 mutation を記録 |
| SEC-004 | P2 | JWT `iat >= exp` を受容 | `src/api/middleware/jwt.ts` | malformed として拒否 |
| SEC-005 | P2 | JWT 失効 API なし | routes 一覧 | `POST /api/v1/auth/revoke`（永続 revocation store） |
| SEC-006 | P2 | API JSON 応答にセキュリティヘッダなし | `router.writeJson` | nosniff / DENY / no-referrer / no-store を付与 |
| SEC-007 | P2 | `/api/v1/*` にグローバルレート制限なし | server コード | per-socket-IP 300 req/min + 設定 env |
| SEC-008 | P2/P3 | OpenAPI の health パス誤り・ライセンス表記 MIT | generator | `/health` 修正、Proprietary に修正 |

### 未修正（バックログ）

| ID | 重大度 | 内容 | 現状の緩和 | 推奨 |
|---|---|---|---|---|
| SEC-009 | P2/P3 | SSR の CSP が `unsafe-inline`（テンプレートのインライン script/style） | 全ユーザーデータを esc()、入力由来コードは無し | nonce/hash 方式へ移行（次期） |
| SEC-010 | P3 | リクエスト ID / 相関 ID なし | ログに時刻+パス | 相関 ID ミドルウェア追加 |
| SEC-011 | P3 | TLS 終端のサンプル設定なし | プロキシ（nginx/TLS）前提と文書化 | nginx サンプルをバックログ |
| SEC-012 | P3 | ブラウザが JWT を localStorage に保持 | CSP + esc() + short TTL | httpOnly cookie / セッション方式の検討 |
| SEC-013 | P2 | API キー失効の管理 API/UI なし | DB から行削除で失効可 | 失効/一覧 API を次期実装 |

## Hardening（適用済みサマリ）

`hardening/hardening.md` に一覧。適用済みは上記 SEC-001〜008、バックログは SEC-009〜013。

## 制限事項

- 本レビューは単一パスの静的/動的確認であり、専任サブエージェントによる複数視点の
  exhaustive スキャンではない（環境制約による代替）。
- ペネトレーションテスト・外部スキャナ（CodeRabbit 等）は PR で別途実施。
- 本番デプロイ先のネットワーク・TLS・IdP 連携は未確認。
