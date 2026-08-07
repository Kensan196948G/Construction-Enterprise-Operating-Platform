"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Activity,
  Wind,
  Droplet,
  Thermometer,
  Zap,
  RadioTower,
  Brain,
  CheckCircle2,
  AlertTriangle,
  Waves,
  Cpu,
  Bell,
  Cloud,
  Sun,
  Clock,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CARD, T_HEADING, T_BODY, T_SECOND, T_MUTED, T_FAINT, BORDER, BORDER_LIGHT, SUBTLE_BG, MONO } from "@/lib/design/tokens";

// ────────────────────────────────────────────────────────────────────────────
// Claude Design — IoT・リアルタイム監視 (IoTSensorsView faithful port)
// SlideTabPanel via inline translateX slide. Covers all sub-items.
// ────────────────────────────────────────────────────────────────────────────

type TabId = "sensors" | "weather" | "wave" | "water" | "gateway" | "edge" | "alerts" | "realtime";

const TABS: { id: TabId; label: string }[] = [
  { id: "sensors", label: "センサ一覧" },
  { id: "weather", label: "気象情報" },
  { id: "wave", label: "波浪監視" },
  { id: "water", label: "水位監視" },
  { id: "gateway", label: "IoT Gateway" },
  { id: "edge", label: "Edge AI" },
  { id: "alerts", label: "アラート管理" },
  { id: "realtime", label: "リアルタイム監視" },
];

const tabFromPath: Record<string, TabId> = {
  "/iot/sensors": "sensors",
  "/iot/weather": "weather",
  "/iot/wave": "wave",
  "/iot/water": "water",
  "/iot/gateway": "gateway",
  "/iot/edge": "edge",
  "/iot/alerts": "alerts",
  "/iot/realtime": "realtime",
};

// ── センサ一覧（faithful port）──────────────────────────────────────────────

type SensorStatus = "normal" | "warning" | "danger";
type SensorType = "wave" | "wind" | "water" | "temp" | "vibration" | "noise";

interface Sensor {
  name: string;
  location: string;
  value: string;
  unit: string;
  status: SensorStatus;
  type: SensorType;
}

const sensors: Sensor[] = [
  { name: "波高計 #1", location: "品川港湾A地点", value: "1.2", unit: "m", status: "normal", type: "wave" },
  { name: "風速計 #3", location: "品川タワー屋上", value: "8.5", unit: "m/s", status: "warning", type: "wind" },
  { name: "水位計 #2", location: "横浜現場排水", value: "0.45", unit: "m", status: "normal", type: "water" },
  { name: "温度計 #5", location: "新宿再開発", value: "32.1", unit: "°C", status: "warning", type: "temp" },
  { name: "振動計 #1", location: "川崎物流基礎", value: "0.08", unit: "gal", status: "normal", type: "vibration" },
  { name: "騒音計 #2", location: "大田区土木", value: "72", unit: "dB", status: "normal", type: "noise" },
];

const statusColors: Record<SensorStatus, string> = {
  normal: "#16a34a",
  warning: "#f97316",
  danger: "#dc2626",
};

const sensorIcon: Record<SensorType, LucideIcon> = {
  wave: Activity,
  wind: Wind,
  water: Droplet,
  temp: Thermometer,
  vibration: Zap,
  noise: RadioTower,
};

const timeRanges = ["1h", "6h", "24h", "7d"] as const;
type TimeRange = (typeof timeRanges)[number];

const thresholds: ReadonlyArray<readonly [string, string, string]> = [
  ["上限（危険）", "15.0", "#dc2626"],
  ["上限（警告）", "10.0", "#f97316"],
  ["下限（警告）", "0.5", "#f97316"],
  ["下限（危険）", "0.1", "#dc2626"],
];

// Deterministic chart series per sensor (no Math.random / Date — SSR safe).
const CHART_SERIES: Record<number, number[]> = (() => {
  const out: Record<number, number[]> = {};
  sensors.forEach((s, idx) => {
    const base = parseFloat(s.value) || 1;
    const data: number[] = [];
    for (let i = 0; i < 24; i++) {
      // smooth pseudo-wave purely from the index — deterministic, no RNG.
      const wobble = Math.sin((i + idx) * 0.6) * 0.18 + Math.sin((i + idx) * 0.21) * 0.1;
      data.push(Math.max(base * 0.5, Math.min(base * 1.8, base * (1 + wobble))));
    }
    out[idx] = data;
  });
  return out;
})();

const panelStyle: React.CSSProperties = { minWidth: "100%", flexShrink: 0, padding: 20 };

// Small shared metric-card helper keeps every panel's 様式 identical.
function MetricRow({ items }: { items: { l: string; v: string; s?: string; c: string }[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${items.length},1fr)`, gap: 12 }}>
      {items.map((d) => (
        <div key={d.l} style={{ padding: 14, borderRadius: 8, background: SUBTLE_BG, border: `1px solid ${BORDER}`, textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: d.c }}>{d.v}</div>
          <div style={{ fontSize: 11, color: T_MUTED, marginTop: 2 }}>
            {d.l}
            {d.s ? ` · ${d.s}` : ""}
          </div>
        </div>
      ))}
    </div>
  );
}

function PanelHeading({ icon, title, sub }: { icon?: ReactNode; title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {icon}
        <span style={{ fontSize: 15, fontWeight: 700, color: T_HEADING }}>{title}</span>
      </div>
      {sub ? <div style={{ fontSize: 12, color: T_MUTED, marginTop: 4 }}>{sub}</div> : null}
    </div>
  );
}

// ── センサ一覧パネル（リッチ・流用）──────────────────────────────────────────

function SensorsPanel() {
  const [selectedSensor, setSelectedSensor] = useState(0);
  const [timeRange, setTimeRange] = useState<TimeRange>("24h");

  const chartData = CHART_SERIES[selectedSensor] ?? [];
  const hasData = chartData.length > 0;
  const maxVal = hasData ? Math.max(...chartData) : 0;
  const minVal = hasData ? Math.min(...chartData) : 0;
  const range = maxVal - minVal || 1;
  const sensor = sensors[selectedSensor];

  const linePath = hasData
    ? `M0,${200 - ((chartData[0] - minVal) / range) * 170} ` +
      chartData
        .map((v, i) => `L${(i / (chartData.length - 1)) * 600},${200 - ((v - minVal) / range) * 170}`)
        .join(" ")
    : "";

  return (
    <div style={panelStyle}>
      {/* Sensor cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))",
          gap: 12,
          marginBottom: 20,
        }}
      >
        {sensors.map((s, i) => {
          const SensorIcon = sensorIcon[s.type] ?? Activity;
          return (
            <div
              key={i}
              onClick={() => setSelectedSensor(i)}
              style={{
                ...CARD,
                padding: 14,
                cursor: "pointer",
                borderColor: selectedSensor === i ? "#1a56db" : BORDER,
                borderWidth: selectedSensor === i ? 2 : 1,
                transition: "all 0.15s",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    background: s.status === "warning" ? "#fff7ed" : "#f0fdf4",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <SensorIcon className="h-4 w-4" style={{ color: statusColors[s.status] }} />
                </div>
                <span role="img" aria-label={s.status === "normal" ? "正常" : s.status === "warning" ? "注意" : "危険"} title={s.status === "normal" ? "正常" : s.status === "warning" ? "注意" : "危険"} style={{ width: 8, height: 8, borderRadius: "50%", background: statusColors[s.status] }} />
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: T_BODY, marginTop: 10 }}>
                {s.value}
                <span style={{ fontSize: 12, fontWeight: 400, color: T_FAINT, marginLeft: 2 }}>{s.unit}</span>
              </div>
              <div style={{ fontSize: 12, fontWeight: 500, color: T_SECOND, marginTop: 2 }}>{s.name}</div>
              <div style={{ fontSize: 10, color: T_FAINT, marginTop: 2 }}>{s.location}</div>
            </div>
          );
        })}
      </div>

      {/* Chart */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20 }}>
        <div style={CARD}>
          <div
            style={{
              padding: "14px 20px",
              borderBottom: `1px solid ${BORDER}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <span style={{ fontSize: 14, fontWeight: 700, color: T_HEADING }}>{sensor.name}</span>
              <span style={{ fontSize: 12, color: T_FAINT, marginLeft: 8 }}>{sensor.location}</span>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {timeRanges.map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeRange(t)}
                  style={{
                    padding: "3px 10px",
                    borderRadius: 4,
                    border: "none",
                    background: timeRange === t ? "#1a56db" : BORDER_LIGHT,
                    color: timeRange === t ? "#fff" : T_MUTED,
                    fontSize: 11,
                    fontWeight: 500,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div style={{ padding: "20px 20px 10px" }}>
            <svg width="100%" height="200" viewBox="0 0 600 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="cg2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1a56db" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#1a56db" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[0, 1, 2, 3, 4].map((i) => (
                <line key={i} x1="0" y1={i * 50} x2="600" y2={i * 50} stroke="#f1f5f9" strokeWidth="1" />
              ))}
              {hasData && (
                <>
                  <path d={`${linePath} L600,200 L0,200 Z`} fill="url(#cg2)" />
                  <path d={linePath} fill="none" stroke="#1a56db" strokeWidth="2" />
                  <circle
                    cx={600}
                    cy={200 - ((chartData[chartData.length - 1] - minVal) / range) * 170}
                    r="4"
                    fill="#1a56db"
                    stroke="#fff"
                    strokeWidth="2"
                  />
                </>
              )}
            </svg>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 10,
                color: T_FAINT,
                marginTop: 4,
                fontFamily: MONO,
              }}
            >
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span>24:00</span>
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              borderTop: `1px solid ${BORDER}`,
              padding: "12px 20px",
            }}
          >
            {(
              [
                ["現在値", sensor.value + sensor.unit],
                ["最大", (hasData ? maxVal.toFixed(1) : "—") + (hasData ? sensor.unit : "")],
                ["最小", (hasData ? minVal.toFixed(1) : "—") + (hasData ? sensor.unit : "")],
                [
                  "平均",
                  (hasData ? (chartData.reduce((a, b) => a + b, 0) / chartData.length).toFixed(1) : "—") +
                    (hasData ? sensor.unit : ""),
                ],
              ] as ReadonlyArray<readonly [string, string]>
            ).map((s, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 10, color: T_FAINT }}>{s[0]}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: T_BODY, marginTop: 2 }}>{s[1]}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={CARD}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${BORDER}` }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: T_HEADING }}>閾値設定</span>
            </div>
            <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              {thresholds.map(([l, v, c], i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "6px 10px",
                    borderRadius: 6,
                    background: SUBTLE_BG,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 8, height: 3, borderRadius: 2, background: c }} />
                    <span style={{ fontSize: 12, color: T_SECOND }}>{l}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: T_BODY, fontFamily: MONO }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ ...CARD, background: "#f5f3ff", borderColor: "#ede9fe" }}>
            <div style={{ padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <Brain className="h-3.5 w-3.5" style={{ color: "#7c3aed" }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: "#7c3aed" }}>AI異常検知</span>
              </div>
              <div style={{ fontSize: 12, color: T_SECOND, lineHeight: 1.6 }}>
                過去72時間のデータパターンは正常範囲内です。15時以降の風速上昇傾向を検知。
              </div>
              <div
                style={{
                  marginTop: 10,
                  fontSize: 11,
                  color: "#16a34a",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <CheckCircle2 className="h-3 w-3" />
                異常スコア: 0.12 (正常)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Weather panel (page-iot.jsx /iot/weather faithful) ──

function WeatherPanel() {
  const metrics: { label: string; value: string; sub: string; icon: LucideIcon; color: string; bg: string }[] = [
    { label: "気温", value: "32°C", sub: "最高34°C予想", icon: Thermometer, color: "#dc2626", bg: "#fef2f2" },
    { label: "風速", value: "8.5m/s", sub: "15時 12m/s予報", icon: Wind, color: "#f97316", bg: "#fff7ed" },
    { label: "降水確率", value: "10%", sub: "午後から曇り", icon: Cloud, color: "#1a56db", bg: "#eff6ff" },
    { label: "WBGT", value: "28°C", sub: "厳重警戒", icon: AlertTriangle, color: "#dc2626", bg: "#fef2f2" },
  ];
  const times = ["06:00", "09:00", "12:00", "15:00", "18:00", "21:00"];
  const temps = [24, 28, 32, 30, 26, 22];
  const winds = [3, 5, 7, 12, 8, 4];
  const rains = [0, 0, 0, 20, 10, 0];
  const sites: { site: string; temp: string; wind: string; alert: boolean }[] = [
    { site: "品川タワー", temp: "32°C", wind: "8.5m/s", alert: true },
    { site: "横浜マンション", temp: "30°C", wind: "5.2m/s", alert: false },
    { site: "大田区土木", temp: "31°C", wind: "4.8m/s", alert: false },
    { site: "川崎物流", temp: "32°C", wind: "7.1m/s", alert: true },
    { site: "千葉港湾", temp: "29°C", wind: "9.2m/s", alert: true },
  ];
  return (
    <div style={panelStyle}>
      <PanelHeading
        icon={<Thermometer className="h-4 w-4" style={{ color: "#f97316" }} aria-hidden="true" />}
        title="気象情報"
        sub="全現場の気象データ・予報・警報"
      />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
        {metrics.map((s) => {
          const MIcon = s.icon;
          return (
            <div key={s.label} style={{ ...CARD, padding: 16, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                <MIcon size={24} style={{ color: s.color }} />
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: T_HEADING }}>{s.value}</div>
              <div style={{ fontSize: 11, color: T_FAINT, marginTop: 2 }}>{s.label}</div>
              <div style={{ fontSize: 10, color: s.color, marginTop: 4, fontWeight: 500 }}>{s.sub}</div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={CARD}>
          <div style={{ padding: "14px 16px", borderBottom: `1px solid ${BORDER}`, fontSize: 14, fontWeight: 700, color: T_HEADING }}>
            時間帯別予報
          </div>
          <div style={{ padding: 16 }}>
            {times.map((t, i) => (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: 16, padding: "8px 0", borderBottom: i < times.length - 1 ? `1px solid ${BORDER_LIGHT}` : "none" }}>
                <span style={{ fontSize: 12, color: T_MUTED, width: 50, fontFamily: MONO }}>{t}</span>
                {i < 3 ? <Sun size={18} style={{ color: "#eab308" }} /> : <Cloud size={18} style={{ color: "#94a3b8" }} />}
                <span style={{ fontSize: 14, fontWeight: 600, color: T_HEADING, width: 50 }}>{temps[i]}°C</span>
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 4 }}>
                  <Wind size={12} style={{ color: "#94a3b8" }} />
                  <span style={{ fontSize: 11, color: T_MUTED }}>{winds[i]}m/s</span>
                </div>
                <span style={{ fontSize: 11, color: T_MUTED }}>{rains[i]}%</span>
              </div>
            ))}
          </div>
        </div>
        <div style={CARD}>
          <div style={{ padding: "14px 16px", borderBottom: `1px solid ${BORDER}`, fontSize: 14, fontWeight: 700, color: T_HEADING }}>
            現場別気象
          </div>
          <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
            {sites.map((s) => (
              <div key={s.site} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 8, background: s.alert ? "#fff7ed" : SUBTLE_BG }}>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: T_HEADING }}>{s.site}</span>
                <span style={{ fontSize: 12, color: T_SECOND }}>{s.temp}</span>
                <span style={{ fontSize: 12, color: s.alert ? "#f97316" : T_MUTED, fontWeight: s.alert ? 600 : 400 }}>{s.wind}</span>
                {s.alert && <AlertTriangle size={14} style={{ color: "#f97316" }} />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Wave-monitoring panel (page-iot.jsx /iot/wave faithful) ──

function WavePanel() {
  const metrics: { label: string; value: string; sub: string; icon: LucideIcon; color: string; bg: string }[] = [
    { label: "有義波高", value: "1.2m", sub: "千葉港湾A地点", icon: Activity, color: "#1a56db", bg: "#eff6ff" },
    { label: "周期", value: "6.5s", sub: "安定", icon: Clock, color: "#16a34a", bg: "#f0fdf4" },
    { label: "作業可否", value: "可", sub: "基準2.0m以下", icon: CheckCircle2, color: "#16a34a", bg: "#f0fdf4" },
  ];
  return (
    <div style={panelStyle}>
      <PanelHeading
        icon={<Waves className="h-4 w-4" style={{ color: "#1a56db" }} aria-hidden="true" />}
        title="波浪監視"
        sub="港湾・海域の波浪リアルタイムデータ"
      />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 20 }}>
        {metrics.map((s) => {
          const MIcon = s.icon;
          return (
            <div key={s.label} style={{ ...CARD, padding: 16, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MIcon size={20} style={{ color: s.color }} />
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: T_HEADING }}>{s.value}</div>
                <div style={{ fontSize: 11, color: T_FAINT }}>
                  {s.label} · {s.sub}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={CARD}>
        <div style={{ padding: "14px 16px", borderBottom: `1px solid ${BORDER}`, fontSize: 14, fontWeight: 700, color: T_HEADING }}>
          波高推移 (24時間)
        </div>
        <div style={{ padding: 20 }}>
          <svg width="100%" height="180" viewBox="0 0 600 180" preserveAspectRatio="none">
            {[0, 1, 2, 3].map((i) => (
              <line key={i} x1="0" y1={i * 50 + 15} x2="600" y2={i * 50 + 15} stroke="#f1f5f9" strokeWidth="1" />
            ))}
            <path
              d="M0,120 Q30,110 60,125 Q90,140 120,115 Q150,90 180,105 Q210,120 240,100 Q270,80 300,95 Q330,110 360,90 Q390,70 420,85 Q450,100 480,80 Q510,60 540,75 Q570,90 600,70"
              fill="none"
              stroke="#1a56db"
              strokeWidth="2"
            />
            <line x1="0" y1="35" x2="600" y2="35" stroke="#dc2626" strokeWidth="1" strokeDasharray="4,4" />
            <text x="496" y="30" fontSize="9" fill="#dc2626">
              基準値 2.0m
            </text>
          </svg>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: T_FAINT, marginTop: 4 }}>
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>24:00</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Water-level panel (page-iot.jsx /iot/water faithful) ──

function WaterPanel() {
  const gauges: { name: string; value: string; limit: string; pct: number; status: string }[] = [
    { name: "横浜現場 排水ピット", value: "0.45m", limit: "1.0m", pct: 45, status: "正常" },
    { name: "品川タワー 地下水位", value: "2.8m", limit: "3.5m", pct: 80, status: "注意" },
    { name: "大田区 調整池", value: "0.62m", limit: "2.0m", pct: 31, status: "正常" },
    { name: "川崎物流 雨水排水", value: "0.15m", limit: "0.8m", pct: 19, status: "正常" },
  ];
  return (
    <div style={panelStyle}>
      <PanelHeading
        icon={<Droplet className="h-4 w-4" style={{ color: "#1a56db" }} aria-hidden="true" />}
        title="水位監視"
        sub="排水・河川・地下水のリアルタイム監視"
      />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16 }}>
        {gauges.map((w) => (
          <div key={w.name} style={{ ...CARD, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: T_HEADING }}>{w.name}</span>
              <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 10, background: w.status === "正常" ? "#dcfce7" : "#fff7ed", color: w.status === "正常" ? "#166534" : "#92400e" }}>
                {w.status}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 4, marginBottom: 8 }}>
              <span style={{ fontSize: 28, fontWeight: 700, color: T_HEADING }}>{w.value}</span>
              <span style={{ fontSize: 12, color: T_FAINT, marginBottom: 4 }}>/ {w.limit}</span>
            </div>
            <div style={{ height: 8, background: BORDER, borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${w.pct}%`, borderRadius: 4, background: w.pct > 70 ? "#f97316" : w.pct > 50 ? "#eab308" : "#16a34a" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── IoT Gateway panel (page-iot.jsx /iot/gateway faithful) ──

function GatewayPanel() {
  const gateways: { id: string; location: string; devices: number; status: string; uptime: string; signal: string; protocol: string }[] = [
    { id: "GW-001", location: "品川タワー", devices: 24, status: "online", uptime: "45d", signal: "強", protocol: "MQTT/LoRa" },
    { id: "GW-002", location: "横浜マンション", devices: 12, status: "online", uptime: "30d", signal: "強", protocol: "MQTT/Wi-Fi" },
    { id: "GW-003", location: "千葉港湾", devices: 18, status: "online", uptime: "60d", signal: "中", protocol: "MQTT/LTE" },
    { id: "GW-004", location: "大田区土木", devices: 8, status: "online", uptime: "15d", signal: "強", protocol: "MQTT/LoRa" },
    { id: "GW-005", location: "川崎物流", devices: 15, status: "degraded", uptime: "7d", signal: "弱", protocol: "MQTT/Wi-Fi" },
  ];
  const cols = "80px 1fr 80px 70px 60px 50px 100px";
  return (
    <div style={panelStyle}>
      <PanelHeading
        icon={<RadioTower className="h-4 w-4" style={{ color: "#7c3aed" }} aria-hidden="true" />}
        title="IoT Gateway"
        sub="ゲートウェイ稼働状況・デバイス接続管理"
      />
      <div style={CARD}>
        <div style={{ display: "grid", gridTemplateColumns: cols, gap: 12, padding: "10px 16px", borderBottom: `1px solid ${BORDER}`, fontSize: 11, fontWeight: 600, color: T_FAINT }}>
          <span>ID</span>
          <span>設置場所</span>
          <span>接続デバイス</span>
          <span>稼働時間</span>
          <span>状態</span>
          <span>信号</span>
          <span>プロトコル</span>
        </div>
        {gateways.map((g, i) => (
          <div key={g.id} style={{ display: "grid", gridTemplateColumns: cols, gap: 12, padding: "12px 16px", alignItems: "center", borderBottom: i < gateways.length - 1 ? `1px solid ${BORDER_LIGHT}` : "none", fontSize: 12 }}>
            <span style={{ fontFamily: MONO, fontSize: 11, color: T_MUTED }}>{g.id}</span>
            <span style={{ fontWeight: 500, color: T_HEADING }}>{g.location}</span>
            <span style={{ fontWeight: 600, color: "#1a56db" }}>{g.devices}台</span>
            <span style={{ color: T_MUTED }}>{g.uptime}</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: g.status === "online" ? "#16a34a" : "#f97316" }}>
              <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: "50%", background: g.status === "online" ? "#16a34a" : "#f97316" }} />
              {g.status === "online" ? "稼働" : "低下"}
            </span>
            <span style={{ fontSize: 11, color: g.signal === "弱" ? "#f97316" : "#16a34a" }}>{g.signal}</span>
            <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: BORDER_LIGHT, color: T_SECOND }}>{g.protocol}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Edge AI panel (page-iot.jsx /iot/edge faithful) ──

function EdgePanel() {
  const nodes: { name: string; device: string; site: string; fps: number; detections: string; model: string; status: string }[] = [
    { name: "安全装備検知 AI", device: "NVIDIA Jetson AGX", site: "品川タワー", fps: 15, detections: "1,842", model: "YOLOv8", status: "running" },
    { name: "ひび割れ検知 AI", device: "NVIDIA Jetson Nano", site: "横浜マンション", fps: 5, detections: "234", model: "ResNet50", status: "running" },
    { name: "重機接近検知 AI", device: "NVIDIA Jetson AGX", site: "大田区土木", fps: 30, detections: "567", model: "YOLOv8", status: "running" },
    { name: "水中異常検知 AI", device: "NVIDIA Jetson Xavier", site: "千葉港湾", fps: 10, detections: "89", model: "Custom CNN", status: "idle" },
  ];
  return (
    <div style={panelStyle}>
      <PanelHeading
        icon={<Cpu className="h-4 w-4" style={{ color: "#7c3aed" }} aria-hidden="true" />}
        title="Edge AI"
        sub="エッジデバイスでのAI推論・リアルタイム分析"
      />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 14 }}>
        {nodes.map((e) => {
          const details: [string, string][] = [
            ["デバイス", e.device],
            ["現場", e.site],
            ["FPS", `${e.fps}fps`],
            ["モデル", e.model],
          ];
          return (
            <div key={e.name} style={{ ...CARD, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: T_HEADING }}>{e.name}</div>
                <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 10, background: e.status === "running" ? "#dcfce7" : BORDER_LIGHT, color: e.status === "running" ? "#166534" : T_MUTED }}>
                  {e.status === "running" ? "稼働中" : "待機"}
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                {details.map(([k, v]) => (
                  <div key={k}>
                    <div style={{ fontSize: 9, color: T_FAINT }}>{k}</div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: T_HEADING }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ padding: "8px 10px", borderRadius: 6, background: "#f5f3ff", display: "flex", alignItems: "center", gap: 6 }}>
                <Brain size={12} style={{ color: "#7c3aed" }} />
                <span style={{ fontSize: 11, color: "#7c3aed", fontWeight: 500 }}>本日検知: {e.detections}件</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Alerts panel (page-iot.jsx /iot/alerts faithful) ──

type AlertSeverity = "warning" | "info" | "danger";

function AlertsPanel() {
  const alerts: { time: string; sensor: string; message: string; severity: AlertSeverity; site: string; ack: boolean }[] = [
    { time: "09:12", sensor: "風速計 #3", message: "風速8.5m/s — 10m/s超過でクレーン作業中止", severity: "warning", site: "品川タワー", ack: false },
    { time: "09:00", sensor: "温度計 #5", message: "WBGT 28°C超過 — 熱中症警戒レベル", severity: "warning", site: "新宿再開発", ack: false },
    { time: "08:42", sensor: "波高計 #1", message: "15時以降 波高2.0m予測 — 海上作業注意", severity: "info", site: "千葉港湾", ack: true },
    { time: "08:15", sensor: "振動計 #2", message: "振動値0.15gal — 基準値接近", severity: "warning", site: "川崎物流", ack: true },
    { time: "昨日 18:30", sensor: "水位計 #1", message: "水位0.8m到達 — 排水ポンプ自動起動", severity: "info", site: "横浜マンション", ack: true },
    { time: "昨日 15:00", sensor: "騒音計 #2", message: "騒音85dB超過 — 規制値接近", severity: "warning", site: "大田区土木", ack: true },
  ];
  const sevColor: Record<AlertSeverity, string> = { warning: "#f97316", info: "#1a56db", danger: "#dc2626" };
  const sevBg: Record<AlertSeverity, string> = { warning: "#fff7ed", info: "#eff6ff", danger: "#fef2f2" };
  return (
    <div style={panelStyle}>
      <PanelHeading
        icon={<Bell className="h-4 w-4" style={{ color: "#f97316" }} aria-hidden="true" />}
        title="アラート管理"
        sub="IoTセンサアラートの一覧・確認・対応管理"
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {alerts.map((a, i) => (
          <div key={i} style={{ ...CARD, padding: "12px 16px", borderLeft: `3px solid ${sevColor[a.severity]}`, display: "flex", alignItems: "center", gap: 12, background: a.ack ? "var(--bg-card, #fff)" : sevBg[a.severity] }}>
            <AlertTriangle size={16} style={{ color: sevColor[a.severity], flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: T_HEADING }}>{a.sensor}</span>
                <span style={{ fontSize: 10, color: T_FAINT }}>{a.site}</span>
              </div>
              <div style={{ fontSize: 12, color: T_SECOND }}>{a.message}</div>
            </div>
            <span style={{ fontSize: 10, color: T_FAINT, flexShrink: 0 }}>{a.time}</span>
            {!a.ack ? (
              <button style={{ padding: "4px 10px", borderRadius: 4, border: `1px solid ${BORDER}`, background: "var(--bg-card, #fff)", fontSize: 10, cursor: "pointer", color: "#1a56db", fontWeight: 600, fontFamily: "inherit" }}>
                確認
              </button>
            ) : (
              <CheckCircle2 size={14} style={{ color: "#16a34a", flexShrink: 0 }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── リアルタイム監視パネル ──────────────────────────────────────────────────

function RealtimePanel() {
  const feeds = [
    { name: "風速計 #3", value: "8.5 m/s", trend: "↑", c: "#f97316" },
    { name: "波高計 #1", value: "1.2 m", trend: "→", c: "#16a34a" },
    { name: "水位計 #2", value: "0.45 m", trend: "→", c: "#16a34a" },
    { name: "温度計 #5", value: "32.1 °C", trend: "↑", c: "#f97316" },
    { name: "振動計 #1", value: "0.08 gal", trend: "→", c: "#16a34a" },
    { name: "騒音計 #2", value: "72 dB", trend: "↓", c: "#16a34a" },
  ];
  return (
    <div style={panelStyle}>
      <PanelHeading icon={<Activity className="h-4 w-4" style={{ color: "#16a34a" }} aria-hidden="true" />} title="リアルタイム監視" sub="全センサのライブ値を統合表示（更新間隔: 5秒）" />
      <div style={{ marginBottom: 16 }}>
        <MetricRow
          items={[
            { l: "監視センサ", v: "6台", s: "全系統オンライン", c: "#1a56db" },
            { l: "正常", v: "4台", s: "—", c: "#16a34a" },
            { l: "警告", v: "2台", s: "風速・温度", c: "#f97316" },
          ]}
        />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))", gap: 12, marginBottom: 16 }}>
        {feeds.map((f) => (
          <div key={f.name} style={{ padding: 14, borderRadius: 8, background: SUBTLE_BG, border: `1px solid ${BORDER}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: T_SECOND }}>{f.name}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: f.c }}>{f.trend}</span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: T_BODY, marginTop: 6 }}>{f.value}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: 10, borderRadius: 8, background: "#dcfce7", border: "1px solid #bbf7d0", display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#166534" }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#16a34a", animation: "iotPulse 2s infinite" }} />
        全センサのライブデータをリアルタイム更新中（更新間隔: 5秒）
      </div>
    </div>
  );
}

// ── メインビュー ────────────────────────────────────────────────────────────

export function IoTDesignView({ subPath }: { subPath?: string }) {
  const [activeTab, setActiveTab] = useState<TabId>((subPath && tabFromPath[subPath]) || "sensors");

  useEffect(() => {
    if (subPath && tabFromPath[subPath]) setActiveTab(tabFromPath[subPath]);
  }, [subPath]);

  const activeIndex = Math.max(0, TABS.findIndex((t) => t.id === activeTab));
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: T_HEADING, margin: 0 }}>IoT・リアルタイム監視</h1>
          <p style={{ fontSize: 12, color: T_MUTED, marginTop: 2 }}>センサ・気象・波浪・水位・Gateway・Edge AI・アラート・リアルタイム</p>
        </div>
        <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#16a34a", fontWeight: 500 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#16a34a", animation: "iotPulse 2s infinite" }} />
          リアルタイム接続中
        </span>
      </div>

      <div style={CARD}>
        {/* Tab bar */}
        <div style={{ display: "flex", borderBottom: `1px solid ${BORDER}`, padding: "0 8px", overflowX: "auto" }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                padding: "12px 16px",
                fontSize: 12,
                fontWeight: activeTab === t.id ? 600 : 400,
                color: activeTab === t.id ? "#1a56db" : T_MUTED,
                cursor: "pointer",
                whiteSpace: "nowrap",
                background: "none",
                border: "none",
                borderBottom: activeTab === t.id ? "2px solid #1a56db" : "2px solid transparent",
                fontFamily: "inherit",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Sliding panels (same order as TABS) */}
        <div style={{ overflow: "hidden" }}>
          <div ref={panelsRef} style={{ display: "flex", transition: "transform 0.35s cubic-bezier(.4,0,.2,1)", transform: `translateX(-${activeIndex * 100}%)` }}>
            <SensorsPanel />
            <WeatherPanel />
            <WavePanel />
            <WaterPanel />
            <GatewayPanel />
            <EdgePanel />
            <AlertsPanel />
            <RealtimePanel />
          </div>
        </div>
      </div>
      <style>{`@keyframes iotPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}
