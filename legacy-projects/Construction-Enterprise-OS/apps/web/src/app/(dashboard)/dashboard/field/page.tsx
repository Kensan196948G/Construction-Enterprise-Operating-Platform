import { AlertTriangle, Cloud, HardHat, Sun, Users, Wind, Zap } from "lucide-react";
import { CARD, T_HEADING, T_BODY, T_MUTED, T_FAINT, BORDER, SUBTLE_BG } from "@/lib/design/tokens";

// ────────────────────────────────────────────────────────────────────────────
// Claude Design — 現場ダッシュボード (DashFieldView faithful port)
// ────────────────────────────────────────────────────────────────────────────

const weather = [
  { time: "09:00", temp: "28°C", wind: "3m/s", icon: "sun" as const },
  { time: "12:00", temp: "32°C", wind: "5m/s", icon: "sun" as const },
  { time: "15:00", temp: "30°C", wind: "8m/s", icon: "cloud" as const },
  { time: "18:00", temp: "26°C", wind: "4m/s", icon: "cloud" as const },
];

const safetyItems = [
  { label: "新規入場者教育", count: "3", color: "#1a56db" },
  { label: "KY活動完了率", count: "92%", color: "#16a34a" },
  { label: "ヒヤリハット", count: "1", color: "#f97316" },
  { label: "是正指摘", count: "2", color: "#dc2626" },
];

const statCards = [
  { label: "稼働現場", value: "13", icon: HardHat, color: "#1a56db", bg: "#eff6ff" },
  { label: "本日作業員", value: "186", icon: Users, color: "#16a34a", bg: "#f0fdf4" },
  { label: "重機稼働", value: "42台", icon: Zap, color: "#f97316", bg: "#fff7ed" },
  { label: "安全アラート", value: "3", icon: AlertTriangle, color: "#dc2626", bg: "#fef2f2" },
];

export default function DashFieldPage() {
  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: T_HEADING, margin: 0 }}>現場ダッシュボード</h1>
        <p style={{ fontSize: 12, color: T_MUTED, marginTop: 2 }}>全現場のリアルタイム状況を一覧表示</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} style={{ ...CARD, padding: 14, display: "flex", alignItems: "center", gap: 10 }}>
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
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Weather */}
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
            本日の気象予報
          </div>
          <div style={{ padding: 16, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
            {weather.map((w) => {
              const WIcon = w.icon === "sun" ? Sun : Cloud;
              return (
                <div key={w.time} style={{ textAlign: "center", padding: "12px 0", borderRadius: 8, background: SUBTLE_BG }}>
                  <div style={{ fontSize: 11, color: T_FAINT, marginBottom: 6 }}>{w.time}</div>
                  <WIcon
                    className="mx-auto mb-1.5 block h-6 w-6"
                    style={{ color: w.icon === "sun" ? "#eab308" : "#94a3b8" }}
                  />
                  <div style={{ fontSize: 16, fontWeight: 700, color: T_BODY }}>{w.temp}</div>
                  <div
                    style={{
                      fontSize: 10,
                      color: T_MUTED,
                      marginTop: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 3,
                    }}
                  >
                    <Wind className="h-2.5 w-2.5" />
                    {w.wind}
                  </div>
                </div>
              );
            })}
          </div>
          <div
            style={{
              padding: "10px 16px",
              borderTop: `1px solid ${BORDER}`,
              background: "#fff7ed",
              borderRadius: "0 0 12px 12px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12,
              color: "#92400e",
            }}
          >
            <AlertTriangle className="h-3.5 w-3.5" style={{ color: "#f97316" }} />
            15時以降 風速増加予報 — クレーン作業要注意
          </div>
        </div>

        {/* Safety summary */}
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
            安全管理サマリー
          </div>
          <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            {safetyItems.map((s) => (
              <div
                key={s.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: SUBTLE_BG,
                }}
              >
                <span style={{ fontSize: 13, color: T_BODY, fontWeight: 500 }}>{s.label}</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.count}</span>
              </div>
            ))}
            <div style={{ marginTop: 8, padding: 12, borderRadius: 8, background: "#fef2f2", border: "1px solid #fecaca" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#991b1b" }}>WBGT警戒: 28°C（厳重警戒）</div>
              <div style={{ fontSize: 11, color: "#b91c1c", marginTop: 2 }}>全現場へ熱中症対策強化指示済み</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
