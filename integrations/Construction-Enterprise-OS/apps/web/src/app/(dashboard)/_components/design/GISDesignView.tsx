"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { AlertTriangle, CheckCircle2, Eye, Globe } from "lucide-react";
import { CARD, T_HEADING, T_BODY, T_SECOND, T_MUTED, BORDER, BORDER_LIGHT, SUBTLE_BG } from "@/lib/design/tokens";

// ────────────────────────────────────────────────────────────────────────────
// Claude Design — GIS / 地図 (GISPage faithful port)
// SlideTabPanel replaced with an inline translateX slide. Covers all sub-items.
// ────────────────────────────────────────────────────────────────────────────

type TabId = "projects" | "ocean" | "disaster" | "drone" | "pointcloud" | "hazard" | "realtime";

const TABS: { id: TabId; label: string }[] = [
  { id: "projects", label: "工事位置" },
  { id: "ocean", label: "海域マップ" },
  { id: "disaster", label: "災害情報" },
  { id: "drone", label: "ドローン地図" },
  { id: "pointcloud", label: "点群データ" },
  { id: "hazard", label: "ハザードマップ" },
  { id: "realtime", label: "リアルタイム位置" },
];

const tabFromPath: Record<string, TabId> = {
  "/gis/projects": "projects",
  "/gis/ocean": "ocean",
  "/gis/disaster": "disaster",
  "/gis/drone": "drone",
  "/gis/pointcloud": "pointcloud",
  "/gis/hazard": "hazard",
  "/gis/realtime": "realtime",
};

const sites = [
  { name: "品川タワー新築", type: "建築", workers: 45, progress: 68 },
  { name: "横浜分譲マンション", type: "建築", workers: 32, progress: 42 },
  { name: "大田区土木工事", type: "土木", workers: 18, progress: 85 },
  { name: "新宿再開発ビル", type: "建築", workers: 28, progress: 23 },
  { name: "川崎物流センター", type: "建築", workers: 38, progress: 55 },
  { name: "千葉港湾整備", type: "港湾", workers: 22, progress: 35 },
  { name: "大田区道路改良", type: "土木", workers: 14, progress: 72 },
  { name: "新宿地下駐車場", type: "建築", workers: 26, progress: 48 },
  { name: "横浜臨港橋梁補修", type: "土木", workers: 19, progress: 61 },
];
const typeColor: Record<string, string> = { 建築: "#1a56db", 土木: "#f97316", 港湾: "#7c3aed" };

const DashboardSiteMap = dynamic(() => import("@/components/dashboard/DashboardSiteMap"), {
  ssr: false,
  loading: () => (
    <div style={{ height: 320, display: "flex", alignItems: "center", justifyContent: "center", color: T_MUTED, background: SUBTLE_BG }}>
      OpenStreetMapを読み込み中...
    </div>
  ),
});

function OSMMap({ label, tone = "#1a56db" }: { label: string; tone?: string }) {
  return (
    <div style={{ height: 320, position: "relative", borderRadius: 8, overflow: "hidden", marginBottom: 16, border: `1px solid ${BORDER}` }}>
      <DashboardSiteMap height="320px" />
      <div
        style={{
          position: "absolute",
          left: 12,
          top: 12,
          zIndex: 500,
          borderRadius: 8,
          padding: "6px 10px",
          background: "rgba(255,255,255,0.94)",
          border: `1px solid ${BORDER}`,
          boxShadow: "0 6px 18px rgba(15,23,42,0.12)",
          color: tone,
          fontSize: 11,
          fontWeight: 700,
        }}
      >
        OpenStreetMap ・ {label}
      </div>
    </div>
  );
}

const panelStyle: React.CSSProperties = { minWidth: "100%", flexShrink: 0, padding: 20 };

export function GISDesignView({ subPath }: { subPath?: string }) {
  const [activeTab, setActiveTab] = useState<TabId>((subPath && tabFromPath[subPath]) || "projects");

  useEffect(() => {
    if (subPath && tabFromPath[subPath]) setActiveTab(tabFromPath[subPath]);
  }, [subPath]);

  const activeIndex = Math.max(0, TABS.findIndex((t) => t.id === activeTab));

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: T_HEADING, margin: 0 }}>GIS / 地図</h1>
        <p style={{ fontSize: 12, color: T_MUTED, marginTop: 2 }}>工事位置・海域・災害・ドローン・点群・ハザード・リアルタイム</p>
      </div>

      <div style={CARD}>
        {/* Tab bar */}
        <div style={{ display: "flex", borderBottom: `1px solid ${BORDER}`, padding: "0 8px", overflowX: "auto" }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                padding: "12px 16px",
                fontSize: 12,
                fontWeight: activeTab === t.id ? 600 : 400,
                color: activeTab === t.id ? "#1a56db" : T_MUTED,
                cursor: "pointer",
                whiteSpace: "nowrap",
                background: "none",
                border: "none",
                borderBottom: activeTab === t.id ? "2px solid #1a56db" : "2px solid transparent",
                fontFamily: "inherit",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Sliding panels */}
        <div style={{ overflow: "hidden" }}>
          <div style={{ display: "flex", transition: "transform 0.35s cubic-bezier(.4,0,.2,1)", transform: `translateX(-${activeIndex * 100}%)` }}>
            {/* 工事位置 */}
            <div style={panelStyle}>
              <OSMMap label="工事位置" />
              <div style={{ fontSize: 13, fontWeight: 600, color: T_BODY, marginBottom: 10 }}>工事一覧 ({sites.length}件)</div>
              {sites.map((s) => (
                <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 8, marginBottom: 6, background: SUBTLE_BG, border: `1px solid ${BORDER_LIGHT}` }}>
                  <span role="img" aria-label={s.type} title={s.type} style={{ width: 8, height: 8, borderRadius: "50%", background: typeColor[s.type] }} />
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: T_BODY }}>{s.name}</span>
                  <span style={{ fontSize: 11, color: T_MUTED }}>{s.type}</span>
                  <span style={{ fontSize: 11, color: T_MUTED }}>{s.workers}名</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#1a56db" }}>{s.progress}%</span>
                </div>
              ))}
            </div>

            {/* 海域マップ */}
            <div style={panelStyle}>
              <OSMMap label="海域マップ" tone="#7c3aed" />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                {[
                  { l: "潮位", v: "1.8m", s: "上げ潮", c: "#1a56db" },
                  { l: "波高", v: "1.2m", s: "安定", c: "#16a34a" },
                  { l: "海水温", v: "22.5°C", s: "平年並み", c: "#f97316" },
                ].map((d) => (
                  <div key={d.l} style={{ padding: 14, borderRadius: 8, background: SUBTLE_BG, border: `1px solid ${BORDER}`, textAlign: "center" }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: d.c }}>{d.v}</div>
                    <div style={{ fontSize: 11, color: T_MUTED, marginTop: 2 }}>{d.l} · {d.s}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 災害情報 */}
            <div style={panelStyle}>
              <OSMMap label="災害情報" tone="#dc2626" />
              <div style={{ fontSize: 13, fontWeight: 600, color: T_BODY, marginBottom: 10 }}>災害関連情報</div>
              {[
                { type: "地震", message: "最新: 2026/05/23 千葉県東方沖 M3.2 深度30km 震度1", severity: "low" },
                { type: "台風", message: "台風情報なし（現在発生中の台風はありません）", severity: "none" },
                { type: "大雨", message: "関東地方 5/26-27 大雨注意報の可能性", severity: "medium" },
                { type: "土砂災害", message: "大田区南部 土砂災害警戒区域 近接工事あり", severity: "medium" },
                { type: "強風", message: "東京湾岸 5/28 最大瞬間風速 18m/s 予想 クレーン作業注意", severity: "medium" },
                { type: "高潮", message: "千葉港湾 満潮時 潮位偏差 +0.3m 観測 警戒レベル内", severity: "low" },
                { type: "火山", message: "周辺火山活動なし（降灰予報の対象外）", severity: "none" },
              ].map((d) => (
                <div key={d.type} style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 6, background: d.severity === "medium" ? "#fff7ed" : d.severity === "low" ? "#eff6ff" : SUBTLE_BG, border: `1px solid ${d.severity === "medium" ? "#fed7aa" : d.severity === "low" ? "#bfdbfe" : BORDER}`, display: "flex", alignItems: "center", gap: 10, fontSize: 12 }}>
                  {d.severity === "none" ? (
                    <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "#16a34a" }} />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5" style={{ color: d.severity === "medium" ? "#f97316" : "#1a56db" }} />
                  )}
                  <span style={{ fontWeight: 600, color: T_BODY, minWidth: 50 }}>{d.type}</span>
                  <span style={{ color: T_SECOND }}>{d.message}</span>
                </div>
              ))}
            </div>

            {/* ドローン地図 */}
            <div style={panelStyle}>
              <OSMMap label="ドローン地図" tone="#7c3aed" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { id: "DRN-001", name: "Phantom 4 RTK", site: "品川タワー", status: "飛行中", battery: 72 },
                  { id: "DRN-004", name: "Phantom 4 RTK", site: "千葉港湾", status: "飛行中", battery: 58 },
                  { id: "DRN-002", name: "Matrice 300", site: "横浜マンション", status: "待機", battery: 95 },
                  { id: "DRN-003", name: "Mavic 3E", site: "川崎物流", status: "充電中", battery: 34 },
                  { id: "DRN-005", name: "Matrice 350 RTK", site: "新宿再開発", status: "飛行中", battery: 81 },
                  { id: "DRN-006", name: "Mavic 3E", site: "大田区土木", status: "待機", battery: 88 },
                  { id: "DRN-007", name: "Phantom 4 RTK", site: "横浜マンション", status: "充電中", battery: 22 },
                ].map((d) => (
                  <div key={d.id} style={{ padding: 12, borderRadius: 8, background: SUBTLE_BG, border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: 10 }}>
                    <Eye className="h-[18px] w-[18px]" style={{ color: d.status === "飛行中" ? "#16a34a" : "#94a3b8" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: T_BODY }}>
                        {d.name} <span style={{ fontSize: 10, color: T_MUTED }}>({d.id})</span>
                      </div>
                      <div style={{ fontSize: 10, color: T_MUTED }}>{d.site}</div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 600, color: d.status === "飛行中" ? "#16a34a" : d.status === "充電中" ? "#f97316" : "#94a3b8" }}>{d.status}</span>
                    <span style={{ fontSize: 10, color: d.battery > 50 ? "#16a34a" : "#f97316" }}>{d.battery}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 点群データ */}
            <div style={panelStyle}>
              <div style={{ height: 300, borderRadius: 8, background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0f172a 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, position: "relative", overflow: "hidden", marginBottom: 16 }}>
                <svg width="100%" height="100%" style={{ position: "absolute", opacity: 0.1 }}>
                  <defs>
                    <pattern id="pcGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <circle cx="10" cy="10" r="1" fill="#60a5fa" />
                    </pattern>
                  </defs>
                  <rect fill="url(#pcGrid)" width="100%" height="100%" />
                </svg>
                <Globe aria-hidden="true" className="h-12 w-12" style={{ color: "#60a5fa", position: "relative", opacity: 0.6 }} />
                <div style={{ fontSize: 16, fontWeight: 700, color: "#93c5fd", position: "relative" }}>3D点群ビューア</div>
                <div style={{ fontSize: 12, color: "#64748b", position: "relative" }}>LiDAR / ドローン測量による3D点群データ</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                {[
                  { l: "データセット", v: "8", c: "#1a56db" },
                  { l: "総ポイント数", v: "42.8億", c: "#7c3aed" },
                  { l: "最終更新", v: "2026/05/22", c: "#16a34a" },
                ].map((s) => (
                  <div key={s.l} style={{ padding: 12, borderRadius: 8, background: SUBTLE_BG, border: `1px solid ${BORDER}`, textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: s.c }}>{s.v}</div>
                    <div style={{ fontSize: 11, color: T_MUTED, marginTop: 2 }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ハザードマップ */}
            <div style={panelStyle}>
              <OSMMap label="ハザードマップ" tone="#f97316" />
              <div style={{ fontSize: 13, fontWeight: 600, color: T_BODY, marginBottom: 10 }}>ハザード情報</div>
              {[
                { area: "品川沿岸", risk: "浸水", level: "中", detail: "高潮時 最大浸水深 0.5m", color: "#f97316" },
                { area: "大田区南部", risk: "液状化", level: "高", detail: "液状化危険度 PL値 15以上", color: "#dc2626" },
                { area: "川崎臨海", risk: "津波", level: "中", detail: "想定津波高 2.5m", color: "#f97316" },
                { area: "新宿西部", risk: "崖崩れ", level: "低", detail: "急傾斜地崩壊危険箇所 近接", color: "#eab308" },
                { area: "横浜港北", risk: "浸水", level: "中", detail: "内水氾濫 想定浸水深 0.3m", color: "#f97316" },
                { area: "千葉港湾", risk: "津波", level: "高", detail: "想定津波高 3.0m 避難経路要確認", color: "#dc2626" },
                { area: "川崎中原", risk: "液状化", level: "中", detail: "液状化危険度 PL値 8〜12", color: "#f97316" },
              ].map((h) => (
                <div key={h.area} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, marginBottom: 6, background: SUBTLE_BG, border: `1px solid ${BORDER}` }}>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: h.color + "18", color: h.color }}>{h.level}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: T_BODY, width: 90 }}>{h.area}</span>
                  <span style={{ fontSize: 11, color: T_MUTED, width: 60 }}>{h.risk}</span>
                  <span style={{ fontSize: 12, color: T_SECOND, flex: 1 }}>{h.detail}</span>
                </div>
              ))}
            </div>

            {/* リアルタイム位置 */}
            <div style={panelStyle}>
              <OSMMap label="リアルタイム位置" tone="#16a34a" />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 12 }}>
                {[
                  { l: "GPS追跡中", v: "42台", c: "#1a56db" },
                  { l: "重機", v: "8台", c: "#f97316" },
                  { l: "ドローン", v: "2機", c: "#7c3aed" },
                ].map((s) => (
                  <div key={s.l} style={{ padding: 12, borderRadius: 8, background: SUBTLE_BG, border: `1px solid ${BORDER}`, textAlign: "center" }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: s.c }}>{s.v}</div>
                    <div style={{ fontSize: 11, color: T_MUTED, marginTop: 2 }}>{s.l}</div>
                  </div>
                ))}
              </div>
              <div style={{ padding: 10, borderRadius: 8, background: "#dcfce7", border: "1px solid #bbf7d0", display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#166534" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#16a34a", animation: "gisPulse 2s infinite" }} />
                全車両・重機のGPS位置をリアルタイム更新中（更新間隔: 5秒）
              </div>
              <style>{`@keyframes gisPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
