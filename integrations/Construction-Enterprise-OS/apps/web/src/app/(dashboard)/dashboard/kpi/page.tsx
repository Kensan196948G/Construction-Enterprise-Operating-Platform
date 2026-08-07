import { AlertTriangle } from "lucide-react";
import { CARD, T_HEADING, T_BODY, T_MUTED, T_FAINT, BORDER, MONO, STATUS_COLOR } from "@/lib/design/tokens";

// ────────────────────────────────────────────────────────────────────────────
// Claude Design — KPI / アラート (DashKPIView faithful port)
// ────────────────────────────────────────────────────────────────────────────

type Status = "ok" | "warning" | "danger";

const kpis: { category: string; items: { name: string; value: string; target: string; status: Status }[] }[] = [
  {
    category: "工程",
    items: [
      { name: "全工事平均進捗率", value: "54.6%", target: "58%", status: "warning" },
      { name: "工程遵守率", value: "84.2%", target: "90%", status: "danger" },
      { name: "工期内完了率", value: "92.0%", target: "95%", status: "warning" },
    ],
  },
  {
    category: "安全",
    items: [
      { name: "度数率", value: "0.42", target: "<1.0", status: "ok" },
      { name: "強度率", value: "0.08", target: "<0.1", status: "ok" },
      { name: "KY実施率", value: "92%", target: "100%", status: "warning" },
    ],
  },
  {
    category: "原価",
    items: [
      { name: "原価差異率", value: "+2.1%", target: "±1%", status: "danger" },
      { name: "購買効率", value: "88.5%", target: "90%", status: "warning" },
      { name: "外注費比率", value: "62.3%", target: "<65%", status: "ok" },
    ],
  },
  {
    category: "品質",
    items: [
      { name: "手戻り率", value: "1.8%", target: "<2%", status: "ok" },
      { name: "検査合格率", value: "98.2%", target: ">97%", status: "ok" },
      { name: "顧客満足度", value: "4.2/5.0", target: ">4.0", status: "ok" },
    ],
  },
];

const alerts: { time: string; message: string; severity: "warning" | "danger" }[] = [
  { time: "09:15", message: "品川タワー：鉄骨建方 2日遅延", severity: "warning" },
  { time: "09:00", message: "川崎物流：原価超過予測 +¥180M", severity: "danger" },
  { time: "08:42", message: "全現場：WBGT 28°C 熱中症厳重警戒", severity: "warning" },
  { time: "08:30", message: "横浜マンション：足場不備是正勧告", severity: "danger" },
  { time: "08:15", message: "風速計#3：風速8.5m/s（閾値接近）", severity: "warning" },
];

export default function DashKPIPage() {
  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: T_HEADING, margin: 0 }}>KPI / アラート</h1>
        <p style={{ fontSize: 12, color: T_MUTED, marginTop: 2 }}>重要業績評価指標とアラート一覧</p>
      </div>

      {/* Alerts */}
      {alerts.map((a) => (
        <div
          key={`${a.time}-${a.message}`}
          style={{
            padding: "8px 14px",
            borderRadius: 8,
            marginBottom: 6,
            background: a.severity === "danger" ? "#fef2f2" : "#fff7ed",
            border: `1px solid ${a.severity === "danger" ? "#fecaca" : "#fed7aa"}`,
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 12,
          }}
        >
          <AlertTriangle className="h-3.5 w-3.5" style={{ color: a.severity === "danger" ? "#dc2626" : "#f97316" }} />
          <span style={{ fontFamily: MONO, fontSize: 10, color: T_FAINT, width: 40 }}>{a.time}</span>
          <span style={{ color: a.severity === "danger" ? "#991b1b" : "#92400e", fontWeight: 500 }}>{a.message}</span>
        </div>
      ))}

      {/* KPI grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16, marginTop: 16 }}>
        {kpis.map((cat) => (
          <div key={cat.category} style={CARD}>
            <div
              style={{
                padding: "12px 16px",
                borderBottom: `1px solid ${BORDER}`,
                fontSize: 14,
                fontWeight: 700,
                color: T_HEADING,
              }}
            >
              {cat.category} KPI
            </div>
            <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              {cat.items.map((k) => (
                <div
                  key={k.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 14px",
                    borderRadius: 8,
                    background: "var(--bg-subtle, #f8fafc)",
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS_COLOR[k.status] }} />
                  <span style={{ flex: 1, fontSize: 13, color: T_BODY, fontWeight: 500 }}>{k.name}</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: STATUS_COLOR[k.status] }}>{k.value}</span>
                  <span style={{ fontSize: 10, color: T_FAINT }}>目標: {k.target}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
