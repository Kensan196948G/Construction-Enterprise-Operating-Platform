"use client";

import { Fragment, useEffect, useState, type ComponentType } from "react";
import { Activity, Brain, Eye, HardHat, MapPin, Zap } from "lucide-react";
import { CARD, T_HEADING, T_BODY, T_MUTED, BORDER, BORDER_LIGHT, SUBTLE_BG } from "@/lib/design/tokens";

// ────────────────────────────────────────────────────────────────────────────
// Claude Design — 自動化・ロボティクス (RoboticsPage faithful port, inline slide)
// ────────────────────────────────────────────────────────────────────────────

type RoboTabId = "auto" | "drone" | "rov" | "twin";

const TABS: { id: RoboTabId; label: string }[] = [
  { id: "auto", label: "自動施工" },
  { id: "drone", label: "ドローン" },
  { id: "rov", label: "ROV" },
  { id: "twin", label: "デジタルツイン" },
];

const tabFromPath: Record<string, RoboTabId> = {
  "/robotics/auto": "auto",
  "/robotics/drone": "drone",
  "/robotics/rov": "rov",
  "/robotics/twin": "twin",
};

const statusColor: Record<string, string> = {
  飛行中: "#16a34a",
  稼働中: "#16a34a",
  自動運転中: "#7c3aed",
  待機: "#94a3b8",
  充電中: "#f97316",
};

const BG_CARD = "var(--bg-card, #fff)";

const summaryCards: { label: string; value: string; icon: ComponentType<{ className?: string; style?: React.CSSProperties }>; color: string; bg: string }[] = [
  { label: "自動施工機", value: "2/3", icon: HardHat, color: "#16a34a", bg: "#f0fdf4" },
  { label: "ドローン稼働", value: "2/4", icon: Eye, color: "#7c3aed", bg: "#f5f3ff" },
  { label: "ROV稼働", value: "1/2", icon: Activity, color: "#1a56db", bg: "#eff6ff" },
  { label: "データ処理", value: "12.4TB", icon: Zap, color: "#f97316", bg: "#fff7ed" },
];

const autoMachines = [
  { name: "自動ブルドーザ D61", project: "大田区土木", status: "自動運転中", progress: 78, operator: "AI制御", gps: "RTK固定" },
  { name: "自動振動ローラ BW213", project: "大田区土木", status: "待機", progress: 0, operator: "手動", gps: "RTK固定" },
  { name: "マシンガイダンス PC200", project: "川崎物流", status: "稼働中", progress: 45, operator: "MG支援", gps: "RTK固定" },
  { name: "自動コンクリート敷均機 SP500", project: "品川タワー新築工事", status: "自動運転中", progress: 62, operator: "AI制御", gps: "RTK固定" },
  { name: "自動グレーダ GD655", project: "千葉港湾整備", status: "稼働中", progress: 88, operator: "MG支援", gps: "RTK固定" },
  { name: "無人ダンプトラック HD785", project: "大田区土木工事", status: "充電中", progress: 0, operator: "手動", gps: "RTK固定" },
];

const drones = [
  { id: "DRN-001", name: "Phantom 4 RTK", location: "品川タワー", status: "飛行中", battery: 72, mission: "測量撮影", altitude: "80m", speed: "5.2m/s" },
  { id: "DRN-002", name: "Matrice 300", location: "横浜マンション", status: "待機", battery: 95, mission: "—", altitude: "—", speed: "—" },
  { id: "DRN-003", name: "Mavic 3E", location: "川崎物流", status: "充電中", battery: 34, mission: "—", altitude: "—", speed: "—" },
  { id: "DRN-004", name: "Phantom 4 RTK", location: "千葉港湾", status: "飛行中", battery: 58, mission: "進捗確認", altitude: "50m", speed: "3.8m/s" },
  { id: "DRN-005", name: "Matrice 350 RTK", location: "新宿再開発", status: "飛行中", battery: 81, mission: "外壁点検", altitude: "120m", speed: "4.5m/s" },
  { id: "DRN-006", name: "Mavic 3E", location: "大田区土木工事", status: "待機", battery: 100, mission: "—", altitude: "—", speed: "—" },
  { id: "DRN-007", name: "Phantom 4 RTK", location: "品川タワー新築工事", status: "飛行中", battery: 47, mission: "出来高測量", altitude: "65m", speed: "2.9m/s" },
  { id: "DRN-008", name: "Matrice 300", location: "横浜分譲マンション", status: "充電中", battery: 22, mission: "—", altitude: "—", speed: "—" },
];

const rovs = [
  { id: "ROV-001", name: "BlueROV2", location: "千葉港湾 水中A", status: "稼働中", depth: "12m", battery: 65, mission: "護岸点検", temp: "18.2°C", visibility: "4m" },
  { id: "ROV-002", name: "Fifish V6", location: "千葉港湾 水中B", status: "待機", depth: "—", battery: 88, mission: "—", temp: "—", visibility: "—" },
  { id: "ROV-003", name: "BlueROV2", location: "川崎物流基地 取水路", status: "稼働中", depth: "8m", battery: 73, mission: "取水口閉塞調査", temp: "16.5°C", visibility: "3m" },
  { id: "ROV-004", name: "Fifish V-EVO", location: "千葉港湾 水中C", status: "稼働中", depth: "18m", battery: 54, mission: "鋼管杭腐食点検", temp: "17.8°C", visibility: "5m" },
  { id: "ROV-005", name: "Chasing M2 Pro", location: "横浜分譲マンション 調整池", status: "待機", depth: "—", battery: 91, mission: "—", temp: "—", visibility: "—" },
];

const panelStyle: React.CSSProperties = { minWidth: "100%", flexShrink: 0, padding: 20 };

export function RoboticsDesignView({ subPath }: { subPath?: string }) {
  const [activeTab, setActiveTab] = useState<RoboTabId>((subPath && tabFromPath[subPath]) || "auto");

  useEffect(() => {
    if (subPath && tabFromPath[subPath]) setActiveTab(tabFromPath[subPath]);
  }, [subPath]);

  const activeIndex = Math.max(0, TABS.findIndex((t) => t.id === activeTab));

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: T_HEADING, margin: 0 }}>自動化・ロボティクス</h1>
        <p style={{ fontSize: 12, color: T_MUTED, marginTop: 2 }}>自動施工・ドローン・ROV・デジタルツイン</p>
      </div>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
        {summaryCards.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} style={{ ...CARD, padding: 14, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon className="h-4 w-4" style={{ color: s.color }} />
              </div>
              <div>
                <div style={{ fontSize: 10, color: T_MUTED }}>{s.label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: T_BODY }}>{s.value}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={CARD}>
        <div style={{ display: "flex", borderBottom: `1px solid ${BORDER}`, padding: "0 8px", overflowX: "auto" }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{ padding: "12px 16px", fontSize: 12, fontWeight: activeTab === t.id ? 600 : 400, color: activeTab === t.id ? "#1a56db" : T_MUTED, cursor: "pointer", whiteSpace: "nowrap", background: "none", border: "none", borderBottom: activeTab === t.id ? "2px solid #1a56db" : "2px solid transparent", fontFamily: "inherit" }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ overflow: "hidden" }}>
          <div style={{ display: "flex", transition: "transform 0.35s cubic-bezier(.4,0,.2,1)", transform: `translateX(-${activeIndex * 100}%)` }}>
            {/* 自動施工 */}
            <div style={panelStyle}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T_BODY, marginBottom: 16 }}>自動施工機械一覧</div>
              <div style={{ borderRadius: 8, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 100px 100px 80px 80px", gap: 12, padding: "10px 16px", background: SUBTLE_BG, borderBottom: `1px solid ${BORDER}`, fontSize: 11, fontWeight: 600, color: T_MUTED }}>
                  <span>機械名</span><span>工事</span><span>状態</span><span>施工進捗</span><span>制御</span><span>GPS</span>
                </div>
                {autoMachines.map((m) => (
                  <div key={m.name} style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 100px 100px 80px 80px", gap: 12, padding: "12px 16px", alignItems: "center", borderBottom: `1px solid ${BORDER_LIGHT}`, fontSize: 12 }}>
                    <span style={{ fontWeight: 500, color: T_BODY }}>{m.name}</span>
                    <span style={{ color: T_MUTED }}>{m.project}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: statusColor[m.status] ?? "#64748b", fontWeight: 500 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor[m.status] ?? "#64748b" }} />{m.status}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ flex: 1, height: 5, background: BORDER, borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${m.progress}%`, background: "#1a56db", borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 10, color: T_MUTED }}>{m.progress}%</span>
                    </div>
                    <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: m.operator === "AI制御" ? "#7c3aed15" : m.operator === "MG支援" ? "#1a56db15" : SUBTLE_BG, color: m.operator === "AI制御" ? "#7c3aed" : m.operator === "MG支援" ? "#1a56db" : T_MUTED, fontWeight: 500 }}>{m.operator}</span>
                    <span style={{ fontSize: 10, color: "#16a34a", fontWeight: 500, display: "flex", alignItems: "center", gap: 3 }}>
                      <MapPin className="h-2.5 w-2.5" />{m.gps}
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16, padding: 14, borderRadius: 8, background: "#f5f3ff", border: "1px solid #ede9fe" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <Brain aria-hidden="true" className="h-3.5 w-3.5" style={{ color: "#7c3aed" }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#7c3aed" }}>AI自動施工制御</span>
                </div>
                <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.6 }}>ブルドーザD61はRTK-GNSSとIMUによる自動制御で施工中。設計面との誤差±3cm以内を維持。本日の施工量: 1,240m³（目標達成率 96%）。</div>
              </div>
            </div>

            {/* ドローン */}
            <div style={panelStyle}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T_BODY, marginBottom: 16 }}>ドローン管理</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }}>
                {drones.map((d) => (
                  <div key={d.id} style={{ padding: 16, borderRadius: 10, border: `1px solid ${BORDER}`, background: d.status === "飛行中" ? "#f0fdf4" : SUBTLE_BG }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: T_BODY }}>{d.name}</div>
                        <div style={{ fontSize: 11, color: T_MUTED, marginTop: 2 }}>{d.id} · {d.location}</div>
                      </div>
                      <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 600, color: statusColor[d.status] }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor[d.status] }} />{d.status}
                      </span>
                    </div>
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: T_MUTED, marginBottom: 3 }}>
                        <span>バッテリー</span><span style={{ fontWeight: 600, color: d.battery > 50 ? "#16a34a" : "#f97316" }}>{d.battery}%</span>
                      </div>
                      <div style={{ height: 4, background: BORDER, borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${d.battery}%`, borderRadius: 2, background: d.battery > 50 ? "#16a34a" : "#f97316" }} />
                      </div>
                    </div>
                    {d.status === "飛行中" && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                        {[["任務", d.mission], ["高度", d.altitude], ["速度", d.speed]].map(([k, v]) => (
                          <div key={k} style={{ textAlign: "center", padding: "5px 0", background: BG_CARD, borderRadius: 4, border: `1px solid ${BORDER}` }}>
                            <div style={{ fontSize: 9, color: T_MUTED }}>{k}</div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: T_BODY }}>{v}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ROV */}
            <div style={panelStyle}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T_BODY, marginBottom: 16 }}>ROV（水中ロボット）管理</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }}>
                {rovs.map((r) => (
                  <div key={r.id} style={{ padding: 16, borderRadius: 10, border: `1px solid ${BORDER}`, background: r.status === "稼働中" ? "#eff6ff" : SUBTLE_BG }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: T_BODY }}>{r.name}</div>
                        <div style={{ fontSize: 11, color: T_MUTED, marginTop: 2 }}>{r.id} · {r.location}</div>
                      </div>
                      <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 600, color: statusColor[r.status] }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor[r.status] }} />{r.status}
                      </span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6, marginBottom: 10 }}>
                      {[["深度", r.depth], ["バッテリー", `${r.battery}%`], ["水温", r.temp], ["視界", r.visibility]].map(([k, v]) => (
                        <div key={k} style={{ textAlign: "center", padding: "6px 0", background: BG_CARD, borderRadius: 4, border: `1px solid ${BORDER}` }}>
                          <div style={{ fontSize: 9, color: T_MUTED }}>{k}</div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: T_BODY, marginTop: 2 }}>{v}</div>
                        </div>
                      ))}
                    </div>
                    {r.status === "稼働中" && (
                      <div style={{ padding: "8px 10px", borderRadius: 6, background: "#f5f3ff", fontSize: 11, color: "#7c3aed", display: "flex", alignItems: "center", gap: 4 }}>
                        <Eye aria-hidden="true" className="h-3 w-3" />任務: {r.mission} — 映像記録中
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* デジタルツイン */}
            <div style={panelStyle}>
              <div style={{ height: 360, borderRadius: 10, background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0f172a 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, position: "relative", overflow: "hidden" }}>
                <svg width="100%" height="100%" style={{ position: "absolute", opacity: 0.15 }}>
                  <defs>
                    <pattern id="twG2" width="30" height="30" patternUnits="userSpaceOnUse">
                      <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#60a5fa" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect fill="url(#twG2)" width="100%" height="100%" />
                </svg>
                <svg width="200" height="180" viewBox="0 0 200 180" style={{ position: "relative" }}>
                  <g stroke="#60a5fa" strokeWidth="1" fill="none" opacity="0.6">
                    <rect x="40" y="40" width="80" height="120" />
                    <rect x="60" y="20" width="80" height="120" />
                    <line x1="40" y1="40" x2="60" y2="20" />
                    <line x1="120" y1="40" x2="140" y2="20" />
                    <line x1="40" y1="160" x2="60" y2="140" />
                    <line x1="120" y1="160" x2="140" y2="140" />
                    {[0, 1, 2, 3, 4].map((f) => (
                      <Fragment key={f}>
                        <line x1="40" y1={160 - f * 30} x2="120" y2={160 - f * 30} opacity="0.3" />
                        <line x1="60" y1={140 - f * 30} x2="140" y2={140 - f * 30} opacity="0.3" />
                      </Fragment>
                    ))}
                  </g>
                  <circle cx="100" cy="90" r="30" stroke="#7c3aed" strokeWidth="1" fill="none" opacity="0.3">
                    <animateTransform attributeName="transform" type="rotate" from="0 100 90" to="360 100 90" dur="10s" repeatCount="indefinite" />
                  </circle>
                </svg>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#93c5fd", position: "relative" }}>デジタルツイン ビューア</div>
                <div style={{ fontSize: 12, color: "#64748b", position: "relative" }}>BIM/CIM + IoT + GIS統合3Dモデル</div>
                <div style={{ display: "flex", gap: 8, position: "relative", marginTop: 8 }}>
                  {["BIM連携", "IoTオーバーレイ", "AI分析", "シミュレーション"].map((b) => (
                    <span key={b} style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid #60a5fa40", color: "#93c5fd", fontSize: 11, fontWeight: 500, cursor: "pointer" }}>{b}</span>
                  ))}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginTop: 16 }}>
                {[["同期デバイス", "86台"], ["更新頻度", "5秒"], ["データ量", "2.4TB"], ["モデルバージョン", "v4.2"]].map(([k, v]) => (
                  <div key={k} style={{ padding: 10, borderRadius: 6, background: SUBTLE_BG, border: `1px solid ${BORDER}`, textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: T_MUTED }}>{k}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: T_BODY, marginTop: 2 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
