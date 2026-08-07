"use client";

import { useEffect, useState } from "react";
import { Brain, Building2, ClipboardList, FileText, Plus, Users } from "lucide-react";
import { CARD, T_HEADING, T_BODY, T_MUTED, T_FAINT, BORDER, BORDER_LIGHT, SUBTLE_BG, MONO } from "@/lib/design/tokens";

// ────────────────────────────────────────────────────────────────────────────
// Claude Design — 協力会社連携 (PartnerPage faithful port)
// Covers the whole category via internal tabs keyed off subPath.
// ────────────────────────────────────────────────────────────────────────────

type TabId = "overview" | "entry" | "docs" | "invoice" | "safety";

const tabFromPath: Record<string, TabId> = {
  "/partner/list": "overview",
  "/partner/entry": "entry",
  "/partner/docs": "docs",
  "/partner/education": "safety",
  "/partner/contract": "overview",
  "/partner/invoice": "invoice",
};

type Risk = "low" | "medium" | "high";

const partners = [
  { name: "(株)中村建設", type: "鉄骨工事", workers: 18, rating: "A", contract: "継続", docs: 2, safety: 98, risk: "low" as Risk },
  { name: "(株)佐々木電気", type: "電気設備", workers: 12, rating: "A", contract: "継続", docs: 0, safety: 95, risk: "low" as Risk },
  { name: "山本配管工業", type: "給排水", workers: 8, rating: "B", contract: "継続", docs: 4, safety: 88, risk: "medium" as Risk },
  { name: "(株)高橋塗装", type: "塗装工事", workers: 6, rating: "B", contract: "単発", docs: 1, safety: 92, risk: "low" as Risk },
  { name: "関東足場(株)", type: "足場工事", workers: 15, rating: "A", contract: "継続", docs: 0, safety: 96, risk: "low" as Risk },
  { name: "(株)東京クレーン", type: "揚重工事", workers: 5, rating: "A", contract: "継続", docs: 3, safety: 90, risk: "medium" as Risk },
  { name: "東日本基礎工業", type: "杭・基礎工事", workers: 22, rating: "A", contract: "継続", docs: 0, safety: 97, risk: "low" as Risk },
  { name: "関東鉄筋工業", type: "鉄筋工事", workers: 26, rating: "A", contract: "継続", docs: 1, safety: 94, risk: "low" as Risk },
  { name: "城南とび工業", type: "とび・土工工事", workers: 14, rating: "B", contract: "継続", docs: 3, safety: 86, risk: "medium" as Risk },
  { name: "武蔵野設備", type: "空調設備", workers: 9, rating: "B", contract: "単発", docs: 2, safety: 89, risk: "medium" as Risk },
];

const entryLogs = [
  { name: "中村 太郎", company: "(株)中村建設", time: "07:45", type: "入場", helmet: "OK", vest: "OK" },
  { name: "佐々木 健", company: "(株)佐々木電気", time: "07:50", type: "入場", helmet: "OK", vest: "OK" },
  { name: "山本 一郎", company: "山本配管工業", time: "07:55", type: "入場", helmet: "OK", vest: "未着用" },
  { name: "高橋 誠", company: "(株)高橋塗装", time: "08:02", type: "入場", helmet: "OK", vest: "OK" },
  { name: "木村 大輔", company: "関東足場(株)", time: "08:10", type: "入場", helmet: "OK", vest: "OK" },
  { name: "斎藤 健太", company: "東日本基礎工業", time: "08:15", type: "入場", helmet: "OK", vest: "OK" },
  { name: "渡辺 浩二", company: "関東鉄筋工業", time: "08:22", type: "入場", helmet: "OK", vest: "OK" },
  { name: "小林 修", company: "城南とび工業", time: "08:30", type: "入場", helmet: "未着用", vest: "OK" },
  { name: "加藤 翔", company: "武蔵野設備", time: "12:05", type: "退場", helmet: "OK", vest: "OK" },
];

const invoices = [
  { company: "(株)中村建設", month: "2026/04", amount: "¥12,500,000", status: "支払済", due: "2026/05/31" },
  { company: "(株)佐々木電気", month: "2026/04", amount: "¥8,200,000", status: "承認済", due: "2026/05/31" },
  { company: "山本配管工業", month: "2026/04", amount: "¥4,800,000", status: "審査中", due: "2026/05/31" },
  { company: "(株)高橋塗装", month: "2026/04", amount: "¥2,100,000", status: "承認待ち", due: "2026/06/15" },
  { company: "関東足場(株)", month: "2026/04", amount: "¥6,400,000", status: "支払済", due: "2026/05/31" },
  { company: "東日本基礎工業", month: "2026/04", amount: "¥18,300,000", status: "支払済", due: "2026/05/31" },
  { company: "関東鉄筋工業", month: "2026/04", amount: "¥14,750,000", status: "承認済", due: "2026/05/31" },
  { company: "城南とび工業", month: "2026/04", amount: "¥5,600,000", status: "審査中", due: "2026/06/15" },
  { company: "武蔵野設備", month: "2026/04", amount: "¥3,900,000", status: "承認待ち", due: "2026/06/15" },
];

const docsRows = [
  { name: "作業員名簿", type: "安全書類", deadline: "2026/05/30", status: "提出済" },
  { name: "下請負業者届", type: "契約書類", deadline: "2026/05/25", status: "未提出" },
  { name: "安全衛生責任者届", type: "安全書類", deadline: "2026/05/28", status: "提出済" },
  { name: "工事保険証書", type: "保険書類", deadline: "2026/06/01", status: "未提出" },
  { name: "資格証明書（玉掛け）", type: "資格書類", deadline: "—", status: "提出済" },
  { name: "有機溶剤作業主任者証", type: "資格書類", deadline: "—", status: "期限切れ" },
  { name: "施工体制台帳", type: "契約書類", deadline: "2026/05/27", status: "提出済" },
  { name: "再下請負通知書", type: "契約書類", deadline: "2026/05/29", status: "未提出" },
  { name: "労災保険加入証明書", type: "保険書類", deadline: "2026/06/03", status: "提出済" },
  { name: "資格証明書（鉄筋施工）", type: "資格書類", deadline: "—", status: "提出済" },
];

const safetyRows = [
  { name: "新規入場者教育", target: "中村 太郎 他3名", date: "2026/05/24", status: "完了" },
  { name: "特別教育（足場）", target: "木村 大輔 他2名", date: "2026/05/20", status: "完了" },
  { name: "職長教育", target: "佐々木 健", date: "2026/05/15", status: "完了" },
  { name: "技能講習（玉掛け）", target: "山本 一郎", date: "2026/04/28", status: "完了" },
  { name: "熱中症対策講習", target: "全作業員", date: "2026/05/01", status: "完了" },
  { name: "酸欠危険作業教育", target: "高橋 隆", date: "予定", status: "未受講" },
  { name: "特別教育（高所作業車）", target: "斎藤 健太 他1名", date: "2026/05/22", status: "完了" },
  { name: "技能講習（鉄筋施工）", target: "渡辺 浩二", date: "2026/05/18", status: "完了" },
  { name: "KY活動リーダー研修", target: "小林 修 他4名", date: "2026/05/10", status: "完了" },
  { name: "石綿取扱い作業従事者教育", target: "加藤 翔", date: "予定", status: "未受講" },
];

const riskColor: Record<Risk, string> = { low: "#16a34a", medium: "#f97316", high: "#dc2626" };
const riskLabel: Record<Risk, string> = { low: "低", medium: "中", high: "高" };
const invoiceStatusColor: Record<string, { bg: string; color: string }> = {
  支払済: { bg: "#dcfce7", color: "#166534" },
  承認済: { bg: "#dbeafe", color: "#1e40af" },
  審査中: { bg: "#fff7ed", color: "#92400e" },
  承認待ち: { bg: "#fef3c7", color: "#92400e" },
};

const summaryCards = [
  { label: "登録会社数", value: "186", icon: Building2, color: "#1a56db", bg: "#eff6ff" },
  { label: "本日入場者", value: "142", icon: Users, color: "#16a34a", bg: "#f0fdf4" },
  { label: "未提出書類", value: "10", icon: FileText, color: "#f97316", bg: "#fff7ed" },
  { label: "未払請求", value: "¥15.1M", icon: ClipboardList, color: "#dc2626", bg: "#fef2f2" },
];

const tabStyle = (active: boolean): React.CSSProperties => ({
  padding: "8px 16px",
  fontSize: 12,
  fontWeight: active ? 600 : 400,
  color: active ? "#1a56db" : T_MUTED,
  cursor: "pointer",
  borderBottom: active ? "2px solid #1a56db" : "2px solid transparent",
  background: "none",
  border: "none",
  borderBottomStyle: "solid",
  fontFamily: "inherit",
});

export function PartnerDesignView({ subPath }: { subPath?: string }) {
  const [selectedPartner, setSelectedPartner] = useState(0);
  const [activeTab, setActiveTab] = useState<TabId>((subPath && tabFromPath[subPath]) || "overview");

  useEffect(() => {
    if (subPath && tabFromPath[subPath]) setActiveTab(tabFromPath[subPath]);
  }, [subPath]);

  const p = partners[selectedPartner];

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: T_HEADING, margin: 0 }}>協力会社連携</h1>
          <p style={{ fontSize: 12, color: T_MUTED, marginTop: 2 }}>入退場管理・提出書類・契約・請求の統合管理</p>
        </div>
        <button
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "none",
            background: "#1a56db",
            color: "#fff",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontFamily: "inherit",
          }}
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          協力会社登録
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
        {summaryCards.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} style={{ ...CARD, padding: 14, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
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

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20 }}>
        {/* Partner list */}
        <div style={{ ...CARD, padding: 0 }}>
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${BORDER}` }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T_HEADING }}>協力会社一覧</div>
          </div>
          {partners.map((pa, i) => (
            <div
              key={pa.name}
              onClick={() => setSelectedPartner(i)}
              style={{
                padding: "12px 16px",
                cursor: "pointer",
                background: i === selectedPartner ? "#eff6ff" : "transparent",
                borderLeft: i === selectedPartner ? "3px solid #1a56db" : "3px solid transparent",
                borderBottom: `1px solid ${BORDER_LIGHT}`,
                transition: "all 0.12s",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T_BODY }}>{pa.name}</div>
                  <div style={{ fontSize: 11, color: T_MUTED, marginTop: 2 }}>{pa.type}</div>
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: 4,
                    background: pa.rating === "A" ? "#dcfce7" : "#fef3c7",
                    color: pa.rating === "A" ? "#166534" : "#92400e",
                  }}
                >
                  {pa.rating}ランク
                </span>
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 8, fontSize: 10, color: T_FAINT }}>
                <span>{pa.workers}名</span>
                <span>安全{pa.safety}%</span>
                <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: riskColor[pa.risk] }} />
                  リスク{riskLabel[pa.risk]}
                </span>
                {pa.docs > 0 && <span style={{ color: "#f97316", fontWeight: 600 }}>未提出{pa.docs}件</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Detail area */}
        <div>
          {/* Partner header */}
          <div style={{ ...CARD, padding: 16, marginBottom: 16, display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 10, background: "#1a56db12", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "#1a56db" }}>
              {p.name[0]}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: T_BODY }}>{p.name}</div>
              <div style={{ fontSize: 12, color: T_MUTED }}>
                {p.type} · {p.contract}契約 · 作業員{p.workers}名
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ textAlign: "center", padding: "4px 12px" }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#16a34a" }}>{p.safety}%</div>
                <div style={{ fontSize: 10, color: T_FAINT }}>安全スコア</div>
              </div>
              <div style={{ textAlign: "center", padding: "4px 12px" }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: riskColor[p.risk] }}>{riskLabel[p.risk]}</div>
                <div style={{ fontSize: 10, color: T_FAINT }}>AIリスク</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={CARD}>
            <div style={{ display: "flex", borderBottom: `1px solid ${BORDER}`, padding: "0 16px" }}>
              {([
                { id: "overview", label: "概要" },
                { id: "entry", label: "入退場" },
                { id: "docs", label: "提出書類" },
                { id: "invoice", label: "請求管理" },
                { id: "safety", label: "安全教育" },
              ] as { id: TabId; label: string }[]).map((t) => (
                <button key={t.id} onClick={() => setActiveTab(t.id)} style={tabStyle(activeTab === t.id)}>
                  {t.label}
                </button>
              ))}
            </div>
            <div style={{ padding: 20 }}>
              {activeTab === "overview" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T_BODY, marginBottom: 12 }}>基本情報</div>
                    {[
                      ["会社名", p.name],
                      ["業種", p.type],
                      ["作業員数", `${p.workers}名`],
                      ["契約形態", p.contract],
                      ["評価ランク", p.rating],
                      ["安全スコア", `${p.safety}%`],
                    ].map(([k, v]) => (
                      <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${BORDER_LIGHT}`, fontSize: 12 }}>
                        <span style={{ color: T_FAINT }}>{k}</span>
                        <span style={{ color: T_BODY, fontWeight: 500 }}>{v}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: 14, borderRadius: 8, background: "#f5f3ff", border: "1px solid #ede9fe" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                      <Brain className="h-3.5 w-3.5" style={{ color: "#7c3aed" }} aria-hidden="true" />
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#7c3aed" }}>AIリスク評価</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.6 }}>
                      過去12ヶ月の実績分析に基づくリスク評価: {riskLabel[p.risk]}。安全教育の受講率が高く、書類提出も概ね期限内。
                      {p.docs > 0 ? `ただし、現在${p.docs}件の未提出書類があります。早急な対応を推奨します。` : "全書類提出済み。優良パートナーです。"}
                    </div>
                  </div>
                </div>
              )}
              {activeTab === "entry" && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T_BODY, marginBottom: 12 }}>本日の入退場記録</div>
                  <div style={{ borderRadius: 8, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 80px 60px 60px 60px", gap: 8, padding: "8px 14px", background: SUBTLE_BG, borderBottom: `1px solid ${BORDER}`, fontSize: 11, fontWeight: 600, color: T_FAINT }}>
                      <span>氏名</span><span>会社</span><span>時刻</span><span>種別</span><span>ヘルメット</span><span>ベスト</span>
                    </div>
                    {entryLogs.map((e, i) => (
                      <div key={e.name} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 80px 60px 60px 60px", gap: 8, padding: "10px 14px", alignItems: "center", borderBottom: i < entryLogs.length - 1 ? `1px solid ${BORDER_LIGHT}` : "none", fontSize: 12 }}>
                        <span style={{ fontWeight: 500, color: T_BODY }}>{e.name}</span>
                        <span style={{ color: T_MUTED }}>{e.company}</span>
                        <span style={{ color: T_MUTED, fontFamily: MONO, fontSize: 11 }}>{e.time}</span>
                        <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 4, background: "#dcfce7", color: "#166534" }}>{e.type}</span>
                        <span style={{ color: "#16a34a", fontSize: 11 }}>{e.helmet}</span>
                        <span style={{ color: e.vest === "OK" ? "#16a34a" : "#dc2626", fontSize: 11, fontWeight: e.vest !== "OK" ? 600 : 400 }}>{e.vest}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {activeTab === "invoice" && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T_BODY, marginBottom: 12 }}>請求管理</div>
                  <div style={{ borderRadius: 8, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 80px 120px 80px 100px", gap: 8, padding: "8px 14px", background: SUBTLE_BG, borderBottom: `1px solid ${BORDER}`, fontSize: 11, fontWeight: 600, color: T_FAINT }}>
                      <span>会社名</span><span>対象月</span><span>金額</span><span>状態</span><span>支払期限</span>
                    </div>
                    {invoices.map((inv, i) => {
                      const sc = invoiceStatusColor[inv.status] ?? { bg: "#f1f5f9", color: "#475569" };
                      return (
                        <div key={inv.company} style={{ display: "grid", gridTemplateColumns: "1.2fr 80px 120px 80px 100px", gap: 8, padding: "10px 14px", alignItems: "center", borderBottom: i < invoices.length - 1 ? `1px solid ${BORDER_LIGHT}` : "none", fontSize: 12 }}>
                          <span style={{ fontWeight: 500, color: T_BODY }}>{inv.company}</span>
                          <span style={{ color: T_MUTED }}>{inv.month}</span>
                          <span style={{ fontFamily: MONO, color: T_BODY, fontWeight: 600 }}>{inv.amount}</span>
                          <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 10, background: sc.bg, color: sc.color }}>{inv.status}</span>
                          <span style={{ color: T_MUTED, fontSize: 11 }}>{inv.due}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {activeTab === "docs" && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T_BODY, marginBottom: 12 }}>提出書類管理</div>
                  <div style={{ borderRadius: 8, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1.5fr 100px 80px 80px", gap: 8, padding: "8px 14px", background: SUBTLE_BG, borderBottom: `1px solid ${BORDER}`, fontSize: 11, fontWeight: 600, color: T_FAINT }}>
                      <span>書類名</span><span>種別</span><span>期限</span><span>状態</span>
                    </div>
                    {docsRows.map((d) => (
                      <div key={d.name} style={{ display: "grid", gridTemplateColumns: "1.5fr 100px 80px 80px", gap: 8, padding: "10px 14px", alignItems: "center", borderBottom: `1px solid ${BORDER_LIGHT}`, fontSize: 12 }}>
                        <span style={{ fontWeight: 500, color: T_BODY }}>{d.name}</span>
                        <span style={{ fontSize: 10, color: T_MUTED }}>{d.type}</span>
                        <span style={{ fontSize: 11, color: T_MUTED }}>{d.deadline}</span>
                        <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 10, background: d.status === "提出済" ? "#dcfce7" : d.status === "未提出" ? "#fff7ed" : "#fef2f2", color: d.status === "提出済" ? "#166534" : d.status === "未提出" ? "#92400e" : "#991b1b" }}>{d.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {activeTab === "safety" && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T_BODY, marginBottom: 12 }}>安全教育記録</div>
                  <div style={{ borderRadius: 8, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 100px 80px", gap: 8, padding: "8px 14px", background: SUBTLE_BG, borderBottom: `1px solid ${BORDER}`, fontSize: 11, fontWeight: 600, color: T_FAINT }}>
                      <span>教育名</span><span>対象者</span><span>受講日</span><span>状態</span>
                    </div>
                    {safetyRows.map((e) => (
                      <div key={e.name} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 100px 80px", gap: 8, padding: "10px 14px", alignItems: "center", borderBottom: `1px solid ${BORDER_LIGHT}`, fontSize: 12 }}>
                        <span style={{ fontWeight: 500, color: T_BODY }}>{e.name}</span>
                        <span style={{ color: T_MUTED, fontSize: 11 }}>{e.target}</span>
                        <span style={{ fontSize: 11, color: T_MUTED }}>{e.date}</span>
                        <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 10, background: e.status === "完了" ? "#dcfce7" : "#fff7ed", color: e.status === "完了" ? "#166534" : "#92400e" }}>{e.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
