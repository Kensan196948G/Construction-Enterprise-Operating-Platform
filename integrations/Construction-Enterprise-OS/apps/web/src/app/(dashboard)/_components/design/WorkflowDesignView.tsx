"use client";

import { useEffect, useState, type ComponentType } from "react";
import { Activity, Brain, CheckCircle2, Clock, FileText, GitBranch, Plus, Shield, X } from "lucide-react";
import { CARD, T_HEADING, T_BODY, T_MUTED, T_FAINT, BORDER, BORDER_LIGHT, SUBTLE_BG } from "@/lib/design/tokens";

// ────────────────────────────────────────────────────────────────────────────
// Claude Design — ワークフロー (WorkflowPage faithful port)
// SlideTabPanel replaced with inline translateX slide. Covers all sub-items.
// ────────────────────────────────────────────────────────────────────────────

type WfTabId = "approval" | "ringi" | "permit" | "esign" | "change";
type Priority = "high" | "medium" | "low";

interface WfItem {
  id: string;
  title: string;
  type: string;
  requester: string;
  project: string;
  priority: Priority;
  created: string;
  deadline: string;
  step: string;
}

const TABS: { id: WfTabId; label: string }[] = [
  { id: "approval", label: "承認一覧" },
  { id: "ringi", label: "稟議" },
  { id: "permit", label: "作業許可" },
  { id: "esign", label: "電子決裁" },
  { id: "change", label: "変更管理" },
];

const tabFromPath: Record<string, WfTabId> = {
  "/workflow/approval": "approval",
  "/workflow/ringi": "ringi",
  "/workflow/permit": "permit",
  "/workflow/esign": "esign",
  "/workflow/change": "change",
};

const pendingItems: WfItem[] = [
  { id: "WF-2026-128", title: "施工計画書（躯体工事）承認依頼", type: "承認", requester: "田中 健一", project: "品川タワー", priority: "high", created: "2026/05/24 08:30", deadline: "2026/05/25", step: "部長承認" },
  { id: "WF-2026-127", title: "資材発注書（鉄筋 SD345）", type: "稟議", requester: "渡辺 誠", project: "横浜マンション", priority: "medium", created: "2026/05/24 07:45", deadline: "2026/05/26", step: "課長承認" },
  { id: "WF-2026-126", title: "クレーン作業許可申請", type: "作業許可", requester: "佐藤 太郎", project: "品川タワー", priority: "high", created: "2026/05/23 16:00", deadline: "2026/05/24", step: "安全確認" },
  { id: "WF-2026-125", title: "設計変更申請（基礎構造）", type: "変更管理", requester: "山田 花子", project: "新宿再開発", priority: "medium", created: "2026/05/23 14:20", deadline: "2026/05/27", step: "技術審査" },
  { id: "WF-2026-123", title: "安全パトロール是正報告", type: "承認", requester: "高橋 美咲", project: "川崎物流基地", priority: "medium", created: "2026/05/23 09:15", deadline: "2026/05/26", step: "安全管理部承認" },
  { id: "WF-2026-122", title: "生コンクリート発注稟議（30-18-20N）", type: "稟議", requester: "鈴木 一郎", project: "大田区土木工事", priority: "high", created: "2026/05/22 17:40", deadline: "2026/05/24", step: "購買部審査" },
  { id: "WF-2026-121", title: "残業申請（夜間打設作業）", type: "承認", requester: "中村 大輔", project: "千葉港湾整備", priority: "medium", created: "2026/05/22 15:20", deadline: "2026/05/25", step: "施工管理部長承認" },
  { id: "WF-2026-120", title: "仮設足場計画 変更申請", type: "変更管理", requester: "渡辺 誠", project: "横浜分譲マンション", priority: "low", created: "2026/05/22 11:05", deadline: "2026/05/29", step: "技術部審査" },
  { id: "WF-2026-124", title: "協力会社 新規登録申請", type: "承認", requester: "伊藤 裕子", project: "全社", priority: "low", created: "2026/05/23 10:00", deadline: "2026/05/28", step: "外注管理確認" },
];

const ringiItems: WfItem[] = pendingItems.filter((it) => it.type === "稟議");

const permitItems: WfItem[] = [
  { id: "WF-P-001", title: "クレーン作業許可申請", type: "作業許可", requester: "佐藤 太郎", project: "品川タワー", priority: "high", created: "2026/05/24 06:30", deadline: "2026/05/24", step: "安全確認" },
  { id: "WF-P-002", title: "高所作業許可（8F以上）", type: "作業許可", requester: "木村 大輔", project: "品川タワー", priority: "high", created: "2026/05/24 07:00", deadline: "2026/05/24", step: "安全管理者" },
  { id: "WF-P-004", title: "酸欠危険場所立入許可（地下ピット）", type: "作業許可", requester: "山田 花子", project: "大田区土木工事", priority: "high", created: "2026/05/24 06:50", deadline: "2026/05/24", step: "安全管理者" },
  { id: "WF-P-005", title: "重機搬入・据付作業許可", type: "作業許可", requester: "渡辺 誠", project: "川崎物流基地", priority: "medium", created: "2026/05/24 07:10", deadline: "2026/05/25", step: "現場監督確認" },
  { id: "WF-P-006", title: "夜間作業許可（コンクリート打設）", type: "作業許可", requester: "高橋 美咲", project: "千葉港湾整備", priority: "high", created: "2026/05/24 05:40", deadline: "2026/05/24", step: "発注者確認" },
  { id: "WF-P-003", title: "火気使用許可（溶接作業）", type: "作業許可", requester: "中村 太郎", project: "横浜マンション", priority: "medium", created: "2026/05/24 07:30", deadline: "2026/05/24", step: "現場監督確認" },
];

const esignItems: WfItem[] = [
  { id: "WF-E-001", title: "施工計画書（躯体工事）電子署名", type: "承認", requester: "田中 健一", project: "品川タワー", priority: "high", created: "2026/05/24 08:30", deadline: "2026/05/25", step: "電子署名待ち" },
  { id: "WF-E-003", title: "工事請負契約書 電子締結", type: "稟議", requester: "山田 花子", project: "新宿再開発", priority: "high", created: "2026/05/24 09:10", deadline: "2026/05/26", step: "電子署名待ち" },
  { id: "WF-E-004", title: "下請負業者選定 電子決裁", type: "承認", requester: "伊藤 裕子", project: "川崎物流基地", priority: "medium", created: "2026/05/23 13:25", deadline: "2026/05/28", step: "購買部決裁" },
  { id: "WF-E-005", title: "完成検査記録 電子署名", type: "変更管理", requester: "高橋 美咲", project: "横浜分譲マンション", priority: "low", created: "2026/05/22 14:50", deadline: "2026/05/30", step: "技術部署名待ち" },
  { id: "WF-E-002", title: "月次報告書 電子決裁", type: "承認", requester: "鈴木 一郎", project: "全社", priority: "medium", created: "2026/05/23 16:00", deadline: "2026/05/27", step: "役員決裁" },
];

const changeItems: WfItem[] = [
  { id: "WF-C-001", title: "設計変更申請（基礎構造）", type: "変更管理", requester: "山田 花子", project: "新宿再開発", priority: "medium", created: "2026/05/23 14:20", deadline: "2026/05/27", step: "技術審査" },
  { id: "WF-C-003", title: "数量変更申請（土工事増工）", type: "変更管理", requester: "鈴木 一郎", project: "大田区土木工事", priority: "high", created: "2026/05/23 11:30", deadline: "2026/05/26", step: "積算確認" },
  { id: "WF-C-004", title: "材料仕様変更申請（外壁タイル）", type: "変更管理", requester: "渡辺 誠", project: "横浜分譲マンション", priority: "medium", created: "2026/05/22 16:15", deadline: "2026/05/29", step: "技術審査" },
  { id: "WF-C-005", title: "工区割変更申請（重機輻輳回避）", type: "変更管理", requester: "中村 大輔", project: "千葉港湾整備", priority: "low", created: "2026/05/21 09:40", deadline: "2026/05/30", step: "発注者確認" },
  { id: "WF-C-002", title: "工程変更申請（雨天延期）", type: "変更管理", requester: "田中 健一", project: "品川タワー", priority: "low", created: "2026/05/22 10:00", deadline: "2026/05/28", step: "発注者確認" },
];

const priorityColor: Record<Priority, string> = { high: "#dc2626", medium: "#f97316", low: "#16a34a" };
const priorityLabel: Record<Priority, string> = { high: "高", medium: "中", low: "低" };
const typeIcon: Record<string, ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  承認: CheckCircle2,
  稟議: FileText,
  作業許可: Shield,
  変更管理: GitBranch,
};

const flowSteps = [
  { label: "申請", status: "done", user: "田中 健一", date: "05/24" },
  { label: "課長確認", status: "done", user: "木下 誠", date: "05/24" },
  { label: "部長承認", status: "active", user: "(承認待ち)", date: "" },
  { label: "完了", status: "pending", user: "", date: "" },
];
const stepColor: Record<string, string> = { done: "#16a34a", active: "#1a56db", pending: "#d1d5db" };

const summaryCards = [
  { label: "承認待ち", value: "5", icon: Clock, color: "#f97316", bg: "#fff7ed" },
  { label: "本日承認", value: "8", icon: CheckCircle2, color: "#16a34a", bg: "#f0fdf4" },
  { label: "今月申請", value: "42", icon: FileText, color: "#1a56db", bg: "#eff6ff" },
  { label: "SLA達成率", value: "94%", icon: Activity, color: "#7c3aed", bg: "#f5f3ff" },
];

function WfListItem({ item, selected, onClick }: { item: WfItem; selected: boolean; onClick: () => void }) {
  const TypeIcon = typeIcon[item.type] ?? FileText;
  return (
    <div
      onClick={onClick}
      style={{ padding: "14px 20px", borderBottom: `1px solid ${BORDER_LIGHT}`, cursor: "pointer", background: selected ? "#eff6ff" : "transparent", transition: "background 0.1s" }}
      onMouseEnter={(e) => { if (!selected) e.currentTarget.style.background = "var(--bg-card-hover, #f8fafc)"; }}
      onMouseLeave={(e) => { if (!selected) e.currentTarget.style.background = "transparent"; }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <div style={{ width: 28, height: 28, borderRadius: 6, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <TypeIcon className="h-3.5 w-3.5" style={{ color: "#1a56db" }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T_BODY }}>{item.title}</div>
          <div style={{ fontSize: 11, color: T_FAINT, marginTop: 2 }}>{item.id} · {item.requester} · {item.project}</div>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: priorityColor[item.priority] + "15", color: priorityColor[item.priority] }}>{priorityLabel[item.priority]}</span>
          <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: "#fff7ed", color: "#92400e", fontWeight: 500 }}>{item.step}</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, fontSize: 10, color: T_FAINT, marginLeft: 38 }}>
        <span>{item.type}</span>
        <span>申請: {item.created}</span>
        <span style={{ color: item.priority === "high" ? "#dc2626" : "#94a3b8" }}>期限: {item.deadline}</span>
      </div>
    </div>
  );
}

export function WorkflowDesignView({ subPath }: { subPath?: string }) {
  const [activeWfTab, setActiveWfTab] = useState<WfTabId>((subPath && tabFromPath[subPath]) || "approval");
  const [selectedItem, setSelectedItem] = useState<WfItem | null>(null);

  useEffect(() => {
    if (subPath && tabFromPath[subPath]) setActiveWfTab(tabFromPath[subPath]);
  }, [subPath]);

  const activeIndex = Math.max(0, TABS.findIndex((t) => t.id === activeWfTab));
  const panels: WfItem[][] = [pendingItems, ringiItems, permitItems, esignItems, changeItems];

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: T_HEADING, margin: 0 }}>ワークフロー</h1>
          <p style={{ fontSize: 12, color: T_MUTED, marginTop: 2 }}>承認・稟議・作業許可・電子決裁の統合管理</p>
        </div>
        <button style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#1a56db", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit" }}>
          <Plus className="h-3.5 w-3.5" />新規申請
        </button>
      </div>

      {/* Summary */}
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

      <div style={{ display: "grid", gridTemplateColumns: selectedItem !== null ? "1fr 380px" : "1fr", gap: 20 }}>
        <div style={CARD}>
          {/* Tab bar */}
          <div style={{ display: "flex", borderBottom: `1px solid ${BORDER}`, padding: "0 8px", overflowX: "auto" }}>
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveWfTab(t.id)}
                style={{ padding: "12px 16px", fontSize: 12, fontWeight: activeWfTab === t.id ? 600 : 400, color: activeWfTab === t.id ? "#1a56db" : T_MUTED, cursor: "pointer", whiteSpace: "nowrap", background: "none", border: "none", borderBottom: activeWfTab === t.id ? "2px solid #1a56db" : "2px solid transparent", fontFamily: "inherit" }}
              >
                {t.label}
              </button>
            ))}
          </div>
          {/* Sliding panels */}
          <div style={{ overflow: "hidden" }}>
            <div style={{ display: "flex", transition: "transform 0.35s cubic-bezier(.4,0,.2,1)", transform: `translateX(-${activeIndex * 100}%)` }}>
              {panels.map((items, pi) => (
                <div key={TABS[pi].id} style={{ minWidth: "100%", flexShrink: 0 }}>
                  {items.map((item) => (
                    <WfListItem key={item.id} item={item} selected={selectedItem?.id === item.id} onClick={() => setSelectedItem(item)} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detail panel */}
        {selectedItem !== null && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={CARD}>
              <div style={{ padding: "14px 16px", borderBottom: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: T_HEADING }}>申請詳細</span>
                <button onClick={() => setSelectedItem(null)} aria-label="閉じる" style={{ border: "none", background: "transparent", cursor: "pointer", color: T_FAINT, padding: 2 }}>
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
              <div style={{ padding: 16 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: T_BODY, marginBottom: 4 }}>{selectedItem.title}</div>
                <div style={{ fontSize: 11, color: T_FAINT, marginBottom: 16 }}>{selectedItem.id}</div>
                {[
                  ["申請者", selectedItem.requester],
                  ["種別", selectedItem.type],
                  ["工事", selectedItem.project],
                  ["優先度", priorityLabel[selectedItem.priority]],
                  ["申請日", selectedItem.created],
                  ["期限", selectedItem.deadline],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${BORDER_LIGHT}`, fontSize: 12 }}>
                    <span style={{ color: T_FAINT }}>{k}</span>
                    <span style={{ color: T_BODY, fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
                <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
                  <button style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", background: "#16a34a", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>承認</button>
                  <button style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", background: "#dc2626", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>差戻し</button>
                </div>
              </div>
            </div>

            {/* Workflow flow */}
            <div style={CARD}>
              <div style={{ padding: "12px 16px", borderBottom: `1px solid ${BORDER}` }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: T_HEADING }}>承認フロー</span>
              </div>
              <div style={{ padding: 16 }}>
                <div style={{ position: "relative", paddingLeft: 20 }}>
                  <div style={{ position: "absolute", left: 7, top: 8, bottom: 8, width: 2, background: BORDER }} />
                  {flowSteps.map((step) => (
                    <div key={step.label} style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 18, position: "relative" }}>
                      <div role="img" aria-label={step.status === "done" ? "完了" : step.status === "active" ? "対応中" : "未着手"} title={step.status === "done" ? "完了" : step.status === "active" ? "対応中" : "未着手"} style={{ position: "absolute", left: -16, width: 14, height: 14, borderRadius: "50%", marginTop: 1, background: stepColor[step.status], border: step.status === "active" ? "3px solid #bfdbfe" : "2px solid #fff", boxShadow: step.status === "active" ? "0 0 0 2px #1a56db40" : "none" }} />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: step.status === "active" ? 600 : 400, color: step.status === "pending" ? "#94a3b8" : T_BODY }}>{step.label}</div>
                        {step.user && <div style={{ fontSize: 10, color: T_FAINT, marginTop: 2 }}>{step.user} {step.date && `· ${step.date}`}</div>}
                        {step.status === "active" && (
                          <span style={{ display: "inline-block", marginTop: 4, fontSize: 10, fontWeight: 600, color: "#1a56db", background: "#eff6ff", padding: "2px 8px", borderRadius: 10 }}>承認待ち</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI assist */}
            <div style={{ ...CARD, background: "#f5f3ff", borderColor: "#ede9fe" }}>
              <div style={{ padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <Brain className="h-3.5 w-3.5" aria-hidden="true" style={{ color: "#7c3aed" }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#7c3aed" }}>AI承認補助</span>
                </div>
                <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.6 }}>
                  この施工計画書は過去の類似承認と整合性があります。内容の主要ポイント: 躯体工事の品質管理基準・施工手順・安全対策が網羅されています。特記事項はありません。
                </div>
                <div style={{ marginTop: 8, fontSize: 11, color: "#16a34a", fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
                  <CheckCircle2 className="h-3 w-3" aria-hidden="true" />AI推奨: 承認可
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
