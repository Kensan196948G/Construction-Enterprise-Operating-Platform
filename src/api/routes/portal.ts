/**
 * Portal landing page (P4): links every CEOP module behind one entry point.
 */

import type { ServerResponse } from "node:http";
import { PLATFORM_VERSION } from "../../version.ts";
import type { Router } from "../router.ts";

function renderPortal(): string {
  const modules = [
    ["/dashboard", "📊 ダッシュボード", "KPI・アプリ健康・端末・承認"],
    ["/governance", "🛡️ ガバナンス", "ポリシー・監査ログ・ABAC 評価"],
    ["/iso", "📋 ISO 統合マネジメント", "ISO 9001/14001/45001/55001/19650・監査・ISMS・BCP"],
    ["/api/v1/info", "ℹ️ プラットフォーム情報", "ビルド・環境・バージョン"],
    ["/metrics", "📈 Prometheus メトリクス", "リクエスト・ランタイム・キュー"],
  ];
  const cards = modules
    .map(
      ([href, title, desc]) => `
      <a href="${href}" style="display:block;padding:16px;border:1px solid #dde2ea;border-radius:10px;text-decoration:none;color:#1f2937;background:#fff;">
        <div style="font-weight:700;font-size:14px;">${title}</div>
        <div style="font-size:12px;color:#6b7280;margin-top:4px;">${desc}</div>
      </a>`,
    )
    .join("");
  return `<!DOCTYPE html>
<html lang="ja"><head><meta charset="utf-8"><title>CEOP Portal v${PLATFORM_VERSION}</title>
<meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;font-family:system-ui,sans-serif;background:#f4f6fa;">
  <div style="max-width:900px;margin:0 auto;padding:32px 20px;">
    <div style="font-size:22px;font-weight:800;">🏗️ Construction Enterprise Operating Platform</div>
    <div style="font-size:12px;color:#6b7280;margin:6px 0 24px;">v${PLATFORM_VERSION} — Portal / P4</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px;">${cards}</div>
  </div>
</body></html>`;
}

export function registerPortalRoute(router: Router): void {
  router.get(
    "/portal",
    async (_req, _ctx, res: ServerResponse) => {
      const body = renderPortal();
      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
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
