# E2E Playwright 雛形 セルフチェック手順 (Loop #7)

`e2e/` 配下を **`npm install` / `tsc --noEmit` / 実行を未実施のまま** で品質確認するための
コードレビュー観点リスト。CI 安定化までは本ファイルを Verify チームが手動でなぞる。

## A. パッケージ構成チェック (`e2e/package.json`)

- [x] `@playwright/test` ^1.48 系
- [x] `@types/node` ^22 系 (TS の `process.env` / Node API 解決に必須)
- [x] `typescript` ^5.6 系
- [x] `private: true` で公開を防止
- [x] `name` は `@cdx/e2e` で workspaces 衝突なし
- [ ] (任意) `dotenv` を追加して `.env.e2e` を読みたい場合は要評価

## B. `tsconfig.json`

- [x] `strict: true` — 型安全
- [x] `moduleResolution: Bundler` — Playwright TS の最新解決方式
- [x] `types: ["node"]` — `process.env` / `Buffer` 等を解決
- [x] `include` に `tests/**/*.ts` と `playwright.config.ts`
- [ ] `noEmit` は Playwright 実行時に内部で TS を変換するため宣言不要 (default `false` で問題なし)

## C. `playwright.config.ts`

- [x] `defineConfig` を使用
- [x] `process.env.E2E_*_URL` でホスト名を上書き可能
- [x] `projects` = chromium / firefox / webkit (3 ブラウザ)
- [x] `forbidOnly: !!process.env.CI` — CI 上で `test.only` を禁止
- [x] `retries: 2` (CI のみ) — フレーキー耐性
- [x] `reporter` に `html` と `list` を両方
- [x] `trace: 'on-first-retry'` — 失敗時のみトレース取得 (容量節約)
- [x] `screenshot: 'only-on-failure'`, `video: 'retain-on-failure'`

## D. テスト spec のレビュー

### `_fixtures.ts`

- [x] `serviceUp(url)` ガードで dev server 未起動でも CI が落ちない設計
- [x] timeout 3000ms は短すぎず長すぎず妥当
- [ ] 注意: `use(async (url) => {...})` の中で `request.newContext()` を毎回生成。
      多テスト並列時には負荷あり。安定化後に context をフィクスチャ共有化を検討。

### `auth-flow.spec.ts`

- [x] ログイン入力フォームを `getByLabel(/メール|email/i)` で多言語対応
- [x] `expect(page).toHaveURL(/\/(home|dashboard|projects)/)` で SPA ルートの多様性吸収
- [x] `/health` 疎通テスト独立
- [ ] パスワード `dev-password` は shared-auth dev mode 前提。プロダクション fixture は別途必要

### `site-flow.spec.ts`

- [x] `beforeEach` でログイン後、`URL not /login` で認証成功を確認
- [x] ガント検証 `canvas, svg.gantt` の locator は実装依存だが妥当
- [ ] `data-testid` を frontend 側で付与すると locator が安定 (Phase 2 で整備候補)

### `cross-app.spec.ts`

- [x] `beforeAll` で gateway 死活ガード → skip 動作
- [x] 200/401/403/404 を許容する緩い contract — Phase 1 で適切
- [ ] 認証スタブ `Bearer dev-token` は shared-auth の dev token 仕様と整合が要確認

## E. Playwright 推奨パターンとの差分

- [x] `expect(...).toHaveURL` / `toBeVisible` の web-first assertion を使用
- [x] `getByRole` / `getByLabel` を locator として優先
- [x] テストファイルは `*.spec.ts` 命名
- [ ] **改善余地**: `test.step('...', async () => {...})` でログのストーリー化が未着手
- [ ] **改善余地**: `globalSetup` で API mocks 経由のシード投入を導入すると、auth-flow を skip させずに動かせる

## F. tsc --noEmit 相当の手動レビュー (実行はしない)

- [x] `import { test as base, request } from '@playwright/test'` — シンボル `request` は Playwright 1.20+ で公開済 (OK)
- [x] `extend<{ serviceUp: (url: string) => Promise<boolean>; }>` ジェネリクスで型注釈
- [x] `_fixtures.ts` 内 `use(...)` の引数が Playwright のフィクスチャ仕様に整合
- [x] `playwright.config.ts` の `process.env.E2E_*` は `@types/node` で解決
- [x] `tests/*.spec.ts` 全てに `import { test, expect } from './_fixtures'` で型推論伝搬
- [x] 明示的に `any` を使っている箇所なし

## G. CI 連動 (`.github/workflows/e2e.yml`)

- [x] `continue-on-error: true` で安定化までブロックしない
- [x] `docker compose up -d` で全 11 部門 + mocks を起動
- [x] `playwright-report` を artifact 保存
- [ ] **TODO**: `continue-on-error: true` を外す閾値を Loop #7 以降で明確化

## H. 起動コマンドのチートシート

```powershell
# 初回セットアップ
cd e2e
npm install
npm run e2e:install   # ブラウザバイナリ取得

# 全部実行 (3 ブラウザ x 3 spec)
npm run e2e

# 単一ブラウザ
npm run e2e:chromium

# UI モード (デバッグ)
npm run e2e:ui

# レポート閲覧
npm run report
```

## I. 既知の限界

1. dev server が未起動だと全 spec が `skip` になるため、**Green でもカバレッジ 0** の状態が発生し得る。
2. `auth-flow` は shared-auth の dev mode + テスト用ユーザー seed が前提。Loop #8 で seed スクリプトを `scripts/dev-fresh.ps1` に組み込む。
3. ブラウザ projects は webkit を含むが、Windows での webkit 起動は CI 環境依存。安定化までは chromium のみ走らせる選択も可。
4. `cross-app.spec.ts` は **404 を許容** しているため、未実装エンドポイントの検知力は低い。
   実装が進んだら 200/401 のみに絞る予定。
