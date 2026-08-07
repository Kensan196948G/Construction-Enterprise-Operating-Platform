# 詳細設計仕様書：Construction CRM & Bid Management
# 営業本部 業務支援システム

| 項目 | 内容 |
|------|------|
| ドキュメントID | DDS-CRM-001 |
| バージョン | 1.0 |
| 作成日 | 2026-05-16 |
| 関連要件定義 | REQ-CRM-001 |

---

## 1. システムアーキテクチャ

```
┌─────────────────────────────────────────────┐
│              フロントエンド (React PWA)        │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐        │
│  │案件管理│ │入札管理│ │CRM   │ │AI提案 │        │
│  └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘        │
├─────┴────────┴────────┴────────┴────────────┤
│              バックエンド (FastAPI)            │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐        │
│  │Project│ │Bid   │ │CRM   │ │AI    │        │
│  │Svc   │ │Svc   │ │Svc   │ │Svc   │        │
│  └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘        │
├─────┴────────┴────────┴────────┴────────────┤
│  PostgreSQL │ Redis │ Elasticsearch │ Azure AI │
└─────────────────────────────────────────────┘
```

---

## 2. データベース設計

### 2.1 主要テーブル

#### t_sales_project（営業案件）
```sql
CREATE TABLE t_sales_project (
    sales_project_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_name        VARCHAR(200) NOT NULL,
    client_org_id       UUID REFERENCES t_client_org(org_id),
    project_type        VARCHAR(50),  -- '公共入札'/'民間随契'/'民間入札'
    estimated_amount    BIGINT,
    bid_date            DATE,
    status              VARCHAR(30) DEFAULT 'lead',  -- lead/qualified/bid/won/lost
    branch_id           UUID REFERENCES t_branch(branch_id),
    owner_id            UUID REFERENCES t_employee(emp_id),
    win_probability     DECIMAL(5,2),
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);
```

#### t_bid_record（入札記録）
```sql
CREATE TABLE t_bid_record (
    bid_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sales_project_id    UUID REFERENCES t_sales_project(sales_project_id),
    bid_method          VARCHAR(30),  -- '一般競争'/'指名競争'/'総合評価'
    bid_price           BIGINT,
    estimated_price     BIGINT,
    evaluation_score    DECIMAL(5,2),
    technical_score     DECIMAL(5,2),
    price_score         DECIMAL(5,2),
    result              VARCHAR(10),  -- 'won'/'lost'/'cancel'
    competitors         JSONB,
    bid_date            DATE,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);
```

#### t_contact（顧客・名刺）
```sql
CREATE TABLE t_contact (
    contact_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id              UUID REFERENCES t_client_org(org_id),
    name                VARCHAR(100) NOT NULL,
    department          VARCHAR(100),
    position            VARCHAR(100),
    email               VARCHAR(200),
    phone               VARCHAR(20),
    card_image_url      VARCHAR(500),
    created_at          TIMESTAMPTZ DEFAULT NOW()
);
```

#### t_technical_proposal（技術提案書）
```sql
CREATE TABLE t_technical_proposal (
    proposal_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sales_project_id    UUID REFERENCES t_sales_project(sales_project_id),
    title               VARCHAR(200),
    content             TEXT,
    ai_generated        BOOLEAN DEFAULT FALSE,
    score               DECIMAL(5,2),
    template_id         UUID,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_proposal_fts ON t_technical_proposal USING gin(to_tsvector('japanese', content));
```

#### t_daily_report（営業日報）
```sql
CREATE TABLE t_daily_report (
    report_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id         UUID REFERENCES t_employee(emp_id),
    report_date         DATE NOT NULL,
    visit_records       JSONB,  -- [{org, contact, purpose, result}]
    next_actions        TEXT,
    approved_by         UUID REFERENCES t_employee(emp_id),
    approved_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 3. API設計

### 3.1 エンドポイント一覧

| メソッド | パス | 説明 |
|----------|------|------|
| GET/POST | /api/v1/sales-projects | 営業案件CRUD |
| GET | /api/v1/sales-projects/{id} | 案件詳細 |
| PATCH | /api/v1/sales-projects/{id}/status | ステータス更新 |
| GET/POST | /api/v1/bids | 入札記録CRUD |
| GET | /api/v1/bids/analysis | 入札分析 |
| GET/POST | /api/v1/contacts | 顧客管理CRUD |
| POST | /api/v1/contacts/ocr | 名刺OCR |
| GET/POST | /api/v1/proposals | 技術提案書CRUD |
| POST | /api/v1/proposals/ai-generate | AI提案書生成 |
| GET | /api/v1/proposals/search | 類似提案書検索 |
| GET/POST | /api/v1/daily-reports | 営業日報CRUD |
| GET | /api/v1/pipeline | 営業パイプライン |
| GET | /api/v1/ai/win-probability | 受注確率予測 |

### 3.2 AI技術提案書生成API
```json
// POST /api/v1/proposals/ai-generate
// Request
{
  "project_name": "○○港埠頭改良工事",
  "work_type": "港湾工事",
  "requirements": ["地盤改良", "ケーソン据付"],
  "evaluation_criteria": ["技術提案", "施工計画", "安全対策"],
  "reference_proposals": ["proposal-uuid-1", "proposal-uuid-2"]
}
// Response
{
  "generated_proposal": {
    "title": "技術提案書（案）",
    "sections": [
      {"heading": "施工計画", "content": "..."},
      {"heading": "品質管理計画", "content": "..."},
      {"heading": "安全管理計画", "content": "..."}
    ],
    "references_used": 5,
    "confidence_score": 0.82
  }
}
```

---

## 4. フロントエンド設計

### 4.1 画面一覧
| 画面ID | 画面名 | 説明 |
|--------|--------|------|
| SCR-CRM-001 | 案件一覧 | カンバン/リスト切替表示 |
| SCR-CRM-002 | 案件詳細 | 案件情報・入札記録・提案書 |
| SCR-CRM-003 | 入札分析 | 総合評価点分析・落札率分析 |
| SCR-CRM-004 | 顧客管理 | 顧客・名刺・接触履歴 |
| SCR-CRM-005 | AI提案書生成 | AI提案書ドラフト生成画面 |
| SCR-CRM-006 | 営業日報 | 日報入力・承認 |
| SCR-CRM-007 | パイプライン | 営業パイプライン可視化 |

### 4.2 ディレクトリ構造
```
src/
├── components/
│   ├── projects/
│   │   ├── ProjectKanban.tsx
│   │   ├── ProjectList.tsx
│   │   └── ProjectDetail.tsx
│   ├── bids/
│   │   ├── BidForm.tsx
│   │   └── BidAnalysis.tsx
│   ├── contacts/
│   │   ├── ContactList.tsx
│   │   └── CardOCR.tsx
│   ├── proposals/
│   │   ├── ProposalEditor.tsx
│   │   └── AIProposalGenerator.tsx
│   └── reports/
│       └── DailyReport.tsx
├── hooks/
├── services/
└── types/
```

---

## 5. AI機能設計

### 5.1 名刺OCR
- Azure AI Document Intelligence（旧Form Recognizer）使用
- 日本語名刺対応、会社名・氏名・部署・電話・メール自動抽出

### 5.2 AI技術提案書生成
- RAGアーキテクチャ: Azure OpenAI GPT-4o + Elasticsearch
- 過去提案書のベクトル化・類似検索
- プロンプトテンプレート管理
- 生成品質スコアリング

### 5.3 受注確率予測
- XGBoostモデル
- 特徴量: 発注者、工種、金額帯、技術者配置、過去実績、総合評価点予測
- 出力: 受注確率 (0-100%)

---

## 6. セキュリティ設計
- 入札関連データは厳格なアクセス制御（入札担当者のみ）
- 営業情報の部門間アクセス制限
- 監査ログの完全記録

