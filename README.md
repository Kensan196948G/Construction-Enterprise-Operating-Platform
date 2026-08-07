# 🏗️ Construction Enterprise Operating Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22.13+-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Zero Runtime Deps](https://img.shields.io/badge/runtime%20deps-zero-brightgreen)](package.json)
[![CI](https://img.shields.io/github/actions/workflow/status/Kensan196948G/Construction-Enterprise-Operating-Platform/ci.yml?label=CI&logo=github)](/.github/workflows/ci.yml)
[![Tests](https://img.shields.io/badge/tests-277%20pass-brightgreen)](src/)
[![Security](https://img.shields.io/badge/security-hardened-blue)](src/api/middleware/auth.ts)
[![License](https://img.shields.io/badge/license-proprietary-lightgrey)](LICENSE.md)

建設会社の **業務ポータル・現場/端末 OS・統制/AI ガバナンス** を統合する上位基盤（coordination layer）です。
個別の業務アプリを吸収せず、**共通ドメイン・統制ゲート・監査証跡・HTTP API** を一元的に提供します。

---

## 📌 概要

| 項目         | 内容                                                                                                                                                                           |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 役割         | 統制・ガバナンス・共通ワークフローの調整基盤                                                                                                                                   |
| バージョン   | v0.7.1（WebUI ホスティング: デザインバンドル 100% 適用配信・systemd 常駐・Neon アクセスログ。基盤: SQLite 永続化・JWT 認証・監査証跡のテナント分離・CRUD/Workflow/Policy API） |
| 言語         | TypeScript 5.7（strict / `noUncheckedIndexedAccess` / 例外を投げない設計）                                                                                                     |
| ランタイム   | Node.js v22.13+（ネイティブ TS 実行・ビルトインテストランナー）                                                                                                                |
| HTTP サーバ  | node:http ベースの軽量ルーター（フレームワーク依存ゼロ）                                                                                                                       |
| 依存方針     | コア実装は **ランタイム依存ゼロ**（devDependencies に typescript / eslint のみ）                                                                                               |
| パッケージ   | pnpm 10.26.2                                                                                                                                                                   |
| テスト       | 277 tests pass（node:test ビルトインランナー）                                                                                                                                 |
| コンテナ     | Docker multi-stage build（non-root・HEALTHCHECK 付き）                                                                                                                         |
| セキュリティ | HMAC-SHA256 + HS256 JWT・timingSafeEqual・RBAC 権限ゲート・CSP ヘッダ・1 MiB 制限                                                                                              |

---

## 🧱 アーキテクチャ全体図

```mermaid
flowchart TD
    Browser["🌐 Web Browser"] -->|GET /dashboard\nGET /governance| WebSSR
    RestClient["🔌 REST Client\n(Bearer keyId:secret)"] -->|/api/v1/*| APIGateway
    JwtClient["🔑 JWT Client\n(Bearer <jwt>)"] -->|/api/v1/*| APIGateway
    AuthClient["🔓 Auth Client"] -->|POST /api/v1/auth/token| APIGateway

    subgraph Platform["🏗️ Construction Enterprise Operating Platform"]
        subgraph HTTP["HTTP Layer · src/api/"]
            APIGateway["🔀 Router\nrouter.ts\n1MiB body limit\nremoteAddress"]
            AuthMW["🔐 Auth Middleware\nAPI Key: HMAC-SHA256\nJWT: HS256 timingSafeEqual"]
            JwtMW["🎫 JWT Issuer\njwt.ts\n1h expiry・jti replay guard"]
            RateLimiter["⏱ Rate Limiter\nsliding-window per socket IP\nauth: 10 req/min・API 全体: 300 req/min"]
            WebSSR["🖥️ SSR Renderer\nweb/renderer.ts\nCSP Headers"]
            APIGateway --> AuthMW
            APIGateway --> RateLimiter
            RateLimiter --> JwtMW
        end

        subgraph Governance["Governance Core · src/governance/"]
            PolicyEngine["⚖️ Policy Engine\ndeny-overrides\nRBAC + ABAC"]
            AuditLog["📋 Audit Log\nSHA-256 hash-chain\ntamper-evident"]
        end

        subgraph Domain["Domain Layer · src/domain/"]
            D1["🏢 organization"]
            D2["👤 user"]
            D3["🎭 role"]
            D4["📱 device"]
            D5["🗂️ application"]
            D6["🔄 workflow"]
            D7["📜 policy"]
            D8["🔍 audit-event"]
        end

        subgraph Persistence["Persistence Layer · src/persistence/"]
            InMem["💾 In-Memory\n×6 repos\n(テスト・開発)"]
            FilePersist["📂 File-backed\n×6 repos\nPOSIX-atomic writes\nCEOP_DATA_DIR"]
            SQLite["🗄️ SQLite\n×6 repos\nWAL・node:sqlite\nCEOP_SQLITE_FILE"]
        end

        subgraph Adapters["Adapter Ports · src/adapters/"]
            A1["📁 CMDB Port"]
            A2["🎫 ITSM Port"]
            A3["⚙️ IMS Port"]
            A4["⚖️ LegalOps Port"]
            A5["🛡️ BCP Port"]
            A6["📄 Document Port\n(参照実装あり)"]
        end

        AuthMW --> PolicyEngine
        JwtMW --> AuthMW
        PolicyEngine --> AuditLog
        PolicyEngine --> Domain
        AuditLog --> Domain
        WebSSR --> PolicyEngine
        Domain --> InMem
        Domain --> FilePersist
        Domain --> SQLite
        InMem --> Adapters
        FilePersist --> Adapters
        SQLite --> Adapters
    end

    subgraph External["🌍 External Systems (M8 計画)"]
        EXT1["CMDB"]
        EXT2["ITSM"]
        EXT3["IMS / LegalOps / BCP"]
        EXT4["DocGen"]
    end

    Adapters -->|将来接続| External
```

---

## 📂 ソース構造

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
│   ├── in-memory/ … 全ドメインの In-Memory リポジトリ（テスト・開発用）
│   ├── file/      … POSIX-atomic ファイル永続化（×6 ドメイン・CEOP_DATA_DIR）
│   └── sqlite/    … SQLite 永続化（×6 ドメイン・WAL・node:sqlite・CEOP_SQLITE_FILE）
├── api/           … HTTP API Gateway
│   ├── server.ts  … createServer() — node:http ファクトリ
│   ├── router.ts  … 軽量ルーター（API key + JWT dual auth・1 MiB 制限・remoteAddress）
│   ├── middleware/
│   │   ├── auth.ts         … API key 検証（HMAC-SHA256 + timingSafeEqual）
│   │   ├── jwt.ts          … HS256 JWT 発行・検証（createJwtIssuer・1h 有効期限）
│   │   ├── rate-limiter.ts … スライディングウィンドウ（auth 10 / API 全体 300 req/min・per socket IP）
│   │   └── request-logger.ts
│   ├── routes/    … health / auth / governance / dashboard / entity-crud / web
│   └── types.ts   … AppContainer・ApiKeyContext・ApiRequest（remoteAddress）型
├── web/           … SSR レンダラー
│   ├── renderer.ts … buildDashboard → HTML 変換（XSS エスケープ）
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

### 🔓 公開エンドポイント（認証不要）

| メソッド | パス                 | 説明                                                                                            |
| -------- | -------------------- | ----------------------------------------------------------------------------------------------- |
| `GET`    | `/health`            | ライブネスプローブ。`{ status, timestamp, uptime }`                                             |
| `GET`    | `/health/ready`      | レディネスプローブ。永続化層を確認して `{ status, storage, timestamp }`                         |
| `GET`    | `/api/v1/info`       | ビルド情報。`{ name, version, environment }`                                                    |
| `GET`    | `/`                  | `/dashboard` へ 302 リダイレクト（認証不要）                                                    |
| `POST`   | `/api/v1/auth/token` | API キーを JWT に交換。`{ credential: "keyId:secret" }` → `{ token, expiresIn: 3600, subject }` |

> ⏱ `/api/v1/auth/token` はレート制限あり（**10 req/min per socket IP**）。超過時は `429 Too Many Requests` + `X-RateLimit-*` ヘッダ。

### 🔐 認証必須エンドポイント — ダッシュボード・統制（`Bearer keyId:secret`）

| メソッド | パス                              | 必要権限            | 説明                                                                                                                                                                                                         |
| -------- | --------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `GET`    | `/dashboard`                      | 認証のみ            | ダッシュボード HTML（SSR・ロールベース表示）                                                                                                                                                                 |
| `GET`    | `/governance`                     | `policy:read`       | ガバナンス管理 HTML（SSR・ポリシー一覧）                                                                                                                                                                     |
| `GET`    | `/api/v1/dashboard`               | 認証のみ            | ロールフィルタ済みダッシュボード JSON                                                                                                                                                                        |
| `GET`    | `/api/v1/organizations`           | `organization:read` | 組織一覧（ページネーション）`{ organizations[], count, total, limit, offset }`                                                                                                                               |
| `GET`    | `/api/v1/users`                   | `user:read`         | ユーザー一覧（ページネーション）`{ users[], count, total, limit, offset }`                                                                                                                                   |
| `GET`    | `/api/v1/applications`            | `application:read`  | アプリ一覧（ページネーション）`{ applications[], count, total, limit, offset }`                                                                                                                              |
| `GET`    | `/api/v1/devices`                 | `device:read`       | デバイス一覧（ページネーション）`{ devices[], count, total, limit, offset }`                                                                                                                                 |
| `GET`    | `/api/v1/governance/policies`     | `policy:read`       | ポリシー一覧（ページネーション）`{ policies[], count, total, limit, offset }`                                                                                                                                |
| `GET`    | `/api/v1/governance/audit`        | `audit:read`        | 監査ログ取得（`?limit=50&offset=0`、limit 最大 200）。**組織スコープ付き資格情報は自組織のエントリのみ**                                                                                                     |
| `GET`    | `/api/v1/governance/audit/export` | `audit:export`      | 監査証跡のファイル出力（`?format=csv\|json&limit=1000&offset=0`、limit 最大 10000）。テナントスコープは上と同一。`sequence`/`previousHash`/`hash` を含み受領側でチェーン再検証可能。**拒否も監査記録される** |
| `POST`   | `/api/v1/governance/evaluate`     | 認証のみ            | アクセス評価。評価結果は監査ログへ自動記録                                                                                                                                                                   |
| `POST`   | `/api/v1/auth/revoke`             | `auth:write`        | 現在の JWT を失効（ログアウト）。JWT Bearer 必須                                                                                                                                                             |

### 🎨 WebUI デザイン（v0.6.1）

ダッシュボード/ガバナンス画面を Claude 系デザイン言語（温かいペーパー基調・
テラコッタアクセント・セリフ見出し・余白を活かしたミニマル構成）で刷新しました。
CSS/JS は外部アセット（`/assets/app.css`・`/assets/app.js`）へ分離し、
SSR 時の CSP から `unsafe-inline` を撤廃しています。SSR 時に短命 JWT を
ページへ埋め込み、自動更新 API 呼び出しにも認証が通るよう修正しています。

> 📌 `*:*` または `*:read` ワイルドカード権限でも `policy:read` / `audit:read` ゲートを通過します。

### 🗂️ Entity CRUD API（M9）— 5 エンティティ × 4 操作

> 全エンドポイントで Bearer 認証必須。操作種別ごとに `<resource>:read` / `<resource>:write` 権限をチェックします。

#### 🏢 Organizations（組織）

| メソッド | パス                        | 必要権限             | 説明                                         | 成功ステータス |
| -------- | --------------------------- | -------------------- | -------------------------------------------- | -------------- |
| `GET`    | `/api/v1/organizations/:id` | `organization:read`  | 組織を 1 件取得。未存在時は `404`            | `200`          |
| `POST`   | `/api/v1/organizations`     | `organization:write` | 組織を新規作成。バリデーション失敗時は `400` | `201`          |
| `PUT`    | `/api/v1/organizations/:id` | `organization:write` | 組織を全項目更新。未存在時は `404`           | `200`          |
| `DELETE` | `/api/v1/organizations/:id` | `organization:write` | 組織を削除。未存在時は `404`                 | `204`          |

#### 👤 Users（ユーザー）

| メソッド | パス                | 必要権限     | 説明                                                                                  | 成功ステータス |
| -------- | ------------------- | ------------ | ------------------------------------------------------------------------------------- | -------------- |
| `GET`    | `/api/v1/users/:id` | `user:read`  | ユーザーを 1 件取得（ソフトデリート後も参照可）                                       | `200`          |
| `POST`   | `/api/v1/users`     | `user:write` | ユーザーを新規作成。重複 email は `409 Conflict`                                      | `201`          |
| `PUT`    | `/api/v1/users/:id` | `user:write` | ユーザーを全項目更新                                                                  | `200`          |
| `DELETE` | `/api/v1/users/:id` | `user:write` | **ソフトデリート** — `status: "deactivated"` に変更（ハード削除しない・監査証跡保持） | `200`          |

> ⚠️ ユーザーは物理削除しません。監査証跡の参照整合性を保つため、DELETE は status を `deactivated` に遷移させます。

#### 🎭 Roles（ロール）

| メソッド | パス                | 必要権限     | 説明                                             | 成功ステータス |
| -------- | ------------------- | ------------ | ------------------------------------------------ | -------------- |
| `GET`    | `/api/v1/roles`     | `role:read`  | ロール一覧 `{ roles[], count }`                  | `200`          |
| `GET`    | `/api/v1/roles/:id` | `role:read`  | ロールを 1 件取得                                | `200`          |
| `POST`   | `/api/v1/roles`     | `role:write` | ロールを新規作成。重複名は `409`、権限空は `400` | `201`          |
| `PUT`    | `/api/v1/roles/:id` | `role:write` | ロールを全項目更新                               | `200`          |
| `DELETE` | `/api/v1/roles/:id` | `role:write` | ロールを削除                                     | `204`          |

#### 📱 Devices（デバイス）

| メソッド | パス                  | 必要権限       | 説明                                                     | 成功ステータス |
| -------- | --------------------- | -------------- | -------------------------------------------------------- | -------------- |
| `GET`    | `/api/v1/devices/:id` | `device:read`  | デバイスを 1 件取得                                      | `200`          |
| `POST`   | `/api/v1/devices`     | `device:write` | デバイスを新規作成。不正 kind は `400`                   | `201`          |
| `PUT`    | `/api/v1/devices/:id` | `device:write` | デバイスを更新（`assignedUserId` / `lastSeenAt` 省略可） | `200`          |
| `DELETE` | `/api/v1/devices/:id` | `device:write` | デバイスを削除                                           | `204`          |

#### 🗂️ Applications（アプリケーション）

| メソッド | パス                       | 必要権限            | 説明                                                       | 成功ステータス |
| -------- | -------------------------- | ------------------- | ---------------------------------------------------------- | -------------- |
| `GET`    | `/api/v1/applications/:id` | `application:read`  | アプリを 1 件取得                                          | `200`          |
| `POST`   | `/api/v1/applications`     | `application:write` | アプリを新規作成。重複 key は `409`、不正形式 key は `400` | `201`          |
| `PUT`    | `/api/v1/applications/:id` | `application:write` | アプリを全項目更新                                         | `200`          |
| `DELETE` | `/api/v1/applications/:id` | `application:write` | アプリを削除                                               | `204`          |

#### 📜 Policies（ガバナンスポリシー M10）

> Policy CRUD は Governance Core のポリシーセットをランタイムで管理します。評価エンジンは即時反映します。

| メソッド | パス                              | 必要権限       | 説明                                                                     | 成功ステータス |
| -------- | --------------------------------- | -------------- | ------------------------------------------------------------------------ | -------------- |
| `GET`    | `/api/v1/governance/policies`     | `policy:read`  | ポリシー一覧（`?limit=&offset=` ページネーション対応）                   | `200`          |
| `GET`    | `/api/v1/governance/policies/:id` | `policy:read`  | ポリシーを 1 件取得。未存在時は `404`                                    | `200`          |
| `POST`   | `/api/v1/governance/policies`     | `policy:write` | ポリシーを新規作成。`effect` は `allow`/`deny` のみ                      | `201`          |
| `PUT`    | `/api/v1/governance/policies/:id` | `policy:write` | ポリシーを更新（`name`/`actions`/`resources`/`conditions` 部分上書き可） | `200`          |
| `DELETE` | `/api/v1/governance/policies/:id` | `policy:write` | ポリシーを削除。評価エンジンから即時除外                                 | `204`          |

> ⚠️ **deny ポリシーは allow より優先**されます（deny-overrides）。誤った deny ポリシーを作成するとアクセスが即時遮断されます。

#### 📄 ページネーション共通仕様（M10）

全ての一覧エンドポイント（`/organizations`・`/users`・`/applications`・`/devices`・`/roles`・`/governance/policies`）は以下の共通クエリパラメータをサポートします。

| パラメータ | 型       | 既定値 | 最大値 | 説明                     |
| ---------- | -------- | ------ | ------ | ------------------------ |
| `limit`    | `number` | `20`   | `200`  | 1 ページあたりの件数     |
| `offset`   | `number` | `0`    | —      | 取得開始位置（0 始まり） |

レスポンスエンベロープ：

```json
{
  "items_key": [...],
  "count":  3,
  "total":  10,
  "limit":  5,
  "offset": 0
}
```

| フィールド | 説明                       |
| ---------- | -------------------------- |
| `count`    | 今回ページに含まれる実件数 |
| `total`    | フィルタ後の全件数         |
| `limit`    | リクエストで有効な limit   |
| `offset`   | リクエストで有効な offset  |

#### 🔒 共通エラー応答

| ステータス | 意味         | 条件                                                |
| ---------- | ------------ | --------------------------------------------------- |
| `400`      | Bad Request  | ドメインバリデーション失敗（`result.error` を返却） |
| `401`      | Unauthorized | 認証情報なし / 不正                                 |
| `403`      | Forbidden    | 認証済みだが当該権限不足                            |
| `404`      | Not Found    | 指定 ID のリソースが存在しない                      |
| `409`      | Conflict     | 重複 email / name / key でユニーク制約違反          |

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

### 📦 プラットフォーム 8 ドメイン

| ドメイン       | 役割                                 | 主な不変条件（型/検証で保証）            |
| -------------- | ------------------------------------ | ---------------------------------------- |
| `organization` | 本社・支店・現場・協力会社の組織階層 | headquarters は親を持たない              |
| `user`         | 利用者と所属・ロール・状態           | email 形式・status 列挙                  |
| `role`         | 権限の束（`resource:action` 形式）   | 最低 1 権限・トークン形式検証            |
| `device`       | 現場端末（タブレット/センサー等）    | retired 端末は利用者に割当不可           |
| `application`  | 連携アプリと健全性（dashboard 用）   | key は kebab-case・health 列挙           |
| `workflow`     | 承認・通知・タスクの定義             | ステップキー重複不可                     |
| `policy`       | 統制ルール（RBAC + 属性条件 ABAC）   | effect=allow/deny・対象必須              |
| `audit-event`  | 監査証跡の 1 レコード                | 不可変・outcome 列挙（success/denied/…） |

### ⚖️ Governance Core — ポリシー評価フロー

```mermaid
flowchart LR
    REQ["リクエスト\nsubject / resource\naction / attributes"]
    --> D1{明示 DENY\nポリシー一致?}
    D1 -->|Yes| DENY["🔴 deny\n(最優先)"]
    D1 -->|No| D2{明示 ALLOW\nポリシー一致?}
    D2 -->|Yes| ALLOW1["🟢 allow\n(ポリシー)"]
    D2 -->|No| D3{RBAC 権限\n一致?}
    D3 -->|Yes| ALLOW2["🟢 allow\n(RBAC)"]
    D3 -->|No| DEFAULT["🔴 deny\n(安全側既定)"]

    style DENY fill:#ff4444,color:#fff
    style DEFAULT fill:#ff4444,color:#fff
    style ALLOW1 fill:#22aa44,color:#fff
    style ALLOW2 fill:#22aa44,color:#fff
```

### 📋 ロールベースダッシュボード（read model）

`buildDashboard()` は viewer の権限を Governance Core で評価し、**閲覧可能なリソースだけ**に絞った
集計ビュー（governance status / app health / device status / pending approvals）を返す純粋関数です。

| 特性         | 内容                                                                     |
| ------------ | ------------------------------------------------------------------------ |
| アクセス制御 | `read` 権限の無いリソースは除外。`hidden` に除外件数を明示（黙殺しない） |
| 決定論       | `generatedAt` を引数化した純粋関数（副作用なし・テスト容易）             |
| 再利用性     | UI / API / CLI のどの表層からも同一ロジックを使用可                      |

### 🔌 連携ポート（adapters）

業務システムは **port interface** 経由で連携し、中核へ吸収しません（ヘキサゴナルアーキテクチャ）。

| ポート                                              | 対象                           | 状態         |
| --------------------------------------------------- | ------------------------------ | ------------ |
| `DocumentPort`                                      | 規程・手順・監査証跡の文書生成 | 参照実装あり |
| `CmdbPort`                                          | 構成アイテム台帳               | 契約定義済   |
| `ItsmPort` / `ImsPort` / `LegalOpsPort` / `BcpPort` | ITSM / 統合管理 / 法務 / BCP   | 契約定義済   |

---

## 🚀 クイックスタート

### 前提条件

- Node.js v22.13 以上
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

`NODE_ENV` が `production` 以外の場合のみ、起動時の stderr にデモ用 API キーが表示されます。

```
[app] demo API keys (use as: Authorization: Bearer <key>:<secret>)
  admin  key=abc123  secret=xyz789    ← *:* 権限（全エンドポイントアクセス可）
  viewer key=def456  secret=uvw012   ← application:read / device:read / audit:read
```

> ⚠️ **本番環境では** `NODE_ENV=production` を設定してください。デモキーは出力されません。

### 🔑 JWT トークン交換（M5 完了）

API キーを短命 JWT（有効期限 1 時間）に交換できます。JWT はファイアウォール内部での
サービス間通信やブラウザクライアントに適しています。

```bash
# 1. API キーを JWT に交換（10 req/min レート制限あり）
curl -s -X POST http://localhost:3000/api/v1/auth/token \
  -H "Content-Type: application/json" \
  -d '{"credential": "abc123:xyz789"}' | jq .
# → { "token": "<jwt>", "expiresIn": 3600, "subject": "admin" }

# 2. JWT で保護エンドポイントにアクセス
curl -H "Authorization: Bearer <jwt>" http://localhost:3000/api/v1/dashboard
```

> 📌 JWT を発行する際は `CEOP_JWT_SECRET` 環境変数で固定の署名鍵を設定することを推奨します。
> 未設定の場合はプロセス起動ごとに新鍵が生成され、再起動後に既存 JWT が無効になります。

---

## 🚀 本番デプロイ（M8）

### 🌐 本番環境（v0.6.2 稼働中）

| 項目           | 値                                                                                                           |
| -------------- | ------------------------------------------------------------------------------------------------------------ |
| 本番 URL       | https://ceop.mirai-dx-platform.com                                                                           |
| 形態           | 本機 Docker コンテナ（`docker run`）+ Cloudflare Tunnel（cloudflared-ceop.service）                          |
| イメージ       | `ceop-platform:v0.6.2`（GHCR: `ghcr.io/kensan196948g/construction-eop:0.6.2`）                               |
| 可動エイリアス | `ceop-platform:current`（稼働中バージョンを指す。バックアップ cron が参照）                                  |
| ホスト         | 192.168.0.185（127.0.0.1:3120 → コンテナ 3000）                                                              |
| DB             | `/home/kensan/.ceop/data/ceop.db`（SQLite WAL、migration 001〜005 適用済み）                                 |
| 認証情報       | `/home/kensan/.ceop/admin-credential.txt`・`viewer-credential.txt`（chmod 600。値は Secrets 管理へ移行推奨） |
| バックアップ   | cron 毎日 02:15 → `/home/kensan/.ceop/backups/`                                                              |
| ヘルス監視     | cron 毎日 02:30 に `/health/ready` を確認（失敗時のみ `health.log` へ追記）                                  |

> ⚠️ **本番は `docker compose` 管理下ではない。** `docker-compose.prod.yml` は同一トポロジを
> 再現するよう合わせてあるが、実機は `docker run` で起動している。`docker compose stop` は
> 一致するコンテナを見つけられず静かに no-op で終わり、実機は止まらない。
> 実運用手順は [`docs/operations/RUNBOOK.md`](docs/operations/RUNBOOK.md) を正とする。

### 前提フロー

- デプロイ先が決まったら本セクションの手順を実行。本番では `CEOP_JWT_SECRET`・API キーは
  必ずファイル/Secrets 管理に保持し、リポジトリへコミットしない。

```
① シークレット生成  →  ② DB マイグレーション  →  ③ API キー発行  →  ④ 起動（docker run）
```

### ① JWT シークレット生成

```bash
# 32 バイト（64 hex 文字）のランダムシークレットを生成
export CEOP_JWT_SECRET=$(openssl rand -hex 32)
echo "CEOP_JWT_SECRET=$CEOP_JWT_SECRET"  # .env に記録して保管
```

### ② SQLite スキーママイグレーション

```bash
# DB ファイルを /data/ceop.db に初期化（初回のみ。再実行は安全）
node --experimental-strip-types scripts/migrate.ts --db /data/ceop.db
# → ✓ 001 OK — initial schema (domain entity tables)
# → ✓ 002 OK — api_keys table
# → Done. 2 migration(s) applied.

# 再実行（冪等）
node --experimental-strip-types scripts/migrate.ts --db /data/ceop.db
# → ✓ 001 already applied
# → ✓ 002 already applied
# → Done. 0 migration(s) applied.
```

### ③ 本番 API キー発行

```bash
# 管理者キーを発行（raw secret は stdout に1度だけ出力される）
node --experimental-strip-types scripts/provision-api-key.ts \
  --subject admin \
  --permissions "*:*" \
  --db /data/ceop.db
# KEY_ID=<hex>
# KEY_SECRET=<hex>
# CREDENTIAL=<keyId>:<secret>   ← これを安全なシークレットマネージャに保存

# 閲覧者キーを発行
# （組織スコープは --organization-id <orgId> で指定。未指定 = プラットフォーム全体）
# 例:
#   node --experimental-strip-types scripts/provision-api-key.ts \
#     --subject site-manager --permissions "device:read,device:write" \
#     --organization-id org-site-01
node --experimental-strip-types scripts/provision-api-key.ts \
  --subject viewer \
  --permissions "application:read,device:read,audit:read" \
  --db /data/ceop.db
```

> ⚠️ **`CREDENTIAL` は1度しか表示されません。** ターミナルを閉じる前にシークレットマネージャへ保存してください。

### ④ Docker Compose で起動

```bash
# .env ファイルを作成（.env.example をコピーして編集）
cp .env.example .env
# CEOP_JWT_SECRET を上記で生成した値に設定

# 本番 Compose で起動
docker compose -f docker-compose.prod.yml up -d

# ログ確認
docker compose -f docker-compose.prod.yml logs -f

# ヘルスチェック確認
curl http://localhost:3000/health
# → { "status": "healthy", ... }

# 発行した API キーで認証
curl -H "Authorization: Bearer <keyId>:<secret>" http://localhost:3000/api/v1/dashboard
```

### 🗄️ マイグレーション設計

| バージョン | 説明                                                        | 状態      |
| ---------- | ----------------------------------------------------------- | --------- |
| `001`      | ドメインエンティティテーブル（M7）                          | ✅ 適用済 |
| `002`      | `api_keys` テーブル（CLI プロビジョニング）                 | ✅ 適用済 |
| `003`      | `audit_log` テーブル（ハッシュチェーン）                    | ✅ 適用済 |
| `004`      | workflows/revoked_jtis 追加 + FK 制約再構築（v0.6.0）       | ✅ 適用済 |
| `005`      | `api_keys.organization_id`（組織スコープ API キー、v0.6.0） | ✅ 適用済 |

- マイグレーションは `schema_migrations` テーブルでバージョン管理されます
- 新しいマイグレーションは `scripts/migrate.ts` の `MIGRATIONS` 配列に追記します
- **本番に適用済みのマイグレーションは絶対に編集・削除しないでください**

---

## 🖥️ WebUI（デザインバンドル・ホスティング / v0.7.0）

ユーザー提供のデザイン成果物 `webui/CEOP Platform.html`（自己完結型 SPA、8.7MB）を
**改変なし（100% 適用）** で配信する専用の静的サーバーです。本体 API（port 3120）とは
別プロセス・別ポートで動作します。

| 項目            | 値                                                            |
| --------------- | ------------------------------------------------------------- |
| 🌐 LAN URL      | `http://192.168.0.185:3130/`                                  |
| ❤️ ヘルス       | `GET /healthz` → `{"status":"ok","service":"ceop-webui",...}` |
| ⚙️ systemd      | `ceop-webui.service`（`deploy/systemd/` に定義）              |
| 🔧 環境変数     | `/home/kensan/.ceop/webui.env`（chmod 600、git 管理外）       |
| 🗄️ アクセスログ | Neon PostgreSQL `ceop-production` / `webui_access_log`        |
| 📦 デザイン正本 | `webui/CEOP Platform.html`（`__bundler` 自己展開形式）        |

```bash
# デザインバンドルを webui/dist/ に展開（gitignore 済）
pnpm run webui:unpack

# ローカル起動（CEOP_WEBUI_ROOT=webui/dist CEOP_WEBUI_PORT=3130）
pnpm run webui:serve

# 本番反映（verify → rsync → 展開 → systemd 再起動 → /healthz 確認）
bash scripts/webui-deploy.sh
```

- `scripts/webui-unpack.ts` が gzip+base64 マニフェスト（510 アセット）を展開し、
  UUID 参照を `assets/<uuid>.<ext>` へ書き換えます
- `src/webui/server.ts` は依存ゼロ（node:http）。パストラバーサル防御、GET/HEAD 限定、
  UUID アセットの immutable キャッシュ、セキュリティヘッダ一式を実装
- CSP は `script-src 'self' 'unsafe-eval'`（デザインランタイムが `text/x-dc` ソースを
  `new Function` でコンパイルするため。本体 API の CSP には影響しません）
- アクセスログは Neon の SQL-over-HTTP へ fire-and-forget でバッチ送信（Neon 障害時も
  配信は継続、アセットヒットは記録対象外）
- `https://ceop.mirai-dx-platform.com` 配下への公開（Tunnel ingress パス分割）は
  production route 変更のため **Approval PR** で別途承認後に実施

---

## 🧪 テスト実行

```bash
# 全テスト実行（277 tests）
pnpm run test

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

## 📋 運用ドキュメント（v0.6.0）

| 文書                                                     | 内容                                           |
| -------------------------------------------------------- | ---------------------------------------------- |
| [Runbook](docs/operations/RUNBOOK.md)                    | デプロイ・更新・rollback・インシデント対応     |
| [バックアップ/復元](docs/operations/BACKUP_RESTORE.md)   | SQLite スナップショット手順・RPO/RTO・復元試験 |
| [監視設計](docs/operations/MONITORING.md)                | SLI/SLO・監視項目・アラート                    |
| [運用台帳](docs/operations/OPERATIONS_LEDGER.md)         | 日次〜年次の運用タスク                         |
| [セキュリティ対応](docs/operations/SECURITY_RESPONSE.md) | P0 対応・秘密ローテーション                    |
| [総合評価](docs/assessment/ROOT-ASSESSMENT.md)           | 現状評価・ギャップ・決定記録                   |

バックアップ実行:

```bash
node --experimental-strip-types scripts/sqlite-backup.ts /data/ceop.db /backup/ceop-$(date -u +%Y%m%dT%H%M%SZ).db
```

### 📊 現在の品質状態

| ゲート    | 状態           | 備考                                                                                                                                                                                                                                                                                              |
| --------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| typecheck | ✅ pass        | strict・`noUncheckedIndexedAccess`・0 error                                                                                                                                                                                                                                                       |
| lint      | ✅ pass        | ESLint flat config + typescript-eslint・0 warning                                                                                                                                                                                                                                                 |
| test      | ✅ 277/277     | domain + governance + dashboard + adapters + API + JWT + file-repo + sqlite-repo + entity-crud (34) + governance-crud (26) + sqlite-audit-log (9) + workflow-crud (26) + audit-coverage (3) + migrate (2) + rate-limit (1) + tenant-scope (3) + audit-tenant-scope (5) + jwt-org (2) + webui (14) |
| build     | ✅ pass        | `dist/` に型定義付き出力                                                                                                                                                                                                                                                                          |
| CI        | ✅ 設定済み    | `.github/workflows/ci.yml`（push / PR トリガー）                                                                                                                                                                                                                                                  |
| Docker    | ✅ multi-stage | non-root ユーザー・HEALTHCHECK 付き                                                                                                                                                                                                                                                               |
| security  | ✅ hardened    | timingSafeEqual・ボディ制限・権限ゲート・CSP・API セキュリティヘッダ・監査網羅                                                                                                                                                                                                                    |

---

## ⚙️ 環境変数

| 変数名                      | 既定値                                       | 説明                                                                                        |
| --------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `PORT`                      | `3000`                                       | HTTP サーバがリッスンする TCP ポート                                                        |
| `NODE_ENV`                  | —                                            | `production` に設定するとデモキーを出力しない                                               |
| `LOG_LEVEL`                 | `info`                                       | `debug` / `info` / `warn` / `error`                                                         |
| `PLATFORM_NAME`             | `Construction Enterprise Operating Platform` | 起動ログ・UI に表示するプラットフォーム名                                                   |
| `CEOP_JWT_SECRET`           | —（プロセス起動ごと自動生成）                | HS256 JWT 署名用 32 バイト秘密鍵（hex 形式）。`production` では**必須**（未設定で起動失敗） |
| `CEOP_SQLITE_FILE`          | —（未設定 = 上位モード選択）                 | SQLite DB ファイルパス（例: `/data/ceop.db`）。設定時は SQLite 永続化（最優先）             |
| `CEOP_DATA_DIR`             | —（未設定 = In-Memory モード）               | ファイル永続化の保存先ディレクトリ。設定時は POSIX-atomic ファイル repo が有効              |
| `CEOP_SEED_DEMO`            | `false`                                      | `true` のとき起動時にデモデータを投入（In-Memory モードでは常に投入）                       |
| `CEOP_LOG_DEMO_CREDS`       | `false`                                      | `true` のときデモ API キーの認証情報を stderr に出力（**本番では絶対に `false`**）          |
| `CEOP_RATE_LIMIT_MAX`       | `300`                                        | `/api/v1/*` のグローバルレート制限（1 分あたり・socket IP 単位）                            |
| `CEOP_RATE_LIMIT_WINDOW_MS` | `60000`                                      | グローバルレート制限のウィンドウ長（ミリ秒）                                                |
| `CEOP_CORS_ORIGIN`          | —（未設定 = CORS 無効）                      | 明示した場合のみ `Access-Control-Allow-Origin` を出力（認証 API では `*` 禁止）             |

### 🗄️ 永続化ティア選択

優先度順に評価されます: **SQLite > File > In-Memory**

```bash
# In-Memory（テスト・デモ）
pnpm start

# ファイル永続化（POSIX-atomic JSON）
CEOP_DATA_DIR=/var/ceop/data pnpm start

# SQLite 永続化（WAL・推奨プロダクション）
CEOP_SQLITE_FILE=/var/ceop/ceop.db pnpm start

# Docker + SQLite ボリュームマウント
docker run -v ceop-data:/data -e CEOP_SQLITE_FILE=/data/ceop.db ceop:latest
```

> `node:sqlite` は Node.js v22.5+ で利用可能な実験的 API です。`--experimental-sqlite` フラグは不要（v22.10+ でデフォルト有効）。

---

## 🔐 セキュリティ

### 🔑 認証モデル

```mermaid
sequenceDiagram
    participant C as クライアント
    participant R as Router
    participant A as Auth Middleware
    participant S as API Key Store

    C->>R: Authorization: Bearer keyId:secret
    R->>A: validateApiKey(credential)
    A->>A: HMAC-SHA256(keyId, secret)
    A->>S: store.get(keyId)
    S-->>A: ApiKeyRecord { secretHash, permissions }
    A->>A: timingSafeEqual(expected, stored)
    alt 一致
        A-->>R: ApiKeyContext { subject, permissions }
        R->>R: 権限ゲートチェック
        R-->>C: 200 OK
    else 不一致
        A-->>R: err "invalid API key secret"
        R-->>C: 401 Unauthorized
    end
```

### 🎫 JWT 認証フロー（M5 追加）

```mermaid
sequenceDiagram
    participant C as クライアント
    participant R as Router
    participant RL as Rate Limiter
    participant A as Auth Middleware
    participant J as JWT Issuer (HS256)

    C->>R: POST /api/v1/auth/token { credential }
    R->>RL: check(socket.remoteAddress)
    alt レート制限超過
        RL-->>C: 429 Too Many Requests + X-RateLimit-*
    else 制限内
        RL-->>R: allowed
        R->>A: validateApiKey(credential)
        A->>A: HMAC-SHA256 + timingSafeEqual
        alt 認証成功
            A-->>R: ApiKeyContext { subject, permissions }
            R->>J: issue(subject, permissions)
            J->>J: HS256 sign（jti=uuid, exp=+1h）
            J-->>C: 200 { token, expiresIn: 3600, subject }
        else 認証失敗
            A-->>R: invalid
            R-->>C: 401 Unauthorized
        end
    end
```

### 🛡️ セキュリティ強化一覧

| カテゴリ                                     | 実装内容                                                                                                                                                                                       | ファイル                                                 |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| タイミング攻撃対策                           | HMAC ハッシュ比較を `timingSafeEqual` で実施                                                                                                                                                   | `middleware/auth.ts`                                     |
| JWT 署名・検証                               | HS256（`node:crypto` HMAC-SHA256）・jti replay guard・1h 有効期限・`iat < exp` 検証                                                                                                            | `middleware/jwt.ts`                                      |
| レート制限（Credential-Stuffing 対策）       | sliding-window 10 req/min を **socket.remoteAddress** でキー（X-Forwarded-For 非信頼）                                                                                                         | `middleware/rate-limiter.ts`                             |
| グローバル API レート制限（v0.6.0）          | `/api/v1/*` 全体を per-socket-IP で制限（既定 300 req/min、`CEOP_RATE_LIMIT_MAX`/`CEOP_RATE_LIMIT_WINDOW_MS` で調整可）                                                                        | `api/server.ts`                                          |
| DoS 防止                                     | リクエストボディを **1 MiB** で打ち切り（`req.destroy` 即断）                                                                                                                                  | `router.ts`                                              |
| 監査ログ権限                                 | `GET /api/v1/governance/audit` に `audit:read` 権限チェック                                                                                                                                    | `routes/governance.ts`                                   |
| ポリシー一覧権限                             | `GET /api/v1/governance/policies` に `policy:read` 権限チェック                                                                                                                                | `routes/governance.ts`                                   |
| 監査失敗の可視化                             | 監査イベント生成失敗を `console.error` でログ（サイレント廃棄を廃止）                                                                                                                          | `routes/governance.ts`                                   |
| CSP ヘッダ                                   | SSR ページに `Content-Security-Policy: default-src 'self'` を付与                                                                                                                              | `routes/web.ts`                                          |
| 秘密情報のログ漏洩防止                       | デモキーログを `NODE_ENV !== production` 条件で制限                                                                                                                                            | `app.ts`                                                 |
| 監査アクター詐称防止                         | 評価 API の `actor` を認証済み `ctx.subject` から取得（リクエストボディ不使用）                                                                                                                | `routes/governance.ts`                                   |
| 監査網羅（v0.6.0）                           | CRUD・Policy/Workflow 変更・トークン発行/失効を監査ログへ記録（actor は認証済み subject）                                                                                                      | `api/audit.ts` + routes                                  |
| テナント分離（v0.6.0）                       | API キー/JWT に `organizationId` を持ち、組織スコープ認証情報は自組織の entity のみ参照・変更可能（他組織は 404 で非公開）                                                                     | `api/routes/*` + `dashboard.ts`                          |
| 監査ログのテナント分離                       | 監査イベントに解決済み context のテナントを付与し、`GET /governance/audit` とダッシュボード監査カウンタを自組織へ絞込み（属性なしエントリは非表示＝fail-closed）。グローバル資格情報は全体可視 | `api/audit.ts` + `routes/governance.ts` + `dashboard.ts` |
| 監査証跡の一括持ち出し制御                   | 一括出力は `audit:read` と分離した `audit:export` 権限を要求（wildcard `audit:*` は両方を満たす）。**拒否も監査記録**。自身の出力イベントは出力範囲の確定後に記録するため payload に混入しない | `routes/governance.ts`                                   |
| CSV 数式インジェクション対策                 | エクスポート値の先頭が `=` `+` `-` `@` TAB CR の場合にアポストロフィを付与し、表計算ソフトでの実行を無効化（値自体は改変しない）。RFC 4180 引用符処理とは別レイヤーで両方適用                  | `api/csv.ts`                                             |
| 権限昇格防止（v0.6.0）                       | ロール作成/更新・ユーザーへのロール割当は「自身が保有する権限の範囲内」のみ許可                                                                                                                | `api/routes/governance.ts`                               |
| JWT 失効 API（v0.6.0）                       | `POST /api/v1/auth/revoke` で現在の JWT を失効し、以後の認証を拒否                                                                                                                             | `routes/auth.ts`                                         |
| API レスポンスセキュリティヘッダ（v0.6.0）   | JSON 応答に `X-Content-Type-Options: nosniff` / `X-Frame-Options: DENY` / `Referrer-Policy: no-referrer` / `Cache-Control: no-store`                                                           | `router.ts`                                              |
| HSTS（M14）                                  | SSR ページに `Strict-Transport-Security: max-age=63072000; includeSubDomains` を付与                                                                                                           | `routes/web.ts`                                          |
| CORS opt-in（M14）                           | `CEOP_CORS_ORIGIN` 環境変数 or `corsOrigin` 設定が明示された場合のみ CORS ヘッダを出力（デフォルト非出力）                                                                                     | `api/server.ts`                                          |
| JWT 無効化永続化（M14）                      | `RevocationStore` ポート（in-memory / SQLite 差し替え可）で `jti` を永続的に無効化。`CEOP_SQLITE_FILE` 設定時は自動で SQLite backing に切り替わる                                              | `persistence/sqlite/revocation-store.ts`                 |
| SQLite FK 制約（M14 + v0.6.0 migration 004） | users/devices/applications は `REFERENCES organizations(id)`、organizations.parent_id は自己参照 FK。マイグレーション 004 で既存 DB を再構築して適用                                           | `scripts/migrate.ts`                                     |

### ⚖️ ポリシーエンジン（Governance Core）

| 評価優先順位 | ルール                                           |
| ------------ | ------------------------------------------------ |
| 1            | **明示 deny** ポリシーが一致 → deny（最高優先）  |
| 2            | **明示 allow** ポリシーが一致 → allow            |
| 3            | **RBAC 権限**（`resource:action`）が一致 → allow |
| 4            | 上記いずれも一致しない → **deny（安全側既定）**  |

ABAC 条件（`{ attribute, equals }`）はポリシーレベルで評価され、
「対象ユーザー属性が条件を満たさなければ deny」という細粒度制御が可能です。

### 📋 監査証跡

- **追記専用**: 既存エントリの変更・削除は API として提供しない
- **改ざん検知**: SHA-256 ハッシュチェーン。`AuditLog.verify()` で破断位置を特定
- **全評価が記録**: `POST /api/v1/governance/evaluate` の全リクエストが自動記録
- **アクター保護**: 記録される `actor` は認証済み API キーの `subject`（リクエストボディに依存しない）

### 🔒 HTTP セキュリティヘッダ（SSR ページ）

| ヘッダ                        | 値                                                                                        |
| ----------------------------- | ----------------------------------------------------------------------------------------- |
| `Content-Security-Policy`     | `default-src 'self'`                                                                      |
| `X-Content-Type-Options`      | `nosniff`                                                                                 |
| `X-Frame-Options`             | `SAMEORIGIN`                                                                              |
| `Referrer-Policy`             | `same-origin`                                                                             |
| `Strict-Transport-Security`   | `max-age=63072000; includeSubDomains`（2年間・SSR ページのみ）                            |
| `Access-Control-Allow-Origin` | **opt-in のみ**（`CEOP_CORS_ORIGIN` 環境変数 or `corsOrigin` 設定を明示した場合のみ出力） |

---

## 🗺️ マイルストーン

```mermaid
gantt
    title Construction Enterprise Operating Platform — Roadmap
    dateFormat YYYY-MM-DD
    section 基盤
        M1 ドメイン + Governance Core    :done,    m1, 2026-06-25, 1d
        M2 ロールベースダッシュボード    :done,    m2, 2026-06-25, 1d
        M3 アダプタポート定義            :done,    m3, 2026-06-25, 1d
    section API + インフラ
        M4 HTTP Gateway + SSR + Docker   :done,    m4, 2026-06-27, 1d
        Security Hardening               :done,    sh, 2026-06-27, 1d
    section 認証 + 永続化
        M5 JWT 認証 + レート制限         :done,    m5, 2026-06-27, 1d
        M6 ファイル永続化（POSIX-atomic）:done,    m6, 2026-06-27, 1d
    section SQLite + 本番
        M7 SQLite 永続化（node:sqlite）  :done,    m7, 2026-06-27, 1d
        M7.5 セキュリティ強化（C-1/H-1）:done,    m75, 2026-06-27, 1d
        M8 本番デプロイ準備              :done,    m8, 2026-06-27, 1d
        M9 全エンティティ CRUD API       :done,    m9, 2026-06-27, 1d
        M10 Pagination + Policy CRUD     :done,    m10, 2026-06-27, 1d
        M11 SQLite 監査ログ              :done,    m11, 2026-06-27, 1d
        M12 Workflow CRUD API            :done,    m12, 2026-06-27, 1d
    section セキュリティ強化 R2
        M13 CodeRabbit Minor 9 件対応    :done,    m13, 2026-06-27, 1d
        M14 HSTS / CORS opt-in / JWT 無効化永続化 / SQLite FK :done, m14, 2026-06-27, 1d
        M15 CI pnpm バージョン競合修正   :done,    m15, 2026-06-27, 1d
    section リリース
        Production Release               :milestone, 2026-12-25, 0d
```

| フェーズ    | 対象                                                                                                                                                                           | 状態          |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- |
| ✅ M1       | 8 ドメイン定義 + Governance Core（policy-engine + audit-log）                                                                                                                  | **completed** |
| ✅ M2       | ロールベースダッシュボード（governance/app health/device/approval）                                                                                                            | **completed** |
| ✅ M3       | アダプタポート定義（CMDB/ITSM/IMS/LegalOps/BCP）+ Document 参照実装                                                                                                            | **completed** |
| ✅ M4       | HTTP API Gateway + SSR フロントエンド + In-Memory 永続化層 + Docker                                                                                                            | **completed** |
| ✅ Security | タイミング攻撃・DoS・権限漏洩・CSP・監査アクター詐称を修正                                                                                                                     | **completed** |
| ✅ M5       | JWT 認証（HS256）・レート制限（sliding-window）・`POST /api/v1/auth/token`                                                                                                     | **completed** |
| ✅ M6       | POSIX-atomic ファイル永続化（×6 ドメイン）・`CEOP_DATA_DIR` 環境変数                                                                                                           | **completed** |
| ✅ M7       | SQLite 永続化（`node:sqlite`・WAL・×6 repos）・`CEOP_SQLITE_FILE` 環境変数・15 統合テスト                                                                                      | **completed** |
| ✅ M7.5     | セキュリティ強化（C-1 ABAC deny-bypass・H-1 JWT 無効化・13 Major 指摘解消）                                                                                                    | **completed** |
| ✅ M8       | 本番デプロイ準備（docker-compose.prod.yml・scripts/migrate.ts・provision-api-key.ts）                                                                                          | **completed** |
| ✅ M9       | 全エンティティ CRUD API（21 エンドポイント・ソフトデリート・409 Conflict 検出・34 テスト）                                                                                     | **completed** |
| ✅ M10      | 共通ペジネーション（`parsePagination`/`paginate`）+ Policy CRUD（5 エンドポイント）+ 26 ガバナンステスト                                                                       | **completed** |
| ✅ M11      | SQLite 監査ログ（`node:sqlite`・WAL・ハッシュチェーン・改ざん検知）+ CodeRabbit Major×9 解消                                                                                   | **completed** |
| ✅ M12      | Workflow CRUD API（5 エンドポイント）+ CodeRabbit Critical×1/Major×13 解消・`AuditEvent.metadata` 凍結                                                                         | **completed** |
| ✅ M13      | CodeRabbit Minor×9 対応（rate-limiter off-by-one・bodyHasKey ガード・trim 一貫性・SQLite リソースリーク）                                                                      | **completed** |
| ✅ M14      | セキュリティ強化 R2：HSTS（2年）・CORS opt-in（`CEOP_CORS_ORIGIN`）・JWT 無効化 SQLite 永続化（`RevocationStore`）・SQLite FK 制約（users/devices/applications/organizations） | **completed** |
| ✅ M15      | CI pnpm バージョン競合修正（`ERR_PNPM_BAD_PM_VERSION` 解消・ci.yml + release.yml 修正）                                                                                        | **completed** |

---

## 📋 Workflow API（M12）

### エンドポイント一覧

| メソッド | パス                    | 権限             | 説明                                               |
| -------- | ----------------------- | ---------------- | -------------------------------------------------- |
| `GET`    | `/api/v1/workflows`     | `workflow:read`  | ワークフロー一覧（ページネーション・フィルタ対応） |
| `GET`    | `/api/v1/workflows/:id` | `workflow:read`  | ワークフロー詳細取得                               |
| `POST`   | `/api/v1/workflows`     | `workflow:write` | ワークフロー作成                                   |
| `PUT`    | `/api/v1/workflows/:id` | `workflow:write` | ワークフロー更新（mutable フィールドのみ）         |
| `DELETE` | `/api/v1/workflows/:id` | `workflow:write` | ワークフロー削除                                   |

### ワークフロードメイン型

```typescript
type WorkflowType = "approval" | "onboarding" | "procurement" | "inspection" | "incident";
type WorkflowStatus = "draft" | "active" | "suspended" | "archived";

interface WorkflowStep {
  key: string; // ステップ識別子
  name: string; // 表示名
  requiredPermission: string; // 実行に必要な権限文字列
}
```

### クエリパラメータ（一覧取得）

| パラメータ | 型     | 説明                                             |
| ---------- | ------ | ------------------------------------------------ |
| `type`     | string | `WorkflowType` でフィルタ                        |
| `status`   | string | `WorkflowStatus` でフィルタ                      |
| `limit`    | number | 1ページあたりの件数（デフォルト: 20・最大: 200） |
| `offset`   | number | スキップ件数（デフォルト: 0）                    |

### レスポンス例（一覧）

```json
{
  "items": [
    {
      "id": "wf-01J...",
      "name": "現場入退場申請",
      "type": "approval",
      "status": "active",
      "steps": [
        { "key": "submit", "name": "申請", "requiredPermission": "workflow:read" },
        { "key": "approve", "name": "承認", "requiredPermission": "workflow:write" }
      ],
      "createdAt": "2026-06-27T00:00:00.000Z",
      "updatedAt": "2026-06-27T00:00:00.000Z"
    }
  ],
  "count": 1,
  "total": 1,
  "limit": 20,
  "offset": 0
}
```

---

## 🧩 統合元（legacy 参照）

| 旧プロジェクト                               | 位置付け                                          |
| -------------------------------------------- | ------------------------------------------------- |
| `legacy-projects/Synapse-OS`                 | 統制・Federation・AI Governance・監査ゲートの中核 |
| `legacy-projects/Construction-Enterprise-OS` | 業務ポータル・統合画面の正本候補                  |
| `legacy-projects/Construction-DX-OS`         | 現場端末・標準クライアント・オフライン運用の参照  |

> `legacy-projects` は設計の参照元です。正本化した仕様のみ本基盤へ移植し、移植済み範囲を記録します。

---

## ⚖️ 設計原則

- 業務アプリを直接吸収しない（連携 = アダプタ）
- セキュリティ・統制・監査・承認を **後付けにしない**
- 実シークレット・本番資格情報・顧客データを含めない
- Result 型で例外を投げない（型安全な失敗表現）
- テストは型・純粋関数・ビルトインランナーで最小依存に保つ
- ランタイム依存ゼロ — Node.js ビルトインのみ使用
