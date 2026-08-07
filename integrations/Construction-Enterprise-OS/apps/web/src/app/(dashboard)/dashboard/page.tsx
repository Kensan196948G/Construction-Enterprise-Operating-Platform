"use client";

import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Brain,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import dynamic from "next/dynamic";

// Real OpenStreetMap construction-site map — client-only (Leaflet uses `window`).
const DashboardSiteMap = dynamic(
  () => import("@/components/dashboard/DashboardSiteMap"),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          height: 260,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f0f4f8",
          color: "#94a3b8",
          fontSize: 12,
        }}
      >
        地図を読み込み中…
      </div>
    ),
  },
);

// ────────────────────────────────────────────────────────────────────────────
// Claude Design — 全社統合ダッシュボード (DashAllView faithful port)
// Theme-aware: light = exact design colors, dark = via layout CSS variables.
// ────────────────────────────────────────────────────────────────────────────

type Stat = {
  label: string;
  value: string;
  trend: string;
  up: boolean;
  color: string;
  bg: string;
  icon: ComponentType<{ className?: string; style?: React.CSSProperties }>;
};

const stats: Stat[] = [
  {
    label: "進行中工事",
    value: "12",
    trend: "+2 今月",
    up: true,
    color: "#1a56db",
    bg: "#eff6ff",
    icon: ClipboardList,
  },
  {
    label: "要承認",
    value: "5",
    trend: "3件 期限切迫",
    up: false,
    color: "#f97316",
    bg: "#fff7ed",
    icon: CheckCircle2,
  },
  {
    label: "IoTアラート",
    value: "3",
    trend: "要対応",
    up: false,
    color: "#dc2626",
    bg: "#fef2f2",
    icon: AlertTriangle,
  },
  {
    label: "新着文書",
    value: "28",
    trend: "+8 今週",
    up: true,
    color: "#16a34a",
    bg: "#f0fdf4",
    icon: FileText,
  },
  {
    label: "本日作業員",
    value: "186",
    trend: "13現場稼働",
    up: true,
    color: "#7c3aed",
    bg: "#f5f3ff",
    icon: Users,
  },
  {
    label: "工程遅延",
    value: "2",
    trend: "品川・川崎",
    up: false,
    color: "#92400e",
    bg: "#fef3c7",
    icon: Clock,
  },
];

type Activity = {
  action: string;
  project: string;
  time: string;
  type: keyof typeof typeColors;
};

const typeColors = {
  safety: "#f97316",
  approval: "#1a56db",
  document: "#16a34a",
  check: "#7c3aed",
  alert: "#dc2626",
} as const;

const activities: Activity[] = [
  {
    action: "安全パトロール報告書が提出されました",
    project: "品川タワー新築工事",
    time: "10分前",
    type: "safety",
  },
  {
    action: "工程会議議事録の承認依頼",
    project: "横浜分譲マンション",
    time: "32分前",
    type: "approval",
  },
  {
    action: "コンクリート強度試験結果がアップロード",
    project: "大田区土木工事",
    time: "1時間前",
    type: "document",
  },
  {
    action: "週間安全サイクルが完了しました",
    project: "新宿再開発ビル",
    time: "2時間前",
    type: "check",
  },
  {
    action: "重機稼働データの異常を検知",
    project: "川崎物流センター",
    time: "3時間前",
    type: "alert",
  },
  {
    action: "ドローン測量データが処理完了",
    project: "千葉港湾整備",
    time: "4時間前",
    type: "document",
  },
];

const projects = [
  { name: "品川タワー新築工事", progress: 68, status: "施工中", workers: 45 },
  { name: "横浜分譲マンション", progress: 42, status: "施工中", workers: 32 },
  { name: "大田区土木工事", progress: 85, status: "仕上げ", workers: 18 },
  { name: "新宿再開発ビル", progress: 23, status: "基礎", workers: 28 },
  { name: "川崎物流センター", progress: 55, status: "躯体", workers: 38 },
];

const insights = [
  {
    title: "工程遅延リスク",
    desc: "品川タワー：鉄骨建方が2日遅延。天候影響による後続工程への波及を予測",
    sev: "warning" as const,
  },
  {
    title: "原価超過予測",
    desc: "川崎物流センター：資材高騰により予算比+3.2%の超過見込み",
    sev: "danger" as const,
  },
  {
    title: "安全改善提案",
    desc: "AI画像解析：横浜現場の足場設置状況について改善推奨",
    sev: "info" as const,
  },
];

// Theme tokens — light fallbacks identical to Claude Design source.
const CARD: React.CSSProperties = {
  background: "var(--bg-card, #fff)",
  borderRadius: 12,
  border: "1px solid var(--border, #e2e8f0)",
};
const T_HEADING = "var(--text-heading, #0f172a)";
const T_BODY = "var(--text, #0f172a)";
const T_SECOND = "var(--text-secondary, #475569)";
const T_MUTED = "#64748b";
const T_FAINT = "#94a3b8";

const insightBg = { warning: "#fff7ed", danger: "#fef2f2", info: "#eff6ff" };
const insightBar = { warning: "#f97316", danger: "#dc2626", info: "#1a56db" };

export default function DashboardPage() {
  const [dateLabel, setDateLabel] = useState("");

  useEffect(() => {
    setDateLabel(
      new Date().toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
      }),
    );
  }, []);

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      {/* Greeting */}
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{ fontSize: 22, fontWeight: 700, color: T_HEADING, margin: 0 }}
        >
          おかえりなさい、田中さん
        </h1>
        <p style={{ fontSize: 13, color: T_MUTED, marginTop: 4 }}>
          {dateLabel ? `${dateLabel} — ` : ""}本日も安全第一で。
        </p>
      </div>

      {/* Stat cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {stats.map((s) => {
          const Icon = s.icon;
          const Trend = s.up ? TrendingUp : TrendingDown;
          return (
            <div
              key={s.label}
              style={{
                ...CARD,
                padding: 16,
                cursor: "pointer",
                transition: "box-shadow 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.boxShadow =
                  "0 4px 12px var(--shadow, rgba(0,0,0,0.08))")
              }
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
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
                  <Icon
                    className="h-[18px] w-[18px]"
                    style={{ color: s.color }}
                  />
                </div>
                <ArrowUpRight
                  className="h-3.5 w-3.5"
                  style={{ color: T_FAINT }}
                />
              </div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: T_BODY,
                  marginTop: 12,
                }}
              >
                {s.value}
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: T_MUTED,
                  marginTop: 2,
                }}
              >
                {s.label}
              </div>
              <div
                style={{
                  fontSize: 11,
                  marginTop: 6,
                  fontWeight: 500,
                  color: s.up ? "#16a34a" : "#dc2626",
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <Trend className="h-3 w-3" />
                {s.trend}
              </div>
            </div>
          );
        })}
      </div>

      {/* Map + AI insights */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
          marginBottom: 20,
        }}
      >
        {/* Map */}
        <div
          style={{ ...CARD, padding: 0, overflow: "hidden", minHeight: 300 }}
        >
          <div
            style={{
              padding: "14px 20px",
              borderBottom: "1px solid var(--border, #e2e8f0)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 700, color: T_HEADING }}>
              工事位置マップ
            </span>
            <span
              style={{
                fontSize: 11,
                color: T_MUTED,
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
                  background: "#16a34a",
                }}
              />
              リアルタイム
            </span>
          </div>
          <div style={{ height: 260 }}>
            <DashboardSiteMap height="260px" />
          </div>
        </div>

        {/* AI insights */}
        <div style={{ ...CARD, padding: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 16,
            }}
          >
            <Brain className="h-[18px] w-[18px]" style={{ color: "#7c3aed" }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: T_HEADING }}>
              AI分析・予測
            </span>
            <span
              style={{
                fontSize: 10,
                color: "#7c3aed",
                background: "#f5f3ff",
                padding: "3px 8px",
                borderRadius: 10,
                fontWeight: 600,
                marginLeft: "auto",
              }}
            >
              AI推奨アクション
            </span>
          </div>
          {insights.map((ins) => (
            <div
              key={ins.title}
              style={{
                padding: 14,
                borderRadius: 8,
                marginBottom: 10,
                background: insightBg[ins.sev],
                borderLeft: `3px solid ${insightBar[ins.sev]}`,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#0f172a",
                  marginBottom: 4,
                }}
              >
                {ins.title}
              </div>
              <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.5 }}>
                {ins.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity + progress */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
        {/* Activity feed */}
        <div style={{ ...CARD, padding: 0 }}>
          <div
            style={{
              padding: "14px 20px",
              borderBottom: "1px solid var(--border, #e2e8f0)",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 700, color: T_HEADING }}>
              最近のアクティビティ
            </span>
            <button
              style={{
                fontSize: 12,
                color: "#1a56db",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              すべて表示
            </button>
          </div>
          {activities.map((item, i) => (
            <div
              key={`${item.time}-${item.action}`}
              style={{
                padding: "12px 20px",
                borderBottom:
                  i < activities.length - 1
                    ? "1px solid var(--border-light, #f1f5f9)"
                    : "none",
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                cursor: "pointer",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background =
                  "var(--bg-card-hover, #f8fafc)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  marginTop: 5,
                  flexShrink: 0,
                  background: typeColors[item.type],
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: T_BODY }}>
                  {item.action}
                </div>
                <div style={{ fontSize: 11, color: T_FAINT, marginTop: 3 }}>
                  {item.project} · {item.time}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Progress list */}
        <div style={{ ...CARD, padding: 20 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: T_HEADING,
              marginBottom: 16,
            }}
          >
            工事進捗
          </div>
          {projects.map((p) => (
            <div key={p.name} style={{ marginBottom: 14 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 5,
                }}
              >
                <span
                  style={{ fontSize: 12, fontWeight: 500, color: T_SECOND }}
                >
                  {p.name}
                </span>
                <span
                  style={{ fontSize: 11, fontWeight: 600, color: "#1a56db" }}
                >
                  {p.progress}%
                </span>
              </div>
              <div
                style={{
                  height: 6,
                  background: "var(--border, #e2e8f0)",
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    borderRadius: 3,
                    width: `${p.progress}%`,
                    background:
                      p.progress > 70
                        ? "#16a34a"
                        : p.progress > 40
                          ? "#1a56db"
                          : "#f97316",
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  marginTop: 4,
                  fontSize: 10,
                  color: T_FAINT,
                }}
              >
                <span>{p.status}</span>
                <span>{p.workers}名</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
