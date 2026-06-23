"use client";

import { useEffect, useState, type ComponentType } from "react";
import { AlertTriangle, CheckCircle2, Clock, Globe, Plus, RadioTower, Shield } from "lucide-react";
import { CARD, T_HEADING, T_BODY, T_SECOND, T_MUTED, BORDER, BORDER_LIGHT, SUBTLE_BG, MONO } from "@/lib/design/tokens";

// ────────────────────────────────────────────────────────────────────────────
// Claude Design — セキュリティ・監査 (SecurityPage faithful port, inline slide)
// ────────────────────────────────────────────────────────────────────────────

type SecTabId = "siem" | "soc" | "vpn" | "edr" | "ot" | "incident" | "audit";
type Sev = "high" | "medium" | "low";

const TABS: { id: SecTabId; label: string }[] = [
  { id: "siem", label: "SIEM" },
  { id: "soc", label: "SOC" },
  { id: "vpn", label: "VPN監視" },
  { id: "edr", label: "EDR" },
  { id: "ot", label: "OT監視" },
  { id: "incident", label: "インシデント" },
  { id: "audit", label: "監査レポート" },
];

const tabFromPath: Record<string, SecTabId> = {
  "/security/siem": "siem",
  "/security/soc": "soc",
  "/security/vpn": "vpn",
  "/security/edr": "edr",
  "/security/ot": "ot",
  "/security/incident": "incident",
  "/security/audit": "audit",
};

const sevBg: Record<Sev, string> = { high: "#fef2f2", medium: "#fff7ed", low: "#fefce8" };
const sevColor: Record<Sev, string> = { high: "#dc2626", medium: "#f97316", low: "#eab308" };

const kpis: { label: string; value: string; sub: string; icon: ComponentType<{ className?: string; style?: React.CSSProperties }>; color: string; bg: string }[] = [
  { label: "脅威検知", value: "5", sub: "本日", icon: AlertTriangle, color: "#dc2626", bg: "#fef2f2" },
  { label: "ブロック", value: "2,481", sub: "今月", icon: Shield, color: "#1a56db", bg: "#eff6ff" },
  { label: "VPN接続", value: "28", sub: "アクティブ", icon: Globe, color: "#16a34a", bg: "#f0fdf4" },
  { label: "EDRカバー", value: "98.5%", sub: "全端末", icon: CheckCircle2, color: "#7c3aed", bg: "#f5f3ff" },
  { label: "未解決", value: "2", sub: "インシデント", icon: Clock, color: "#f97316", bg: "#fff7ed" },
];

const siemRows: { time: string; type: string; source: string; target: string; sev: Sev; status: string }[] = [
  { time: "09:12", type: "ブルートフォース", source: "203.0.113.55", target: "auth-service", sev: "high", status: "ブロック済" },
  { time: "08:45", type: "ポートスキャン", source: "198.51.100.77", target: "gateway", sev: "medium", status: "監視中" },
  { time: "07:30", type: "不正API呼出", source: "10.0.5.44", target: "api-gateway", sev: "low", status: "調査中" },
  { time: "06:15", type: "マルウェア検知", source: "PC-FIELD-023", target: "endpoint", sev: "high", status: "隔離済" },
  { time: "昨日", type: "VPN異常接続", source: "172.16.99.1", target: "vpn-gw", sev: "medium", status: "解決済" },
  { time: "10:38", type: "SQLインジェクション試行", source: "203.0.113.91", target: "api-gateway", sev: "high", status: "ブロック済" },
  { time: "10:05", type: "不審なDNSクエリ", source: "10.0.7.18", target: "dns-resolver", sev: "medium", status: "監視中" },
  { time: "09:47", type: "権限昇格検知", source: "PC-OFFICE-045", target: "ad-server", sev: "high", status: "隔離済" },
  { time: "昨日", type: "大量データ転送", source: "10.0.4.62", target: "file-server", sev: "low", status: "調査中" },
];

const vpnRows = [
  { user: "田中 健一", location: "品川現場", ip: "10.0.1.45", protocol: "WireGuard", duration: "2h 15m", active: true },
  { user: "佐藤 太郎", location: "横浜現場", ip: "10.0.1.88", protocol: "WireGuard", duration: "1h 42m", active: true },
  { user: "山田 花子", location: "本社", ip: "10.0.2.12", protocol: "IPsec", duration: "3h 05m", active: true },
  { user: "鈴木 一郎", location: "自宅", ip: "10.0.3.99", protocol: "WireGuard", duration: "45m", active: false },
  { user: "高橋 美咲", location: "本社DC", ip: "10.0.2.34", protocol: "IPsec", duration: "4h 18m", active: true },
  { user: "山田 花子", location: "川崎物流", ip: "10.0.1.120", protocol: "WireGuard", duration: "1h 02m", active: true },
  { user: "渡辺 翔", location: "千葉港湾", ip: "10.0.3.55", protocol: "OpenVPN", duration: "27m", active: true },
  { user: "中村 太郎", location: "大田区土木", ip: "10.0.1.201", protocol: "WireGuard", duration: "5h 40m", active: false },
];

const edrStats = [
  { l: "管理端末", v: "842", c: "#1a56db" },
  { l: "保護済み", v: "829", c: "#16a34a" },
  { l: "要確認", v: "8", c: "#f97316" },
  { l: "隔離中", v: "5", c: "#dc2626" },
];
const edrRows = [
  { name: "PC-FIELD-023", user: "中村 太郎", status: "隔離中", threat: "Trojan.Gen.2", detected: "06:15" },
  { name: "PC-OFFICE-045", user: "伊藤 裕子", status: "要確認", threat: "Suspicious DLL Load", detected: "昨日 18:00" },
  { name: "PC-FIELD-089", user: "木村 大輔", status: "スキャン中", threat: "PUP.Optional", detected: "昨日 15:30" },
  { name: "PC-OFFICE-112", user: "高橋 美咲", status: "要確認", threat: "Ransomware.Lockbit", detected: "10:42" },
  { name: "PC-FIELD-204", user: "山田 花子", status: "隔離中", threat: "Backdoor.Win32.Agent", detected: "09:20" },
  { name: "SRV-DC-001", user: "本社DC", status: "スキャン中", threat: "Suspicious PowerShell", detected: "昨日 22:10" },
];

const otStats = [
  { l: "OTデバイス", v: "86", c: "#1a56db" },
  { l: "PLC/SCADA", v: "12", c: "#7c3aed" },
  { l: "セグメント", v: "4", c: "#16a34a" },
];
const otRows = [
  { segment: "IoTセンサーネットワーク", devices: 58, traffic: "正常", anomaly: 0 },
  { segment: "重機制御ネットワーク", devices: 12, traffic: "正常", anomaly: 0 },
  { segment: "ビル管理システム (BAS)", devices: 8, traffic: "正常", anomaly: 0 },
  { segment: "SCADA/PLC制御", devices: 8, traffic: "注意", anomaly: 2 },
  { segment: "タワークレーン遠隔監視", devices: 6, traffic: "正常", anomaly: 0 },
  { segment: "環境センサー網 (CO2/騒音)", devices: 24, traffic: "正常", anomaly: 0 },
  { segment: "入退場ゲート制御", devices: 9, traffic: "注意", anomaly: 1 },
];

const incidents: { id: string; title: string; sev: Sev; status: string; assignee: string; date: string }[] = [
  { id: "INC-042", title: "フィッシングメール検知", sev: "medium", status: "対応中", assignee: "高橋", date: "2026/05/24" },
  { id: "INC-041", title: "マルウェア感染（PC-FIELD-023）", sev: "high", status: "隔離済", assignee: "高橋", date: "2026/05/24" },
  { id: "INC-040", title: "パスワード漏洩疑い", sev: "high", status: "解決済", assignee: "渡辺", date: "2026/05/23" },
  { id: "INC-039", title: "OTネットワーク異常通信", sev: "medium", status: "解決済", assignee: "渡辺", date: "2026/05/22" },
  { id: "INC-043", title: "ランサムウェア検知（PC-OFFICE-112）", sev: "high", status: "対応中", assignee: "高橋", date: "2026/05/25" },
  { id: "INC-044", title: "不正ログイン試行の急増", sev: "medium", status: "調査中", assignee: "高橋", date: "2026/05/25" },
  { id: "INC-045", title: "USB経由のマルウェア持込", sev: "high", status: "隔離済", assignee: "渡辺", date: "2026/05/24" },
  { id: "INC-046", title: "外部委託者アカウントの権限超過", sev: "low", status: "解決済", assignee: "山田", date: "2026/05/23" },
];

const auditRows = [
  { time: "09:15", user: "田中 健一", action: "ログイン", resource: "Web App", result: "成功" },
  { time: "09:12", user: "unknown", action: "ログイン試行x5", resource: "Auth API", result: "失敗" },
  { time: "09:10", user: "佐藤 太郎", action: "文書ダウンロード", resource: "構造図_7F.pdf", result: "成功" },
  { time: "09:05", user: "高橋 美咲", action: "権限変更", resource: "User: 中村", result: "成功" },
  { time: "08:58", user: "山田 花子", action: "API Key生成", resource: "IoT Gateway", result: "成功" },
  { time: "08:50", user: "システム", action: "バックアップ完了", resource: "PostgreSQL", result: "成功" },
  { time: "08:42", user: "高橋 美咲", action: "ファイアウォール規則更新", resource: "FW: 千葉港湾", result: "成功" },
  { time: "08:30", user: "山田 花子", action: "MFA設定変更", resource: "User: 渡辺", result: "成功" },
  { time: "08:15", user: "unknown", action: "管理画面アクセス試行", resource: "Admin Console", result: "失敗" },
  { time: "08:02", user: "田中 健一", action: "監査ログエクスポート", resource: "Audit Log (5月分)", result: "成功" },
];

const sectionTitle: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: T_BODY, marginBottom: 16 };
const panelStyle: React.CSSProperties = { minWidth: "100%", flexShrink: 0, padding: 20 };
const tableHead = (cols: string): React.CSSProperties => ({
  display: "grid", gridTemplateColumns: cols, gap: 12, padding: "10px 16px", background: SUBTLE_BG,
  borderBottom: `1px solid ${BORDER}`, fontSize: 11, fontWeight: 600, color: T_MUTED,
});
const statCard: React.CSSProperties = { padding: 14, borderRadius: 8, background: SUBTLE_BG, border: `1px solid ${BORDER}`, textAlign: "center" };

export function SecurityDesignView({ subPath }: { subPath?: string }) {
  const [activeTab, setActiveTab] = useState<SecTabId>((subPath && tabFromPath[subPath]) || "siem");

  useEffect(() => {
    if (subPath && tabFromPath[subPath]) setActiveTab(tabFromPath[subPath]);
  }, [subPath]);

  const activeIndex = Math.max(0, TABS.findIndex((t) => t.id === activeTab));

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: T_HEADING, margin: 0 }}>セキュリティ・監査</h1>
        <p style={{ fontSize: 12, color: T_MUTED, marginTop: 2 }}>SIEM・SOC・VPN・EDR・OT・インシデント・監査</p>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 14, marginBottom: 20 }}>
        {kpis.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} style={{ ...CARD, padding: 14, display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 6, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon className="h-4 w-4" style={{ color: s.color }} />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: T_BODY }}>{s.value}</div>
                <div style={{ fontSize: 10, color: T_MUTED }}>{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={CARD}>
        {/* Tab bar */}
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
            {/* SIEM */}
            <div style={panelStyle}>
              <div style={sectionTitle}>SIEM — 脅威検知イベント</div>
              <div style={{ borderRadius: 8, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
                <div style={tableHead("70px 1fr 130px 100px 60px 80px")}>
                  <span>時刻</span><span>種別</span><span>送信元</span><span>対象</span><span>深刻度</span><span>状態</span>
                </div>
                {siemRows.map((t) => (
                  <div key={t.time + t.type} style={{ display: "grid", gridTemplateColumns: "70px 1fr 130px 100px 60px 80px", gap: 12, padding: "12px 16px", alignItems: "center", borderBottom: `1px solid ${BORDER_LIGHT}`, fontSize: 12 }}>
                    <span style={{ fontFamily: MONO, fontSize: 11, color: T_MUTED }}>{t.time}</span>
                    <span style={{ fontWeight: 500, color: T_BODY }}>{t.type}</span>
                    <span style={{ fontFamily: MONO, fontSize: 11, color: T_MUTED }}>{t.source}</span>
                    <span style={{ color: T_MUTED }}>{t.target}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: sevBg[t.sev], color: sevColor[t.sev], textTransform: "uppercase" }}>{t.sev}</span>
                    <span style={{ fontSize: 11, color: t.status === "ブロック済" || t.status === "解決済" ? "#16a34a" : "#f97316", fontWeight: 500 }}>{t.status}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* SOC */}
            <div style={panelStyle}>
              <div style={sectionTitle}>SOC — セキュリティオペレーションセンター</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 16 }}>
                {[{ l: "監視対象", v: "248", s: "ノード", c: "#1a56db" }, { l: "アラート(24h)", v: "12", s: "件", c: "#f97316" }, { l: "対応完了率", v: "96%", s: "SLA達成", c: "#16a34a" }].map((s) => (
                  <div key={s.l} style={statCard}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: s.c }}>{s.v}</div>
                    <div style={{ fontSize: 11, color: T_MUTED, marginTop: 2 }}>{s.l} · {s.s}</div>
                  </div>
                ))}
              </div>
              <div style={{ padding: 16, borderRadius: 8, border: `1px solid ${BORDER}` }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T_BODY, marginBottom: 12 }}>脅威検知推移 (24時間)</div>
                <svg width="100%" height="120" viewBox="0 0 600 120" preserveAspectRatio="none">
                  {[0, 1, 2, 3].map((i) => <line key={i} x1="0" y1={i * 35 + 10} x2="600" y2={i * 35 + 10} stroke="#f1f5f9" strokeWidth="1" />)}
                  <path d="M0,90 L25,85 L50,92 L75,70 L100,75 L125,80 L150,50 L175,45 L200,55 L225,60 L250,65 L275,40 L300,35 L325,50 L350,45 L375,60 L400,65 L425,70 L450,55 L475,50 L500,60 L525,65 L550,70 L575,75 L600,65" fill="none" stroke="#dc2626" strokeWidth="2" />
                  <path d="M0,90 L25,85 L50,92 L75,70 L100,75 L125,80 L150,50 L175,45 L200,55 L225,60 L250,65 L275,40 L300,35 L325,50 L350,45 L375,60 L400,65 L425,70 L450,55 L475,50 L500,60 L525,65 L550,70 L575,75 L600,65 L600,120 L0,120 Z" fill="#dc262610" />
                </svg>
              </div>
            </div>

            {/* VPN監視 */}
            <div style={panelStyle}>
              <div style={sectionTitle}>VPNアクティブセッション</div>
              <div style={{ borderRadius: 8, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
                <div style={tableHead("1fr 100px 120px 90px 80px 60px")}>
                  <span>ユーザー</span><span>場所</span><span>IP</span><span>プロトコル</span><span>接続時間</span><span>状態</span>
                </div>
                {vpnRows.map((v) => (
                  <div key={v.user} style={{ display: "grid", gridTemplateColumns: "1fr 100px 120px 90px 80px 60px", gap: 12, padding: "12px 16px", alignItems: "center", borderBottom: `1px solid ${BORDER_LIGHT}`, fontSize: 12 }}>
                    <span style={{ fontWeight: 500, color: T_BODY }}>{v.user}</span>
                    <span style={{ color: T_MUTED }}>{v.location}</span>
                    <span style={{ fontFamily: MONO, fontSize: 11, color: T_MUTED }}>{v.ip}</span>
                    <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: SUBTLE_BG, color: T_SECOND, fontWeight: 500 }}>{v.protocol}</span>
                    <span style={{ color: T_MUTED }}>{v.duration}</span>
                    <span role="img" aria-label={v.active ? "稼働中" : "低下"} title={v.active ? "稼働中" : "低下"} style={{ width: 6, height: 6, borderRadius: "50%", background: v.active ? "#16a34a" : "#f97316" }} />
                  </div>
                ))}
              </div>
            </div>

            {/* EDR */}
            <div style={panelStyle}>
              <div style={sectionTitle}>EDR — エンドポイント検知と応答</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 16 }}>
                {edrStats.map((s) => (
                  <div key={s.l} style={statCard}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: s.c }}>{s.v}</div>
                    <div style={{ fontSize: 11, color: T_MUTED }}>{s.l}</div>
                  </div>
                ))}
              </div>
              {edrRows.map((e) => (
                <div key={e.name} style={{ padding: 12, borderRadius: 8, border: `1px solid ${BORDER}`, marginBottom: 8, display: "flex", alignItems: "center", gap: 12 }}>
                  <Shield className="h-[18px] w-[18px]" style={{ color: e.status === "隔離中" ? "#dc2626" : "#f97316" }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T_BODY }}>{e.name} <span style={{ fontSize: 11, fontWeight: 400, color: T_MUTED }}>({e.user})</span></div>
                    <div style={{ fontSize: 11, color: T_MUTED, marginTop: 2 }}>{e.threat}</div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 10, background: e.status === "隔離中" ? "#fef2f2" : "#fff7ed", color: e.status === "隔離中" ? "#991b1b" : "#92400e" }}>{e.status}</span>
                  <span style={{ fontSize: 10, color: T_MUTED }}>{e.detected}</span>
                </div>
              ))}
            </div>

            {/* OT監視 */}
            <div style={panelStyle}>
              <div style={sectionTitle}>OTネットワーク監視</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 16 }}>
                {otStats.map((s) => (
                  <div key={s.l} style={statCard}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: s.c }}>{s.v}</div>
                    <div style={{ fontSize: 11, color: T_MUTED }}>{s.l}</div>
                  </div>
                ))}
              </div>
              {otRows.map((s) => (
                <div key={s.segment} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 8, marginBottom: 6, background: SUBTLE_BG, border: `1px solid ${BORDER}` }}>
                  <RadioTower className="h-4 w-4" style={{ color: s.anomaly > 0 ? "#f97316" : "#16a34a" }} />
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: T_BODY }}>{s.segment}</span>
                  <span style={{ fontSize: 11, color: T_MUTED }}>{s.devices}台</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: s.traffic === "正常" ? "#16a34a" : "#f97316" }}>{s.traffic}</span>
                  {s.anomaly > 0 && <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 4, background: "#fff7ed", color: "#92400e" }}>異常{s.anomaly}</span>}
                </div>
              ))}
            </div>

            {/* インシデント */}
            <div style={panelStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: T_BODY }}>インシデント管理</span>
                <button style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: "#dc2626", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4 }}>
                  <Plus className="h-3 w-3" aria-hidden="true" />登録
                </button>
              </div>
              {incidents.map((inc) => (
                <div key={inc.id} style={{ padding: 14, borderRadius: 8, border: `1px solid ${BORDER}`, marginBottom: 8, cursor: "pointer" }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#93c5fd")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border, #e2e8f0)")}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontFamily: MONO, fontSize: 11, color: T_MUTED }}>{inc.id}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: inc.sev === "high" ? "#fef2f2" : "#fff7ed", color: inc.sev === "high" ? "#dc2626" : "#f97316", textTransform: "uppercase" }}>{inc.sev}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 10, background: inc.status === "解決済" ? "#dcfce7" : inc.status === "隔離済" ? "#fef2f2" : "#fff7ed", color: inc.status === "解決済" ? "#166534" : inc.status === "隔離済" ? "#991b1b" : "#92400e" }}>{inc.status}</span>
                    <span style={{ marginLeft: "auto", fontSize: 10, color: T_MUTED }}>{inc.date}</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T_BODY }}>{inc.title}</div>
                  <div style={{ fontSize: 11, color: T_MUTED, marginTop: 4 }}>担当: {inc.assignee}</div>
                </div>
              ))}
            </div>

            {/* 監査レポート */}
            <div style={panelStyle}>
              <div style={sectionTitle}>監査ログ</div>
              <div style={{ borderRadius: 8, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
                <div style={tableHead("70px 1fr 1fr 1fr 80px")}>
                  <span>時刻</span><span>ユーザー</span><span>操作</span><span>リソース</span><span>結果</span>
                </div>
                {auditRows.map((l) => (
                  <div key={l.time + l.user} style={{ display: "grid", gridTemplateColumns: "70px 1fr 1fr 1fr 80px", gap: 12, padding: "12px 16px", alignItems: "center", borderBottom: `1px solid ${BORDER_LIGHT}`, fontSize: 12 }}>
                    <span style={{ fontFamily: MONO, fontSize: 11, color: T_MUTED }}>{l.time}</span>
                    <span style={{ fontWeight: 500, color: T_BODY }}>{l.user}</span>
                    <span style={{ color: T_MUTED }}>{l.action}</span>
                    <span style={{ color: T_MUTED, fontSize: 11 }}>{l.resource}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: l.result === "成功" ? "#16a34a" : "#dc2626" }}>{l.result}</span>
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
