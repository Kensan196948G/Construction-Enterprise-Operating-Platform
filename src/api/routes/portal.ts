/**
 * Portal landing page (P4): links every CEOP module behind one entry point.
 *
 * v0.14.1: rebuilt with the standard left-sidebar + right-content layout so
 * the portal behaves like every other CEOP screen (header, accordion sidebar
 * including the ⚙️ システム設定 group, and module cards in the main pane).
 */

import type { ServerResponse } from "node:http";
import { PLATFORM_VERSION } from "../../version.ts";
import type { Router } from "../router.ts";

function renderPortal(): string {
  const modules: ReadonlyArray<readonly [string, string, string]> = [
    ["/dashboard", "📊 ダッシュボード", "KPI・アプリ健康・端末・承認"],
    ["/governance", "🛡️ ガバナンス", "ポリシー・監査ログ・ABAC 評価"],
    ["/iso", "📋 ISO 統合マネジメント", "ISO 9001/14001/45001/55001/19650・監査・ISMS・BCP"],
    [
      "/mvp-app",
      "🧩 統合モジュール（MVP）",
      "現場管理・AI ビルド・DX ポートフォリオ・材料フォトログ",
    ],
    ["/daily-reports", "📝 日報管理コンソール", "日報の作成・提出・承認"],
    ["/api/v1/info", "ℹ️ プラットフォーム情報", "ビルド・環境・バージョン"],
    ["/metrics", "📈 Prometheus メトリクス", "リクエスト・ランタイム・キュー"],
  ];
  const cards = modules
    .map(
      ([href, title, desc]) => `
      <a class="portal-card" href="${href}">
        <div class="portal-card__title">${title}</div>
        <div class="portal-card__desc">${desc}</div>
      </a>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ポータル — 建設企業プラットフォーム</title>
    <link rel="icon" href="/api/assets/favicon.svg" type="image/svg+xml" />
    <link rel="manifest" href="/api/assets/manifest.webmanifest" />
    <link rel="apple-touch-icon" href="/api/assets/favicon-192.png" />
    <link rel="stylesheet" href="/api/assets/app.css" />
  </head>
  <body>
    <header class="header">
      <button class="hamburger" id="hamburgerBtn" aria-label="メニューを開閉">☰</button>
      <a class="header__logo" href="/portal">
        <span class="header__logo-mark">🏛️</span>
        <span>
          <span class="header__title">建設企業プラットフォーム</span>
          <span class="header__subtitle">Portal / P4 — モジュール一覧</span>
        </span>
      </a>
      <div class="header__spacer"></div>
      <span class="header__version">v${PLATFORM_VERSION}</span>
      <button class="btn-icon" id="refreshBtn">更新</button>
    </header>

    <div class="layout">
      <nav class="sidebar" id="sidebar" aria-label="メインメニュー">
        <details class="nav-group" open>
          <summary class="nav-group__summary">🏠 メインメニュー</summary>
          <div class="nav-group__body">
            <a class="nav-item" href="/dashboard"><span class="nav-icon">📊</span> ダッシュボード</a>
            <a class="nav-item" href="/governance"><span class="nav-icon">🛡</span> ガバナンス</a>
            <a class="nav-item" href="/daily-reports"><span class="nav-icon">📝</span> 日報管理コンソール</a>
          </div>
        </details>
        <details class="nav-group">
          <summary class="nav-group__summary">📋 ISO 統合マネジメント</summary>
          <div class="nav-group__body">
            <a class="nav-item nav-sub" href="/iso-app#analytics">📊 分析</a>
            <a class="nav-item nav-sub" href="/iso-app#quality">✅ 品質 (ISO 9001)</a>
            <a class="nav-item nav-sub" href="/iso-app#environment">🌿 環境 (ISO 14001)</a>
            <a class="nav-item nav-sub" href="/iso-app#safety">⛑️ 安全 (ISO 45001)</a>
            <a class="nav-item nav-sub" href="/iso-app#assets">🏛️ 資産 (ISO 55001)</a>
            <a class="nav-item nav-sub" href="/iso-app#bim">🏗️ BIM/CIM (ISO 19650)</a>
            <a class="nav-item nav-sub" href="/iso-app#audit">📋 監査・是正</a>
            <a class="nav-item nav-sub" href="/iso-app#isms">🔐 ISMS (ISO 27001)</a>
            <a class="nav-item nav-sub" href="/iso-app#bcp">🔄 事業継続 (BCP)</a>
          </div>
        </details>
        <details class="nav-group">
          <summary class="nav-group__summary">🧩 統合モジュール（MVP）</summary>
          <div class="nav-group__body">
            <a class="nav-item" href="/mvp-app"><span class="nav-icon">👷</span> 現場管理・AI・DX 統合</a>
          </div>
        </details>
        <details class="nav-group">
          <summary class="nav-group__summary">⚙️ システム設定</summary>
          <div class="nav-group__body">
            <a class="nav-item" href="/api/v1/info"><span class="nav-icon">ℹ️</span> プラットフォーム情報</a>
            <a class="nav-item" href="/api/v1/governance/audit/export"><span class="nav-icon">📑</span> 監査エクスポート</a>
            <a class="nav-item" href="/metrics"><span class="nav-icon">📈</span> メトリクス</a>
            <a class="nav-item" href="/api/v1/auth/keys"><span class="nav-icon">🔑</span> API キー</a>
          </div>
        </details>
      </nav>

      <main class="main" id="mainContent">
        <div class="page-header">
          <div class="page-eyebrow">Portal / P4</div>
          <h1 class="page-title">🏛️ ポータル</h1>
          <p class="page-subtitle">
            Construction Enterprise Operating Platform v${PLATFORM_VERSION} — 全モジュールの入口
          </p>
        </div>

        <section class="section">
          <div class="section-title">モジュール一覧</div>
          <div class="portal-grid">${cards}</div>
        </section>
      </main>
    </div>

    <footer class="footer">
      <span>建設企業オペレーティングプラットフォーム v${PLATFORM_VERSION}</span>
      <span class="footer__right">Portal / P4</span>
    </footer>

    <div class="toast-container" id="toastContainer" aria-live="polite"></div>
    <script src="/api/assets/app.js"></script>
  </body>
</html>`;
}

export function registerPortalRoute(router: Router): void {
  router.get(
    "/portal",
    async (_req, _ctx, res: ServerResponse) => {
      const body = renderPortal();
      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Length": Buffer.byteLength(body),
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Referrer-Policy": "no-referrer",
        "Strict-Transport-Security": "max-age=63072000; includeSubDomains",
      });
      res.end(body);
    },
    false,
  );
  router.get(
    "/iso",
    async (_req, _ctx, res: ServerResponse) => {
      // The ISO console (/iso-app) has the working left-menu → right-content
      // layout. Keep /iso as a stable entry point via redirect instead of the
      // former static landing whose anchor links did nothing.
      res.writeHead(302, {
        Location: "/iso-app",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Referrer-Policy": "no-referrer",
        "Strict-Transport-Security": "max-age=63072000; includeSubDomains",
      });
      res.end();
    },
    false,
  );
}
