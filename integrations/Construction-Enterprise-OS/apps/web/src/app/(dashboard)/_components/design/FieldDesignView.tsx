"use client";

import { useEffect, useRef, useState } from "react";
import {
  Camera,
  Filter,
  Plus,
  Shield,
  AlertTriangle,
  CheckCircle2,
  X,
  Users,
  Activity,
  Eye,
  type LucideIcon,
} from "lucide-react";
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
// Claude Design — 現場DX (faithful port of page-field-sub.jsx + page-field-dx.jsx)
// SlideTabPanel replaced with an inline translateX slide. Covers all sub-items:
// 工事一覧 / 現場進捗 / 工程管理 / 作業日報 / 現場写真 / 出来形管理 /
// 安全管理 / KY活動 / 重機管理 / 作業員管理 / 現場ライブビュー
// Sub-view tabs (progress…live) mirror page-field-sub.jsx 1:1 (data + structure).
// ────────────────────────────────────────────────────────────────────────────

type TabId =
  | "projects"
  | "progress"
  | "schedule"
  | "daily"
  | "photos"
  | "measure"
  | "safety"
  | "ky"
  | "equipment"
  | "workers"
  | "live";

const TABS: { id: TabId; label: string }[] = [
  { id: "projects", label: "工事一覧" },
  { id: "progress", label: "現場進捗" },
  { id: "schedule", label: "工程管理" },
  { id: "daily", label: "作業日報" },
  { id: "photos", label: "現場写真" },
  { id: "measure", label: "出来形管理" },
  { id: "safety", label: "安全管理" },
  { id: "ky", label: "KY活動" },
  { id: "equipment", label: "重機管理" },
  { id: "workers", label: "作業員管理" },
  { id: "live", label: "現場ライブビュー" },
];

const tabFromPath: Record<string, TabId> = {
  "/field/projects": "projects",
  "/field/progress": "progress",
  "/field/schedule": "schedule",
  "/field/daily": "daily",
  "/field/photos": "photos",
  "/field/measure": "measure",
  "/field/safety": "safety",
  "/field/ky": "ky",
  "/field/equipment": "equipment",
  "/field/workers": "workers",
  "/field/live": "live",
};

// ── Semantic colors (hardcoded by design spec) ──────────────────────────────
const C_BLUE = "#1a56db";
const C_GREEN = "#16a34a";
const C_RED = "#dc2626";
const C_ORANGE = "#f97316";
const C_PURPLE = "#7c3aed";

// ── 工事一覧 data (page-field-dx.jsx faithful) ──────────────────────────────
const sites = [
  {
    name: "品川タワー新築工事",
    client: "品川都市開発(株)",
    type: "建築",
    period: "2025/04 〜 2027/03",
    progress: 68,
    status: "施工中",
    workers: 45,
    equipment: 8,
    weather: "晴れ 32°C",
  },
  {
    name: "横浜分譲マンション",
    client: "横浜住宅(株)",
    type: "建築",
    period: "2025/06 〜 2027/09",
    progress: 42,
    status: "施工中",
    workers: 32,
    equipment: 5,
    weather: "曇り 28°C",
  },
  {
    name: "大田区土木工事",
    client: "大田区役所",
    type: "土木",
    period: "2025/01 〜 2026/08",
    progress: 85,
    status: "施工中",
    workers: 18,
    equipment: 4,
    weather: "晴れ 30°C",
  },
  {
    name: "新宿再開発ビル",
    client: "新宿開発機構",
    type: "建築",
    period: "2025/09 〜 2028/02",
    progress: 23,
    status: "施工中",
    workers: 28,
    equipment: 6,
    weather: "晴れ 31°C",
  },
];
const typeColor: Record<string, string> = {
  建築: C_BLUE,
  土木: C_ORANGE,
  港湾: C_PURPLE,
};

// ── 現場進捗 (default) — page-field-sub.jsx faithful (7 projects) ────────────
const progressProjects = [
  {
    name: "品川タワー新築工事",
    client: "品川都市開発(株)",
    progress: 68,
    status: "施工中",
    workers: 45,
    phase: "躯体工事",
  },
  {
    name: "横浜分譲マンション",
    client: "横浜住宅(株)",
    progress: 42,
    status: "施工中",
    workers: 32,
    phase: "躯体工事",
  },
  {
    name: "大田区土木工事",
    client: "大田区",
    progress: 85,
    status: "仕上げ",
    workers: 18,
    phase: "舗装工事",
  },
  {
    name: "新宿再開発ビル",
    client: "新宿都市開発(株)",
    progress: 23,
    status: "基礎",
    workers: 28,
    phase: "基礎工事",
  },
  {
    name: "川崎物流センター",
    client: "川崎ロジ(株)",
    progress: 55,
    status: "躯体",
    workers: 38,
    phase: "鉄骨建方",
  },
  {
    name: "千葉港湾整備",
    client: "千葉県",
    progress: 35,
    status: "施工中",
    workers: 22,
    phase: "ケーソン据付",
  },
  {
    name: "埼玉道路改修",
    client: "埼玉県",
    progress: 60,
    status: "施工中",
    workers: 15,
    phase: "切削オーバーレイ",
  },
];

// ── 工程管理 — page-field-sub.jsx gantt items (faithful) ─────────────────────
const ganttItems = [
  { name: "基礎工事", start: 0, end: 20, progress: 100, color: C_GREEN },
  {
    name: "躯体工事（1-3F）",
    start: 15,
    end: 35,
    progress: 100,
    color: C_GREEN,
  },
  { name: "躯体工事（4-7F）", start: 30, end: 55, progress: 75, color: C_BLUE },
  {
    name: "躯体工事（8-12F）",
    start: 50,
    end: 75,
    progress: 10,
    color: C_ORANGE,
  },
  { name: "外装工事", start: 45, end: 80, progress: 5, color: C_ORANGE },
  {
    name: "設備工事（電気）",
    start: 40,
    end: 85,
    progress: 15,
    color: C_PURPLE,
  },
  {
    name: "設備工事（機械）",
    start: 45,
    end: 85,
    progress: 10,
    color: C_PURPLE,
  },
  { name: "内装工事", start: 60, end: 90, progress: 0, color: "#94a3b8" },
  { name: "外構工事", start: 80, end: 95, progress: 0, color: "#94a3b8" },
  { name: "検査・引渡し", start: 90, end: 100, progress: 0, color: "#94a3b8" },
];
const ganttMonths = [
  "4月",
  "5月",
  "6月",
  "7月",
  "8月",
  "9月",
  "10月",
  "11月",
  "12月",
  "1月",
  "2月",
  "3月",
];

// ── 作業日報 — page-field-sub.jsx reports (faithful) ─────────────────────────
const dailyReports = [
  {
    date: "2026/05/24",
    site: "品川タワー",
    author: "田中 健一",
    workers: 45,
    weather: "晴れ",
    status: "作成中",
    tasks: "7F鉄骨建方、5Fコンクリート打設、6F配筋検査",
  },
  {
    date: "2026/05/23",
    site: "品川タワー",
    author: "田中 健一",
    workers: 42,
    weather: "曇り",
    status: "承認済",
    tasks: "6F鉄骨建方完了、5F型枠、安全パトロール",
  },
  {
    date: "2026/05/22",
    site: "品川タワー",
    author: "田中 健一",
    workers: 44,
    weather: "晴れ",
    status: "承認済",
    tasks: "6F鉄骨建方、4F内装準備、資材搬入",
  },
  {
    date: "2026/05/24",
    site: "横浜マンション",
    author: "渡辺 誠",
    workers: 32,
    weather: "曇り",
    status: "承認待ち",
    tasks: "3F型枠組立、2F配筋、足場点検",
  },
];

// ── 現場写真 — page-field-sub.jsx photos (faithful) ──────────────────────────
const photos = [
  {
    name: "7F鉄骨建方_正面",
    date: "2026/05/24 09:15",
    tags: ["躯体", "鉄骨", "7F"],
    author: "田中",
  },
  {
    name: "コンクリート打設_5F",
    date: "2026/05/24 10:30",
    tags: ["躯体", "コンクリ", "5F"],
    author: "佐藤",
  },
  {
    name: "配筋検査_6F_全景",
    date: "2026/05/23 14:00",
    tags: ["検査", "配筋", "6F"],
    author: "山田",
  },
  {
    name: "足場設置状況_西面",
    date: "2026/05/23 11:20",
    tags: ["安全", "足場"],
    author: "鈴木",
  },
  {
    name: "資材搬入_鉄骨",
    date: "2026/05/22 08:45",
    tags: ["資材", "鉄骨"],
    author: "田中",
  },
  {
    name: "クレーン作業_全景",
    date: "2026/05/22 09:30",
    tags: ["重機", "クレーン"],
    author: "渡辺",
  },
  {
    name: "安全パトロール_指摘箇所",
    date: "2026/05/21 15:00",
    tags: ["安全", "パトロール"],
    author: "佐藤",
  },
  {
    name: "出来形測定_柱",
    date: "2026/05/21 13:30",
    tags: ["出来形", "柱", "6F"],
    author: "山田",
  },
];

// ── 出来形管理 — page-field-sub.jsx measurements (faithful) ──────────────────
const measurements = [
  {
    item: "柱 C1（6F）",
    design: "600×600",
    actual: "601×599",
    diff: "+1/-1",
    result: "合格",
  },
  {
    item: "梁 G1（6F）",
    design: "400×800",
    actual: "399×801",
    diff: "-1/+1",
    result: "合格",
  },
  {
    item: "スラブ厚（5F）",
    design: "200mm",
    actual: "202mm",
    diff: "+2",
    result: "合格",
  },
  {
    item: "壁厚（5F）",
    design: "180mm",
    actual: "179mm",
    diff: "-1",
    result: "合格",
  },
  {
    item: "鉄骨柱傾き",
    design: "1/1000以下",
    actual: "1/1500",
    diff: "—",
    result: "合格",
  },
  {
    item: "アンカーボルト位置",
    design: "±5mm",
    actual: "+3mm",
    diff: "+3",
    result: "合格",
  },
];

// ── 安全管理 — page-field-sub.jsx KPIs + patrols (faithful) ───────────────────
const safetyKpis: {
  label: string;
  value: string;
  icon: LucideIcon;
  color: string;
  bg: string;
}[] = [
  {
    label: "本月パトロール",
    value: "18",
    icon: Shield,
    color: C_BLUE,
    bg: "#eff6ff",
  },
  {
    label: "指摘件数",
    value: "12",
    icon: AlertTriangle,
    color: C_ORANGE,
    bg: "#fff7ed",
  },
  {
    label: "是正完了",
    value: "10",
    icon: CheckCircle2,
    color: C_GREEN,
    bg: "#f0fdf4",
  },
  { label: "重大指摘", value: "1", icon: X, color: C_RED, bg: "#fef2f2" },
];
const patrols = [
  {
    date: "2026/05/24",
    inspector: "佐藤 太郎",
    site: "品川タワー",
    findings: 2,
    critical: 0,
    status: "完了",
  },
  {
    date: "2026/05/23",
    inspector: "佐藤 太郎",
    site: "横浜マンション",
    findings: 3,
    critical: 1,
    status: "是正中",
  },
  {
    date: "2026/05/22",
    inspector: "鈴木 一郎",
    site: "川崎物流",
    findings: 1,
    critical: 0,
    status: "完了",
  },
  {
    date: "2026/05/21",
    inspector: "佐藤 太郎",
    site: "新宿再開発",
    findings: 0,
    critical: 0,
    status: "完了",
  },
];

// ── KY活動 — page-field-sub.jsx ky records (faithful) ────────────────────────
const kyRecords = [
  {
    date: "2026/05/24",
    team: "鉄骨建方班",
    hazard: "高所作業・クレーン吊り荷",
    measures: "安全帯装着確認・合図者配置",
    participants: 8,
  },
  {
    date: "2026/05/24",
    team: "コンクリ班",
    hazard: "コンクリート打設・ポンプ車",
    measures: "打設範囲立入禁止・保護具着用",
    participants: 12,
  },
  {
    date: "2026/05/24",
    team: "配筋班",
    hazard: "重量物運搬・鉄筋切断",
    measures: "保護手袋着用・2人作業",
    participants: 6,
  },
  {
    date: "2026/05/24",
    team: "足場班",
    hazard: "足場組立・落下防止",
    measures: "親綱設置・安全帯使用",
    participants: 5,
  },
];

// ── 重機管理 — page-field-sub.jsx equipment (faithful, 8台) ──────────────────
const equipment = [
  {
    name: "タワークレーン TC-1200",
    site: "品川タワー",
    status: "稼働中",
    hours: "1,842h",
    nextInsp: "2026/06/15",
    operator: "吉田",
  },
  {
    name: "ラフタークレーン 25t",
    site: "品川タワー",
    status: "稼働中",
    hours: "956h",
    nextInsp: "2026/07/01",
    operator: "木村",
  },
  {
    name: "コンクリートポンプ車",
    site: "品川タワー",
    status: "稼働中",
    hours: "678h",
    nextInsp: "2026/06/20",
    operator: "松田",
  },
  {
    name: "バックホウ 0.7m³",
    site: "大田区土木",
    status: "待機",
    hours: "2,340h",
    nextInsp: "2026/06/01",
    operator: "—",
  },
  {
    name: "ブルドーザ D61",
    site: "大田区土木",
    status: "AI自動運転",
    hours: "1,120h",
    nextInsp: "2026/06/10",
    operator: "AI制御",
  },
  {
    name: "振動ローラ BW213",
    site: "大田区土木",
    status: "待機",
    hours: "890h",
    nextInsp: "2026/07/15",
    operator: "—",
  },
  {
    name: "ラフタークレーン 50t",
    site: "川崎物流",
    status: "稼働中",
    hours: "1,560h",
    nextInsp: "2026/06/05",
    operator: "高橋",
  },
  {
    name: "フォークリフト 3t",
    site: "川崎物流",
    status: "稼働中",
    hours: "420h",
    nextInsp: "2026/08/01",
    operator: "中村",
  },
];
const equipColor: Record<string, string> = {
  稼働中: C_GREEN,
  待機: "#94a3b8",
  AI自動運転: C_PURPLE,
};

// ── 作業員管理 — page-field-sub.jsx workers (faithful, 6名) ──────────────────
const workerKpis: {
  label: string;
  value: string;
  icon: LucideIcon;
  color: string;
  bg: string;
}[] = [
  {
    label: "本日入場者",
    value: "186",
    icon: Users,
    color: C_BLUE,
    bg: "#eff6ff",
  },
  {
    label: "作業中",
    value: "158",
    icon: Activity,
    color: C_GREEN,
    bg: "#f0fdf4",
  },
  {
    label: "資格切れ注意",
    value: "3",
    icon: AlertTriangle,
    color: C_ORANGE,
    bg: "#fff7ed",
  },
];
const workers = [
  {
    name: "中村 太郎",
    company: "(株)中村建設",
    trade: "鉄骨工",
    site: "品川タワー",
    entry: "07:45",
    status: "作業中",
    cert: ["玉掛け", "鉄骨組立"],
  },
  {
    name: "佐々木 健",
    company: "(株)佐々木電気",
    trade: "電気工",
    site: "品川タワー",
    entry: "07:50",
    status: "作業中",
    cert: ["電気工事士"],
  },
  {
    name: "山本 一郎",
    company: "山本配管工業",
    trade: "配管工",
    site: "横浜マンション",
    entry: "07:55",
    status: "作業中",
    cert: ["配管技能"],
  },
  {
    name: "木村 大輔",
    company: "関東足場(株)",
    trade: "足場工",
    site: "品川タワー",
    entry: "08:10",
    status: "作業中",
    cert: ["足場組立", "高所作業"],
  },
  {
    name: "松田 誠",
    company: "(株)中村建設",
    trade: "型枠工",
    site: "横浜マンション",
    entry: "08:00",
    status: "休憩中",
    cert: ["型枠施工"],
  },
  {
    name: "高橋 隆",
    company: "(株)東京クレーン",
    trade: "オペレーター",
    site: "川崎物流",
    entry: "07:30",
    status: "作業中",
    cert: ["移動式クレーン"],
  },
];

// ── 現場ライブビュー — page-field-sub.jsx cameras (faithful, 4台 2x2) ─────────
const cameras = [
  {
    name: "品川タワー 全景カメラ",
    location: "北東角 40m",
    status: "live",
    fps: 30,
  },
  {
    name: "品川タワー 7F作業エリア",
    location: "7F南面",
    status: "live",
    fps: 15,
  },
  {
    name: "横浜マンション 全景",
    location: "南側 30m",
    status: "live",
    fps: 30,
  },
  {
    name: "川崎物流 ヤード",
    location: "管理棟屋上",
    status: "offline",
    fps: 0,
  },
];

// ── Layout primitives (faithful style language) ─────────────────────────────
const panelStyle: React.CSSProperties = {
  minWidth: "100%",
  flexShrink: 0,
  padding: 20,
};

function PanelHeading({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: T_HEADING }}>
        {title}
      </div>
      {sub && (
        <div style={{ fontSize: 12, color: T_MUTED, marginTop: 3 }}>{sub}</div>
      )}
    </div>
  );
}

function MetricRow({
  items,
}: {
  items: { l: string; v: string; c: string; s?: string }[];
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${items.length}, 1fr)`,
        gap: 12,
        marginBottom: 16,
      }}
    >
      {items.map((m) => (
        <div
          key={m.l}
          style={{
            padding: 14,
            borderRadius: 8,
            background: SUBTLE_BG,
            border: `1px solid ${BORDER}`,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 700, color: m.c }}>{m.v}</div>
          <div style={{ fontSize: 11, color: T_MUTED, marginTop: 2 }}>
            {m.l}
            {m.s ? ` · ${m.s}` : ""}
          </div>
        </div>
      ))}
    </div>
  );
}

// KPI card with leading icon tile (faithful to page-field-sub safety/workers KPIs)
function IconKpiCard({
  kpi,
}: {
  kpi: {
    label: string;
    value: string;
    icon: LucideIcon;
    color: string;
    bg: string;
  };
}) {
  const Ico = kpi.icon;
  return (
    <div
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
          background: kpi.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ico size={16} style={{ color: kpi.color }} />
      </div>
      <div>
        <div style={{ fontSize: 10, color: T_FAINT }}>{kpi.label}</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: T_HEADING }}>
          {kpi.value}
        </div>
      </div>
    </div>
  );
}

export function FieldDesignView({ subPath }: { subPath?: string }) {
  const [activeTab, setActiveTab] = useState<TabId>(
    (subPath && tabFromPath[subPath]) || "projects",
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
          現場DX
        </h1>
        <p style={{ fontSize: 12, color: T_MUTED, marginTop: 2 }}>
          工事管理・進捗・工程・日報・写真・出来形・安全・KY・重機・作業員・ライブ
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
            {/* ── 工事一覧 (page-field-dx faithful) ──────────────────────────── */}
            <div style={panelStyle}>
              <PanelHeading
                title={`工事一覧 (${sites.length}件)`}
                sub="施工中の全工事と稼働状況"
              />
              <MetricRow
                items={[
                  { l: "稼働工事", v: `${sites.length}`, c: C_BLUE },
                  {
                    l: "作業員合計",
                    v: `${sites.reduce((a, s) => a + s.workers, 0)}名`,
                    c: C_PURPLE,
                  },
                  {
                    l: "重機合計",
                    v: `${sites.reduce((a, s) => a + s.equipment, 0)}台`,
                    c: C_ORANGE,
                  },
                  {
                    l: "平均進捗",
                    v: `${Math.round(sites.reduce((a, s) => a + s.progress, 0) / sites.length)}%`,
                    c: C_GREEN,
                  },
                ]}
              />
              {sites.map((s) => (
                <div
                  key={s.name}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 8,
                    marginBottom: 8,
                    background: SUBTLE_BG,
                    border: `1px solid ${BORDER_LIGHT}`,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: typeColor[s.type],
                      }}
                    />
                    <span
                      style={{
                        flex: 1,
                        fontSize: 13,
                        fontWeight: 600,
                        color: T_BODY,
                      }}
                    >
                      {s.name}
                    </span>
                    <span style={{ fontSize: 11, color: T_MUTED }}>
                      {s.type}
                    </span>
                    <span
                      style={{ fontSize: 11, fontWeight: 600, color: C_BLUE }}
                    >
                      {s.progress}%
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 14,
                      marginTop: 6,
                      fontSize: 11,
                      color: T_MUTED,
                    }}
                  >
                    <span>{s.client}</span>
                    <span>{s.period}</span>
                    <span>{s.workers}名</span>
                    <span>重機{s.equipment}台</span>
                    <span>{s.weather}</span>
                  </div>
                  <div
                    style={{
                      height: 4,
                      background: BORDER,
                      borderRadius: 2,
                      overflow: "hidden",
                      marginTop: 8,
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${s.progress}%`,
                        borderRadius: 2,
                        background: s.progress > 70 ? C_GREEN : C_BLUE,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* ── 現場進捗 (page-field-sub default, 7 projects faithful) ──────── */}
            <div style={panelStyle}>
              <PanelHeading title="現場進捗" sub="全工事の進捗状況一覧" />
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {progressProjects.map((p) => (
                  <div
                    key={p.name}
                    style={{
                      ...CARD,
                      padding: 16,
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: T_HEADING,
                        }}
                      >
                        {p.name}
                      </div>
                      <div
                        style={{ fontSize: 11, color: T_MUTED, marginTop: 2 }}
                      >
                        {p.client} · {p.phase} · {p.workers}名
                      </div>
                    </div>
                    <div style={{ width: 200 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 11,
                          marginBottom: 4,
                        }}
                      >
                        <span style={{ color: T_FAINT }}>{p.status}</span>
                        <span style={{ fontWeight: 600, color: C_BLUE }}>
                          {p.progress}%
                        </span>
                      </div>
                      <div
                        style={{
                          height: 6,
                          background: BORDER,
                          borderRadius: 3,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${p.progress}%`,
                            borderRadius: 3,
                            background: p.progress > 70 ? C_GREEN : C_BLUE,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── 工程管理 (page-field-sub gantt faithful) ───────────────────── */}
            <div style={panelStyle}>
              <PanelHeading
                title="工程管理"
                sub="ガントチャート・マイルストーン管理"
              />
              <div style={CARD}>
                <div
                  style={{
                    padding: "14px 16px",
                    borderBottom: `1px solid ${BORDER}`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{ fontSize: 14, fontWeight: 700, color: T_HEADING }}
                  >
                    品川タワー新築工事 — 全体工程表
                  </span>
                  <div style={{ display: "flex", gap: 6 }}>
                    {["日", "週", "月"].map((u) => (
                      <button
                        key={u}
                        style={{
                          padding: "3px 10px",
                          borderRadius: 4,
                          border: "none",
                          background: u === "月" ? C_BLUE : BORDER_LIGHT,
                          color: u === "月" ? "#fff" : T_MUTED,
                          fontSize: 11,
                          cursor: "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ padding: 16, overflowX: "auto" }}>
                  {/* Month headers */}
                  <div
                    style={{
                      display: "flex",
                      marginLeft: 160,
                      marginBottom: 8,
                    }}
                  >
                    {ganttMonths.map((m) => (
                      <div
                        key={m}
                        style={{
                          width: 60,
                          fontSize: 10,
                          color: T_FAINT,
                          textAlign: "center",
                          borderLeft: `1px solid ${BORDER_LIGHT}`,
                        }}
                      >
                        {m}
                      </div>
                    ))}
                  </div>
                  {ganttItems.map((g, i) => (
                    <div
                      key={g.name}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        marginBottom: 6,
                      }}
                    >
                      <div
                        style={{
                          width: 160,
                          fontSize: 12,
                          color: "#374151",
                          fontWeight: 500,
                          flexShrink: 0,
                          paddingRight: 12,
                        }}
                      >
                        {g.name}
                      </div>
                      <div
                        style={{
                          flex: 1,
                          height: 20,
                          position: "relative",
                          background: SUBTLE_BG,
                          borderRadius: 4,
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            left: `${g.start}%`,
                            width: `${g.end - g.start}%`,
                            height: "100%",
                            borderRadius: 4,
                            background: g.color + "25",
                            border: `1px solid ${g.color}40`,
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${g.progress}%`,
                              background: g.color,
                              borderRadius: 3,
                              transition: "width 0.5s",
                            }}
                          />
                        </div>
                        {/* Today marker */}
                        {i === 0 && (
                          <div
                            style={{
                              position: "absolute",
                              left: "58%",
                              top: -4,
                              bottom: -4,
                              width: 2,
                              background: C_RED,
                              zIndex: 2,
                            }}
                          >
                            <div
                              style={{
                                position: "absolute",
                                top: -6,
                                left: -8,
                                fontSize: 8,
                                color: C_RED,
                                fontWeight: 700,
                              }}
                            >
                              今日
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── 作業日報 (page-field-sub reports faithful) ─────────────────── */}
            <div style={panelStyle}>
              <PanelHeading title="作業日報" sub="日報の作成・確認・承認" />
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <button
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: "none",
                    background: C_BLUE,
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Plus size={14} aria-hidden="true" />
                  本日の日報を作成
                </button>
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {dailyReports.map((r) => (
                  <div
                    key={`${r.site}-${r.date}`}
                    style={{ ...CARD, padding: 16 }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 8,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: T_HEADING,
                          }}
                        >
                          {r.site}
                        </span>
                        <span style={{ fontSize: 11, color: T_FAINT }}>
                          {r.date}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: 10,
                          background:
                            r.status === "承認済"
                              ? "#dcfce7"
                              : r.status === "承認待ち"
                                ? "#fff7ed"
                                : "#dbeafe",
                          color:
                            r.status === "承認済"
                              ? "#166534"
                              : r.status === "承認待ち"
                                ? "#92400e"
                                : "#1e40af",
                        }}
                      >
                        {r.status}
                      </span>
                    </div>
                    <div
                      style={{ fontSize: 12, color: T_SECOND, marginBottom: 6 }}
                    >
                      {r.tasks}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 12,
                        fontSize: 10,
                        color: T_FAINT,
                      }}
                    >
                      <span>記入者: {r.author}</span>
                      <span>作業員: {r.workers}名</span>
                      <span>天候: {r.weather}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── 現場写真 (page-field-sub photos faithful) ──────────────────── */}
            <div style={panelStyle}>
              <PanelHeading
                title="現場写真"
                sub="工事写真の撮影・管理・AI分類"
              />
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <button
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: "none",
                    background: C_BLUE,
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Camera size={14} aria-hidden="true" />
                  写真アップロード
                </button>
                <button
                  style={{
                    padding: "8px 14px",
                    borderRadius: 8,
                    border: `1px solid ${BORDER}`,
                    background: "var(--bg-card, #fff)",
                    fontSize: 12,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    color: "#374151",
                  }}
                >
                  <Filter size={14} aria-hidden="true" />
                  フィルタ
                </button>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                  gap: 14,
                }}
              >
                {photos.map((p, i) => (
                  <div
                    key={p.name}
                    style={{ ...CARD, padding: 0, overflow: "hidden" }}
                  >
                    <div
                      style={{
                        height: 140,
                        background: `hsl(${(i * 47) % 360}, 15%, ${85 + (i % 3)}%)`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Camera size={32} style={{ color: T_FAINT }} />
                    </div>
                    <div style={{ padding: 12 }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: T_HEADING,
                        }}
                      >
                        {p.name}
                      </div>
                      <div
                        style={{ fontSize: 10, color: T_FAINT, marginTop: 3 }}
                      >
                        {p.date} · {p.author}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: 4,
                          marginTop: 6,
                          flexWrap: "wrap",
                        }}
                      >
                        {p.tags.map((t) => (
                          <span
                            key={t}
                            style={{
                              fontSize: 9,
                              padding: "1px 6px",
                              borderRadius: 4,
                              background: "#eff6ff",
                              color: C_BLUE,
                              fontWeight: 500,
                            }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── 出来形管理 (page-field-sub measurements faithful) ──────────── */}
            <div style={panelStyle}>
              <PanelHeading
                title="出来形管理"
                sub="設計値と実測値の照合・品質管理"
              />
              <div style={CARD}>
                <div
                  style={{
                    padding: "14px 16px",
                    borderBottom: `1px solid ${BORDER}`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{ fontSize: 14, fontWeight: 700, color: T_HEADING }}
                  >
                    出来形測定結果 — 品川タワー
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      padding: "3px 8px",
                      borderRadius: 10,
                      background: "#dcfce7",
                      color: "#166534",
                      fontWeight: 600,
                    }}
                  >
                    全項目合格
                  </span>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.5fr 100px 100px 80px 70px",
                    gap: 12,
                    padding: "10px 16px",
                    borderBottom: `1px solid ${BORDER}`,
                    fontSize: 11,
                    fontWeight: 600,
                    color: T_FAINT,
                  }}
                >
                  <span>測定項目</span>
                  <span>設計値</span>
                  <span>実測値</span>
                  <span>差分</span>
                  <span>判定</span>
                </div>
                {measurements.map((m, i) => (
                  <div
                    key={m.item}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1.5fr 100px 100px 80px 70px",
                      gap: 12,
                      padding: "12px 16px",
                      alignItems: "center",
                      borderBottom:
                        i < measurements.length - 1
                          ? `1px solid ${BORDER_LIGHT}`
                          : "none",
                      fontSize: 12,
                    }}
                  >
                    <span style={{ fontWeight: 500, color: T_HEADING }}>
                      {m.item}
                    </span>
                    <span
                      style={{ fontFamily: MONO, fontSize: 11, color: T_MUTED }}
                    >
                      {m.design}
                    </span>
                    <span
                      style={{
                        fontFamily: MONO,
                        fontSize: 11,
                        color: T_HEADING,
                        fontWeight: 500,
                      }}
                    >
                      {m.actual}
                    </span>
                    <span
                      style={{ fontFamily: MONO, fontSize: 11, color: T_MUTED }}
                    >
                      {m.diff}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: C_GREEN,
                        background: "#dcfce7",
                        padding: "2px 8px",
                        borderRadius: 10,
                        textAlign: "center",
                      }}
                    >
                      {m.result}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── 安全管理 (page-field-sub KPIs + patrols faithful) ──────────── */}
            <div style={panelStyle}>
              <PanelHeading
                title="安全管理"
                sub="安全パトロール・ヒヤリハット・是正管理"
              />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4,1fr)",
                  gap: 14,
                  marginBottom: 20,
                }}
              >
                {safetyKpis.map((s) => (
                  <IconKpiCard key={s.label} kpi={s} />
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
                  安全パトロール記録
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "100px 1fr 1fr 80px 70px 70px",
                    gap: 12,
                    padding: "10px 16px",
                    borderBottom: `1px solid ${BORDER}`,
                    fontSize: 11,
                    fontWeight: 600,
                    color: T_FAINT,
                  }}
                >
                  <span>日付</span>
                  <span>点検者</span>
                  <span>現場</span>
                  <span>指摘</span>
                  <span>重大</span>
                  <span>状態</span>
                </div>
                {patrols.map((p, i) => (
                  <div
                    key={`${p.site}-${p.date}`}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "100px 1fr 1fr 80px 70px 70px",
                      gap: 12,
                      padding: "12px 16px",
                      alignItems: "center",
                      borderBottom:
                        i < patrols.length - 1
                          ? `1px solid ${BORDER_LIGHT}`
                          : "none",
                      fontSize: 12,
                    }}
                  >
                    <span style={{ color: T_MUTED, fontSize: 11 }}>
                      {p.date}
                    </span>
                    <span style={{ fontWeight: 500, color: T_HEADING }}>
                      {p.inspector}
                    </span>
                    <span style={{ color: T_MUTED }}>{p.site}</span>
                    <span
                      style={{
                        fontWeight: 600,
                        color: p.findings > 0 ? C_ORANGE : C_GREEN,
                      }}
                    >
                      {p.findings}件
                    </span>
                    <span
                      style={{
                        fontWeight: 600,
                        color: p.critical > 0 ? C_RED : C_GREEN,
                      }}
                    >
                      {p.critical}件
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: 10,
                        background: p.status === "完了" ? "#dcfce7" : "#fff7ed",
                        color: p.status === "完了" ? "#166534" : "#92400e",
                      }}
                    >
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── KY活動 (page-field-sub 危険要因/対策 2-col faithful) ────────── */}
            <div style={panelStyle}>
              <PanelHeading title="KY活動" sub="危険予知活動の記録・管理" />
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {kyRecords.map((k) => (
                  <div key={k.team} style={{ ...CARD, padding: 16 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 10,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <Shield size={16} aria-hidden="true" style={{ color: C_ORANGE }} />
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: T_HEADING,
                          }}
                        >
                          {k.team}
                        </span>
                      </div>
                      <span style={{ fontSize: 11, color: T_FAINT }}>
                        {k.date} · {k.participants}名参加
                      </span>
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          padding: 12,
                          borderRadius: 8,
                          background: "#fef2f2",
                          border: "1px solid #fecaca",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            color: C_RED,
                            marginBottom: 4,
                          }}
                        >
                          危険要因
                        </div>
                        <div style={{ fontSize: 12, color: "#374151" }}>
                          {k.hazard}
                        </div>
                      </div>
                      <div
                        style={{
                          padding: 12,
                          borderRadius: 8,
                          background: "#f0fdf4",
                          border: "1px solid #bbf7d0",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            color: C_GREEN,
                            marginBottom: 4,
                          }}
                        >
                          対策
                        </div>
                        <div style={{ fontSize: 12, color: "#374151" }}>
                          {k.measures}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── 重機管理 (page-field-sub equipment faithful, 8台) ──────────── */}
            <div style={panelStyle}>
              <PanelHeading
                title="重機管理"
                sub="重機稼働状況・点検スケジュール・GPS位置"
              />
              <div style={CARD}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.5fr 1fr 90px 80px 100px 70px",
                    gap: 12,
                    padding: "10px 16px",
                    borderBottom: `1px solid ${BORDER}`,
                    fontSize: 11,
                    fontWeight: 600,
                    color: T_FAINT,
                  }}
                >
                  <span>重機名</span>
                  <span>現場</span>
                  <span>状態</span>
                  <span>稼働時間</span>
                  <span>次回点検</span>
                  <span>操縦者</span>
                </div>
                {equipment.map((e, i) => (
                  <div
                    key={e.name}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1.5fr 1fr 90px 80px 100px 70px",
                      gap: 12,
                      padding: "12px 16px",
                      alignItems: "center",
                      borderBottom:
                        i < equipment.length - 1
                          ? `1px solid ${BORDER_LIGHT}`
                          : "none",
                      fontSize: 12,
                    }}
                  >
                    <span style={{ fontWeight: 500, color: T_HEADING }}>
                      {e.name}
                    </span>
                    <span style={{ color: T_MUTED }}>{e.site}</span>
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 11,
                        color: equipColor[e.status] || T_MUTED,
                        fontWeight: 500,
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: equipColor[e.status] || T_MUTED,
                        }}
                      />
                      {e.status}
                    </span>
                    <span
                      style={{
                        fontFamily: MONO,
                        fontSize: 11,
                        color: "#374151",
                      }}
                    >
                      {e.hours}
                    </span>
                    <span style={{ fontSize: 11, color: T_MUTED }}>
                      {e.nextInsp}
                    </span>
                    <span style={{ color: T_MUTED }}>{e.operator}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── 作業員管理 (page-field-sub workers faithful, 6名) ──────────── */}
            <div style={panelStyle}>
              <PanelHeading
                title="作業員管理"
                sub="入退場・資格・配置の統合管理"
              />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3,1fr)",
                  gap: 14,
                  marginBottom: 20,
                }}
              >
                {workerKpis.map((s) => (
                  <IconKpiCard key={s.label} kpi={s} />
                ))}
              </div>
              <div style={CARD}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 80px 1fr 60px 70px 1.2fr",
                    gap: 8,
                    padding: "10px 16px",
                    borderBottom: `1px solid ${BORDER}`,
                    fontSize: 11,
                    fontWeight: 600,
                    color: T_FAINT,
                  }}
                >
                  <span>氏名</span>
                  <span>会社</span>
                  <span>職種</span>
                  <span>現場</span>
                  <span>入場</span>
                  <span>状態</span>
                  <span>保有資格</span>
                </div>
                {workers.map((w, i) => (
                  <div
                    key={w.name}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 80px 1fr 60px 70px 1.2fr",
                      gap: 8,
                      padding: "10px 16px",
                      alignItems: "center",
                      borderBottom:
                        i < workers.length - 1
                          ? `1px solid ${BORDER_LIGHT}`
                          : "none",
                      fontSize: 12,
                    }}
                  >
                    <span style={{ fontWeight: 500, color: T_HEADING }}>
                      {w.name}
                    </span>
                    <span style={{ color: T_MUTED, fontSize: 11 }}>
                      {w.company}
                    </span>
                    <span style={{ color: T_MUTED }}>{w.trade}</span>
                    <span style={{ color: T_MUTED, fontSize: 11 }}>
                      {w.site}
                    </span>
                    <span
                      style={{ fontFamily: MONO, fontSize: 10, color: T_MUTED }}
                    >
                      {w.entry}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: w.status === "作業中" ? C_GREEN : C_ORANGE,
                      }}
                    >
                      {w.status}
                    </span>
                    <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                      {w.cert.map((c) => (
                        <span
                          key={c}
                          style={{
                            fontSize: 9,
                            padding: "1px 5px",
                            borderRadius: 4,
                            background: "#eff6ff",
                            color: C_BLUE,
                          }}
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── 現場ライブビュー (page-field-sub cameras faithful, 4台 2x2) ── */}
            <div style={panelStyle}>
              <PanelHeading
                title="現場ライブビュー"
                sub="リアルタイム映像・タイムラプス"
              />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2,1fr)",
                  gap: 16,
                }}
              >
                {cameras.map((c) => (
                  <div
                    key={c.name}
                    style={{ ...CARD, padding: 0, overflow: "hidden" }}
                  >
                    <div
                      style={{
                        height: 220,
                        background: c.status === "live" ? "#0f172a" : "#1e293b",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                      }}
                    >
                      {c.status === "live" ? (
                        <>
                          <Eye size={40} style={{ color: "#334155" }} />
                          <span
                            style={{
                              position: "absolute",
                              top: 10,
                              left: 10,
                              fontSize: 10,
                              padding: "2px 8px",
                              borderRadius: 4,
                              background: C_RED,
                              color: "#fff",
                              fontWeight: 700,
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <span
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: "50%",
                                background: "#fff",
                                animation: "fieldPulse 2s infinite",
                              }}
                            />
                            LIVE
                          </span>
                          <span
                            style={{
                              position: "absolute",
                              bottom: 10,
                              right: 10,
                              fontSize: 9,
                              color: T_MUTED,
                            }}
                          >
                            {c.fps}fps
                          </span>
                        </>
                      ) : (
                        <span style={{ fontSize: 12, color: T_MUTED }}>
                          オフライン
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        padding: 12,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: T_HEADING,
                          }}
                        >
                          {c.name}
                        </div>
                        <div
                          style={{ fontSize: 10, color: T_FAINT, marginTop: 2 }}
                        >
                          {c.location}
                        </div>
                      </div>
                      <span
                        role="img"
                        aria-label={c.status === "live" ? "稼働中" : "オフライン"}
                        title={c.status === "live" ? "稼働中" : "オフライン"}
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: c.status === "live" ? C_GREEN : "#94a3b8",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <style>{`@keyframes fieldPulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
