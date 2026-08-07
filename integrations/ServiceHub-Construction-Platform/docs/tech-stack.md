# ⚙️ 技術スタック詳細

> **対象読者**: ソフトウェアエンジニア、アーキテクト、技術評価担当者  
> ServiceHub 工事管理プラットフォームの技術選定・アーキテクチャ・設計方針を詳述します。

---

## 📌 目次

1. [技術スタック全体図](#-技術スタック全体図)
2. [フロントエンド](#-フロントエンド)
3. [バックエンド](#-バックエンド)
4. [データベース・ストレージ](#-データベースストレージ)
5. [AI・機械学習](#-ai機械学習)
6. [インフラ・DevOps](#-インフラdevops)
7. [セキュリティ](#-セキュリティ)
8. [テスト](#-テスト)
9. [アーキテクチャ設計方針](#-アーキテクチャ設計方針)
10. [API 設計](#-api-設計)

---

## 🗺️ 技術スタック全体図

```mermaid
graph TB
    subgraph "🖥️ フロントエンド"
        R[React 18<br>TypeScript 5]
        V[Vite 6<br>ビルドツール]
        TQ[TanStack Query v5<br>サーバー状態管理]
        ZU[Zustand<br>クライアント状態管理]
        RR[React Router v6<br>ルーティング]
        TW[Tailwind CSS v3<br>スタイリング]
        RC[Recharts<br>グラフ・可視化]
        LU[Lucide React<br>アイコン]
        RHF[React Hook Form<br>フォーム]
        ZD[Zod<br>バリデーション]
    end

    subgraph "⚙️ バックエンド"
        FA[FastAPI<br>Python 3.12]
        SA[SQLAlchemy 2.x<br>ORM]
        AL[Alembic<br>DB マイグレーション]
        PW[Passlib + JWT<br>認証]
        BO[Boto3<br>S3 クライアント]
        CE[Celery<br>非同期タスク（計画中）]
    end

    subgraph "🗄️ データ層"
        PG[PostgreSQL 15<br>メイン DB]
        MN[MinIO<br>ファイルストレージ]
        RD[Redis<br>キャッシュ（計画中）]
    end

    subgraph "🤖 AI サービス"
        CL[Anthropic Claude<br>Legal Tech AI]
        OA[OpenAI API<br>ナレッジ検索 AI]
    end

    subgraph "🐳 インフラ"
        DC[Docker Compose<br>ローカル/ステージング]
        GH[GitHub Actions<br>CI/CD]
        PW2[Playwright<br>E2E テスト]
    end

    R --> TQ & ZU & RR & TW & RC & LU & RHF & ZD
    R -->|Vite バンドル| V
    TQ -->|REST API| FA
    FA --> SA --> PG
    FA --> BO --> MN
    FA --> CL & OA
    GH --> DC
    PW2 -->|ブラウザ操作| R
```

---

## 🖥️ フロントエンド

### コア技術

| ライブラリ | バージョン | 役割 | 採用理由 |
|---|---|---|---|
| ![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&style=flat-square) | 18.x | UI フレームワーク | Concurrent Mode・Server Components 対応 |
| ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&style=flat-square) | 5.x | 型安全な JavaScript | 開発時エラー検出・IDE 補完 |
| ![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&style=flat-square) | 6.x | ビルドツール | 高速 HMR・ES Module ネイティブ |

### 状態管理

```mermaid
graph LR
    subgraph "🌐 サーバー状態（TanStack Query）"
        A[APIデータ] -->|fetch| B[Query Cache]
        B -->|自動再取得| C[React コンポーネント]
    end

    subgraph "💾 クライアント状態（Zustand）"
        D[認証情報] --> E[authStore]
        F[UI 設定] --> G[settingsStore]
        E & G --> C
    end
```

| ライブラリ | バージョン | 役割 | 採用理由 |
|---|---|---|---|
| TanStack Query | v5 | サーバー状態管理 | キャッシュ・再取得・エラー処理の自動化 |
| Zustand | v4 | クライアント状態管理 | 軽量・型安全・DevTools 対応 |

### UI・スタイリング

| ライブラリ | 役割 |
|---|---|
| Tailwind CSS v3 | ユーティリティファーストな CSS フレームワーク |
| shadcn/ui | Radix UI ベースのアクセシブルコンポーネント |
| Lucide React | 統一されたアイコンセット（MIT ライセンス） |
| Recharts | SVG ベースのグラフ・データ可視化 |

### フォーム・バリデーション

| ライブラリ | 役割 |
|---|---|
| React Hook Form v7 | 高性能フォーム（不要な再レンダリング排除） |
| Zod v3 | スキーマベースの型安全バリデーション |
| @hookform/resolvers | Zod を React Hook Form に統合 |

### フロントエンドアーキテクチャ

```mermaid
graph TD
    subgraph "📁 src ディレクトリ構造"
        Pages[📄 pages/<br>ページコンポーネント]
        Components[🧩 components/<br>再利用コンポーネント]
        Hooks[🎣 hooks/<br>カスタムフック]
        API[📡 api/<br>API クライアント]
        Stores[💾 stores/<br>Zustand ストア]
        Types[🔤 generated/<br>OpenAPI 生成型]
        Mocks[🃏 mocks/<br>モックデータ・resolver]
    end

    Pages --> Components
    Pages --> Hooks
    Hooks --> API
    Hooks --> Stores
    API --> Types
    API -->|MOCK_MODE=true| Mocks
```

### モックアーキテクチャ（開発環境）

`VITE_MOCK_MODE=true` 設定時、API リクエストを実際のバックエンドに送らずモックデータで応答します。

```mermaid
sequenceDiagram
    participant C as React Component
    participant Q as TanStack Query
    participant A as api/client.ts
    participant R as mocks/resolver.ts
    participant D as mocks/data.ts

    C->>Q: useQuery('projects')
    Q->>A: GET /projects
    A->>A: MOCK_MODE チェック
    A->>R: resolveMock('GET', '/projects')
    R->>D: MOCK_PROJECTS
    D-->>R: プロジェクト配列
    R-->>A: {status: 200, data: [...]}
    A-->>Q: ApiResponse
    Q-->>C: data, isLoading, error
```

---

## ⚙️ バックエンド

### コア技術

| ライブラリ | バージョン | 役割 | 採用理由 |
|---|---|---|---|
| ![FastAPI](https://img.shields.io/badge/FastAPI-0.136-009688?logo=fastapi&style=flat-square) | 0.136 | Web フレームワーク | 自動 OpenAPI 生成・型安全・高速 |
| ![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&style=flat-square) | 3.12 | 言語 | 型ヒント強化・パフォーマンス改善 |
| SQLAlchemy | 2.x | ORM | 非同期対応・型安全クエリ |
| Alembic | 最新 | DB マイグレーション | SQLAlchemy との統合・バージョン管理 |
| Pydantic v2 | 2.x | データバリデーション | 高速・型安全・JSON スキーマ生成 |

### バックエンドアーキテクチャ（レイヤー構造）

```mermaid
graph TB
    subgraph "🌐 API レイヤー（FastAPI Routers）"
        R1[auth.py] & R2[projects.py] & R3[daily_reports.py]
        R4[itsm.py] & R5[legal.py] & R6[costs.py]
    end

    subgraph "🔧 サービスレイヤー"
        S1[ProjectService] & S2[ITSMService]
        S3[LegalTechService] & S4[AuthService]
    end

    subgraph "🗄️ データアクセスレイヤー（SQLAlchemy）"
        M1[Project モデル] & M2[User モデル]
        M3[Incident モデル] & M4[Contract モデル]
    end

    subgraph "🔌 外部連携レイヤー"
        E1[MinIO クライアント] & E2[AI クライアント]
    end

    R1 & R2 & R3 --> S1 & S2 & S3 & S4
    S1 & S2 & S3 --> M1 & M2 & M3 & M4
    S3 --> E1 & E2
```

### 認証・認可フロー

```mermaid
sequenceDiagram
    participant C as クライアント
    participant A as FastAPI
    participant DB as PostgreSQL

    C->>A: POST /auth/login {email, password}
    A->>DB: ユーザー検索・パスワード検証
    DB-->>A: Userオブジェクト
    A-->>C: {access_token, refresh_token}

    Note over C,A: 以降のリクエスト

    C->>A: GET /projects (Authorization: Bearer token)
    A->>A: JWT 検証・ロール確認
    A->>DB: RBAC チェック（プロジェクトへのアクセス権）
    DB-->>A: クエリ結果
    A-->>C: JSON レスポンス

    Note over C,A: トークン期限切れ時

    C->>A: POST /auth/refresh {refresh_token}
    A-->>C: 新 access_token・refresh_token
```

### セキュリティ実装

| 機能 | 実装方法 |
|---|---|
| 🔐 パスワードハッシュ | bcrypt（Passlib）|
| 🔑 JWT 発行 | python-jose（HS256） |
| 🛡️ IDOR 防止 | 全 API でオーナーシップ確認 |
| 🔒 CORS 制御 | 許可オリジンのホワイトリスト |
| 🚦 レート制限 | Nginx レベルでの制御 |

---

## 🗄️ データベース・ストレージ

### データベース設計

```mermaid
erDiagram
    USERS {
        uuid id PK
        string email UK
        string full_name
        string role
        bool is_active
        timestamp created_at
    }
    PROJECTS {
        uuid id PK
        string project_number UK
        string name
        uuid owner_id FK
        string status
        decimal budget
        date start_date
        date end_date
    }
    DAILY_REPORTS {
        uuid id PK
        uuid project_id FK
        uuid reporter_id FK
        date report_date
        string status
        text content
    }
    INCIDENTS {
        uuid id PK
        string incident_number UK
        string title
        string severity
        string status
        uuid assigned_to FK
    }
    CONTRACTS {
        uuid id PK
        uuid project_id FK
        string title
        string contract_type
        string risk_level
        bytea content_hash
    }

    USERS ||--o{ PROJECTS : "owns"
    USERS ||--o{ DAILY_REPORTS : "creates"
    PROJECTS ||--o{ DAILY_REPORTS : "has"
    PROJECTS ||--o{ CONTRACTS : "has"
    USERS ||--o{ INCIDENTS : "assigned"
```

### ストレージ選定

| ストレージ | 用途 | 採用理由 |
|---|---|---|
| PostgreSQL 15 | メインデータ | ACID・JSON 対応・UUID・全文検索 |
| MinIO | ファイル（写真・書類） | S3 互換・オンプレ対応・プリサインド URL |
| Redis（計画中） | セッションキャッシュ | 高速・TTL 管理 |

---

## 🤖 AI・機械学習

### AI エンジン構成

```mermaid
graph LR
    subgraph "⚖️ Legal Tech AI（Claude）"
        A[契約書 PDF/テキスト] --> B[Anthropic Claude<br>claude-opus-4-7]
        B --> C[CRITICAL リスク検出]
        B --> D[建設業法条項判定]
        B --> E[下請法コンプライアンス]
    end

    subgraph "🤖 ナレッジ AI（OpenAI）"
        F[ナレッジ記事] --> G[Embedding 生成<br>text-embedding-3-small]
        G --> H[ベクトル検索]
        H --> I[関連ナレッジ提示]
    end

    subgraph "🛡️ 法的証跡"
        J[証跡データ] --> K[SHA-256 ハッシュ]
        K --> L[改ざん検知<br>Fail-Closed 設計]
    end
```

| AI サービス | モデル | 用途 |
|---|---|---|
| Anthropic Claude | claude-opus-4-7 | 法的リスク分析・建設業法判定 |
| OpenAI | text-embedding-3-small | ナレッジ記事のベクトル埋め込み |
| OpenAI | gpt-4o（計画中） | ナレッジ Q&A 生成 |

### Legal Tech 実装詳細

```mermaid
graph TD
    A[📄 契約書アップロード] --> B[テキスト抽出]
    B --> C[Claude API へ送信]
    C --> D{リスク判定}
    D -->|CRITICAL| E[🔴 即時通知・エスカレーション]
    D -->|HIGH| F[🟠 ITSM インシデント自動生成]
    D -->|MEDIUM| G[🟡 レビュー推奨通知]
    D -->|LOW| H[🟢 通常ログ記録]
    E & F & G & H --> I[📋 証跡タイムライン記録]
    I --> J[🔒 SHA-256 ハッシュ保存]
```

---

## 🐳 インフラ・DevOps

### Docker 構成

```yaml
# docker-compose.yml 概要
services:
  frontend:   # React アプリ (Node.js 20 LTS)
  backend:    # FastAPI (Python 3.12-slim)
  db:         # PostgreSQL 15-alpine
  minio:      # MinIO RELEASE.2024
  nginx:      # Nginx リバースプロキシ（本番のみ）
```

### CI/CD パイプライン詳細

```mermaid
graph LR
    subgraph "📦 GitHub Actions"
        A[Push / PR] --> B[🔍 Lint<br>ruff・mypy・ESLint・tsc]
        B --> C[🧪 Unit Tests<br>pytest・Vitest]
        C --> D[🔒 Security Scan<br>Bandit・pip-audit・npm audit]
        D --> E[🏗️ Build<br>Docker image・Vite build]
        E --> F[🌐 E2E Tests<br>Playwright 221件]
        F --> G{✅ All Pass?}
        G -->|Yes| H[🚀 Deploy to Staging]
        G -->|No| I[❌ Fail & Notify]
    end
```

### 使用 GitHub Actions

| ワークフロー | 実行タイミング | 主な処理 |
|---|---|---|
| `backend-ci.yml` | PR・Push | ruff / mypy / pytest / Bandit / pip-audit |
| `frontend-ci.yml` | PR・Push | ESLint / tsc / Vitest / Vite build |
| `e2e.yml` | Push to main | Playwright E2E（Chromium・Firefox・Safari） |
| `security.yml` | 毎日 0:00 | 依存関係脆弱性スキャン |

---

## 🔒 セキュリティ

### セキュリティ多層防御

```mermaid
graph TD
    subgraph "🌐 ネットワーク層"
        A[HTTPS / TLS 1.3]
        B[Nginx レート制限]
    end

    subgraph "🔐 認証・認可層"
        C[JWT HS256 署名]
        D[Refresh Token ローテーション]
        E[RBAC ロールチェック]
        F[IDOR 保護（全エンドポイント）]
    end

    subgraph "🛡️ アプリケーション層"
        G[SQL インジェクション対策<br>SQLAlchemy ORM]
        H[XSS 対策<br>Content-Security-Policy]
        I[CSRF 対策<br>SameSite Cookie]
    end

    subgraph "🔍 監査・検出層"
        J[全操作ログ記録]
        K[SHA-256 改ざん検知]
        L[自動脆弱性スキャン]
    end

    A --> C
    B --> C
    C & D --> E & F
    E & F --> G & H & I
    G & H & I --> J & K & L
```

### IDOR（不正直接オブジェクト参照）防止設計

すべての READ / WRITE エンドポイントで以下のチェックを実施:

```python
# 例: プロジェクト取得時のオーナーシップ確認
@router.get("/projects/{project_id}")
async def get_project(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(404)
    # IDOR 防止: 自分のプロジェクトまたは ADMIN のみアクセス可
    if project.owner_id != current_user.id and current_user.role != "ADMIN":
        raise HTTPException(403)
    return project
```

---

## 🧪 テスト

### テスト戦略

```mermaid
graph TB
    subgraph "🔺 テストピラミッド"
        E2E[🌐 E2E テスト<br>Playwright 221件<br>ブラウザ操作シミュレーション]
        INT[🔄 統合テスト<br>pytest 200件+<br>API エンドポイント検証]
        UNIT[🧩 ユニットテスト<br>Vitest 294件<br>コンポーネント・関数単体]
    end
    UNIT --> INT --> E2E
```

### バックエンドテスト（pytest）

| テスト種別 | 件数 | ファイル |
|---|---|---|
| 単体テスト | 150件+ | `tests/unit/` |
| 統合テスト | 215件+ | `tests/integration/` |
| セキュリティテスト | IDOR 全ルート | `tests/integration/test_*_security.py` |

### フロントエンドテスト（Vitest）

| テスト種別 | 件数 | ファイル |
|---|---|---|
| コンポーネントテスト | 200件+ | `src/**/*.test.tsx` |
| フックテスト | 94件+ | `src/hooks/**/*.test.ts` |

### E2E テスト（Playwright）

| テスト対象ページ | 件数 |
|---|---|
| 認証フロー | 12件 |
| ダッシュボード | 15件 |
| 工事案件管理 | 28件 |
| 日報管理 | 20件 |
| ITSM | 35件 |
| Legal Tech | 18件 |
| その他 | 93件 |

---

## 🏛️ アーキテクチャ設計方針

### 設計原則

| 原則 | 実践方法 |
|---|---|
| **型安全ファースト** | OpenAPI → TypeScript 型自動生成（`openapi-typescript`）|
| **単方向データフロー** | TanStack Query → コンポーネント（Props ドリル禁止）|
| **ゼロトラストセキュリティ** | 全 API でトークン検証・ロールチェック・IDOR 防止 |
| **テスト容易性** | モック注入可能・依存性逆転原則 |
| **オブザーバビリティ** | 構造化ログ・ヘルスチェックエンドポイント |

### OpenAPI 型生成フロー

```mermaid
graph LR
    A[FastAPI<br>Pydantic モデル] -->|自動生成| B[openapi.json]
    B -->|openapi-typescript| C[src/generated/api-types.ts]
    C -->|型インポート| D[React コンポーネント]
    C -->|型インポート| E[mocks/data.ts]
```

> フロントエンドとバックエンドの型が自動同期されるため、API 変更時の型不整合を開発時に検出できます。

---

## 📡 API 設計

### REST API 命名規則

| パターン | エンドポイント例 |
|---|---|
| コレクション取得 | `GET /api/v1/projects` |
| 単一リソース取得 | `GET /api/v1/projects/{id}` |
| 作成 | `POST /api/v1/projects` |
| 更新 | `PATCH /api/v1/projects/{id}` |
| 削除 | `DELETE /api/v1/projects/{id}` |
| サブリソース | `GET /api/v1/projects/{id}/daily-reports` |

### ページネーション

```json
// GET /api/v1/projects?page=2&per_page=20
{
  "items": [...],
  "total": 85,
  "page": 2,
  "per_page": 20,
  "pages": 5
}
```

### エラーレスポンス形式

```json
{
  "detail": "エラーメッセージ（日本語対応）",
  "error_code": "PROJECT_NOT_FOUND",
  "status": 404
}
```

---

## 🔗 関連ドキュメント

| ドキュメント | 内容 |
|---|---|
| [📘 IT 導入・運用ガイド](it-guide.md) | 環境構築・運用手順 |
| [📋 API 仕様書（Swagger）](http://localhost:8000/docs) | エンドポイント詳細（サーバー起動時） |
| [🔒 セキュリティ設計](06_セキュリティ（Security）/) | 脅威分析・対策詳細 |
| [📊 テスト仕様](07_テスト（Testing）/) | テスト方針・カバレッジ |

---

*⚙️ 最終更新: 2026-06-14 | ServiceHub Construction Platform 技術スタック詳細 v1.0*
