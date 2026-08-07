# Construction DX One Platform - ClaudeCode 初期コマンドプロンプト指示書

## プロジェクト概要

本書は「Construction DX One Platform（統合建設DX基盤）」の開発をClaudeCodeで進める際の初期コマンドプロンプト指示書です。みらい建設工業の組織構造に基づき、部門別MVP → API統合 → 全社統合の流れでシステムを構築します。

---

## 対象企業情報

- **企業名**: みらい建設工業株式会社
- **業種**: 建設土木（海上工事・陸上工事・エネルギー関連工事）
- **組織図参照**: https://www.mirai-const.co.jp/company/chart/
- **特性**: 公共工事比率が高い、港湾・海上工事に強み
- **既存IT環境**: Microsoft 365 / Entra ID / SharePoint Online / FortiGate / Cisco / DeskNet's NEO / HENNGE

---

## 準拠法規・規格

- ISO 9001（品質マネジメント）
- ISO 14001（環境マネジメント）
- ISO 45001（労働安全衛生マネジメント）
- 建設業法
- 品確法（公共工事の品質確保の促進に関する法律）
- 労働安全衛生法
- i-Construction 2.0
- 電子帳簿保存法
- インボイス制度

---

## 共通技術スタック

```
フロントエンド: React 18 + TypeScript 5 + PWA (Workbox)
バックエンド:   Python FastAPI
データベース:   PostgreSQL 16 + PostGIS + TimescaleDB
検索:          Elasticsearch (Kuromoji)
キャッシュ:     Redis 7
AI/ML:         Azure OpenAI GPT-4o / scikit-learn / Prophet / LangChain
認証:          Entra ID + HENNGE SSO (OIDC/OAuth2)
GIS:           CesiumJS / Leaflet + PostGIS
3D/BIM:        IFC.js / Three.js
ETL:           Apache Airflow + dbt
監視:          Zabbix + Grafana + Wazuh (SIEM)
コンテナ:       Docker + Docker Compose
CI/CD:         GitHub Actions
```

---

## プロジェクト構成

```
Construction-DX-OnePlatform/
├── 00_共通基盤/
│   ├── docs/                          # 本指示書等
│   ├── shared-auth/                   # 統合認証モジュール
│   ├── shared-db/                     # 共通マスタ・マイグレーション
│   ├── shared-ui/                     # 共通UIコンポーネント
│   └── api-gateway/                   # 統合APIゲートウェイ
├── 01_経営企画部/ConstructionExecutiveDashboard/
├── 02_営業本部/ConstructionCRM-BidManagement/
├── 03_ソリューション営業本部/SmartInfrastructureSolutionPlatform/
├── 04_施工本部/ConstructionSiteManagementSystem/
├── 05_技術本部/TechnicalKnowledge-BIMPlatform/
├── 06_安全品質環境本部/SafetyQualityGovernancePlatform/
├── 07_管理本部/CorporateOperationPlatform/
├── 08_購買部/ProcurementMaterialPlatform/
├── 09_船舶事業部/MarineFleetManagement/
├── 10_IT-DX部門/ConstructionITSM-ZeroTrustPlatform/
└── 11_統合データ基盤/ConstructionDataLake-DigitalTwin/
```

---

## フェーズ計画と開発順序

### Phase 1（最優先）
1. **統合認証基盤** (00_共通基盤/shared-auth)
2. **施工管理システム** (04_施工本部) - PWAオフライン対応必須
3. **安全品質ガバナンス** (06_安全品質環境本部)
4. **ITSM/ゼロトラスト基盤** (10_IT-DX部門)
5. **共通マスタ・文書管理基盤** (00_共通基盤/shared-db)

### Phase 2
6. **原価管理** (07_管理本部 - 経理機能)
7. **購買・調達管理** (08_購買部)
8. **建設CRM・入札管理** (02_営業本部)
9. **技術ナレッジ基盤** (05_技術本部)

### Phase 3
10. **経営ダッシュボード** (01_経営企画部)
11. **BIM/CIM本格連携** (05_技術本部 + 03_ソリューション営業本部)
12. **AI解析基盤** (11_統合データ基盤)
13. **船舶運航管理** (09_船舶事業部)
14. **IoT連携・デジタルツイン** (11_統合データ基盤)

---

## ClaudeCode 初期コマンド手順

### Step 0: 環境準備

```bash
# プロジェクトルートに移動
cd Construction-DX-OnePlatform

# Python仮想環境の作成
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# .venv\Scripts\activate  # Windows

# Node.js環境確認
node --version  # v20以上推奨
npm --version

# Docker環境確認
docker --version
docker compose version
```

### Step 1: 共通基盤の構築

```bash
# --- 共通データベース初期化 ---
mkdir -p 00_共通基盤/shared-db/migrations
mkdir -p 00_共通基盤/shared-db/seeds

# ClaudeCodeへの指示:
# 「共通マスタのデータベースマイグレーションファイルを作成してください。
#  以下の共通マスタテーブルを含めてください：
#  - t_department (組織マスタ)
#  - t_branch (支店マスタ)
#  - t_employee (従業員マスタ)
#  - t_client_org (発注者マスタ)
#  - t_project (工事マスタ)
#  - t_material (資材マスタ)
#  PostgreSQL 16 + PostGIS を使用。
#  Alembic でマイグレーション管理。」
```

### Step 2: 統合認証モジュール

```bash
mkdir -p 00_共通基盤/shared-auth

# ClaudeCodeへの指示:
# 「Entra ID (OIDC) + HENNGE SSO 連携の認証モジュールを作成してください。
#  FastAPI用のミドルウェアとして実装。
#  以下を含めてください：
#  - OIDC認証フロー
#  - JWT検証ミドルウェア
#  - RBAC (ロールベースアクセス制御)
#  - セッション管理 (Redis)
#  - Entra IDグループ→アプリロールのマッピング
#  python-jose, httpx, redis を使用。」
```

### Step 3: 共通UIコンポーネント

```bash
mkdir -p 00_共通基盤/shared-ui

# ClaudeCodeへの指示:
# 「React 18 + TypeScript の共通UIコンポーネントライブラリを作成してください。
#  建設DXシステム用の共通UIを含めてください：
#  - Layout (サイドバー + ヘッダー + メイン)
#  - DataTable (ソート/フィルタ/ページネーション)
#  - FormBuilder (動的フォーム生成)
#  - ChartWrapper (Recharts/D3ラッパー)
#  - FileUploader (写真/文書アップロード)
#  - OfflineIndicator (オフライン状態表示)
#  - SyncStatusBar (同期状態バー)
#  - MapViewer (Leaflet/CesiumJS切替)
#  Tailwind CSS v3 でスタイリング。」
```

### Step 4: Phase1 施工管理システム（最重要）

```bash
mkdir -p 04_施工本部/ConstructionSiteManagementSystem/{backend,frontend}

# ClaudeCodeへの指示（バックエンド）:
# 「施工管理システムのバックエンドAPIを FastAPI で構築してください。
#  詳細設計仕様書 DDS-CSM-001 に基づき、以下のAPI群を実装：
#  
#  1. 施工プロジェクトCRUD
#  2. 工程管理（ガントチャート対応）
#  3. 出来高管理
#  4. 原価管理（EAC予測含む）
#  5. 作業日報CRUD + 承認ワークフロー
#  6. 現場写真管理（アップロード + AI分類）
#  7. 電子黒板（SHA-256改ざん検知）
#  8. 作業員入退場（QRコード対応）
#  9. 重機管理
#  10. オフライン同期API (push/pull/status)
#  
#  PostgreSQL + SQLAlchemy 2.0 + Alembic
#  認証は shared-auth モジュールを参照
#  同期エンジンはタイムスタンプベースのコンフリクト解決を実装」

# ClaudeCodeへの指示（フロントエンド）:
# 「施工管理システムのフロントエンドをReact PWAで構築してください。
#  最重要要件: オフライン完全対応（Service Worker + IndexedDB）
#  
#  1. Workbox による Service Worker 設定
#  2. Dexie.js による IndexedDB スキーマ設計
#  3. Background Sync API によるオフライン→後同期
#  4. 以下の画面を実装:
#     - 現場ダッシュボード
#     - 工程表（ガントチャート - Gantt Task React）
#     - 出来高入力フォーム
#     - 原価入力・分析画面
#     - カメラ撮影・写真管理・電子黒板
#     - 作業日報入力
#     - KY活動記録
#     - 入退場QRスキャナー
#     - 同期ステータス画面
#  PWA manifest.json + アイコン生成含む」
```

### Step 5: Phase1 安全品質ガバナンス

```bash
mkdir -p 06_安全品質環境本部/SafetyQualityGovernancePlatform/{backend,frontend}

# ClaudeCodeへの指示:
# 「安全品質ガバナンスシステムを構築してください。
#  詳細設計仕様書 DDS-SQG-001 に基づき実装。
#  
#  バックエンド (FastAPI):
#  - ヒヤリハット管理 + 4M分析
#  - KY活動管理
#  - 労災事故記録 + 度数率/強度率自動計算
#  - 安全パトロール（チェックリスト + 写真）
#  - 品質記録 + 不適合管理 + CAPA
#  - ISO監査管理（ISO9001/14001/45001）
#  - 環境記録（CO2 Scope1/2/3、産廃マニフェスト）
#  - AI危険予測API
#  
#  フロントエンド (React PWA):
#  - モバイル最適化（現場利用）
#  - オフライン対応（ヒヤリハット・パトロール入力）
#  - 写真撮影・添付機能
#  - ダッシュボード（安全指標・品質指標・環境指標）」
```

### Step 6: Phase1 ITSMゼロトラスト基盤

```bash
mkdir -p 10_IT-DX部門/ConstructionITSM-ZeroTrustPlatform/{backend,frontend}

# ClaudeCodeへの指示:
# 「ITSM・ゼロトラスト基盤システムを構築してください。
#  詳細設計仕様書 DDS-ITZ-001 に基づき実装。
#  
#  バックエンド (FastAPI):
#  - ITSMチケット管理（インシデント/問題/変更/リクエスト）
#  - CMDB（IT資産台帳 + 構成関連管理）
#  - FortiGateログ収集（Syslog受信 + 解析）
#  - Ciscoデバイス監視（SNMP v3）
#  - Entra IDサインインログ分析
#  - AI HelpDesk（RAG: Azure OpenAI + ナレッジベース）
#  - SLA管理・レポート
#  
#  統合監視:
#  - Wazuh連携（SIEM）
#  - Zabbix連携（ネットワーク監視）
#  - Grafanaダッシュボード設定
#  
#  フロントエンド (React):
#  - チケット管理画面
#  - CMDBビューア（トポロジー表示含む）
#  - SIEM ダッシュボード
#  - ネットワーク監視画面
#  - AI HelpDesk チャットUI」
```

### Step 7: Docker Compose 統合環境

```bash
# ClaudeCodeへの指示:
# 「Phase1 の全システムを統合する docker-compose.yml を作成してください。
#  
#  サービス一覧:
#  - postgres (PostgreSQL 16 + PostGIS + TimescaleDB)
#  - redis (Redis 7)
#  - elasticsearch (Elasticsearch 8 + Kuromoji)
#  - construction-site-api (施工管理バックエンド)
#  - construction-site-web (施工管理フロントエンド)
#  - safety-quality-api (安全品質バックエンド)
#  - safety-quality-web (安全品質フロントエンド)
#  - itsm-api (ITSMバックエンド)
#  - itsm-web (ITSMフロントエンド)
#  - nginx (リバースプロキシ + SSL終端)
#  - wazuh (SIEM)
#  - zabbix-server (監視)
#  - grafana (可視化)
#  
#  ネットワーク: 
#  - frontend (外部公開)
#  - backend (内部通信)
#  - monitoring (監視系)
#  
#  ボリューム: PostgreSQL + Elasticsearch + MinIO 永続化
#  環境変数: .env ファイルで管理」
```

---

## 各部門API統合のための共通ルール

### API命名規約
```
/api/v1/{domain}/{resource}
例: /api/v1/construction/projects
    /api/v1/safety/near-miss
    /api/v1/itsm/tickets
```

### 共通レスポンスフォーマット
```json
{
  "status": "success",
  "data": { ... },
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 150
  }
}
```

### エラーレスポンス
```json
{
  "status": "error",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力値が不正です",
    "details": [...]
  }
}
```

### 共通ヘッダー
```
Authorization: Bearer {entra_id_jwt_token}
X-Request-ID: {uuid}
X-Department: {department_code}
Accept-Language: ja
```

---

## テスト方針

### ユニットテスト
```bash
# バックエンド
pytest tests/ --cov=app --cov-report=html

# フロントエンド
npm test -- --coverage
```

### E2Eテスト
```bash
# Playwright
npx playwright test
```

### オフラインテスト（施工管理固有）
```bash
# Chrome DevTools > Network > Offline でテスト
# Service Worker の動作確認
# IndexedDB データ整合性確認
# 同期コンフリクト解決テスト
```

---

## CI/CD パイプライン

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  backend-test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgis/postgis:16-3.4
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.12' }
      - run: pip install -r requirements.txt
      - run: pytest --cov

  frontend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm test -- --coverage
      - run: npm run build
```

---

## 監視・アラート設定

### 重要アラート
| 対象 | 条件 | 通知先 |
|------|------|--------|
| API応答時間 | > 5秒 | IT-DX部門 Slack |
| DB接続数 | > 80% | IT-DX部門 Slack |
| ディスク使用量 | > 85% | IT-DX部門 Slack |
| セキュリティイベント | Critical | IT-DX部門 + 経営層 |
| 同期エラー | 連続5回失敗 | IT-DX部門 Slack |

---

## 運用ドキュメント参照

各部門の要件定義書・詳細設計仕様書は以下のパスに格納：

```
Construction-DX-OnePlatform/
├── 01_経営企画部/ConstructionExecutiveDashboard/
│   ├── 要件定義書_経営ダッシュボード.md
│   └── 詳細設計仕様書_経営ダッシュボード.md
├── 02_営業本部/ConstructionCRM-BidManagement/
│   ├── 要件定義書_建設CRM入札管理.md
│   └── 詳細設計仕様書_建設CRM入札管理.md
├── 03_ソリューション営業本部/SmartInfrastructureSolutionPlatform/
│   ├── 要件定義書_スマートインフラソリューション.md
│   └── 詳細設計仕様書_スマートインフラ.md
├── 04_施工本部/ConstructionSiteManagementSystem/
│   ├── 要件定義書_施工管理システム.md
│   └── 詳細設計仕様書_施工管理システム.md
├── 05_技術本部/TechnicalKnowledge-BIMPlatform/
│   ├── 要件定義書_技術ナレッジBIM基盤.md
│   └── 詳細設計仕様書_技術ナレッジBIM基盤.md
├── 06_安全品質環境本部/SafetyQualityGovernancePlatform/
│   ├── 要件定義書_安全品質ガバナンス.md
│   └── 詳細設計仕様書_安全品質ガバナンス.md
├── 07_管理本部/CorporateOperationPlatform/
│   ├── 要件定義書_企業運営基盤.md
│   └── 詳細設計仕様書_企業運営基盤.md
├── 08_購買部/ProcurementMaterialPlatform/
│   ├── 要件定義書_調達資材管理.md
│   └── 詳細設計仕様書_調達資材管理.md
├── 09_船舶事業部/MarineFleetManagement/
│   ├── 要件定義書_船舶運航管理.md
│   └── 詳細設計仕様書_船舶運航管理.md
├── 10_IT-DX部門/ConstructionITSM-ZeroTrustPlatform/
│   ├── 要件定義書_ITSM-ゼロトラスト基盤.md
│   └── 詳細設計仕様書_ITSM-ゼロトラスト基盤.md
└── 11_統合データ基盤/ConstructionDataLake-DigitalTwin/
    ├── 要件定義書_統合データレイク.md
    └── 詳細設計仕様書_統合データレイク.md
```

---

## 最終目標

```
現場 → IoT → BIM/CIM → AI解析 → 経営分析 → 全社最適化
```

Construction Digital Twin Platform として、全部門データを統合し、
「統合建設DX基盤」によるデータドリブン経営を実現する。

---

*本指示書は Construction DX One Platform 開発の起点として使用してください。*
*各StepのClaudeCodeへの指示をコピー＆ペーストして順次実行することで、*
*Phase1 のMVP構築が可能です。*

