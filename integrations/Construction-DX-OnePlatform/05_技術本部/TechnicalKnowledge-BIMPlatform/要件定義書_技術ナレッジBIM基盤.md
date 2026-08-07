# 要件定義書：Technical Knowledge & BIM Platform
# 技術本部 業務支援システム

| 項目 | 内容 |
|------|------|
| ドキュメントID | REQ-TKB-001 |
| バージョン | 1.0 |
| 作成日 | 2026-05-16 |
| 対象部門 | 技術本部（技術部・研究開発部・エンジニアリング部） |
| システム名 | Technical Knowledge & BIM Platform |

---

## 1. 概要

### 1.1 目的
建設技術資料・BIM/CIMモデル・CAD図面・施工ナレッジを一元管理し、AI検索による技術ノウハウの迅速な活用を実現する。研究開発・特許管理・技術提案DBを統合し、技術力の組織的蓄積と活用を推進する。

### 1.2 背景
- 技術ノウハウの属人化（ベテラン技術者の退職リスク）
- BIM/CIM活用のi-Construction 2.0対応
- 「過去の港湾工事で地盤改良した事例」等の即時検索ニーズ

---

## 2. 機能要件

### 2.1 技術資料管理
- FR-TKB-001: 技術文書の分類・タグ管理
- FR-TKB-002: バージョン管理
- FR-TKB-003: 全文検索
- FR-TKB-004: SharePoint Online連携

### 2.2 BIM/CIM管理
- FR-TKB-010: IFCモデル管理・表示
- FR-TKB-011: モデルバージョン管理
- FR-TKB-012: 属性情報管理
- FR-TKB-013: 施工現場との連携

### 2.3 CAD図面管理
- FR-TKB-020: DWG/DXF/PDF図面管理
- FR-TKB-021: 図面検索（番号・工事名・工種）
- FR-TKB-022: 図面比較機能

### 2.4 AI施工ナレッジ検索
- FR-TKB-030: 自然言語による技術文書検索
- FR-TKB-031: 類似工法自動推薦
- FR-TKB-032: RAG（Retrieval Augmented Generation）による回答生成
- FR-TKB-033: 検索結果のランキング・関連度表示

### 2.5 研究管理・特許管理
- FR-TKB-040: 研究プロジェクト管理
- FR-TKB-041: 特許出願・維持管理
- FR-TKB-042: 技術論文DB

### 2.6 技術提案DB
- FR-TKB-050: 技術提案書テンプレート管理
- FR-TKB-051: 提案書の検索・再利用
- FR-TKB-052: 営業CRMとの連携

### 2.7 土質データ管理
- FR-TKB-060: 地質調査データDB
- FR-TKB-061: 土質データのGIS表示
- FR-TKB-062: 類似地盤条件検索

---

## 3. 非機能要件
- NFR-TKB-001: 大容量ファイル対応（BIMモデル数十GB）
- NFR-TKB-002: Entra ID SSO
- NFR-TKB-003: 全文検索インデックス更新：ニアリアルタイム

---

## 4. 技術スタック

| レイヤー | 技術 |
|----------|------|
| フロントエンド | React + Three.js + CesiumJS |
| バックエンド | Python FastAPI |
| データベース | PostgreSQL + PostGIS |
| 検索エンジン | Elasticsearch / Azure AI Search |
| AI/RAG | Azure OpenAI + LangChain |
| BIM | IFC.js / xBIM |
| ストレージ | Azure Blob Storage / SharePoint |
| 認証 | Entra ID + HENNGE SSO |

---

## 5. 統合要件
- 営業CRMへの技術提案DB連携
- 施工管理システムへのBIM/CIMデータ連携
- ソリューション営業へのナレッジ提供
- 統合データレイクへの技術データETL

---

## 6. フェーズ計画
Phase2（技術ナレッジ基盤）→ Phase3（BIM/CIM本格連携）

