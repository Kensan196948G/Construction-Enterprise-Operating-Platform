# 🏗️ Construction Enterprise Operating Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22.6+-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Zero Runtime Deps](https://img.shields.io/badge/runtime%20deps-zero-brightgreen)](package.json)
[![CI](https://img.shields.io/github/actions/workflow/status/kensan/construction-eop/ci.yml?label=CI&logo=github)](/.github/workflows/ci.yml)
[![Tests](https://img.shields.io/badge/tests-45%20pass-brightgreen)](src/)
[![License](https://img.shields.io/badge/license-private-lightgrey)](package.json)

建設会社の **業務ポータル・現場/端末 OS・統制/AI ガバナンス** を統合する上位基盤（coordination layer）です。
個別の業務アプリを吸収せず、**共通ドメイン・統制ゲート・監査証跡・HTTP API** を一元的に提供します。

---

## 📌 概要

| 項目         | 内容                                                                           |
| ------------ | ------------------------------------------------------------------------------ |
| 役割         | 統制・ガバナンス・共通ワークフローの調整基盤                                   |
| バージョン   | v0.2.0                                                                         |
| 言語         | TypeScript 5.7（strict / `noUncheckedIndexedAccess` / 例外を投げない設計）     |
| ランタイム   | Node.js v22.6+（ネイティブ TS 実行・ビルトインテストランナー）                 |
| HTTP サーバ  | node:http ベースの軽量ルーター（フレームワーク依存ゼロ）                       |
| 依存方針     | コア実装は **ランタイム依存ゼロ**（devDependencies に typescript / eslint のみ） |
| パッケージ   | pnpm 10.26.2                                                                   |
| テスト       | 45 tests pass（node:test ビルトインランナー）                                  |
| コンテナ     | Docker multi-stage build（non-root・HEALTHCHECK 付き）                         |

---

## 🧱 アーキテクチャ

```
                          ┌─────────────────────────────────────────────────────┐
                          │           Construction Enterprise Operating Platform │
                          │                                                      │
  [Web Browser]  ─────── │ ─── GET /dashboard  ──┐                             │
                          │     GET /governance   │   [Web SSR Layer]           │
                          │                       │   src/web/ renderer.ts      │
                          │                       ↓                             │
  [REST Client]  ─────── │ ─── HTTP API Gateway ─────────────────────────────  │
   (Bearer token)         │     src/api/server.ts                               │
                          │     src/api/router.ts                               │
                          │          │                                          │
                          │          ▼                                          │
                          │   ┌──────────────────────────────────────────┐     │
                          │   │          Governance Core                  │     │
                          │   │  evaluateAccess (deny-overrides RBAC+ABAC)│     │
                          │   │  AuditLog (SHA-256 hash-chain, tamper)    │     │
                          │   └──────────────────┬───────────────────────┘     │
                          │                       │                             │
                          │          ┌────────────▼──────────────┐             │
                          │          │      Domain Layer (8)      │             │
                          │          │  organization · user · role │             │
                          │          │  device · application      │             │
                          │          │  workflow · policy         │             │
                          │          │  audit-event · common      │             │
                          │          └────────────┬──────────────┘             │
                          │                       │                             │
                          │          ┌────────────▼──────────────┐             │
                          │          │   Persistence Layer        │             │
                          │          │   In-Memory Repositories   │             │
                          │          │   (port interfaces ready   │             │
                          │          │    for DB swap-in)         │             │
                          │          └────────────┬──────────────┘             │
                          │                       │                             │
                          │          ┌────────────▼──────────────┐             │
                          │          │   Adapter Ports (M3)       │             │
                          │          │  CmdbPort · ItsmPort       │             │
                          │          │  ImsPort · LegalOpsPort    │             │
                          │          │  BcpPort · DocumentPort    │             │
                          │          └───────────────────────────┘             │
                          └─────────────────────────────────────────────────────┘
                                                  │
                          ┌───────────────────────▼──────────────────────────────┐
                          │  External Systems (future M4 concrete adapters)       │
                          │  [CMDB]  [ITSM]  [IMS]  [LegalOps]  [BCP]  [DocGen] │
                          └──────────────────────────────────────────────────────┘
```

### ソース構造

```
src/
├── domain/        … 8 コアドメイン（プラットフォームの語彙・Result 型）
│   ├── organization · user · role · device
│   ├── application · workflow · policy · audit-event
│   └── common      … Result 型・ブランド型・バリデーション基盤
├── governance/    … Governance Core（統制ゲート）
│   ├── policy-engine … アクセス決定（deny-overrides RBAC+ABAC）
│   └── audit-log     … 追記専用・SHA-256 ハッシュチェーン監査ログ
├── dashboard/     … ロールベースのリードモデル（アクセス制御付き集計）
│   └── buildDashboard … governance / app health / device / pending approvals
├── adapters/      … 連携ポート（CMDB/ITSM/IMS/LegalOps/BCP/Document）
│   └── in-memory-document-adapter … Document Control 参照実装
├── persistence/   … リポジトリ実装
│   └── in-memory/ … 全ドメインの In-Memory リポジトリ（テスト・開発用）
├── api/           … HTTP API Gateway
│   ├── server.ts  … createServer() — node:http ファクトリ
│   ├── router.ts  … 軽量ルーター（PathParam・Bearer 認証・CORS）
│   ├── middleware/ … auth（HMAC-SHA256 API Key）・request-logger
│   ├── routes/    … health / governance / dashboard / web
│   └── types.ts   … AppContainer・ApiKeyContext 型
├── web/           … SSR レンダラー
│   ├── renderer.ts … buildDashboard → HTML 変換
│   └── templates/ … index.html・governance.html
├── app.ts         … createApp() / start() — ブートストラップ
└── index.ts       … 公開 API エクスポート
scripts/
├── start.ts       … node --experimental-strip-types で直接起動
└── healthcheck.ts … Docker HEALTHCHECK スクリプト
examples/
└── quickstart.ts  … ゼロ依存デモ（ドメイン・統制・ダッシュボード一連）
```

---

## 🌐 API エンドポイント

### 公開エンドポイント（認証不要）

| メソッド | パス           | 説明                                               |
| -------- | -------------- | -------------------------------------------------- |
| GET      | `/health`      | ライブネスプローブ。`{ status, timestamp, uptime }` |
| GET      | `/api/v1/info` | ビルド情報。`{ name, version, environment }`       |
| GET      | `/`            | `/dashboard` へ 302 リダイレクト                   |
| GET      | `/dashboard`   | ダッシュボード HTML（SSR・ゲストビュー）           |
| GET      | `/governance`  | ガバナンス管理 HTML（SSR・ポリシー一覧）           |

### 認証必須エンドポイント（Bearer keyId:secret）

| メソッド | パス                          | 説明                                                                |
| -------- | ----------------------------- | ------------------------------------------------------------------- |
| GET      | `/api/v1/dashboard`           | ロールフィルタ済みダッシュボード JSON                               |
| GET      | `/api/v1/organizations`       | 組織一覧 `{ organizations[], count }`                               |
| GET      | `/api/v1/users`               | ユーザー一覧 `{ users[], count }`                                   |
| GET      | `/api/v1/applications`        | アプリ一覧 `{ applications[], count }`                              |
| GET      | `/api/v1/devices`             | デバイス一覧 `{ devices[], count }`                                 |
| GET      | `/api/v1/governance/policies` | ポリシー一覧 `{ policies[], count }`                                |
| GET      | `/api/v1/governance/audit`    | 監査ログ取得（`?limit=50`、最大 200）                               |
| POST     | `/api/v1/governance/evaluate` | アクセス評価。`{ subject, resource, action, roleIds?, attributes? }` |

#### POST /api/v1/governance/evaluate — リクエスト例

```json
{
  "subject": "user-admin",
  "resource": "audit",
  "action": "read",
  "roleIds": ["role-admin"],
  "attributes": { "department": "governance" }
}
```

#### POST /api/v1/governance/evaluate — レスポンス例

```json
{
  "decision": "allow",
  "reason": "wildcard permission grants resource=audit action=read",
  "matchedPolicyIds": [],
  "subject": "user-admin",
  "resource": "audit",
  "action": "read"
}
```

---

## 🗂️ ドメインモデル

### プラットフォーム 8 ドメイン

| ドメイン       | 役割                                 | 主な不変条件（型/検証で保証）           |
| -------------- | ------------------------------------ | --------------------------------------- |
| `organization` | 本社・支店・現場・協力会社の組織階層 | headquarters は親を持たない             |
| `user`         | 利用者と所属・ロール・状態           | email 形式・status 列挙                 |
| `role`         | 権限の束（`resource:action` 形式）   | 最低 1 権限・トークン形式検証           |
| `device`       | 現場端末（タブレット/センサー等）    | retired 端末は利用者に割当不可          |
| `application`  | 連携アプリと健全性（dashboard 用）   | key は kebab-case・health 列挙          |
| `workflow`     | 承認・通知・タスクの定義             | ステップキー重複不可                    |
| `policy`       | 統制ルール（RBAC + 属性条件 ABAC）   | effect=allow/deny・対象必須             |
| `audit-event`  | 監査証跡の 1 レコード                | 不可変・outcome 列挙（success/denied/…） |

### Governance Core

| コンポーネント   | 機能                                                                                    |
| ---------------- | --------------------------------------------------------------------------------------- |
| `evaluateAccess` | アクセス決定。優先順位 **明示 deny > 明示 allow > RBAC 付与 > 既定 deny**（安全側既定） |
| `AuditLog`       | 追記専用ログ。SHA-256 ハッシュチェーンで改ざんを検知（`verify()` が破断位置を特定）     |

### ロールベースダッシュボード（read model）

`buildDashboard()` は viewer の権限を Governance Core で評価し、**閲覧可能なリソースだけ**に絞った
集計ビュー（governance status / app health / device status / pending approvals）を返す純粋関数です。

| 特性         | 内容                                                                     |
| ------------ | ------------------------------------------------------------------------ |
| アクセス制御 | `read` 権限の無いリソースは除外。`hidden` に除外件数を明示（黙殺しない） |
| 決定論       | `generatedAt` を引数化した純粋関数（副作用なし・テスト容易）             |
| 再利用性     | UI / API / CLI のどの表層からも同一ロジックを使用可                      |

### 連携ポート（adapters）

業務システムは **port interface** 経由で連携し、中核へ吸収しません（ヘキサゴナルアーキテクチャ）。

| ポート                                              | 対象                           | 状態         |
| --------------------------------------------------- | ------------------------------ | ------------ |
| `DocumentPort`                                      | 規程・手順・監査証跡の文書生成 | 参照実装あり |
| `CmdbPort`                                          | 構成アイテム台帳               | 契約定義済   |
| `ItsmPort` / `ImsPort` / `LegalOpsPort` / `BcpPort` | ITSM / 統合管理 / 法務 / BCP   | 契約定義済   |

---

## 🚀 クイックスタート

### 前提条件

- Node.js v22.6 以上
- pnpm v9 以上（または `corepack enable`）

### ローカル開発

```bash
# 依存インストール（devDependencies のみ・ランタイム依存ゼロ）
pnpm install

# ドメイン + ガバナンス + ダッシュボードのデモを実行
pnpm run demo

# API サーバを起動（ポート 3000）
node --experimental-strip-types scripts/start.ts

# ブラウザでアクセス
open http://localhost:3000/dashboard
```

### Docker

```bash
# イメージをビルドして起動
docker compose up --build

# ヘルスチェック確認
curl http://localhost:3000/health

# API テスト（demo credentials は起動ログに表示）
curl -H "Authorization: Bearer <key>:<secret>" http://localhost:3000/api/v1/dashboard
```

### Demo API キーの取得

サーバ起動時に stderr にデモ用 API キーが出力されます。

```
[app] demo API keys (use as: Authorization: Bearer <key>:<secret>)
  admin  key=abc123  secret=xyz789
  viewer key=def456  secret=uvw012
```

---

## 🧪 テスト実行

```bash
# 全テスト実行（45 tests）
pnpm run test

# ウォッチモード（TDD）
pnpm run test:watch

# typecheck + lint + test 一括
pnpm run verify

# 型チェックのみ
pnpm run typecheck

# Lint のみ
pnpm run lint

# Lint 自動修正
pnpm run lint:fix

# ビルド（dist/ に JS + .d.ts 出力）
pnpm run build
```

### 現在の品質状態

| ゲート    | 状態         | 備考                                                   |
| --------- | ------------ | ------------------------------------------------------ |
| typecheck | ✅ pass      | strict・`noUncheckedIndexedAccess`・0 error            |
| lint      | ✅ pass      | ESLint flat config + typescript-eslint・0 warning      |
| test      | ✅ 45/45     | domain + governance + dashboard + adapters + API       |
| build     | ✅ pass      | `dist/` に型定義付き出力                               |
| CI        | ✅ 設定済み  | `.github/workflows/ci.yml`（push / PR トリガー）       |
| Docker    | ✅ multi-stage | non-root ユーザー・HEALTHCHECK 付き                  |

---

## ⚙️ 環境変数

| 変数名          | 既定値                                          | 説明                                          |
| --------------- | ----------------------------------------------- | --------------------------------------------- |
| `PORT`          | `3000`                                          | HTTP サーバがリッスンする TCP ポート          |
| `NODE_ENV`      | `production`                                    | `development` / `production`                  |
| `LOG_LEVEL`     | `info`                                          | `debug` / `info` / `warn` / `error`           |
| `PLATFORM_NAME` | `Construction Enterprise Operating Platform`    | 起動ログ・UI に表示するプラットフォーム名     |
| `API_KEY`       | —                                               | Docker Compose 用ビューアーキー（dev のみ）   |
| `API_KEY_ADMIN` | —                                               | Docker Compose 用管理者キー（dev のみ）       |

> **注意**: API キーは起動時に動的生成されます。本番環境では環境変数経由でシークレットを注入しないでください。永続化層と Key Management Service (KMS) の統合が M4 で計画されています。

---

## 🔐 セキュリティ

### 認証モデル

- **API キー認証**: `Authorization: Bearer keyId:secret` ヘッダ形式
- **秘密保護**: シークレットはプレーンテキストで保存せず、keyId をキーとした **HMAC-SHA256** のみ保持
- **HMAC 検証**: 照合時に定数時間比較（タイミング攻撃耐性）

### ポリシーエンジン（Governance Core）

| 評価優先順位 | ルール                                       |
| ------------ | -------------------------------------------- |
| 1            | **明示 deny** ポリシーが一致 → deny（最高）  |
| 2            | **明示 allow** ポリシーが一致 → allow        |
| 3            | **RBAC 権限**（`resource:action`）が一致 → allow |
| 4            | 上記いずれも一致しない → **deny（安全側既定）** |

ABAC 条件（`{ attribute, equals }`）はポリシーレベルで評価され、
「対象ユーザー属性が条件を満たさなければ deny」という細粒度制御が可能です。

### 監査証跡

- **追記専用**: 既存エントリの変更・削除は API として提供しない
- **改ざん検知**: SHA-256 ハッシュチェーン。`AuditLog.verify()` で破断位置を特定
- **全評価が記録**: `POST /api/v1/governance/evaluate` の全リクエストが自動記録

### HTTP セキュリティヘッダ（SSR ページ）

| ヘッダ                       | 値                   |
| ---------------------------- | -------------------- |
| `X-Content-Type-Options`     | `nosniff`            |
| `X-Frame-Options`            | `SAMEORIGIN`         |
| `Referrer-Policy`            | `same-origin`        |
| `Access-Control-Allow-Origin`| `*`（設定変更可）    |

---

## 🗺️ マイルストーン

| フェーズ | 対象                                                                | 状態         |
| -------- | ------------------------------------------------------------------- | ------------ |
| ✅ M1    | 8 ドメイン定義 + Governance Core（policy-engine + audit-log）       | **completed** |
| ✅ M2    | ロールベースダッシュボード（governance/app health/device/approval） | **completed** |
| ✅ M3    | アダプタポート定義（CMDB/ITSM/IMS/LegalOps/BCP）+ Document 参照実装 | **completed** |
| ✅ M4    | HTTP API Gateway + SSR フロントエンド + In-Memory 永続化層 + Docker | **completed** |
| 🔄 M5   | 認証強化・セッション管理・JWT 対応                                  | **planned**  |
| ⬜ M6   | 外部アダプタ本実装（CMDB/ITSM 接続）・DB 永続化・本番デプロイ       | **planned**  |

---

## 🧩 統合元（legacy 参照）

| 旧プロジェクト                               | 位置付け                                          |
| -------------------------------------------- | ------------------------------------------------- |
| `legacy-projects/Synapse-OS`                 | 統制・Federation・AI Governance・監査ゲートの中核 |
| `legacy-projects/Construction-Enterprise-OS` | 業務ポータル・統合画面の正本候補                  |
| `legacy-projects/Construction-DX-OS`         | 現場端末・標準クライアント・オフライン運用の参照  |

> `legacy-projects` は設計の参照元です。正本化した仕様のみ本基盤へ移植し、移植済み範囲を記録します。

---

## ⚖️ 原則

- 業務アプリを直接吸収しない（連携 = アダプタ）
- セキュリティ・統制・監査・承認を **後付けにしない**
- 実シークレット・本番資格情報・顧客データを含めない
- Result 型で例外を投げない（型安全な失敗表現）
- テストは型・純粋関数・ビルトインランナーで最小依存に保つ
