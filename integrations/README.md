# Integrations — 統合元リポジトリ（Migration Sources）

本ディレクトリは、以下の 5 リポジトリの**現行スナップショット（.git 除く）**を
CEOP へ取り込んだ統合元ソースです。旧リポジトリは、全機能の統合が完了し
ユーザーの Y/N 確認を得た後に削除します（削除までは GitHub 側を正本とし、
本ディレクトリは統合・参照・監査用のコピーとして扱います）。

| リポジトリ | 技術スタック | 主な機能領域 | 備考 |
|---|---|---|---|
| ServiceHub-Construction-Platform | FastAPI + React/Vite + PostgreSQL + nginx + Prometheus | 工事案件・日報・写真・安全品質・原価工数・AI ナレッジ・契約法務・ITSM・通知・認証 | 880+ テスト。最も業務実装が進んでいる |
| Construction-Enterprise-OS | Python サービス群 + pnpm workspace + WebUI | ダッシュボード・現場管理・図面文書・承認・原価 ERP・GIS・IoT・AI・セキュリティ・ロボティクス | モック/設計中心 |
| Construction-DX-OnePlatform | 部門別モジュール群（11 本部）+ portal + shared-auth/api-gateway/shared-db/shared-pdf + monitoring | 施工・安全品質環境・営業・技術・購買・船舶・管理・経営企画・統合データ基盤・IT-DX・監査 | モック/設計中心 |
| Construction-DX-OS | FastAPI + cdx-agent + SDK + Postgres + OIDC | 端末登録・ハートビート・インベントリ・シリアルスキャン・ISO ビルド・PXE rollback・管理 UI | 端末基盤として最も実装が進んでいる |
| Synapse-OS | FastAPI マイクロサービス群 + Next.js | Tenant/Identity・Issue・Document・Approval・Audit・Dashboard・Knowledge・Federation・AI Gateway | 396 テスト。統制/ガバナンスで最先端 |

## ライセンス・帰属

- Construction-DX-OS: MIT（LICENSE ファイルあり）
- Construction-DX-OnePlatform: LICENSE ファイルあり
- ServiceHub / Construction-Enterprise-OS / Synapse-OS: リポジトリ内に LICENSE 未確認
  （ServiceHub README は MIT 表記）。CEOP は Proprietary のため、統合時は
  出所・ライセンス・帰属を `docs/integration/NOTICE.md` に記録し、
  権利確認が完了するまで本番利用しない方針とする。

## 更新方法

統合元の最新を取り込む場合:

```bash
git clone --depth 1 https://github.com/Kensan196948G/<repo>.git /tmp/src
rsync -a --exclude='.git' /tmp/src/ integrations/<repo>/
```

本ディレクトリは eslint / typecheck / build の対象外（`eslint.config.js` の ignores）。

