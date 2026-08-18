# Civil Construction Management Platform

建設・土木現場業務と ISO 9001/14001/45001/55001/19650 統合マネジメントシステム (IMS) を一体化した統合業務基盤です。

[![CI](https://github.com/Kensan196948G/Civil-Construction-Management-Platform/actions/workflows/ci.yml/badge.svg)](https://github.com/Kensan196948G/Civil-Construction-Management-Platform/actions/workflows/ci.yml)
[![Node.js](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen)](https://nodejs.org/)

---

## 📌 アーキテクチャ概要

```
┌─────────────────────────────────────────────────────┐
│                   pnpm Monorepo                      │
│                                                      │
│  apps/api          apps/web                          │
│  NestJS 11         Next.js 15 App Router             │
│  Prisma 5          TanStack Query v5                 │
│  PostgreSQL 16     NextAuth v4                       │
│  JWT + RBAC        TailwindCSS + Radix UI            │
└─────────────────────────────────────────────────────┘
```

### 技術スタック

| レイヤー       | 技術                                                                                |
| -------------- | ----------------------------------------------------------------------------------- |
| バックエンド   | NestJS 11, Prisma 5, PostgreSQL 16, JWT (bcrypt 12)                                 |
| フロントエンド | Next.js 15 App Router, TanStack Query v5, NextAuth v4                               |
| UI             | TailwindCSS v3, Radix UI Primitives (shadcn/ui ベース)                              |
| パッケージ管理 | pnpm 9 ワークスペース                                                               |
| CI/CD          | GitHub Actions (6 ジョブ: Type / Lint / API / Web / E2E / Security), Docker Compose |

---

## 📋 ドメインモデル

```
Organization
├── User (SiteStaff / SiteManager / Executive / Auditor / Admin / ISOAuditor)
├── Project
│   └── Site
│       ├── WorkItem
│       └── Inspection → ChecklistItem
├── Nonconformity (NC-YYYY-NNNN)   ← ISO 不適合管理
│   ├── CorrectiveAction (CA-YYYY-NNNN)  ← 是正処置
│   └── Evidence                         ← 証跡
└── InternalAudit                         ← 内部監査
    └── AuditLog (不変証跡)              ← J-SOX/ISO 証跡
```

---

## 🚀 セットアップ

### 必要環境

- Node.js 22+
- pnpm 9+
- PostgreSQL 16+

推奨ローカル Node バージョン:

```bash
nvm use
```

### ローカル開発

```bash
# 依存パッケージインストール
pnpm install

# 環境変数設定
cp .env.example .env
# DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET を編集

# PostgreSQL 起動 (Docker)
docker-compose up -d postgres

# Prisma マイグレーション適用
pnpm db:migrate

# 開発サーバー起動 (API + Web 同時起動)
pnpm dev
```

Web UI: `http://192.168.0.185:3003`

The root URL opens the imported `Civil Construction Platform v2.dc.html` design prototype.

### Docker Compose 利用

```bash
docker-compose up -d   # PostgreSQL + API + Web 起動
```

### デモアカウント (シードデータ)

| メール             | パスワード | ロール      |
| ------------------ | ---------- | ----------- |
| admin@demo.local   | Demo1234!  | Admin       |
| manager@demo.local | Demo1234!  | SiteManager |
| staff@demo.local   | Demo1234!  | SiteStaff   |
| auditor@demo.local | Demo1234!  | Auditor     |
| exec@demo.local    | Demo1234!  | Executive   |

---

## 📊 API エンドポイント

| リソース       | エンドポイント            | 説明                   |
| -------------- | ------------------------- | ---------------------- |
| 認証           | `POST /auth/login`        | ログイン (JWT 発行)    |
| 認証           | `POST /auth/refresh`      | アクセストークン更新   |
| プロジェクト   | `GET /projects`           | 工事プロジェクト一覧   |
| 現場           | `GET /sites`              | 現場一覧               |
| 不適合         | `GET /nonconformities`    | NC 一覧 (NC-YYYY-NNNN) |
| 是正処置       | `GET /corrective-actions` | CA 一覧 (CA-YYYY-NNNN) |
| 証跡           | `POST /evidence`          | 証跡ファイル登録       |
| 内部監査       | `GET /audits`             | 内部監査一覧           |
| ダッシュボード | `GET /dashboard/overview` | ロール別概要           |
| ヘルスチェック | `GET /health`             | サービス稼働確認       |

Swagger UI: `http://192.168.0.185:3003/api/backend/api/docs` (開発環境のみ)

---

## 🧪 テスト

```bash
# ユニットテスト (全スイート)
pnpm test

# カバレッジ付き
pnpm test:cov

# 型チェック
pnpm typecheck

# Lint
pnpm lint

# ブラウザ E2E smoke
pnpm test:e2e
```

現在のテスト状況: **API 18 スイート / 314 テスト + Playwright E2E smoke 2 件** (2026-06-27 実測)

---

## 🔐 セキュリティ

- bcrypt 12 rounds (パスワード・リフレッシュトークン)
- JWT アクセストークン 15 分 + opaque リフレッシュトークン 7 日 (DB 管理・ローテーション)
- RBAC ガード + seed済みロール (`Admin` / `SiteManager` / `Auditor` / `ISOAuditor`) 正規化
- Helmet + CORS 設定済み
- 本番依存関係監査: `pnpm audit --prod` 既知脆弱性 0 件 (2026-06-27 実測)

---

## 📁 プロジェクト構成

```
Civil-Construction-Management-Platform/
├── apps/
│   ├── api/                    # NestJS 11 バックエンド
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # 14 モデル定義
│   │   │   └── seed.ts         # デモデータ
│   │   └── src/
│   │       ├── auth/           # JWT 認証 + RBAC
│   │       ├── projects/       # 工事プロジェクト
│   │       ├── sites/          # 現場管理
│   │       ├── nonconformities/ # 不適合管理 (IMS)
│   │       ├── corrective-actions/ # 是正処置 (IMS)
│   │       ├── evidence/       # 証跡管理
│   │       ├── audit/          # 内部監査 + AuditLog
│   │       └── dashboard/      # ロール別ダッシュボード
│   └── web/                    # Next.js 15 フロントエンド
│       └── src/app/
│           ├── (auth)/         # 認証ページ
│           └── (dashboard)/    # メインダッシュボード
├── .github/workflows/ci.yml    # GitHub Actions CI
├── docker-compose.yml          # ローカル環境
└── state.json                  # ClaudeOS セッション状態
```

---

## 📦 モジュール構成

| モジュール             | パス                                                                                             | 説明                                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| **Project Operations** | `apps/api/src/projects/`, `apps/api/src/sites/`, `apps/api/src/work-items/`                      | 工事プロジェクト・現場・作業項目の CRUD。工期・進捗・担当者管理を含む                                |
| **IMS Core**           | `apps/api/src/nonconformities/`, `apps/api/src/corrective-actions/`, `apps/api/src/inspections/` | ISO 9001/14001/45001 要求事項に準拠した不適合管理・是正処置・検査チェックリスト                      |
| **Dashboard**          | `apps/api/src/dashboard/`, `apps/web/src/app/(dashboard)/`                                       | ロール別集計ビュー (SiteStaff / SiteManager / Executive / Auditor)。KPI・未解決 NC・是正期限を可視化 |
| **Evidence Center**    | `apps/api/src/evidence/`, `apps/api/src/audit/`                                                  | NC/CA 紐づき証跡ファイル管理・内部監査・不変監査ログ (AuditLog)。J-SOX / ISO 証跡要件対応            |
| **Auth & RBAC**        | `apps/api/src/auth/`                                                                             | JWT (15 分) + opaque リフレッシュトークン (7 日)・bcrypt 12 rounds・ロール正規化付きアクセス制御     |
| **Shared Types**       | `packages/types/`                                                                                | API/Web 共通 TypeScript 型定義・列挙型                                                               |

---

## 🔄 開発ワークフロー

```
1. Issue 作成 → 2. Feature Branch → 3. 実装 + テスト → 4. PR 作成 → 5. CI 通過 → 6. レビュー → 7. Merge
```

### ブランチ戦略

| ブランチ        | 用途                    |
| --------------- | ----------------------- |
| `main`          | リリースブランチ (保護) |
| `master`        | 開発統合ブランチ        |
| `feat/<topic>`  | 機能追加                |
| `fix/<topic>`   | バグ修正                |
| `chore/<topic>` | 設定・依存関係更新      |

### コマンド一覧

```bash
pnpm install          # 依存パッケージインストール
pnpm dev              # 全ワークスペース開発サーバー起動
pnpm build            # 全ワークスペースビルド
pnpm test             # 全ワークスペーステスト実行
pnpm test:cov         # カバレッジ付きテスト
pnpm test:e2e         # Playwright E2E smoke
pnpm lint             # 全ワークスペース Lint
pnpm typecheck        # 型チェック
pnpm db:generate      # Prisma クライアント生成
pnpm db:migrate       # マイグレーション適用
pnpm db:push          # スキーマ直接適用 (CI 用)
pnpm db:seed          # デモデータ投入
```

---

## 🗺️ 統合元 (Legacy Projects)

| 旧プロジェクト                                     | 参照目的                           |
| -------------------------------------------------- | ---------------------------------- |
| `legacy-projects/Civil-Construction-IMS`           | ISO 要求事項・IMS ドメイン仕様     |
| `legacy-projects/ServiceHub-Construction-Platform` | 現場業務 UI・ワークフロー参照      |
| `legacy-projects/Construction-DX-OnePlatform`      | 統合ポータル・画面プロトタイプ参照 |

---

## 📈 開発状況 (2026-06-27)

| 項目                        | 状態                             |
| --------------------------- | -------------------------------- |
| バックエンド API 基盤       | ✅ 完了                          |
| フロントエンド Web 基盤     | ✅ 完了                          |
| Prisma スキーマ (14 モデル) | ✅ 完了                          |
| 認証・認可 (JWT + RBAC)     | ✅ 完了                          |
| IMS ドメイン実装            | ✅ 完了                          |
| ユニットテスト (314 件)     | ✅ 完了                          |
| GitHub Actions CI           | ✅ 6 ジョブ構成                  |
| Docker Compose              | ✅ local / prod config 検証済    |
| InspectionModule 本実装     | ✅ 完了                          |
| WorkItemsModule 本実装      | ✅ 完了                          |
| Web production build        | ✅ Node 22 で確認済              |
| E2E テスト                  | ✅ IMS vertical smoke 確認済     |
| Security audit              | ✅ 本番依存関係の既知脆弱性 0 件 |
| RBAC role normalization     | ✅ seed済みロール互換テスト追加  |
| Web Docker runner           | ✅ standalone 起動確認済         |
| NC/CA/Evidence 監査ログ     | ✅ AuditLog 統合・テスト追加     |
| テナント分離                | ✅ Backend baseline 完了         |
| IMS vertical slice UI       | ✅ Create/detail baseline 完了   |

### 🚧 Release Gate 残タスク

| ゲート                  | 状態               | 次アクション                                                                                                                 |
| ----------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| テナント分離            | ✅ Baseline 完了   | Project / Site / WorkItem / Inspection / Evidence は JWT 組織スコープに統一。最終リリース前に route-level two-org E2E を追加 |
| NC/CA/Evidence 監査ログ | ✅ E2E 確認済      | 登録・更新・完了・削除時に `AuditService.createAuditLog` を統合。NC/CA/Evidence CREATE は Playwright + audit-log API で確認   |
| IMS vertical slice UI   | ✅ E2E 確認済      | `/nonconformities/new` → `/corrective-actions/new` → `/evidence/new` の登録・詳細・証跡添付導線を Firefox E2E で確認           |
| GitHub Projects         | ⚠️ 更新先未確定    | PR #10 の正しいProject board確認後に更新                                                                                     |
