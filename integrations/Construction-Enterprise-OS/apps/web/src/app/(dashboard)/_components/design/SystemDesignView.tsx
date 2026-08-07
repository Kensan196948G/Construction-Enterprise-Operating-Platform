"use client";

import { useEffect, useState, type ComponentType } from "react";
import { Activity, CheckCircle2, GitBranch, RefreshCw, Shield, X, Zap } from "lucide-react";
import { CARD, T_HEADING, T_BODY, T_SECOND, T_MUTED, T_FAINT, BORDER, BORDER_LIGHT, SUBTLE_BG, MONO } from "@/lib/design/tokens";

// ────────────────────────────────────────────────────────────────────────────
// Claude Design — システム管理 (SystemPage faithful port)
// Conditional tab rendering (matches source — no SlideTabPanel here).
// ────────────────────────────────────────────────────────────────────────────

type SysTabId = "server" | "db" | "backup" | "api" | "devops";

const tabFromPath: Record<string, SysTabId> = {
  "/system/server": "server",
  "/system/db": "db",
  "/system/backup": "backup",
  "/system/api-status": "api",
  "/system/devops": "devops",
};

const TABS: { id: SysTabId; label: string }[] = [
  { id: "server", label: "サーバ監視" },
  { id: "db", label: "DB管理" },
  { id: "backup", label: "バックアップ" },
  { id: "api", label: "API状態" },
  { id: "devops", label: "DevOps/CI-CD" },
];

const servers = [
  { name: "k8s-master-01", type: "K8s Master", cpu: 32, mem: 48, disk: 35, status: "running", uptime: "45d 12h" },
  { name: "k8s-worker-01", type: "K8s Worker", cpu: 68, mem: 72, disk: 55, status: "running", uptime: "45d 12h" },
  { name: "k8s-worker-02", type: "K8s Worker", cpu: 55, mem: 61, disk: 42, status: "running", uptime: "45d 12h" },
  { name: "k8s-worker-03", type: "K8s Worker", cpu: 78, mem: 85, disk: 68, status: "warning", uptime: "30d 8h" },
  { name: "db-primary", type: "PostgreSQL", cpu: 45, mem: 62, disk: 71, status: "running", uptime: "90d 3h" },
  { name: "db-replica", type: "PostgreSQL", cpu: 22, mem: 38, disk: 71, status: "running", uptime: "90d 3h" },
  { name: "redis-01", type: "Redis", cpu: 12, mem: 28, disk: 15, status: "running", uptime: "60d 1h" },
  { name: "kafka-01", type: "Kafka", cpu: 35, mem: 55, disk: 62, status: "running", uptime: "45d 12h" },
  { name: "es-01", type: "Elasticsearch", cpu: 48, mem: 78, disk: 58, status: "running", uptime: "45d 12h" },
  { name: "k8s-worker-04", type: "K8s Worker", cpu: 41, mem: 58, disk: 47, status: "running", uptime: "45d 12h" },
  { name: "es-02", type: "Elasticsearch", cpu: 52, mem: 74, disk: 61, status: "running", uptime: "45d 12h" },
  { name: "kafka-02", type: "Kafka", cpu: 28, mem: 49, disk: 58, status: "running", uptime: "45d 12h" },
  { name: "minio-02", type: "MinIO", cpu: 21, mem: 31, disk: 76, status: "running", uptime: "60d 1h" },
  { name: "minio-01", type: "MinIO", cpu: 18, mem: 25, disk: 82, status: "warning", uptime: "60d 1h" },
];

const databases = [
  { name: "ceos_auth", size: "2.4GB", tables: 18, connections: 42, status: "healthy", replication: "sync" },
  { name: "ceos_documents", size: "48.2GB", tables: 24, connections: 28, status: "healthy", replication: "sync" },
  { name: "ceos_iot", size: "125.8GB", tables: 12, connections: 86, status: "healthy", replication: "async" },
  { name: "ceos_gis", size: "18.6GB", tables: 15, connections: 14, status: "healthy", replication: "sync" },
  { name: "ceos_erp", size: "8.4GB", tables: 32, connections: 22, status: "healthy", replication: "sync" },
  { name: "ceos_notification", size: "1.2GB", tables: 9, connections: 16, status: "healthy", replication: "sync" },
  { name: "ceos_gateway", size: "640MB", tables: 7, connections: 34, status: "healthy", replication: "async" },
  { name: "ceos_ai", size: "12.8GB", tables: 11, connections: 12, status: "healthy", replication: "async" },
  { name: "ceos_workflow", size: "3.1GB", tables: 14, connections: 18, status: "degraded", replication: "sync" },
];

const backups = [
  { target: "PostgreSQL 全DB", lastRun: "2026/05/24 03:00", size: "206GB", duration: "45m", status: "成功", next: "2026/05/25 03:00" },
  { target: "MinIO (文書ストレージ)", lastRun: "2026/05/24 02:00", size: "1.2TB", duration: "2h 15m", status: "成功", next: "2026/05/25 02:00" },
  { target: "Elasticsearch インデックス", lastRun: "2026/05/24 04:00", size: "85GB", duration: "30m", status: "成功", next: "2026/05/25 04:00" },
  { target: "Redis スナップショット", lastRun: "2026/05/24 00:00", size: "4.2GB", duration: "2m", status: "成功", next: "毎時" },
  { target: "Kafka トピックログ", lastRun: "2026/05/24 02:30", size: "62GB", duration: "18m", status: "成功", next: "2026/05/25 02:30" },
  { target: "設定/Secrets (Vault)", lastRun: "2026/05/24 00:30", size: "45MB", duration: "8s", status: "成功", next: "2026/05/25 00:30" },
  { target: "GIS タイルキャッシュ", lastRun: "2026/05/24 05:00", size: "34GB", duration: "22m", status: "成功", next: "2026/05/26 05:00" },
  { target: "K8s etcd", lastRun: "2026/05/24 01:00", size: "120MB", duration: "15s", status: "成功", next: "2026/05/25 01:00" },
];

const apiCards = [
  { label: "API Gateway", status: "healthy", uptime: "99.98%", latency: "12ms" },
  { label: "Auth Service", status: "healthy", uptime: "99.99%", latency: "45ms" },
  { label: "IoT Service", status: "healthy", uptime: "99.97%", latency: "32ms" },
  { label: "Document Service", status: "healthy", uptime: "99.95%", latency: "120ms" },
  { label: "Workflow Service", status: "degraded", uptime: "98.5%", latency: "580ms" },
];

const apiRows = [
  { ep: "/api/v1/auth/login", method: "POST", avg: "45ms", success: "99.98%", rps: "42", p99: "120ms", ok: true },
  { ep: "/api/v1/auth/token", method: "POST", avg: "12ms", success: "99.99%", rps: "156", p99: "35ms", ok: true },
  { ep: "/api/v1/documents", method: "GET", avg: "120ms", success: "99.95%", rps: "28", p99: "350ms", ok: true },
  { ep: "/api/v1/iot/sensors", method: "GET", avg: "32ms", success: "99.99%", rps: "245", p99: "85ms", ok: true },
  { ep: "/api/v1/workflow", method: "POST", avg: "580ms", success: "98.8%", rps: "12", p99: "2.1s", ok: false },
  { ep: "/api/v1/gis/locations", method: "GET", avg: "95ms", success: "99.97%", rps: "18", p99: "210ms", ok: true },
  { ep: "/api/v1/ai/chat", method: "POST", avg: "1.2s", success: "99.9%", rps: "8", p99: "3.5s", ok: true },
  { ep: "/api/v1/erp/costs", method: "GET", avg: "210ms", success: "99.96%", rps: "6", p99: "450ms", ok: true },
  { ep: "/api/v1/bim/models", method: "GET", avg: "350ms", success: "99.9%", rps: "4", p99: "1.2s", ok: true },
  { ep: "/api/v1/gateway/health", method: "GET", avg: "8ms", success: "99.99%", rps: "320", p99: "22ms", ok: true },
  { ep: "/api/v1/iot/telemetry", method: "POST", avg: "48ms", success: "99.96%", rps: "412", p99: "140ms", ok: true },
  { ep: "/api/v1/documents/upload", method: "POST", avg: "680ms", success: "99.92%", rps: "9", p99: "2.4s", ok: true },
  { ep: "/api/v1/workflow/approve", method: "POST", avg: "95ms", success: "99.94%", rps: "15", p99: "260ms", ok: true },
  { ep: "/api/v1/notification", method: "POST", avg: "25ms", success: "99.99%", rps: "85", p99: "65ms", ok: true },
];

const pipelines: { name: string; branch: string; commit: string; status: "success" | "running" | "failed"; duration: string; time: string }[] = [
  { name: "auth-service", branch: "main", commit: "fix: MFA timeout", status: "success", duration: "3m 42s", time: "09:15" },
  { name: "gateway", branch: "main", commit: "feat: rate limit update", status: "success", duration: "4m 18s", time: "08:30" },
  { name: "document-service", branch: "develop", commit: "test: OCR unit tests", status: "running", duration: "2m 10s", time: "09:22" },
  { name: "iot-service", branch: "main", commit: "perf: sensor batch query", status: "success", duration: "5m 05s", time: "07:45" },
  { name: "gis-service", branch: "main", commit: "feat: tile cache warmup", status: "success", duration: "3m 28s", time: "08:05" },
  { name: "erp-service", branch: "main", commit: "fix: cost rollup rounding", status: "success", duration: "4m 02s", time: "07:20" },
  { name: "notification-service", branch: "develop", commit: "feat: push retry policy", status: "running", duration: "1m 32s", time: "09:25" },
  { name: "web-frontend", branch: "feature/sidebar", commit: "UI: role filter update", status: "failed", duration: "1m 55s", time: "08:50" },
];

const summaryCards: { label: string; value: string; icon: ComponentType<{ className?: string; style?: React.CSSProperties }>; color: string; bg: string }[] = [
  { label: "サーバ稼働", value: "10/10", icon: Activity, color: "#16a34a", bg: "#f0fdf4" },
  { label: "DB接続", value: "210", icon: Zap, color: "#1a56db", bg: "#eff6ff" },
  { label: "バックアップ", value: "正常", icon: CheckCircle2, color: "#7c3aed", bg: "#f5f3ff" },
  { label: "CI/CDパイプライン", value: "4/5", icon: GitBranch, color: "#f97316", bg: "#fff7ed" },
  { label: "テスト", value: "451 PASS", icon: Shield, color: "#16a34a", bg: "#f0fdf4" },
];

const statusColor: Record<string, string> = { running: "#16a34a", warning: "#f97316", down: "#dc2626", healthy: "#16a34a", degraded: "#f97316" };
const pipeColor: Record<string, string> = { success: "#16a34a", running: "#1a56db", failed: "#dc2626" };
const pipeIcon: Record<string, ComponentType<{ className?: string; style?: React.CSSProperties }>> = { success: CheckCircle2, running: RefreshCw, failed: X };

const usageColor = (v: number) => (v > 80 ? "#dc2626" : v > 60 ? "#f97316" : "#16a34a");

function UsageBar({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 100 }}>
      <span style={{ fontSize: 9, color: T_FAINT, width: 26 }}>{label}</span>
      <div style={{ flex: 1, height: 5, background: BORDER_LIGHT, borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${value}%`, background: usageColor(value), borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 9, fontFamily: MONO, color: usageColor(value), fontWeight: 600, width: 28, textAlign: "right" }}>{value}%</span>
    </div>
  );
}

const sectionTitle: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: T_BODY, marginBottom: 16 };
const tableHead = (cols: string): React.CSSProperties => ({ display: "grid", gridTemplateColumns: cols, gap: 12, padding: "10px 14px", background: SUBTLE_BG, borderBottom: `1px solid ${BORDER}`, fontSize: 11, fontWeight: 600, color: T_FAINT });

export function SystemDesignView({ subPath }: { subPath?: string }) {
  const [activeTab, setActiveTab] = useState<SysTabId>((subPath && tabFromPath[subPath]) || "server");

  useEffect(() => {
    if (subPath && tabFromPath[subPath]) setActiveTab(tabFromPath[subPath]);
  }, [subPath]);

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: T_HEADING, margin: 0 }}>システム管理</h1>
        <p style={{ fontSize: 12, color: T_MUTED, marginTop: 2 }}>サーバ監視・DB管理・バックアップ・DevOps/CI-CD</p>
      </div>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 20 }}>
        {summaryCards.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} style={{ ...CARD, padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 6, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon aria-hidden="true" className="h-4 w-4" style={{ color: s.color }} />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: T_BODY }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: T_FAINT }}>{s.label}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={CARD}>
        <div style={{ display: "flex", borderBottom: `1px solid ${BORDER}`, padding: "0 16px", overflowX: "auto" }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{ padding: "8px 16px", fontSize: 12, fontWeight: activeTab === t.id ? 600 : 400, color: activeTab === t.id ? "#1a56db" : T_MUTED, cursor: "pointer", whiteSpace: "nowrap", background: "none", border: "none", borderBottom: activeTab === t.id ? "2px solid #1a56db" : "2px solid transparent", fontFamily: "inherit" }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ padding: 20 }}>
          {activeTab === "server" && (
            <div>
              <div style={sectionTitle}>インフラ一覧</div>
              <div style={{ borderRadius: 8, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
                <div style={tableHead("1.2fr 100px 140px 140px 140px 50px 80px")}>
                  <span>ホスト名</span><span>種別</span><span>CPU</span><span>メモリ</span><span>ディスク</span><span>状態</span><span>稼働時間</span>
                </div>
                {servers.map((s, i) => (
                  <div key={s.name} style={{ display: "grid", gridTemplateColumns: "1.2fr 100px 140px 140px 140px 50px 80px", gap: 8, padding: "10px 14px", alignItems: "center", borderBottom: i < servers.length - 1 ? `1px solid ${BORDER_LIGHT}` : "none", fontSize: 12 }}>
                    <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 500, color: T_BODY }}>{s.name}</span>
                    <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: BORDER_LIGHT, color: T_SECOND, fontWeight: 500 }}>{s.type}</span>
                    <UsageBar label="CPU" value={s.cpu} />
                    <UsageBar label="MEM" value={s.mem} />
                    <UsageBar label="DSK" value={s.disk} />
                    <span role="img" aria-label={s.status === "running" ? "稼働中" : s.status === "healthy" ? "正常" : s.status === "warning" ? "警告" : s.status === "degraded" ? "低下" : s.status === "down" ? "停止" : "障害"} title={s.status === "running" ? "稼働中" : s.status === "healthy" ? "正常" : s.status === "warning" ? "警告" : s.status === "degraded" ? "低下" : s.status === "down" ? "停止" : "障害"} style={{ width: 8, height: 8, borderRadius: "50%", background: statusColor[s.status] }} />
                    <span style={{ fontSize: 10, color: T_FAINT, fontFamily: MONO }}>{s.uptime}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "db" && (
            <div>
              <div style={sectionTitle}>データベース一覧</div>
              <div style={{ borderRadius: 8, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
                <div style={tableHead("1.2fr 80px 70px 80px 70px 80px")}>
                  <span>データベース</span><span>サイズ</span><span>テーブル</span><span>コネクション</span><span>状態</span><span>レプリケーション</span>
                </div>
                {databases.map((d, i) => (
                  <div key={d.name} style={{ display: "grid", gridTemplateColumns: "1.2fr 80px 70px 80px 70px 80px", gap: 12, padding: "12px 14px", alignItems: "center", borderBottom: i < databases.length - 1 ? `1px solid ${BORDER_LIGHT}` : "none", fontSize: 12 }}>
                    <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 500, color: T_BODY }}>{d.name}</span>
                    <span style={{ fontFamily: MONO, fontSize: 11, color: T_SECOND }}>{d.size}</span>
                    <span style={{ color: T_MUTED }}>{d.tables}</span>
                    <span style={{ fontFamily: MONO, fontSize: 11, color: T_SECOND }}>{d.connections}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor[d.status] }} />
                      <span style={{ fontSize: 10, color: statusColor[d.status], fontWeight: 500 }}>{d.status}</span>
                    </span>
                    <span style={{ fontSize: 10, color: T_MUTED }}>{d.replication}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "backup" && (
            <div>
              <div style={sectionTitle}>バックアップスケジュール</div>
              <div style={{ borderRadius: 8, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
                <div style={tableHead("1.5fr 130px 80px 80px 60px 130px")}>
                  <span>対象</span><span>最終実行</span><span>サイズ</span><span>所要時間</span><span>結果</span><span>次回</span>
                </div>
                {backups.map((b, i) => (
                  <div key={b.target} style={{ display: "grid", gridTemplateColumns: "1.5fr 130px 80px 80px 60px 130px", gap: 12, padding: "12px 14px", alignItems: "center", borderBottom: i < backups.length - 1 ? `1px solid ${BORDER_LIGHT}` : "none", fontSize: 12 }}>
                    <span style={{ fontWeight: 500, color: T_BODY }}>{b.target}</span>
                    <span style={{ fontFamily: MONO, fontSize: 10, color: T_MUTED }}>{b.lastRun}</span>
                    <span style={{ fontFamily: MONO, fontSize: 11, color: T_SECOND }}>{b.size}</span>
                    <span style={{ color: T_MUTED }}>{b.duration}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: "#16a34a" }}>{b.status}</span>
                    <span style={{ fontSize: 10, color: T_FAINT }}>{b.next}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "api" && (
            <div>
              <div style={sectionTitle}>API ヘルスチェック</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 16 }}>
                {apiCards.map((s) => (
                  <div key={s.label} style={{ padding: 14, borderRadius: 8, border: `1px solid ${BORDER}`, background: s.status === "healthy" ? "#f0fdf4" : "#fff7ed" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: T_BODY }}>{s.label}</span>
                      <span role="img" aria-label={s.status === "healthy" ? "正常" : "低下"} title={s.status === "healthy" ? "正常" : "低下"} style={{ width: 8, height: 8, borderRadius: "50%", background: s.status === "healthy" ? "#16a34a" : "#f97316" }} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <div><div style={{ fontSize: 9, color: T_FAINT }}>稼働率</div><div style={{ fontSize: 14, fontWeight: 700, color: T_BODY }}>{s.uptime}</div></div>
                      <div><div style={{ fontSize: 9, color: T_FAINT }}>平均遅延</div><div style={{ fontSize: 14, fontWeight: 700, color: T_BODY }}>{s.latency}</div></div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ borderRadius: 8, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
                <div style={tableHead("1.5fr 60px 80px 80px 80px 80px 60px")}>
                  <span>エンドポイント</span><span>メソッド</span><span>レスポンス</span><span>成功率</span><span>RPS</span><span>P99</span><span>状態</span>
                </div>
                {apiRows.map((a) => (
                  <div key={a.ep} style={{ display: "grid", gridTemplateColumns: "1.5fr 60px 80px 80px 80px 80px 60px", gap: 8, padding: "10px 14px", alignItems: "center", borderBottom: `1px solid ${BORDER_LIGHT}`, fontSize: 11 }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 500, color: T_BODY }}>{a.ep}</span>
                    <span style={{ fontSize: 9, fontWeight: 600, padding: "1px 4px", borderRadius: 3, background: a.method === "GET" ? "#dbeafe" : "#dcfce7", color: a.method === "GET" ? "#1e40af" : "#166534" }}>{a.method}</span>
                    <span style={{ fontFamily: MONO, fontSize: 10, color: T_SECOND }}>{a.avg}</span>
                    <span style={{ fontFamily: MONO, fontSize: 10, color: a.ok ? "#16a34a" : "#dc2626", fontWeight: 500 }}>{a.success}</span>
                    <span style={{ fontFamily: MONO, fontSize: 10, color: T_MUTED }}>{a.rps}</span>
                    <span style={{ fontFamily: MONO, fontSize: 10, color: T_MUTED }}>{a.p99}</span>
                    <span role="img" aria-label={a.ok ? "正常" : "低下"} title={a.ok ? "正常" : "低下"} style={{ width: 6, height: 6, borderRadius: "50%", background: a.ok ? "#16a34a" : "#f97316" }} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "devops" && (
            <div>
              <div style={sectionTitle}>CI/CD パイプライン (GitHub Actions)</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {pipelines.map((p) => {
                  const PipeIcon = pipeIcon[p.status];
                  return (
                    <div key={p.name} style={{ padding: 14, borderRadius: 8, border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: 12 }}>
                      <PipeIcon aria-hidden="true" className="h-[18px] w-[18px]" style={{ color: pipeColor[p.status], flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: T_BODY }}>{p.name}</span>
                          <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 4, background: BORDER_LIGHT, color: T_SECOND, fontFamily: MONO }}>{p.branch}</span>
                        </div>
                        <div style={{ fontSize: 11, color: T_MUTED, marginTop: 3 }}>{p.commit}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 11, fontWeight: 500, color: pipeColor[p.status] }}>{p.status === "running" ? "実行中..." : p.status}</div>
                        <div style={{ fontSize: 10, color: T_FAINT, marginTop: 2 }}>{p.duration} · {p.time}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 20, padding: 16, borderRadius: 8, background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <CheckCircle2 aria-hidden="true" className="h-[18px] w-[18px]" style={{ color: "#16a34a" }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#166534" }}>451 tests ALL PASS</span>
                  <span style={{ fontSize: 11, color: "#16a34a", marginLeft: "auto" }}>22サービス · 7パッケージ · 582ファイル</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
