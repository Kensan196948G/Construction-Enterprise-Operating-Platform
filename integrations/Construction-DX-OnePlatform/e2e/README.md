# e2e — Construction DX One Platform Playwright スイート

## 概要

3 部門の frontend + api-gateway をまたぐ end-to-end テスト雛形。
**dev server / docker compose が未起動の場合は自動 skip** されるよう
`_fixtures.ts::serviceUp` でガードしているため、CI/ローカル双方で安全に走らせられる。

## ディレクトリ構成

```
e2e/
├── package.json             # @playwright/test のみ
├── playwright.config.ts     # baseURL / projects (chromium/firefox/webkit)
├── tsconfig.json
└── tests/
    ├── _fixtures.ts         # service 死活ガード
    ├── auth-flow.spec.ts    # ログイン → ホーム / api-gateway /health
    ├── site-flow.spec.ts    # 04 施工: プロジェクト一覧 → 工程登録 → ガント
    └── cross-app.spec.ts    # api-gateway 経由で 04/06/10 各 API 疎通
```

## ローカル実行

```powershell
cd e2e
npm install
npm run e2e:install        # ブラウザバイナリ取得 (初回のみ)

# 別ターミナルで dev stack を起動
docker compose up -d postgres redis api-gateway construction-site-api `
                     construction-site-web safety-quality-web itsm-web

# テスト実行
npm run e2e
npm run e2e:ui             # UI モード (デバッグ)
npm run report             # 直近の HTML レポート
```

## 環境変数

| 変数 | 既定 | 用途 |
| --- | --- | --- |
| `E2E_SITE_URL` | `http://localhost:3000` | 04 施工 frontend |
| `E2E_SQ_URL` | `http://localhost:3001` | 06 安全品質 frontend |
| `E2E_ITSM_URL` | `http://localhost:3002` | 10 ITSM frontend |
| `E2E_GATEWAY_URL` | `http://localhost:8080` | api-gateway |

## CI での扱い

`.github/workflows/e2e.yml` が PR 毎に起動する。

- ビルド済 docker compose スタックを起動 → 60 秒 health 待ち → e2e 実行
- いずれかのサービスに到達できない場合、各テストは `_fixtures.ts::serviceUp` で skip される
- 当面は `continue-on-error: true` で運用 (skip-if-broken)。安定化後に外す

## 設計方針

1. **dev server に依存しないデフォルト動作** — service 未起動でも skip するため、
   開発初期段階でもブロックしない。
2. **gateway 経由のクロス部門アクセス** — `/api/<dept>/...` 形式の routing を契約とし、
   200/401/403/404 のいずれかであれば「経路は到達した」と判定する緩い assertion。
3. **broswer projects = chromium / firefox / webkit** — モバイル含む網羅はあえて見送り、
   段階的に拡張。
