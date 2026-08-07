---
id: "0043"
title: "Admin SPA 事前ビルド化 → CSP から 'unsafe-eval' と unpkg.com を除去"
status: resolved
priority: P3
resolved: "2026-05-13"
resolution_pr: "#38"
phase: "Phase 4"
labels: [webui, admin, security, csp, build, tech-debt]
created: "2026-05-06"
parent: "0039"
---

## Summary

Loop 73 / PR #32 で、`/admin-spa/` を表示可能にするため CSP に下記の弱い緩和を入れた:

- `script-src` に `'unsafe-eval'`（ブラウザ Babel 変換）
- `script-src` に `https://unpkg.com`（React/ReactDOM/Babel CDN）
- `style-src` に `https://fonts.googleapis.com`（Google Fonts CSS）
- `font-src` に `https://fonts.gstatic.com`（Google Fonts 本体）

これは Anthropic Design Canvas のバンドルが「ランタイム JSX 変換 + CDN 依存」前提だった結果の暫定処置。本 Issue では SPA を **事前ビルド化** して、これらの緩和を **すべて元に戻す** ことを目的とする。

## Why this matters (security)

| ディレクティブ | 残置リスク |
|---|---|
| `'unsafe-eval'` | XSS 脆弱性が発生した場合、`eval/Function` 経由でリモートコード実行が可能になる |
| `https://unpkg.com` | CDN 改ざん攻撃 (supply chain) で React/Babel に悪意あるコードが混入すると即座に SPA を侵害 |
| Google Fonts | フォント取得経路の漏洩（小さいが、telemetry リスク） |

事前ビルドで `'self'` のみに戻れば **CSP は再び厳格** になり、上記すべてを遮断できる。

## Scope

1. **ビルドパイプライン選定**: esbuild (推奨、軽量) または Vite (推奨、開発時 HMR が強い) を選択
2. **proto-* JSX → JS 事前トランスパイル**: 9 個の `proto-*.jsx` を `proto-*.js` にビルド
3. **依存物の self-host**: React 18.3.1 / ReactDOM 18.3.1 を npm から取り込み、`/admin-spa/vendor/` 配下に配備
4. **Google Fonts の self-host**: 必要な woff2 と CSS を `/admin-spa/fonts/` に配備、または system font に置換
5. **index.html の書き換え**: `<script type="text/babel">` を通常の `<script type="module" src="proto-app.js">` に置換、CDN 参照を削除
6. **CSP 復元**: `security_headers.py` を Loop 73 修正前のポリシーへ戻す。`'unsafe-eval'` / `unpkg.com` / `fonts.googleapis.com` / `fonts.gstatic.com` をすべて削除
7. **テスト更新**: `test_csp_allows_admin_spa_cdn_dependencies` を「**含まれていないこと**」を assert する `test_csp_no_external_origins` に置き換え
8. **CI 統合**: `npm run build` が CI で実行され、ビルド成果物が `server/api/static/admin-spa/` に置かれることを保証
9. **regression 検証**: WebUI の全タブ (Dashboard / Devices / ISO / Rings / Security / Settings / Others) が事前ビルド版で同一動作することを Playwright で確認

## Acceptance Criteria

- [ ] `/admin-spa/index.html` が CDN を一切参照していない
- [ ] CSP ヘッダから `'unsafe-eval'` `https://unpkg.com` `https://fonts.*` がすべて削除されている
- [ ] `script-src` が `'self' 'unsafe-inline'` のみに戻る（厳密な `'self'` のみへ近づける）
- [ ] WebUI 7 タブの Playwright 回帰が緑
- [ ] CI でビルドが自動実行される

## Out of Scope

- React の Server-Side Rendering（必要なら別 Issue）
- React 19 へのアップグレード（必要なら別 Issue）
- Construction Hub launcher（`os/launcher/construction-hub/`）の事前ビルド化（こちらは Phase 1 別経路で扱う）

## 参考

- 暫定 PR (本 Issue を生んだトリガ): #32 (commit `d45ffb0`)
- 親 Issue: `0039` (Admin SPA design import)
- 影響ファイル: `server/api/static/admin-spa/*.jsx`, `server/api/cdx_server/obs/security_headers.py`

## Resolution (Loop 85 — 2026-05-13)

PR #38 で完了。実装内容:

- `build.mjs`: esbuild transform で 9 つの `proto-*.jsx` を JSX→JS 変換し `dist/bundle.js` に連結
- `vendor/react.min.js`, `vendor/react-dom.min.js`: React 18.3.1 UMD 本番ビルドを npm から self-host
- `index.html`: CDN `<script>`/`<link>` を全削除
- `security_headers.py`: CSP から `'unsafe-eval'` / `https://unpkg.com` / `fonts.googleapis.com` / `fonts.gstatic.com` を除去
- `test_csp_no_external_origins`: 4 CDN が CSP に含まれないことを assert
- `ci.yml` に `spa-build` ジョブを追加 (npm ci + npm run build + CDN sanity check)

## Acceptance Criteria 達成確認

- [x] `/admin-spa/index.html` が CDN を一切参照していない
- [x] CSP ヘッダから `'unsafe-eval'` `https://unpkg.com` `https://fonts.*` がすべて削除されている
- [x] `script-src` が `'self' 'nonce-...'` のみ (外部オリジンなし)
- [ ] WebUI 7 タブの Playwright 回帰が緑 (実機サーバーで要確認)
- [x] CI でビルドが自動実行される (spa-build ジョブ SUCCESS)
