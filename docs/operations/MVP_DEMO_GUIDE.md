# CEOP MVP/Prototype デモガイド（v0.13.0）

この文書は、**架空のデモデータ一式**を使って CEOP を実際に操作・評価するための手順です。
本番運用・本番 DB・実データには一切影響しません。

## 1. 起動（2 通り）

### 1-a. In-Memory デモ（すぐ確認）

```bash
pnpm install
pnpm run start:demo        # CEOP_SEED_RICH_DEMO=true でポート 3000 に起動
```

デモ API キーは `CEOP_LOG_DEMO_CREDS=true pnpm run start:demo` とすると stderr に表示されます。
`admin`（`*:*`）と `viewer`（閲覧のみ）の 2 系統です。

### 1-b. SQLite 永続デモ（再起動後も保持）

```bash
pnpm run seed:demo -- --db /tmp/ceop-demo.db   # migration 001〜026 + 全デモデータ投入
CEOP_SQLITE_FILE=/tmp/ceop-demo.db pnpm start
```

`seed-demo.ts` は既に案件データが存在する DB への上書きを拒否します（本番データ保護）。
デモ DB を作り直す場合は明示的に `--force` を付けてください。

## 2. ダミーデータの構成（すべて架空）

| 区分             | 内容（件数）                                                                            |
| ---------------- | --------------------------------------------------------------------------------------- |
| 組織             | 本社・支店・現場×2・協力会社（5）                                                       |
| ロール/ユーザー  | 8 ロール（管理者/所長/品質/安全/調達/監査/作業員/閲覧）・12 ユーザー                    |
| 案件             | 進行中 2・計画 1・完了 1・中断 1（5、予算・発注者・住所・工期付き）                     |
| 日報             | 下書き→提出→承認の状態遷移例（6）                                                       |
| ISO レコード     | 品質/環境/安全/資産/BIM/監査/ISMS/BCP の 32 種（親子リンク付き）                        |
| 契約・法的証跡   | 元請/下請 6 契約 + 証跡イベント 5（SHA-256 風の架空ハッシュ）                           |
| 発注             | draft/issued/approved/received/cancelled の 6 件（金額自動計算）                        |
| 安全/品質        | パトロール・KY（指摘あり）3 件 / 検査 pass・fail・pending 4 件                          |
| 原価/工数        | 費目別 予算 vs 実績 5 件 / 作業員別工数 6 件                                            |
| 工程・写真・図面 | 作業予定 5 / 写真メタ 5 / 図面 Rev. 管理 6                                              |
| ナレッジ/AI 統制 | 記事 6（AI 生成 1 は承認済 AI アクションと連結）・AI アクション 4（承認/却下/利用制限） |
| 通知             | テンプレート 3・購読設定 3・配信 4（sent/pending/failed/retry・未読 3）                 |
| 承認ワークフロー | 日報/発注/安全の定義 3・インスタンス 4（承認/却下/保留）                                |
| 連携             | 6 システム契約 + イベント 6（inbound received / outbound sent/retrying/failed）         |
| 監査証跡         | ハッシュチェーン済み 10 件（`GET /api/v1/governance/audit/export` で CSV 出力可）       |

人物名・会社名・住所・メール・金額・ハッシュはすべて架空です（`mirai-dx-demo.example` 等）。
シード実装は `src/persistence/rich-demo.ts`、再生成は上記コマンドでいつでも可能です。

## 3. 操作ウォークスルー（ブラウザ）

| 画面             | 手順                               | 確認ポイント                                                    |
| ---------------- | ---------------------------------- | --------------------------------------------------------------- |
| `/portal`        | 認証なしで開く                     | 全モジュール入口                                                |
| `/dashboard`     | admin キーで開く                   | ユーザー/アプリ/デバイス KPI・障害アプリ（Document Service 等） |
| `/daily-reports` | 案件 `DEMO-2026-001` を選択        | 承認済み/提出済み/下書きの日報一覧 → 新規作成→提出→承認         |
| `/iso-app`       | 分析タブ → 品質タブ → 種類絞り込み | 32 種の規格別件数・検索・状態遷移・連携契約 6 システム          |
| `/governance`    | ポリシー評価・監査閲覧             | 評価実行と監査証跡の確認                                        |
| `/iso`           | ランディング                       | ISO 統合マネジメント入口                                        |

## 4. API 例（admin キー使用）

```bash
CRED="<keyId>:<secret>"
BASE=http://localhost:3000

curl -s -H "Authorization: Bearer $CRED" $BASE/api/v1/projects
curl -s -H "Authorization: Bearer $CRED" "$BASE/api/v1/projects/project-demo-1/daily-reports"
curl -s -H "Authorization: Bearer $CRED" "$BASE/api/v1/iso?limit=50"
curl -s -H "Authorization: Bearer $CRED" $BASE/api/v1/notifications/unread-count
curl -s -H "Authorization: Bearer $CRED" $BASE/api/v1/workflow-instances
curl -s -H "Authorization: Bearer $CRED" $BASE/api/v1/integrations/events
curl -s -H "Authorization: Bearer $CRED" $BASE/api/v1/governance/audit/export
```

CSV 帳票: `/api/v1/daily-reports/export.csv`（日報）・`/api/v1/iso/export.csv`（ISO）。

## 5. 検証

```bash
pnpm run verify          # format/openapi/typecheck/lint/test 553/build/parity
pnpm run test:e2e        # Playwright（portal/dashboard/daily-reports/iso-app/mvp-demo・12 テスト）
```

※ 開発機で Chromium が SIGTRAP になる環境では、ローカル限定設定
`playwright.firefox.local.config.ts`（`--config` で指定）で Firefox 実行できます。CI は Chromium のままです。

## 6. URL 区分

- 本番: `https://ceop.mirai-dx-platform.com`（既存・本ドキュメントの作業では変更しない）
- MVP/Prototype: `https://ceop-mvp.mirai-dx-platform.com`（別 Tunnel・別ポートで公開する想定。
  公開状況は最終報告を参照）

## 7. 既知制約

- PDF 帳票・SMTP/Slack 実送信・AI 推論本体はバックログ（デモはメタデータ/統制フローまで）
- デモデータは開発/評価専用。`NODE_ENV=production` では投入を拒否
