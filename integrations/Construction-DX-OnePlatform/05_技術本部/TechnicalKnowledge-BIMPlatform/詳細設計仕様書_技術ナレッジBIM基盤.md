# 詳細設計仕様書：Technical Knowledge & BIM Platform
# 技術本部 業務支援システム

| 項目 | 内容 |
|------|------|
| ドキュメントID | DDS-TKB-001 |
| バージョン | 1.0 |
| 作成日 | 2026-05-16 |
| 関連要件定義 | REQ-TKB-001 |

---

## 1. システムアーキテクチャ

```
┌──────────────────────────────────────────────┐
│    フロントエンド (React + Three.js + IFC.js)  │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐         │
│  │資料管理│ │BIM   │ │CAD   │ │AI検索 │         │
│  └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘         │
├─────┴────────┴────────┴────────┴─────────────┤
│              バックエンド (FastAPI)             │
│  ┌────────┐ ┌────────┐ ┌────────┐             │
│  │Document │ │BIM/CAD │ │RAG/AI  │             │
│  │Service  │ │Service │ │Service │             │
│  └────┬───┘ └────┬───┘ └────┬───┘             │
├───────┴──────────┴──────────┴────────────────┤
│ PostgreSQL+PostGIS │ Elasticsearch │ Azure AI  │
│ SharePoint Online  │ Blob Storage  │ LangChain │
└──────────────────────────────────────────────┘
```

---

## 2. RAG（AI施工ナレッジ検索）設計

### 2.1 アーキテクチャ
```
ユーザー質問
    │  「過去の港湾工事で地盤改良した事例」
    ▼
クエリ解析 (Azure OpenAI)
    │  → キーワード抽出 + ベクトル化
    ▼
ハイブリッド検索 (Elasticsearch)
    │  → キーワード検索 + ベクトル類似度検索
    │  → BM25 + cosine similarity のスコア統合
    ▼
コンテキスト構築
    │  → 上位10件の関連文書チャンクを取得
    ▼
回答生成 (Azure OpenAI GPT-4o)
    │  → 文書チャンクをコンテキストとして回答生成
    ▼
回答 + 出典表示
```

### 2.2 ドキュメントインデックス設計
```json
// Elasticsearch インデックスマッピング
{
  "mappings": {
    "properties": {
      "doc_id": {"type": "keyword"},
      "title": {"type": "text", "analyzer": "kuromoji"},
      "content": {"type": "text", "analyzer": "kuromoji"},
      "content_vector": {"type": "dense_vector", "dims": 1536},
      "doc_type": {"type": "keyword"},
      "work_type": {"type": "keyword"},
      "project_name": {"type": "text", "analyzer": "kuromoji"},
      "tags": {"type": "keyword"},
      "created_at": {"type": "date"}
    }
  }
}
```

### 2.3 チャンク分割戦略
- チャンクサイズ: 500トークン
- オーバーラップ: 100トークン
- 分割単位: 段落 > セクション > 固定長

---

## 3. データベース設計

### 3.1 主要テーブル

#### t_technical_document（技術文書）
```sql
CREATE TABLE t_technical_document (
    doc_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title               VARCHAR(300) NOT NULL,
    doc_type            VARCHAR(50),  -- '施工要領'/'技術論文'/'研究報告'/'規格基準'
    work_type           VARCHAR(100),
    content_text        TEXT,
    file_path           VARCHAR(500),
    sharepoint_url      VARCHAR(500),
    version             INT DEFAULT 1,
    tags                TEXT[],
    indexed_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_doc_fts ON t_technical_document USING gin(to_tsvector('japanese', title || ' ' || COALESCE(content_text, '')));
```

#### t_bim_model（BIM/CIMモデル）
```sql
CREATE TABLE t_bim_model (
    model_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name          VARCHAR(200) NOT NULL,
    format              VARCHAR(20),  -- 'IFC'/'LandXML'/'CityGML'/'RVT'
    file_path           VARCHAR(500),
    file_size_bytes     BIGINT,
    project_id          UUID,
    attributes          JSONB,
    version             INT DEFAULT 1,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);
```

#### t_cad_drawing（CAD図面）
```sql
CREATE TABLE t_cad_drawing (
    drawing_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drawing_number      VARCHAR(50),
    title               VARCHAR(200),
    format              VARCHAR(10),  -- 'DWG'/'DXF'/'PDF'
    file_path           VARCHAR(500),
    project_id          UUID,
    revision            VARCHAR(10),
    created_at          TIMESTAMPTZ DEFAULT NOW()
);
```

#### t_soil_data（土質データ）
```sql
CREATE TABLE t_soil_data (
    soil_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location            GEOMETRY(POINT, 4326),
    boring_name         VARCHAR(50),
    depth_m             DECIMAL(6,2),
    soil_type           VARCHAR(50),
    n_value             INT,
    project_id          UUID,
    survey_date         DATE,
    data                JSONB,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_soil_location ON t_soil_data USING gist(location);
```

#### t_patent（特許）
```sql
CREATE TABLE t_patent (
    patent_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patent_number       VARCHAR(30),
    title               VARCHAR(300),
    inventors           JSONB,
    filing_date         DATE,
    grant_date          DATE,
    status              VARCHAR(20),
    abstract            TEXT,
    renewal_date        DATE,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 4. API設計

| メソッド | パス | 説明 |
|----------|------|------|
| GET/POST | /api/v1/documents | 技術文書CRUD |
| POST | /api/v1/documents/upload | 文書アップロード+インデックス |
| GET | /api/v1/documents/search | 全文検索 |
| POST | /api/v1/ai/knowledge-search | AIナレッジ検索 |
| GET/POST | /api/v1/bim-models | BIMモデルCRUD |
| GET | /api/v1/bim-models/{id}/viewer | 3Dビューア |
| GET/POST | /api/v1/cad-drawings | CAD図面CRUD |
| GET/POST | /api/v1/soil-data | 土質データCRUD |
| GET | /api/v1/soil-data/map | GIS表示 |
| GET/POST | /api/v1/patents | 特許管理CRUD |
| GET/POST | /api/v1/research | 研究プロジェクト管理 |

---

## 5. SharePoint Online連携設計
- Microsoft Graph API による文書同期
- SharePoint Webhook による変更検知
- 文書メタデータの双方向同期

