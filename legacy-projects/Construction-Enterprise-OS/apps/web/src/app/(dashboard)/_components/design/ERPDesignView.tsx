"use client";

import { useEffect, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Brain,
  Clipboard,
  TrendingUp,
  Users,
} from "lucide-react";
import type { ComponentType } from "react";
import type { LucideIcon } from "lucide-react";
import {
  CARD,
  T_HEADING,
  T_BODY,
  T_SECOND,
  T_MUTED,
  T_FAINT,
  BORDER,
  BORDER_LIGHT,
  SUBTLE_BG,
  MONO,
} from "@/lib/design/tokens";

// ────────────────────────────────────────────────────────────────────────────
// Claude Design — ERP・経営管理 (faithful port of page-erp.jsx / page-erp-cost.jsx)
// SlideTabPanel replaced with an inline translateX slide. Covers all sub-items:
// 原価 / 予算 / 契約 / 購買 / 売上 / 労務 / 在庫 / 工事台帳 / BIレポート
// Each panel mirrors the master's data and structure 1:1.
// ────────────────────────────────────────────────────────────────────────────

type TabId =
  | "cost"
  | "budget"
  | "contract"
  | "purchase"
  | "sales"
  | "labor"
  | "stock"
  | "ledger"
  | "bi";

const TABS: { id: TabId; label: string }[] = [
  { id: "cost", label: "原価管理" },
  { id: "budget", label: "予算管理" },
  { id: "contract", label: "契約管理" },
  { id: "purchase", label: "購買管理" },
  { id: "sales", label: "売上管理" },
  { id: "labor", label: "労務管理" },
  { id: "stock", label: "在庫管理" },
  { id: "ledger", label: "工事台帳" },
  { id: "bi", label: "BIレポート" },
];

const tabFromPath: Record<string, TabId> = {
  "/erp/cost": "cost",
  "/erp/budget": "budget",
  "/erp/contract": "contract",
  "/erp/purchase": "purchase",
  "/erp/sales": "sales",
  "/erp/labor": "labor",
  "/erp/stock": "stock",
  "/erp/ledger": "ledger",
  "/erp/bi": "bi",
};

// ── Semantic colors (kept literal for status meaning, mirrors master) ────────
const C_BLUE = "#1a56db";
const C_GREEN = "#16a34a";
const C_ORANGE = "#f97316";
const C_RED = "#dc2626";
const C_PURPLE = "#7c3aed";

// ── Shared building blocks ──────────────────────────────────────────────────
const panelStyle: React.CSSProperties = {
  minWidth: "100%",
  flexShrink: 0,
  padding: 20,
};

/** ERP page header (master `header(title, desc)`). */
function PanelHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h1
        style={{ fontSize: 20, fontWeight: 700, color: T_HEADING, margin: 0 }}
      >
        {title}
      </h1>
      <p style={{ fontSize: 12, color: T_MUTED, marginTop: 2 }}>{desc}</p>
    </div>
  );
}

// ── KPI cards (master `kpis` + `KPICards`) ──────────────────────────────────
type KpiCard = {
  label: string;
  value: string;
  sub: string;
  color: string;
  bg: string;
  icon: LucideIcon;
};

const kpis: KpiCard[] = [
  {
    label: "年度売上高",
    value: "¥18.2B",
    sub: "前年比+12%",
    color: C_BLUE,
    bg: "#eff6ff",
    icon: TrendingUp,
  },
  {
    label: "粗利率",
    value: "14.8%",
    sub: "目標15%",
    color: C_ORANGE,
    bg: "#fff7ed",
    icon: Activity,
  },
  {
    label: "受注残高",
    value: "¥42.5B",
    sub: "24件",
    color: C_GREEN,
    bg: "#f0fdf4",
    icon: Clipboard,
  },
  {
    label: "原価差異",
    value: "-¥180M",
    sub: "超過3件",
    color: C_RED,
    bg: "#fef2f2",
    icon: AlertTriangle,
  },
];

/** Master `KPICards` — 4 cards, icon + label + value (no sub line). */
function KPICards() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4,1fr)",
        gap: 14,
        marginBottom: 20,
      }}
    >
      {kpis.map((k) => {
        const Icon = k.icon;
        return (
          <div
            key={k.label}
            style={{
              ...CARD,
              padding: 14,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: k.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon className="h-4 w-4" style={{ color: k.color }} aria-hidden="true" />
            </div>
            <div>
              <div style={{ fontSize: 10, color: T_FAINT }}>{k.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: T_HEADING }}>
                {k.value}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Generic 100%-width progress bar used for 消化率 / 履行率 / 回収率 etc. */
function RateBar({ value, color }: { value: number; color: string }) {
  return (
    <div
      style={{
        flex: 1,
        height: 6,
        background: BORDER,
        borderRadius: 3,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${Math.min(100, Math.max(0, value))}%`,
          background: color,
          borderRadius: 3,
        }}
      />
    </div>
  );
}

// ── 原価管理 (default — faithful port of ERPCostView / page-erp-cost.jsx) ────
type CostStatus = "normal" | "warning" | "danger";

type CostRow = {
  project: string;
  budget: number;
  actual: number;
  forecast: number;
  status: CostStatus;
};

const costData: CostRow[] = [
  {
    project: "品川タワー新築工事",
    budget: 4200,
    actual: 3860,
    forecast: 4350,
    status: "warning",
  },
  {
    project: "横浜分譲マンション",
    budget: 2800,
    actual: 1150,
    forecast: 2780,
    status: "normal",
  },
  {
    project: "大田区土木工事",
    budget: 1500,
    actual: 1280,
    forecast: 1520,
    status: "warning",
  },
  {
    project: "新宿再開発ビル",
    budget: 6500,
    actual: 1420,
    forecast: 6400,
    status: "normal",
  },
  {
    project: "川崎物流センター",
    budget: 3200,
    actual: 1760,
    forecast: 3380,
    status: "danger",
  },
];

function BarCompare({
  budget,
  actual,
  forecast,
}: {
  budget: number;
  actual: number;
  forecast: number;
}) {
  const max = Math.max(budget, actual, forecast);
  const bars = [
    { label: "予算", value: budget, color: T_FAINT },
    { label: "実績", value: actual, color: C_BLUE },
    {
      label: "予測",
      value: forecast,
      color: forecast > budget ? C_RED : C_GREEN,
    },
  ];
  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: 4, width: 180 }}
    >
      {bars.map((b) => (
        <div
          key={b.label}
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          <span style={{ fontSize: 9, color: T_FAINT, width: 24 }}>
            {b.label}
          </span>
          <RateBar value={(b.value / max) * 100} color={b.color} />
        </div>
      ))}
    </div>
  );
}

function CostPanel() {
  return (
    <div style={panelStyle}>
      <div style={{ marginBottom: 20 }}>
        <h1
          style={{ fontSize: 20, fontWeight: 700, color: T_HEADING, margin: 0 }}
        >
          ERP・経営管理
        </h1>
        <p style={{ fontSize: 12, color: T_MUTED, marginTop: 2 }}>
          原価管理・予算管理・経営分析
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 14,
          marginBottom: 20,
        }}
      >
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div
              key={k.label}
              style={{
                ...CARD,
                padding: 14,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: k.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon className="h-4 w-4" style={{ color: k.color }} aria-hidden="true" />
              </div>
              <div>
                <div style={{ fontSize: 10, color: T_FAINT }}>{k.label}</div>
                <div
                  style={{ fontSize: 20, fontWeight: 700, color: T_HEADING }}
                >
                  {k.value}
                </div>
                <div style={{ fontSize: 11, color: T_MUTED, marginTop: 2 }}>
                  {k.sub}
                </div>
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
          工事別 原価管理{" "}
          <span
            style={{
              fontSize: 11,
              color: T_FAINT,
              fontWeight: 400,
              marginLeft: 8,
            }}
          >
            単位：百万円
          </span>
        </div>
        <div style={{ borderRadius: 8, overflow: "hidden", margin: 16 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.5fr 80px 80px 80px 80px 180px",
              gap: 12,
              padding: "10px 16px",
              background: SUBTLE_BG,
              borderBottom: `1px solid ${BORDER}`,
              fontSize: 11,
              fontWeight: 600,
              color: T_MUTED,
            }}
          >
            <span>工事名</span>
            <span>予算</span>
            <span>実績</span>
            <span>予測</span>
            <span>差異</span>
            <span>推移</span>
          </div>
          {costData.map((c, i) => {
            const diff = c.forecast - c.budget;
            return (
              <div
                key={c.project}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.5fr 80px 80px 80px 80px 180px",
                  gap: 12,
                  padding: "14px 16px",
                  alignItems: "center",
                  borderBottom:
                    i < costData.length - 1
                      ? `1px solid ${BORDER_LIGHT}`
                      : "none",
                }}
              >
                <span
                  style={{ fontSize: 13, fontWeight: 500, color: T_HEADING }}
                >
                  {c.project}
                </span>
                <span
                  style={{ fontSize: 13, fontFamily: MONO, color: T_SECOND }}
                >
                  {c.budget.toLocaleString()}
                </span>
                <span
                  style={{ fontSize: 13, fontFamily: MONO, color: T_SECOND }}
                >
                  {c.actual.toLocaleString()}
                </span>
                <span
                  style={{ fontSize: 13, fontFamily: MONO, color: T_SECOND }}
                >
                  {c.forecast.toLocaleString()}
                </span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: MONO,
                    color: diff > 0 ? C_RED : C_GREEN,
                  }}
                >
                  {diff > 0 ? "+" : ""}
                  {diff}
                </span>
                <BarCompare
                  budget={c.budget}
                  actual={c.actual}
                  forecast={c.forecast}
                />
              </div>
            );
          })}
        </div>
        <div
          style={{
            margin: "0 16px 16px",
            padding: 14,
            borderRadius: 8,
            background: "#f5f3ff",
            border: "1px solid #ede9fe",
            display: "flex",
            gap: 10,
          }}
        >
          <Brain
            className="h-4 w-4"
            style={{ color: C_PURPLE, flexShrink: 0, marginTop: 2 }}
            aria-hidden="true"
          />
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: C_PURPLE,
                marginBottom: 4,
              }}
            >
              AI経営分析
            </div>
            <div style={{ fontSize: 12, color: T_SECOND, lineHeight: 1.6 }}>
              川崎物流センターの原価超過リスクが高まっています。主因は鋼材価格の上昇（+8.3%）と基礎工事の手戻り。調達先の見直しと工程の最適化を推奨します。
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 予算管理 (faithful — 工事別 総予算/配賦/使用/残額/消化率) ────────────────
type BudgetRow = {
  project: string;
  total: number;
  allocated: number;
  used: number;
  remaining: number;
};

const budgetData: BudgetRow[] = [
  {
    project: "品川タワー新築工事",
    total: 4200,
    allocated: 4200,
    used: 2860,
    remaining: 1340,
  },
  {
    project: "横浜分譲マンション",
    total: 2800,
    allocated: 2800,
    used: 1150,
    remaining: 1650,
  },
  {
    project: "大田区土木工事",
    total: 1500,
    allocated: 1500,
    used: 1280,
    remaining: 220,
  },
  {
    project: "新宿再開発ビル",
    total: 6500,
    allocated: 6500,
    used: 1420,
    remaining: 5080,
  },
  {
    project: "川崎物流センター",
    total: 3200,
    allocated: 3200,
    used: 1760,
    remaining: 1440,
  },
];

function BudgetPanel() {
  return (
    <div style={panelStyle}>
      <PanelHeader title="予算管理" desc="工事別予算配分・消化率・残額管理" />
      <KPICards />
      <div style={CARD}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.5fr 90px 90px 90px 90px 120px",
            gap: 12,
            padding: "10px 16px",
            borderBottom: `1px solid ${BORDER}`,
            fontSize: 11,
            fontWeight: 600,
            color: T_FAINT,
          }}
        >
          <span>工事名</span>
          <span>総予算</span>
          <span>配賦額</span>
          <span>使用額</span>
          <span>残額</span>
          <span>消化率</span>
        </div>
        {budgetData.map((b, i) => {
          const pct = Math.round((b.used / b.total) * 100);
          return (
            <div
              key={b.project}
              style={{
                display: "grid",
                gridTemplateColumns: "1.5fr 90px 90px 90px 90px 120px",
                gap: 12,
                padding: "12px 16px",
                alignItems: "center",
                borderBottom:
                  i < budgetData.length - 1
                    ? `1px solid ${BORDER_LIGHT}`
                    : "none",
                fontSize: 12,
              }}
            >
              <span style={{ fontWeight: 500, color: T_HEADING }}>
                {b.project}
              </span>
              <span style={{ fontFamily: MONO, fontSize: 11 }}>
                {b.total.toLocaleString()}
              </span>
              <span style={{ fontFamily: MONO, fontSize: 11 }}>
                {b.allocated.toLocaleString()}
              </span>
              <span style={{ fontFamily: MONO, fontSize: 11 }}>
                {b.used.toLocaleString()}
              </span>
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 11,
                  fontWeight: 600,
                  color: b.remaining < 500 ? C_RED : C_GREEN,
                }}
              >
                {b.remaining.toLocaleString()}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <RateBar
                  value={pct}
                  color={pct > 80 ? C_RED : pct > 60 ? C_ORANGE : C_BLUE}
                />
                <span style={{ fontSize: 10, color: T_MUTED, width: 28 }}>
                  {pct}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── 契約管理 (faithful — 発注者/契約額/工期/契約形態/状態) ───────────────────
type ContractRow = {
  name: string;
  client: string;
  amount: string;
  period: string;
  type: string;
  status: string;
};

const contractData: ContractRow[] = [
  {
    name: "品川タワー新築工事",
    client: "品川都市開発(株)",
    amount: "¥4,200M",
    period: "2025/04-2027/03",
    type: "総価契約",
    status: "履行中",
  },
  {
    name: "横浜分譲マンション",
    client: "横浜住宅(株)",
    amount: "¥2,800M",
    period: "2025/06-2027/09",
    type: "総価契約",
    status: "履行中",
  },
  {
    name: "大田区土木工事",
    client: "大田区",
    amount: "¥1,500M",
    period: "2025/08-2026/12",
    type: "単価契約",
    status: "履行中",
  },
  {
    name: "新宿再開発ビル",
    client: "新宿都市開発(株)",
    amount: "¥6,500M",
    period: "2026/01-2028/06",
    type: "総価契約",
    status: "履行中",
  },
];

function ContractPanel() {
  return (
    <div style={panelStyle}>
      <PanelHeader title="契約管理" desc="工事請負契約・変更契約の管理" />
      <div style={CARD}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.3fr 1fr 90px 120px 80px 70px",
            gap: 12,
            padding: "10px 16px",
            borderBottom: `1px solid ${BORDER}`,
            fontSize: 11,
            fontWeight: 600,
            color: T_FAINT,
          }}
        >
          <span>工事名</span>
          <span>発注者</span>
          <span>契約額</span>
          <span>工期</span>
          <span>契約形態</span>
          <span>状態</span>
        </div>
        {contractData.map((c, i) => (
          <div
            key={c.name}
            style={{
              display: "grid",
              gridTemplateColumns: "1.3fr 1fr 90px 120px 80px 70px",
              gap: 12,
              padding: "12px 16px",
              alignItems: "center",
              borderBottom:
                i < contractData.length - 1
                  ? `1px solid ${BORDER_LIGHT}`
                  : "none",
              fontSize: 12,
            }}
          >
            <span style={{ fontWeight: 500, color: T_HEADING }}>{c.name}</span>
            <span style={{ color: T_MUTED }}>{c.client}</span>
            <span style={{ fontWeight: 600, color: T_HEADING }}>
              {c.amount}
            </span>
            <span style={{ fontSize: 10, color: T_MUTED }}>{c.period}</span>
            <span
              style={{
                fontSize: 10,
                padding: "2px 6px",
                borderRadius: 4,
                background: BORDER_LIGHT,
                color: T_SECOND,
                justifySelf: "start",
              }}
            >
              {c.type}
            </span>
            <span style={{ fontSize: 10, fontWeight: 600, color: C_GREEN }}>
              {c.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 購買管理 (faithful — 品目/数量/サプライヤー/金額/納期/状態) ───────────────
type PurchaseRow = {
  item: string;
  qty: string;
  supplier: string;
  amount: string;
  delivery: string;
  status: "発注済" | "製作中" | "配車済" | "出荷済";
};

const purchaseData: PurchaseRow[] = [
  {
    item: "SD345 D25 鉄筋",
    qty: "120t",
    supplier: "東京鉄鋼(株)",
    amount: "¥14.4M",
    delivery: "2026/06/01",
    status: "発注済",
  },
  {
    item: "H-400x200 鉄骨",
    qty: "85t",
    supplier: "日本製鉄(株)",
    amount: "¥25.5M",
    delivery: "2026/06/15",
    status: "製作中",
  },
  {
    item: "コンクリート 30-18-20",
    qty: "450m³",
    supplier: "関東生コン",
    amount: "¥6.3M",
    delivery: "2026/05/28",
    status: "配車済",
  },
  {
    item: "型枠合板 12mm",
    qty: "2,000枚",
    supplier: "林業資材(株)",
    amount: "¥3.2M",
    delivery: "2026/05/27",
    status: "発注済",
  },
  {
    item: "安全ネット 5m幅",
    qty: "500m",
    supplier: "安全用品(株)",
    amount: "¥1.5M",
    delivery: "2026/05/30",
    status: "出荷済",
  },
];

/** Master purchase status badge palette (bg/fg pairs). */
function purchaseBadge(status: PurchaseRow["status"]): {
  bg: string;
  color: string;
} {
  if (status === "出荷済") return { bg: "#dcfce7", color: "#166534" };
  if (status === "配車済") return { bg: "#dbeafe", color: "#1e40af" };
  return { bg: "#fef3c7", color: "#92400e" };
}

function PurchasePanel() {
  return (
    <div style={panelStyle}>
      <PanelHeader
        title="購買管理"
        desc="資材発注・納品管理・サプライヤー管理"
      />
      <div style={CARD}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.3fr 70px 1fr 80px 90px 70px",
            gap: 12,
            padding: "10px 16px",
            borderBottom: `1px solid ${BORDER}`,
            fontSize: 11,
            fontWeight: 600,
            color: T_FAINT,
          }}
        >
          <span>品目</span>
          <span>数量</span>
          <span>サプライヤー</span>
          <span>金額</span>
          <span>納期</span>
          <span>状態</span>
        </div>
        {purchaseData.map((o, i) => {
          const badge = purchaseBadge(o.status);
          return (
            <div
              key={o.item}
              style={{
                display: "grid",
                gridTemplateColumns: "1.3fr 70px 1fr 80px 90px 70px",
                gap: 12,
                padding: "12px 16px",
                alignItems: "center",
                borderBottom:
                  i < purchaseData.length - 1
                    ? `1px solid ${BORDER_LIGHT}`
                    : "none",
                fontSize: 12,
              }}
            >
              <span style={{ fontWeight: 500, color: T_HEADING }}>
                {o.item}
              </span>
              <span style={{ color: T_MUTED }}>{o.qty}</span>
              <span style={{ color: T_MUTED }}>{o.supplier}</span>
              <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 500 }}>
                {o.amount}
              </span>
              <span style={{ fontSize: 11, color: T_MUTED }}>{o.delivery}</span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: 10,
                  background: badge.bg,
                  color: badge.color,
                  justifySelf: "start",
                }}
              >
                {o.status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── 売上管理 (faithful — KPICards + 工事別売上 契約/請求/回収/回収率) ─────────
type SalesRow = {
  name: string;
  contract: number;
  billed: number;
  collected: number;
};

const salesData: SalesRow[] = [
  { name: "品川タワー", contract: 4200, billed: 2800, collected: 2650 },
  { name: "横浜マンション", contract: 2800, billed: 1100, collected: 1050 },
  { name: "大田区土木", contract: 1500, billed: 1250, collected: 1200 },
  { name: "新宿再開発", contract: 6500, billed: 1200, collected: 1150 },
];

function SalesPanel() {
  return (
    <div style={panelStyle}>
      <PanelHeader title="売上管理" desc="工事別売上・出来高・請求管理" />
      <KPICards />
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
          工事別売上
        </div>
        {salesData.map((p) => (
          <div
            key={p.name}
            style={{
              display: "grid",
              gridTemplateColumns: "1.5fr 90px 90px 90px 120px",
              gap: 12,
              padding: "12px 16px",
              alignItems: "center",
              borderBottom: `1px solid ${BORDER_LIGHT}`,
              fontSize: 12,
            }}
          >
            <span style={{ fontWeight: 500, color: T_HEADING }}>{p.name}</span>
            <span style={{ fontFamily: MONO, fontSize: 11, color: T_MUTED }}>
              {p.contract.toLocaleString()}M
            </span>
            <span style={{ fontFamily: MONO, fontSize: 11 }}>
              {p.billed.toLocaleString()}M
            </span>
            <span style={{ fontFamily: MONO, fontSize: 11, color: C_GREEN }}>
              {p.collected.toLocaleString()}M
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <RateBar
                value={(p.collected / p.contract) * 100}
                color={C_BLUE}
              />
              <span style={{ fontSize: 10, color: T_MUTED }}>
                {Math.round((p.collected / p.contract) * 100)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 労務管理 (faithful — KPI4枚 + 部門別労務配置) ─────────────────────────────
type LaborKpi = { l: string; v: string; c: string; bg: string };

const laborKpis: LaborKpi[] = [
  { l: "総労務者数", v: "1,248名", c: C_BLUE, bg: "#eff6ff" },
  { l: "本月労務費", v: "¥186M", c: C_ORANGE, bg: "#fff7ed" },
  { l: "平均残業", v: "18.5h", c: C_PURPLE, bg: "#f5f3ff" },
  { l: "有給取得率", v: "72%", c: C_GREEN, bg: "#f0fdf4" },
];

type LaborDept = { dept: string; staff: number; field: number; office: number };

const laborDepts: LaborDept[] = [
  { dept: "施工管理部", staff: 42, field: 38, office: 4 },
  { dept: "技術部", staff: 28, field: 12, office: 16 },
  { dept: "安全管理部", staff: 8, field: 6, office: 2 },
  { dept: "購買部", staff: 12, field: 2, office: 10 },
];

function LaborPanel() {
  return (
    <div style={panelStyle}>
      <PanelHeader title="労務管理" desc="労務費・勤怠・配置計画" />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 14,
          marginBottom: 20,
        }}
      >
        {laborKpis.map((s) => (
          <div
            key={s.l}
            style={{
              ...CARD,
              padding: 14,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
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
              <Users className="h-4 w-4" style={{ color: s.c }} aria-hidden="true" />
            </div>
            <div>
              <div style={{ fontSize: 10, color: T_FAINT }}>{s.l}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: T_HEADING }}>
                {s.v}
              </div>
            </div>
          </div>
        ))}
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
          部門別労務配置
        </div>
        {laborDepts.map((d) => (
          <div
            key={d.dept}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 16px",
              borderBottom: `1px solid ${BORDER_LIGHT}`,
              fontSize: 12,
            }}
          >
            <span style={{ width: 120, fontWeight: 500, color: T_HEADING }}>
              {d.dept}
            </span>
            <span style={{ width: 60, color: T_SECOND }}>{d.staff}名</span>
            <span style={{ width: 80, color: T_MUTED, fontSize: 11 }}>
              現場{d.field}
            </span>
            <span style={{ width: 80, color: T_MUTED, fontSize: 11 }}>
              内勤{d.office}
            </span>
            <RateBar value={(d.field / d.staff) * 100} color={C_BLUE} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 在庫管理 (faithful — 在庫数/発注点/状態/保管場所) ─────────────────────────
type StockRow = {
  name: string;
  stock: string;
  min: string;
  status: "充足" | "不足";
  location: string;
};

const stockData: StockRow[] = [
  {
    name: "SD345 D25 鉄筋",
    stock: "45t",
    min: "20t",
    status: "充足",
    location: "品川ヤード",
  },
  {
    name: "H-400x200 鉄骨",
    stock: "12t",
    min: "15t",
    status: "不足",
    location: "品川ヤード",
  },
  {
    name: "型枠合板 12mm",
    stock: "800枚",
    min: "500枚",
    status: "充足",
    location: "横浜倉庫",
  },
  {
    name: "セメント 普通",
    stock: "30t",
    min: "10t",
    status: "充足",
    location: "大田区現場",
  },
  {
    name: "安全帯 フルハーネス",
    stock: "25個",
    min: "30個",
    status: "不足",
    location: "本社倉庫",
  },
];

function StockPanel() {
  return (
    <div style={panelStyle}>
      <PanelHeader title="在庫管理" desc="資材在庫・発注点管理・拠点別在庫" />
      <div style={CARD}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.5fr 80px 80px 70px 100px",
            gap: 12,
            padding: "10px 16px",
            borderBottom: `1px solid ${BORDER}`,
            fontSize: 11,
            fontWeight: 600,
            color: T_FAINT,
          }}
        >
          <span>品目</span>
          <span>在庫数</span>
          <span>発注点</span>
          <span>状態</span>
          <span>保管場所</span>
        </div>
        {stockData.map((it, i) => (
          <div
            key={it.name}
            style={{
              display: "grid",
              gridTemplateColumns: "1.5fr 80px 80px 70px 100px",
              gap: 12,
              padding: "12px 16px",
              alignItems: "center",
              borderBottom:
                i < stockData.length - 1 ? `1px solid ${BORDER_LIGHT}` : "none",
              fontSize: 12,
            }}
          >
            <span style={{ fontWeight: 500, color: T_HEADING }}>{it.name}</span>
            <span style={{ fontFamily: MONO, fontSize: 11 }}>{it.stock}</span>
            <span style={{ fontSize: 11, color: T_MUTED }}>{it.min}</span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: 10,
                background: it.status === "充足" ? "#dcfce7" : "#fef2f2",
                color: it.status === "充足" ? "#166534" : "#991b1b",
                justifySelf: "start",
              }}
            >
              {it.status}
            </span>
            <span style={{ color: T_MUTED, fontSize: 11 }}>{it.location}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 工事台帳 (faithful — 契約額/出来高/実行予算/実績原価/粗利率) ──────────────
type LedgerRow = {
  name: string;
  contract: number;
  dekidaka: number;
  budget: number;
  cost: number;
  margin: number;
};

const ledgerData: LedgerRow[] = [
  {
    name: "品川タワー新築",
    contract: 4200,
    dekidaka: 2800,
    budget: 3570,
    cost: 2380,
    margin: 15.0,
  },
  {
    name: "横浜分譲マンション",
    contract: 2800,
    dekidaka: 1100,
    budget: 2380,
    cost: 935,
    margin: 15.0,
  },
  {
    name: "大田区土木",
    contract: 1500,
    dekidaka: 1250,
    budget: 1305,
    cost: 1100,
    margin: 12.0,
  },
  {
    name: "新宿再開発ビル",
    contract: 6500,
    dekidaka: 1200,
    budget: 5525,
    cost: 1020,
    margin: 15.0,
  },
  {
    name: "川崎物流センター",
    contract: 3200,
    dekidaka: 1760,
    budget: 2720,
    cost: 1585,
    margin: 9.9,
  },
];

function LedgerPanel() {
  return (
    <div style={panelStyle}>
      <PanelHeader title="工事台帳" desc="工事別損益・出来高・原価の統合台帳" />
      <div style={CARD}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.5fr 90px 90px 90px 90px 70px",
            gap: 12,
            padding: "10px 16px",
            borderBottom: `1px solid ${BORDER}`,
            fontSize: 11,
            fontWeight: 600,
            color: T_FAINT,
          }}
        >
          <span>工事名</span>
          <span>契約額</span>
          <span>出来高</span>
          <span>実行予算</span>
          <span>実績原価</span>
          <span>粗利率</span>
        </div>
        {ledgerData.map((p) => (
          <div
            key={p.name}
            style={{
              display: "grid",
              gridTemplateColumns: "1.5fr 90px 90px 90px 90px 70px",
              gap: 12,
              padding: "12px 16px",
              alignItems: "center",
              borderBottom: `1px solid ${BORDER_LIGHT}`,
              fontSize: 12,
            }}
          >
            <span style={{ fontWeight: 500, color: T_HEADING }}>{p.name}</span>
            <span style={{ fontFamily: MONO, fontSize: 11 }}>
              {p.contract.toLocaleString()}
            </span>
            <span style={{ fontFamily: MONO, fontSize: 11 }}>
              {p.dekidaka.toLocaleString()}
            </span>
            <span style={{ fontFamily: MONO, fontSize: 11 }}>
              {p.budget.toLocaleString()}
            </span>
            <span style={{ fontFamily: MONO, fontSize: 11 }}>
              {p.cost.toLocaleString()}
            </span>
            <span
              style={{
                fontWeight: 600,
                color:
                  p.margin < 12 ? C_RED : p.margin < 14 ? C_ORANGE : C_GREEN,
              }}
            >
              {p.margin}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── BIレポート (faithful — レポートカード4件 hsl グラデ) ──────────────────────
const biReports = [
  "売上推移レポート",
  "原価分析レポート",
  "受注状況レポート",
  "安全管理レポート",
];

function BiPanel() {
  return (
    <div style={panelStyle}>
      <PanelHeader title="BIレポート" desc="経営分析・BI可視化ダッシュボード" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {biReports.map((r, i) => (
          <div
            key={r}
            style={{
              ...CARD,
              padding: 0,
              cursor: "pointer",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: 140,
                background: `hsl(${210 + i * 25},20%,92%)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <BarChart3 style={{ width: 36, height: 36, color: T_FAINT }} aria-hidden="true" />
            </div>
            <div style={{ padding: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: T_HEADING }}>
                {r}
              </div>
              <div style={{ fontSize: 11, color: T_MUTED, marginTop: 3 }}>
                最終更新: 2026/05/24
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Panel registry (TABS と同順) ────────────────────────────────────────────
const PANELS: Record<TabId, ComponentType> = {
  cost: CostPanel,
  budget: BudgetPanel,
  contract: ContractPanel,
  purchase: PurchasePanel,
  sales: SalesPanel,
  labor: LaborPanel,
  stock: StockPanel,
  ledger: LedgerPanel,
  bi: BiPanel,
};

export function ERPDesignView({ subPath }: { subPath?: string }) {
  const [activeTab, setActiveTab] = useState<TabId>(
    (subPath && tabFromPath[subPath]) || "cost",
  );

  useEffect(() => {
    if (subPath && tabFromPath[subPath]) setActiveTab(tabFromPath[subPath]);
  }, [subPath]);

  const activeIndex = Math.max(
    0,
    TABS.findIndex((t) => t.id === activeTab),
  );
  const panelsRef = useRef<HTMLDivElement>(null);
  // a11y: keep off-screen (inactive) slide panels out of tab order / SR tree
  useEffect(() => {
    const kids = panelsRef.current?.children;
    if (!kids) return;
    Array.from(kids).forEach((el, i) => {
      const panel = el as HTMLElement;
      panel.inert = i !== activeIndex;
      panel.setAttribute("aria-hidden", String(i !== activeIndex));
    });
  }, [activeIndex]);

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <h1
          style={{ fontSize: 20, fontWeight: 700, color: T_HEADING, margin: 0 }}
        >
          ERP・経営管理
        </h1>
        <p style={{ fontSize: 12, color: T_MUTED, marginTop: 2 }}>
          原価・予算・契約・購買・売上・労務・在庫・工事台帳・BIレポート
        </p>
      </div>

      <div style={CARD}>
        {/* Tab bar */}
        <div
          style={{
            display: "flex",
            borderBottom: `1px solid ${BORDER}`,
            padding: "0 8px",
            overflowX: "auto",
          }}
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                padding: "12px 16px",
                fontSize: 12,
                fontWeight: activeTab === t.id ? 600 : 400,
                color: activeTab === t.id ? C_BLUE : T_MUTED,
                cursor: "pointer",
                whiteSpace: "nowrap",
                background: "none",
                border: "none",
                borderBottom:
                  activeTab === t.id
                    ? `2px solid ${C_BLUE}`
                    : "2px solid transparent",
                fontFamily: "inherit",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Sliding panels */}
        <div style={{ overflow: "hidden" }}>
          <div
            ref={panelsRef}
            style={{
              display: "flex",
              transition: "transform 0.35s cubic-bezier(.4,0,.2,1)",
              transform: `translateX(-${activeIndex * 100}%)`,
            }}
          >
            {TABS.map((t) => {
              const Panel = PANELS[t.id];
              return <Panel key={t.id} />;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
