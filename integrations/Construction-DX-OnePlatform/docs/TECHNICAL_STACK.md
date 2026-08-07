# ⚙️ 技術スタック

Construction DX One Platform の技術構成を、確認しやすいようにレイヤー別に整理した資料です。

非エンジニア向け概要: [README.md](../README.md)

IT部門向け運用資料: [README_ENGINEERS.md](./README_ENGINEERS.md)

---

## 🗺️ 全体構成

```mermaid
flowchart TB
    User[👤 Users<br/>本社・支店・現場・経営・監査]
    Portal[🌐 Integrated Portal<br/>React + nginx]
    Gateway[🚪 API Gateway<br/>FastAPI]
    Dept[🏢 Department APIs<br/>FastAPI x 11]
    Data[🗄️ Data Layer<br/>PostgreSQL / Redis / Elasticsearch / MinIO]
    Monitor[📊 Monitoring & Security<br/>Grafana / Zabbix / Wazuh]

    User --> Portal
    Portal --> Gateway
    Gateway --> Dept
    Dept --> Data
    Data --> Monitor
```

## 🌐 フロントエンド

| 技術 | 用途 |
| --- | --- |
| ![React](https://img.shields.io/badge/React-18.3.1-61dafb?logo=react) | 統合ポータルと部門別WebUI |
| ![Vite](https://img.shields.io/badge/Vite-5.x-646cff?logo=vite) | 部門別フロントエンドの開発・ビルド |
| ![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript) | 部門別WebUIの型安全 |
| ![nginx](https://img.shields.io/badge/nginx-1.27--alpine-009639?logo=nginx) | 静的ファイル配信 |
| SVG / CSS Custom Properties | チャート、アイコン、ライト/ダークテーマ |

## 🐍 バックエンド

| 技術 | 用途 |
| --- | --- |
| ![Python](https://img.shields.io/badge/Python-3.12-3776ab?logo=python) | バックエンド共通言語 |
| ![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi) | API Gateway、部門API |
| ![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0-cc2927?logo=sqlalchemy) | ORM |
| ![Pydantic](https://img.shields.io/badge/Pydantic-2.x-e92063?logo=pydantic) | API入出力検証 |
| Alembic | DBマイグレーション |
| uvicorn | ASGIサーバー |

## 🗄️ データ層

| 技術 | 用途 |
| --- | --- |
| ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql) | 業務データ |
| PostGIS | 位置情報、現場・設備データ |
| TimescaleDB | IoT・時系列データ |
| ![Redis](https://img.shields.io/badge/Redis-7--alpine-dc382d?logo=redis) | キャッシュ、セッション |
| ![Elasticsearch](https://img.shields.io/badge/Elasticsearch-8-005571?logo=elasticsearch) | 全文検索、ログ検索 |
| ![MinIO](https://img.shields.io/badge/MinIO-Object%20Storage-c72e49?logo=minio) | 写真、PDF、図面ファイル |

## 🛡️ 認証・セキュリティ

```mermaid
flowchart LR
    ID[🪪 Microsoft Entra ID / HENNGE ONE]
    GW[🚪 API Gateway]
    RBAC[🔐 RBAC / 権限]
    Log[📋 Audit Log]
    SIEM[🛡️ Wazuh / Zabbix]

    ID --> GW
    GW --> RBAC
    RBAC --> Log
    Log --> SIEM
```

| 技術・仕組み | 用途 |
| --- | --- |
| Microsoft Entra ID | 社内ID連携 |
| HENNGE ONE | SSO / メール・ID統制 |
| RBAC | 部門・役割別アクセス制御 |
| Wazuh | セキュリティ監視 |
| Zabbix | インフラ監視 |
| 監査ログ | 操作証跡、権限変更、出力履歴 |

## 🐳 インフラ・運用

| 技術 | 用途 |
| --- | --- |
| ![Docker](https://img.shields.io/badge/Docker-Compose%20v2-2496ed?logo=docker) | ローカル/社内機器でのコンテナ起動 |
| ![systemd](https://img.shields.io/badge/systemd-User%20Service-0d597f) | 機器起動時の自動起動 |
| ![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-CI%2FCD-2088ff?logo=githubactions) | CI/CD |
| Grafana | メトリクス可視化 |
| nginx healthcheck | WebUI死活監視 |

## 🧪 品質・テスト

| ツール | 用途 |
| --- | --- |
| pytest | Pythonユニットテスト |
| ESLint | JavaScript/TypeScript静的解析 |
| Ruff | Python静的解析 |
| npm audit | Node.js依存関係チェック |
| pip-audit | Python依存関係チェック |
| Playwright | E2Eテスト |

## 🏗️ 部門別構成

```mermaid
flowchart LR
    Common[00 共通基盤]
    Exec[01 経営企画]
    Sales[02 営業]
    Solution[03 ソリューション]
    Site[04 施工]
    Tech[05 技術]
    SQ[06 安全品質環境]
    Admin[07 管理]
    Proc[08 購買]
    Marine[09 船舶]
    ITSM[10 IT-DX]
    Lake[11 統合データ基盤]

    Common --> Exec
    Common --> Sales
    Common --> Solution
    Common --> Site
    Common --> Tech
    Common --> SQ
    Common --> Admin
    Common --> Proc
    Common --> Marine
    Common --> ITSM
    Common --> Lake
```

## 🌐 標準・制度対応

| 標準・制度 | 関連領域 |
| --- | --- |
| i-Construction 2.0 | BIM/CIM、ICT施工、3次元データ |
| ISO 9001 | 品質管理 |
| ISO 14001 | 環境管理 |
| ISO 20000 | ITサービス管理 |
| ISO 27001 | 情報セキュリティ |
| J-SOX | 内部統制、監査証跡 |
| 電子帳簿保存法 | 電子データ保存 |
| インボイス制度 | 請求・購買管理 |

## 🔗 関連資料

- [IT部門向けガイド](./README_ENGINEERS.md)
- [ポート一覧](./PORTS.md)
- [自動起動ガイド](./AUTOSTART.md)
- [本番リリースロードマップ](./PRODUCTION_LAUNCH_ROADMAP.md)
