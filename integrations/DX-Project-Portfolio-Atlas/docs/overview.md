# アーキテクチャ概要

詳細は `docs/adr/ADR-001-cto-decisions-phase1.md` と設計仕様書を参照。

## コンポーネント

| コンポーネント | 技術 | 役割 |
| --- | --- | --- |
| web | React + Vite + nginx | SPA 配信、KPI/一覧/詳細/2D |
| api | FastAPI + SQLAlchemy | REST API、認可、Webhook、監査 |
| worker | Python | 同期・クレンジング・ジョブ実行 |
| scheduler | Python | 定期整合（reconcile/metrics） |
| db | Neon PostgreSQL 17 | 正本データ、ジョブキュー |
| monitoring | Prometheus | メトリクス・SLO アラート |

## データモデル（要約）

```mermaid
erDiagram
    PROJECT ||--o{ REPOSITORY : contains
    PROJECT ||--o{ APPROVED_ATTRIBUTE : history
    PROJECT ||--o{ PROJECT_RELATION : source
    PROJECT ||--o{ PROJECT_RELATION : target
    REPOSITORY ||--o{ OBSERVATION : produces
    APP_USER ||--o{ AUDIT_LOG : acts
    PROJECT ||--o{ REVIEW_QUEUE : review
```

## 認証・認可フロー

```mermaid
sequenceDiagram
    participant U as 利用者
    participant A as Cloudflare Access
    participant API as FastAPI
    participant DB as PostgreSQL
    U->>A: 認証
    A-->>API: Access JWT
    API->>API: aud/iss/exp 検証 + JWKS
    API->>DB: ユーザー取得/作成 + ロール判定
    API->>API: 可視性フィルタ適用
```
