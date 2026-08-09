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

function renderIsoPage(): string {
  const modules: ReadonlyArray<readonly [string, string, string]> = [
    ["quality", "✅ 品質 (ISO 9001)", "品質計画・検査・不適合"],
    ["environment", "🌿 環境 (ISO 14001)", "環境側面・法令順守・廃棄物"],
    ["safety", "⛑️ 安全 (ISO 45001)", "危険源・ヒヤリハット・パトロール・KY"],
    ["assets", "🏛️ 資産 (ISO 55001)", "資産台帳・保全・点検・廃棄・引渡し"],
    ["bim", "🏗️ BIM/CIM (ISO 19650)", "EIR・BEP・情報コンテナ・調整課題"],
    ["audit", "📋 監査・是正", "監査計画・指摘・是正処置"],
    ["isms", "🔐 ISMS (ISO 27001)", "情報資産・脅威・リスク評価・インシデント"],
    ["bcp", "🔄 事業継続 (BCP)", "BCP 計画・リスクシナリオ・訓練"],
    ["analytics", "📊 ISO 分析", "規格別コンプライアンス・KPI"],
  ];
  const cards = modules
    .map(
      ([id, title, desc]) => `
      <a href="#${id}" style="display:block;padding:16px;border:1px solid #dde2ea;border-radius:10px;text-decoration:none;color:#1f2937;background:#fff;">
        <div style="font-weight:700;font-size:14px;">${title}</div>
        <div style="font-size:12px;color:#6b7280;margin-top:4px;">${desc}</div>
      </a>`,
    )
    .join("");
  const endpoints = [
    ["GET /api/v1/iso", "全 ISO レコード（kind 指定可）"],
    ["POST /api/v1/iso", "ISO レコード作成"],
    ["POST /api/v1/iso/:id/action", "承認・差戻し・公開・完了・取消"],
    ["GET /api/v1/iso/analytics", "規格別コンプライアンス分析"],
    ["GET /api/v1/integrations/contracts", "連携先6システム契約定義"],
  ]
    .map(
      ([path, desc]) =>
        `<div style="display:flex;gap:12px;padding:8px 0;border-bottom:1px solid #eef1f5;font-size:12px;">
          <code style="color:#2563eb;white-space:nowrap;">${path}</code>
          <span style="color:#6b7280;">${desc}</span>
        </div>`,
    )
    .join("");
  return `<!DOCTYPE html>
<html lang="ja"><head><meta charset="utf-8"><title>ISO 統合マネジメント | CEOP</title>
<meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;font-family:system-ui,sans-serif;background:#f4f6fa;">
  <div style="max-width:960px;margin:0 auto;padding:32px 20px;">
    <a href="/portal" style="font-size:12px;color:#6b7280;">← Portal</a>
    <div style="font-size:22px;font-weight:800;margin-top:8px;">📋 ISO 統合マネジメント</div>
    <div style="font-size:12px;color:#6b7280;margin:6px 0 20px;">Civil-Construction-IMS 吸収 — ISO 9001/14001/45001/55001/19650・ISMS・BCP</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px;">${cards}</div>
    <div style="margin-top:24px;font-weight:700;font-size:14px;">API エンドポイント</div>
    <div style="margin-top:8px;">${endpoints}</div>
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
      const body = renderIsoPage();
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
}
