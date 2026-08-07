import { AlertTriangle, Brain, CheckCircle2, Zap } from "lucide-react";
import { CARD, T_HEADING, T_BODY, T_MUTED, T_FAINT, BORDER, BORDER_LIGHT, MONO } from "@/lib/design/tokens";

// ────────────────────────────────────────────────────────────────────────────
// Claude Design — AI分析ダッシュボード (DashAIView faithful port)
// ────────────────────────────────────────────────────────────────────────────

const statCards = [
  { label: "稼働AIモデル", value: "5", icon: Brain, color: "#7c3aed", bg: "#f5f3ff" },
  { label: "本日予測数", value: "3,818", icon: Zap, color: "#1a56db", bg: "#eff6ff" },
  { label: "平均精度", value: "86.9%", icon: CheckCircle2, color: "#16a34a", bg: "#f0fdf4" },
  { label: "検知アラート", value: "7", icon: AlertTriangle, color: "#f97316", bg: "#fff7ed" },
];

const models = [
  { name: "工程遅延予測モデル", accuracy: "87.2%", lastTrained: "2026/05/20", predictions: 342, status: "active" as const },
  { name: "原価超過予測モデル", accuracy: "82.5%", lastTrained: "2026/05/18", predictions: 156, status: "active" as const },
  { name: "安全リスク判定モデル", accuracy: "91.3%", lastTrained: "2026/05/22", predictions: 891, status: "active" as const },
  { name: "画像異常検知モデル", accuracy: "94.1%", lastTrained: "2026/05/24", predictions: 2340, status: "active" as const },
  { name: "品質予測モデル", accuracy: "79.8%", lastTrained: "2026/05/15", predictions: 89, status: "training" as const },
];

const GRID = "1.5fr 80px 120px 100px 80px";

export default function DashAIPage() {
  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: T_HEADING, margin: 0 }}>AI分析ダッシュボード</h1>
        <p style={{ fontSize: 12, color: T_MUTED, marginTop: 2 }}>AIモデル稼働状況・予測精度・分析結果</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
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
          AIモデル一覧
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: GRID,
            gap: 12,
            padding: "10px 16px",
            borderBottom: `1px solid ${BORDER}`,
            fontSize: 11,
            fontWeight: 600,
            color: T_FAINT,
          }}
        >
          <span>モデル名</span>
          <span>精度</span>
          <span>最終学習</span>
          <span>予測回数</span>
          <span>状態</span>
        </div>
        {models.map((m, i) => (
          <div
            key={m.name}
            style={{
              display: "grid",
              gridTemplateColumns: GRID,
              gap: 12,
              padding: "12px 16px",
              alignItems: "center",
              borderBottom: i < models.length - 1 ? `1px solid ${BORDER_LIGHT}` : "none",
              fontSize: 12,
            }}
          >
            <span style={{ fontWeight: 500, color: T_BODY, display: "flex", alignItems: "center", gap: 6 }}>
              <Brain className="h-3.5 w-3.5" style={{ color: "#7c3aed" }} />
              {m.name}
            </span>
            <span style={{ fontWeight: 600, color: "#16a34a" }}>{m.accuracy}</span>
            <span style={{ color: T_MUTED, fontSize: 11 }}>{m.lastTrained}</span>
            <span style={{ fontFamily: MONO, color: "#374151", fontSize: 11 }}>{m.predictions.toLocaleString()}</span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: 10,
                background: m.status === "active" ? "#dcfce7" : "#fef3c7",
                color: m.status === "active" ? "#166534" : "#92400e",
                justifySelf: "start",
              }}
            >
              {m.status === "active" ? "稼働中" : "学習中"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
