import { Activity, AlertTriangle, ClipboardList, TrendingUp } from "lucide-react";
import { CARD, T_HEADING, T_BODY, T_MUTED, T_FAINT, BORDER } from "@/lib/design/tokens";

// ────────────────────────────────────────────────────────────────────────────
// Claude Design — 経営ダッシュボード (DashExecView faithful port)
// ────────────────────────────────────────────────────────────────────────────

const kpiCards = [
  { label: "年度売上高", value: "¥18.2B", sub: "前年比 +12.3%", icon: TrendingUp, color: "#1a56db", bg: "#eff6ff" },
  { label: "粗利率", value: "14.8%", sub: "目標15.0%", icon: Activity, color: "#f97316", bg: "#fff7ed" },
  { label: "受注残高", value: "¥42.5B", sub: "24案件", icon: ClipboardList, color: "#16a34a", bg: "#f0fdf4" },
  { label: "原価差異", value: "-¥180M", sub: "超過3件", icon: AlertTriangle, color: "#dc2626", bg: "#fef2f2" },
];

const divisions = [
  { name: "建築事業部", profit: "15.2%", revenue: "¥8.4B", color: "#1a56db", pct: 76 },
  { name: "土木事業部", profit: "13.8%", revenue: "¥5.2B", color: "#16a34a", pct: 69 },
  { name: "港湾事業部", profit: "16.1%", revenue: "¥3.1B", color: "#7c3aed", pct: 80 },
  { name: "その他", profit: "11.5%", revenue: "¥1.5B", color: "#f97316", pct: 57 },
];

export default function DashExecPage() {
  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: T_HEADING, margin: 0 }}>経営ダッシュボード</h1>
        <p style={{ fontSize: 12, color: T_MUTED, marginTop: 2 }}>売上・利益・受注残・リスクの経営視点サマリー</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
        {kpiCards.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} style={{ ...CARD, padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: s.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon className="h-4 w-4" style={{ color: s.color }} />
                </div>
                <div>
                  <div style={{ fontSize: 10, color: T_FAINT }}>{s.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: T_BODY }}>{s.value}</div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: T_MUTED, marginTop: 8 }}>{s.sub}</div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Sales trend */}
        <div style={CARD}>
          <div
            style={{
              padding: "14px 16px",
              borderBottom: `1px solid ${BORDER}`,
              fontSize: 14,
              fontWeight: 700,
              color: T_HEADING,
            }}
          >
            売上推移
          </div>
          <div style={{ padding: 16 }}>
            <svg width="100%" height="160" viewBox="0 0 500 160" preserveAspectRatio="none">
              {[0, 1, 2, 3].map((i) => (
                <line key={i} x1="0" y1={i * 50 + 10} x2="500" y2={i * 50 + 10} stroke="#f1f5f9" strokeWidth="1" />
              ))}
              <path
                d="M20,140 L60,130 L100,125 L140,110 L180,100 L220,95 L260,85 L300,80 L340,70 L380,55 L420,45 L460,35 L500,25"
                fill="none"
                stroke="#1a56db"
                strokeWidth="2.5"
              />
              <path
                d="M20,140 L60,130 L100,125 L140,110 L180,100 L220,95 L260,85 L300,80 L340,70 L380,55 L420,45 L460,35 L500,25 L500,160 L20,160 Z"
                fill="#1a56db10"
              />
            </svg>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: T_FAINT, marginTop: 4 }}>
              <span>4月</span>
              <span>6月</span>
              <span>8月</span>
              <span>10月</span>
              <span>12月</span>
              <span>2月</span>
            </div>
          </div>
        </div>

        {/* Division profit */}
        <div style={CARD}>
          <div
            style={{
              padding: "14px 16px",
              borderBottom: `1px solid ${BORDER}`,
              fontSize: 14,
              fontWeight: 700,
              color: T_HEADING,
            }}
          >
            部門別利益率
          </div>
          <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            {divisions.map((d) => (
              <div key={d.name}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                  <span style={{ fontWeight: 500, color: T_BODY }}>{d.name}</span>
                  <span style={{ fontWeight: 600, color: d.color }}>{d.profit}</span>
                </div>
                <div style={{ height: 6, background: BORDER, borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${d.pct}%`, background: d.color, borderRadius: 3 }} />
                </div>
                <div style={{ fontSize: 10, color: T_FAINT, marginTop: 2 }}>売上 {d.revenue}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
