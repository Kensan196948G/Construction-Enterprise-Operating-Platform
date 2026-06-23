"use client";

import { Fragment, useEffect, useState, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Folder, Shield, Users } from "lucide-react";
import { CARD, T_HEADING, T_BODY, T_SECOND, T_MUTED, BORDER, BORDER_LIGHT, SUBTLE_BG } from "@/lib/design/tokens";

// ────────────────────────────────────────────────────────────────────────────
// Claude Design — 共通基盤 (CommonPage faithful port). Section derived from
// subPath; each section uses an inline slide-tab panel.
// ────────────────────────────────────────────────────────────────────────────

const BG_CARD = "var(--bg-card, #fff)";
const ACCENT = "var(--accent, #1a56db)";
const ACCENT_LIGHT = "var(--accent-light, #eff6ff)";

function SlidePanel({ tabs, activeId, onChange, children }: { tabs: { id: string; label: string }[]; activeId: string; onChange: (id: string) => void; children: ReactNode[] }) {
  const idx = Math.max(0, tabs.findIndex((t) => t.id === activeId));
  return (
    <>
      <div style={{ display: "flex", borderBottom: `1px solid ${BORDER}`, padding: "0 8px", overflowX: "auto" }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            style={{ padding: "12px 16px", fontSize: 12, fontWeight: activeId === t.id ? 600 : 400, color: activeId === t.id ? "#1a56db" : T_MUTED, cursor: "pointer", whiteSpace: "nowrap", background: "none", border: "none", borderBottom: activeId === t.id ? "2px solid #1a56db" : "2px solid transparent", fontFamily: "inherit" }}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div style={{ overflow: "hidden" }}>
        <div style={{ display: "flex", transition: "transform 0.35s cubic-bezier(.4,0,.2,1)", transform: `translateX(-${idx * 100}%)` }}>
          {children.map((c, i) => (
            <div key={tabs[i].id} style={{ minWidth: "100%", flexShrink: 0 }}>{c}</div>
          ))}
        </div>
      </div>
    </>
  );
}

function AuthSessionsTable() {
  const sessions = [
    { user: "田中 健一", ip: "192.168.1.45", device: "Windows 11 / Chrome", login: "09:02", status: "active", mfa: true },
    { user: "佐藤 太郎", ip: "10.0.0.88", device: "macOS / Safari", login: "08:45", status: "active", mfa: true },
    { user: "山田 花子", ip: "172.16.0.12", device: "iPhone / Safari", login: "08:30", status: "active", mfa: true },
    { user: "鈴木 一郎", ip: "192.168.2.99", device: "Android / Chrome", login: "07:15", status: "idle", mfa: false },
  ];
  const stC: Record<string, string> = { active: "#16a34a", idle: "#f97316", expired: "#94a3b8" };
  const stL: Record<string, string> = { active: "アクティブ", idle: "アイドル", expired: "期限切れ" };
  return (
    <div style={{ borderRadius: 8, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 1.2fr 70px 80px 50px", gap: 12, padding: "8px 16px", background: SUBTLE_BG, borderBottom: `1px solid ${BORDER}`, fontSize: 11, fontWeight: 600, color: T_MUTED }}>
        <span>ユーザー</span><span>IP</span><span>デバイス</span><span>ログイン</span><span>状態</span><span>MFA</span>
      </div>
      {sessions.map((s, i) => (
        <div key={s.user} style={{ display: "grid", gridTemplateColumns: "1fr 120px 1.2fr 70px 80px 50px", gap: 12, padding: "10px 16px", alignItems: "center", borderBottom: i < sessions.length - 1 ? `1px solid ${BORDER_LIGHT}` : "none", fontSize: 12 }}>
          <span style={{ fontWeight: 500, color: T_BODY }}>{s.user}</span>
          <span style={{ color: T_MUTED, fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>{s.ip}</span>
          <span style={{ color: T_MUTED }}>{s.device}</span>
          <span style={{ color: T_MUTED }}>{s.login}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: stC[s.status] }} />
            <span style={{ fontSize: 11, color: stC[s.status], fontWeight: 500 }}>{stL[s.status]}</span>
          </span>
          <span>{s.mfa ? <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "#16a34a" }} /> : <AlertTriangle className="h-3.5 w-3.5" style={{ color: "#f97316" }} />}</span>
        </div>
      ))}
    </div>
  );
}

function UserListContent() {
  const users = [
    { name: "田中 健一", email: "tanaka@ceos.jp", role: "現場監督", dept: "施工管理部", status: "active" },
    { name: "佐藤 太郎", email: "sato@ceos.jp", role: "安全管理者", dept: "安全管理部", status: "active" },
    { name: "山田 花子", email: "yamada@ceos.jp", role: "設計担当", dept: "技術部", status: "active" },
    { name: "鈴木 一郎", email: "suzuki@ceos.jp", role: "経営層", dept: "経営企画部", status: "idle" },
    { name: "高橋 美咲", email: "takahashi@ceos.jp", role: "IT管理者", dept: "情報システム部", status: "active" },
    { name: "渡辺 誠", email: "watanabe@ceos.jp", role: "現場監督", dept: "施工管理部", status: "active" },
    { name: "伊藤 裕子", email: "ito@ceos.jp", role: "事務", dept: "総務部", status: "offline" },
    { name: "中村 大輔", email: "nakamura@ceos.jp", role: "協力会社", dept: "(株)中村建設", status: "active" },
  ];
  const rc: Record<string, string> = { 現場監督: "#f97316", 安全管理者: "#dc2626", 設計担当: "#7c3aed", 経営層: "#1a56db", IT管理者: "#16a34a", 事務: "#94a3b8", 協力会社: "#eab308" };
  const sd: Record<string, string> = { active: "#16a34a", idle: "#f97316", offline: "#d1d5db" };
  const stats = [
    { l: "総ユーザー数", v: "1,248", c: "#1a56db" },
    { l: "アクティブ", v: "342", c: "#16a34a" },
    { l: "MFA有効率", v: "94.2%", c: "#7c3aed" },
    { l: "協力会社", v: "186", c: "#f97316" },
  ];
  return (
    <Fragment>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 16 }}>
        {stats.map((s) => (
          <div key={s.l} style={{ padding: 12, borderRadius: 8, background: SUBTLE_BG, border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 6, background: s.c + "15", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users className="h-3.5 w-3.5" style={{ color: s.c }} />
            </div>
            <div><div style={{ fontSize: 10, color: T_MUTED }}>{s.l}</div><div style={{ fontSize: 18, fontWeight: 700, color: T_BODY }}>{s.v}</div></div>
          </div>
        ))}
      </div>
      <div style={{ borderRadius: 8, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.2fr 100px 120px 40px", gap: 12, padding: "8px 16px", background: SUBTLE_BG, borderBottom: `1px solid ${BORDER}`, fontSize: 11, fontWeight: 600, color: T_MUTED }}>
          <span>名前</span><span>メール</span><span>ロール</span><span>部署</span><span />
        </div>
        {users.map((u, i) => (
          <div key={u.email} style={{ display: "grid", gridTemplateColumns: "1.2fr 1.2fr 100px 120px 40px", gap: 12, padding: "10px 16px", alignItems: "center", borderBottom: i < users.length - 1 ? `1px solid ${BORDER_LIGHT}` : "none", fontSize: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: (rc[u.role] ?? "#94a3b8") + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: rc[u.role] ?? "#94a3b8" }}>{u.name[0]}</div>
              <span style={{ fontWeight: 500, color: T_BODY }}>{u.name}</span>
            </div>
            <span style={{ color: T_MUTED, fontSize: 11 }}>{u.email}</span>
            <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 10, background: (rc[u.role] ?? "#94a3b8") + "18", color: rc[u.role] ?? "#94a3b8" }}>{u.role}</span>
            <span style={{ color: T_MUTED, fontSize: 11 }}>{u.dept}</span>
            <span role="img" aria-label={u.status === "active" ? "アクティブ" : u.status === "idle" ? "アイドル" : "オフライン"} title={u.status === "active" ? "アクティブ" : u.status === "idle" ? "アイドル" : "オフライン"} style={{ width: 6, height: 6, borderRadius: "50%", background: sd[u.status] }} />
          </div>
        ))}
      </div>
    </Fragment>
  );
}

function RoleManagementContent() {
  const roles = [
    { name: "IT管理者", users: 5, perms: "全権限", color: "#16a34a" },
    { name: "経営層", users: 8, perms: "ダッシュボード, ERP, BI", color: "#1a56db" },
    { name: "現場監督", users: 42, perms: "現場DX, 文書, IoT, GIS", color: "#f97316" },
    { name: "安全管理者", users: 12, perms: "安全管理, IoT, 現場DX", color: "#dc2626" },
    { name: "設計担当", users: 18, perms: "文書, BIM, CAD", color: "#7c3aed" },
    { name: "協力会社", users: 186, perms: "協力会社ポータルのみ", color: "#eab308" },
    { name: "維持管理", users: 8, perms: "IoT, GIS, 文書", color: "#92400e" },
    { name: "事務", users: 15, perms: "ワークフロー, 文書", color: "#94a3b8" },
  ];
  return (
    <Fragment>
      <div style={{ fontSize: 13, fontWeight: 600, color: T_BODY, marginBottom: 16 }}>ロール・権限マトリクス</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {roles.map((r) => (
          <div key={r.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 8, border: `1px solid ${BORDER}`, background: SUBTLE_BG }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: r.color }} />
            <span style={{ width: 100, fontSize: 13, fontWeight: 600, color: T_BODY }}>{r.name}</span>
            <span style={{ width: 60, fontSize: 12, fontWeight: 600, color: r.color }}>{r.users}名</span>
            <span style={{ flex: 1, fontSize: 11, color: T_MUTED }}>{r.perms}</span>
            <button style={{ padding: "4px 10px", borderRadius: 4, border: `1px solid ${BORDER}`, background: BG_CARD, fontSize: 10, cursor: "pointer", color: ACCENT, fontFamily: "inherit" }}>編集</button>
          </div>
        ))}
      </div>
    </Fragment>
  );
}

function APIListContent() {
  const apis = [
    { name: "/api/v1/auth", method: "POST", status: "healthy", latency: "45ms", calls: "12,482", errors: "0.02%" },
    { name: "/api/v1/documents", method: "GET", status: "healthy", latency: "120ms", calls: "8,234", errors: "0.05%" },
    { name: "/api/v1/iot/sensors", method: "GET", status: "healthy", latency: "32ms", calls: "45,891", errors: "0.01%" },
    { name: "/api/v1/workflow", method: "POST", status: "degraded", latency: "580ms", calls: "3,421", errors: "1.2%" },
    { name: "/api/v1/gis/locations", method: "GET", status: "healthy", latency: "95ms", calls: "6,712", errors: "0.03%" },
    { name: "/api/v1/ai/chat", method: "POST", status: "healthy", latency: "1.2s", calls: "2,156", errors: "0.1%" },
    { name: "/api/v1/erp/costs", method: "GET", status: "healthy", latency: "210ms", calls: "1,890", errors: "0.04%" },
  ];
  const stC: Record<string, string> = { healthy: "#16a34a", degraded: "#f97316" };
  return (
    <div style={{ borderRadius: 8, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 70px 80px 80px 90px 70px", gap: 12, padding: "8px 14px", background: SUBTLE_BG, borderBottom: `1px solid ${BORDER}`, fontSize: 11, fontWeight: 600, color: T_MUTED }}>
        <span>エンドポイント</span><span>メソッド</span><span>状態</span><span>レイテンシ</span><span>リクエスト</span><span>エラー率</span>
      </div>
      {apis.map((a, i) => (
        <div key={a.name} style={{ display: "grid", gridTemplateColumns: "1.5fr 70px 80px 80px 90px 70px", gap: 12, padding: "10px 14px", alignItems: "center", borderBottom: i < apis.length - 1 ? `1px solid ${BORDER_LIGHT}` : "none", fontSize: 12 }}>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 500, color: T_BODY }}>{a.name}</span>
          <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 4, background: a.method === "GET" ? "#dbeafe" : "#dcfce7", color: a.method === "GET" ? "#1e40af" : "#166534" }}>{a.method}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: stC[a.status] }} />
            <span style={{ fontSize: 11, color: stC[a.status], fontWeight: 500 }}>{a.status}</span>
          </span>
          <span style={{ color: T_SECOND, fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>{a.latency}</span>
          <span style={{ color: T_MUTED }}>{a.calls}</span>
          <span style={{ color: parseFloat(a.errors) > 1 ? "#dc2626" : T_MUTED, fontWeight: parseFloat(a.errors) > 1 ? 600 : 400 }}>{a.errors}</span>
        </div>
      ))}
    </div>
  );
}

function APILogsContent() {
  const logs = [
    { time: "09:15:42", method: "POST", endpoint: "/api/v1/auth/login", status: 200, duration: "45ms", user: "田中 健一" },
    { time: "09:15:38", method: "GET", endpoint: "/api/v1/documents?project=shinagawa", status: 200, duration: "120ms", user: "佐藤 太郎" },
    { time: "09:15:35", method: "GET", endpoint: "/api/v1/iot/sensors/wind-3", status: 200, duration: "32ms", user: "System" },
    { time: "09:15:30", method: "POST", endpoint: "/api/v1/workflow/approve", status: 500, duration: "580ms", user: "山田 花子" },
    { time: "09:15:28", method: "GET", endpoint: "/api/v1/gis/locations", status: 200, duration: "95ms", user: "渡辺 誠" },
    { time: "09:15:22", method: "POST", endpoint: "/api/v1/ai/chat", status: 200, duration: "1.2s", user: "田中 健一" },
  ];
  return (
    <div style={{ borderRadius: 8, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
      <div style={{ display: "grid", gridTemplateColumns: "90px 50px 1.5fr 50px 60px 1fr", gap: 8, padding: "8px 14px", background: SUBTLE_BG, borderBottom: `1px solid ${BORDER}`, fontSize: 11, fontWeight: 600, color: T_MUTED }}>
        <span>時刻</span><span>メソッド</span><span>エンドポイント</span><span>Status</span><span>Duration</span><span>ユーザー</span>
      </div>
      {logs.map((l, i) => (
        <div key={l.time} style={{ display: "grid", gridTemplateColumns: "90px 50px 1.5fr 50px 60px 1fr", gap: 8, padding: "8px 14px", alignItems: "center", borderBottom: i < logs.length - 1 ? `1px solid ${BORDER_LIGHT}` : "none", fontSize: 11 }}>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", color: T_MUTED, fontSize: 10 }}>{l.time}</span>
          <span style={{ fontSize: 9, fontWeight: 600, padding: "1px 4px", borderRadius: 3, background: l.method === "GET" ? "#dbeafe" : "#dcfce7", color: l.method === "GET" ? "#1e40af" : "#166534" }}>{l.method}</span>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", color: T_BODY, fontSize: 10 }}>{l.endpoint}</span>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, color: l.status === 200 ? "#16a34a" : "#dc2626" }}>{l.status}</span>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", color: T_MUTED, fontSize: 10 }}>{l.duration}</span>
          <span style={{ color: T_MUTED }}>{l.user}</span>
        </div>
      ))}
    </div>
  );
}

function MasterDataContent() {
  const masters = [
    { name: "工事種別マスタ", records: 48, updated: "2026/05/20", owner: "管理部" },
    { name: "工種マスタ", records: 215, updated: "2026/05/18", owner: "技術部" },
    { name: "資材マスタ", records: 3842, updated: "2026/05/24", owner: "購買部" },
    { name: "協力会社マスタ", records: 186, updated: "2026/05/22", owner: "外注管理部" },
    { name: "社員マスタ", records: 1248, updated: "2026/05/24", owner: "人事部" },
    { name: "重機マスタ", records: 94, updated: "2026/05/15", owner: "機械部" },
    { name: "単価マスタ", records: 5621, updated: "2026/05/23", owner: "積算部" },
  ];
  return (
    <div style={{ borderRadius: 8, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 100px 120px 100px 60px", gap: 12, padding: "8px 16px", background: SUBTLE_BG, borderBottom: `1px solid ${BORDER}`, fontSize: 11, fontWeight: 600, color: T_MUTED }}>
        <span>マスタ名</span><span>レコード数</span><span>最終更新</span><span>管理部門</span><span />
      </div>
      {masters.map((m, i) => (
        <div key={m.name} style={{ display: "grid", gridTemplateColumns: "1.5fr 100px 120px 100px 60px", gap: 12, padding: "10px 16px", alignItems: "center", borderBottom: i < masters.length - 1 ? `1px solid ${BORDER_LIGHT}` : "none", fontSize: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: 4, background: ACCENT_LIGHT, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Folder className="h-3 w-3" style={{ color: ACCENT }} />
            </div>
            <span style={{ fontWeight: 500, color: T_BODY }}>{m.name}</span>
          </div>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", color: T_SECOND }}>{m.records.toLocaleString()}</span>
          <span style={{ color: T_MUTED }}>{m.updated}</span>
          <span style={{ color: T_MUTED }}>{m.owner}</span>
          <button style={{ padding: "4px 10px", borderRadius: 4, border: `1px solid ${BORDER}`, background: BG_CARD, fontSize: 10, cursor: "pointer", color: ACCENT, fontFamily: "inherit" }}>編集</button>
        </div>
      ))}
    </div>
  );
}

function SystemConfigContent() {
  const rows: [string, string][] = [
    ["システム名", "Construction Enterprise OS"],
    ["バージョン", "v0.1.0 (Build 18)"],
    ["環境", "Production"],
    ["データベース", "PostgreSQL 16 + PostGIS + TimescaleDB"],
    ["キャッシュ", "Redis 7"],
    ["メッセージキュー", "Apache Kafka 3.7"],
    ["検索エンジン", "Elasticsearch 8.14"],
    ["ストレージ", "MinIO (S3互換)"],
    ["認証", "JWT (RS256) + MFA (TOTP)"],
    ["テスト", "451 tests ALL PASS"],
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {rows.map(([k, v]) => (
        <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderRadius: 8, background: SUBTLE_BG, border: `1px solid ${BORDER}`, fontSize: 12 }}>
          <span style={{ color: T_MUTED, fontWeight: 500 }}>{k}</span>
          <span style={{ color: T_BODY, fontWeight: 600 }}>{v}</span>
        </div>
      ))}
    </div>
  );
}

// ── Auth tab panels ──
const entraInfo: [string, string][] = [["テナントID", "xxxxxxxx-xxxx-xxxx-xxxx"], ["同期ユーザー", "1,248"], ["最終同期", "2026/05/24 09:12"], ["同期間隔", "30分"]];
const entraStats: [string, string, string][] = [["グループ同期", "42グループ", "#16a34a"], ["アプリ登録", "8アプリ", "#1a56db"], ["条件付きアクセス", "5ポリシー", "#7c3aed"], ["サービスプリンシパル", "12", "#f97316"]];
const adStats = [{ l: "同期ユーザー", v: "1,186", c: "#1a56db" }, { l: "OU数", v: "24", c: "#7c3aed" }, { l: "最終同期", v: "08:00", c: "#16a34a" }];
const adInfo: [string, string][] = [["ドメイン", "ceos.local"], ["ドメインコントローラ", "DC01, DC02 (冗長化)"], ["LDAP接続", "LDAPS (636)"], ["同期モード", "Delta Sync"], ["パスワードハッシュ同期", "有効"]];
const mfaStats = [{ l: "MFA有効率", v: "94.2%", c: "#16a34a" }, { l: "TOTP登録", v: "1,176", c: "#1a56db" }, { l: "SMS認証", v: "72", c: "#f97316" }, { l: "未設定", v: "72", c: "#dc2626" }];
const mfaBreakdown: [string, number, string, number][] = [["TOTP (Authenticator)", 1176, "#1a56db", 94], ["SMS認証", 72, "#f97316", 6]];
const ssoStats = [{ l: "SSO対応アプリ", v: "8", c: "#1a56db" }, { l: "本日SSO認証", v: "842", c: "#16a34a" }];
const ssoApps: [string, string, string][] = [["Construction Enterprise OS", "SAML 2.0", "有効"], ["Microsoft 365", "OpenID Connect", "有効"], ["Box (文書管理)", "SAML 2.0", "有効"], ["Slack", "OAuth 2.0", "有効"], ["HENNGE One", "SAML 2.0", "有効"], ["Autodesk BIM 360", "SAML 2.0", "有効"], ["GIS Platform", "OAuth 2.0", "有効"], ["IoT Dashboard", "JWT", "有効"]];

const statCard: React.CSSProperties = { padding: 14, borderRadius: 8, background: SUBTLE_BG, border: `1px solid ${BORDER}`, textAlign: "center" };

const authTabFromPath: Record<string, string> = {
  "/common/auth-entra": "entra",
  "/common/auth-ad": "ad",
  "/common/auth-mfa": "mfa",
  "/common/auth-sso": "sso",
  "/common/auth/entra": "entra",
  "/common/auth/ad": "ad",
  "/common/auth/mfa": "mfa",
  "/common/auth/sso": "sso",
};

export function CommonDesignView({ subPath = "/common/auth-entra" }: { subPath?: string }) {
  const section = subPath.includes("/auth") ? "auth" : subPath.includes("/users") || subPath.includes("/roles") ? "users" : subPath.includes("/api") ? "api" : "master";

  const [authTab, setAuthTab] = useState<string>(authTabFromPath[subPath] || "entra");
  const [userTab, setUserTab] = useState<string>(subPath === "/common/roles" ? "roles" : "list");
  const [apiTab, setApiTab] = useState<string>(subPath === "/common/api/logs" || subPath === "/common/api-logs" ? "logs" : "list");
  const [masterTab, setMasterTab] = useState<string>(subPath === "/common/config" ? "config" : "data");

  useEffect(() => {
    if (authTabFromPath[subPath]) setAuthTab(authTabFromPath[subPath]);
    if (subPath === "/common/roles") setUserTab("roles");
    if (subPath === "/common/users") setUserTab("list");
    if (subPath === "/common/api/logs" || subPath === "/common/api-logs") setApiTab("logs");
    if (subPath === "/common/api") setApiTab("list");
    if (subPath === "/common/config") setMasterTab("config");
    if (subPath === "/common/master") setMasterTab("data");
  }, [subPath]);

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: T_HEADING, margin: 0 }}>共通基盤</h1>
        <p style={{ fontSize: 12, color: T_MUTED, marginTop: 2 }}>認証・ユーザー・API・マスタデータの統合管理</p>
      </div>

      {section === "auth" && (
        <div style={CARD}>
          <SlidePanel
            tabs={[{ id: "entra", label: "Entra ID" }, { id: "ad", label: "AD連携" }, { id: "mfa", label: "MFA" }, { id: "sso", label: "SSO" }]}
            activeId={authTab}
            onChange={setAuthTab}
          >
            {/* Entra ID */}
            <div style={{ padding: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div style={{ padding: 16, borderRadius: 8, background: SUBTLE_BG, border: `1px solid ${BORDER}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <Shield aria-hidden="true" className="h-[18px] w-[18px]" style={{ color: "#1a56db" }} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: T_BODY }}>Entra ID (Azure AD)</span>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 10, background: "#dcfce7", color: "#166534", marginLeft: "auto" }}>接続中</span>
                  </div>
                  {entraInfo.map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${BORDER_LIGHT}`, fontSize: 12 }}>
                      <span style={{ color: T_MUTED }}>{k}</span>
                      <span style={{ color: T_BODY, fontWeight: 500, fontFamily: k === "テナントID" ? "'JetBrains Mono',monospace" : "inherit" }}>{v}</span>
                    </div>
                  ))}
                </div>
                <div style={{ padding: 16, borderRadius: 8, background: SUBTLE_BG, border: `1px solid ${BORDER}` }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T_BODY, marginBottom: 12 }}>同期統計</div>
                  {entraStats.map(([k, v, c]) => (
                    <div key={k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderRadius: 6, marginBottom: 4, background: c + "10" }}>
                      <span style={{ fontSize: 12, color: T_SECOND }}>{k}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: c }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <AuthSessionsTable />
            </div>

            {/* AD連携 */}
            <div style={{ padding: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 16 }}>
                {adStats.map((s) => (
                  <div key={s.l} style={statCard}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: s.c }}>{s.v}</div>
                    <div style={{ fontSize: 11, color: T_MUTED, marginTop: 2 }}>{s.l}</div>
                  </div>
                ))}
              </div>
              <div style={{ padding: 14, borderRadius: 8, background: SUBTLE_BG, border: `1px solid ${BORDER}` }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T_BODY, marginBottom: 10 }}>AD Forest構成</div>
                {adInfo.map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${BORDER_LIGHT}`, fontSize: 12 }}>
                    <span style={{ color: T_MUTED }}>{k}</span>
                    <span style={{ color: T_BODY, fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* MFA */}
            <div style={{ padding: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 16 }}>
                {mfaStats.map((s) => (
                  <div key={s.l} style={statCard}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: s.c }}>{s.v}</div>
                    <div style={{ fontSize: 11, color: T_MUTED, marginTop: 2 }}>{s.l}</div>
                  </div>
                ))}
              </div>
              <div style={{ padding: 12, borderRadius: 8, background: "#fef2f2", border: "1px solid #fecaca", display: "flex", alignItems: "center", gap: 10, marginBottom: 16, fontSize: 12, color: "#991b1b" }}>
                <AlertTriangle aria-hidden="true" className="h-3.5 w-3.5" style={{ color: "#dc2626" }} />72名のユーザーがMFA未設定です。セキュリティポリシーに基づき設定を促進してください。
              </div>
              <div style={{ padding: 14, borderRadius: 8, background: SUBTLE_BG, border: `1px solid ${BORDER}` }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T_BODY, marginBottom: 10 }}>MFA方式別内訳</div>
                {mfaBreakdown.map(([method, count, color, pct]) => (
                  <div key={method} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: `1px solid ${BORDER_LIGHT}` }}>
                    <span style={{ flex: 1, fontSize: 12, color: T_SECOND }}>{method}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color }}>{count}名</span>
                    <div style={{ width: 100, height: 6, background: BORDER, borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SSO */}
            <div style={{ padding: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
                {ssoStats.map((s) => (
                  <div key={s.l} style={statCard}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: s.c }}>{s.v}</div>
                    <div style={{ fontSize: 11, color: T_MUTED, marginTop: 2 }}>{s.l}</div>
                  </div>
                ))}
              </div>
              <div style={{ padding: 14, borderRadius: 8, background: SUBTLE_BG, border: `1px solid ${BORDER}` }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T_BODY, marginBottom: 10 }}>SSO連携アプリ一覧</div>
                {ssoApps.map(([app, protocol, status]) => (
                  <div key={app} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 60px", gap: 12, padding: "8px 0", borderBottom: `1px solid ${BORDER_LIGHT}`, fontSize: 12, alignItems: "center" }}>
                    <span style={{ fontWeight: 500, color: T_BODY }}>{app}</span>
                    <span style={{ color: T_MUTED, fontSize: 11 }}>{protocol}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: "#16a34a", display: "flex", alignItems: "center", gap: 3 }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#16a34a" }} />{status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </SlidePanel>
        </div>
      )}

      {section === "users" && (
        <div style={CARD}>
          <SlidePanel tabs={[{ id: "list", label: "ユーザー一覧" }, { id: "roles", label: "権限管理" }]} activeId={userTab} onChange={setUserTab}>
            <div style={{ padding: 20 }}><UserListContent /></div>
            <div style={{ padding: 20 }}><RoleManagementContent /></div>
          </SlidePanel>
        </div>
      )}

      {section === "api" && (
        <div style={CARD}>
          <SlidePanel tabs={[{ id: "list", label: "API一覧" }, { id: "logs", label: "APIログ" }]} activeId={apiTab} onChange={setApiTab}>
            <div style={{ padding: 20 }}><APIListContent /></div>
            <div style={{ padding: 20 }}><APILogsContent /></div>
          </SlidePanel>
        </div>
      )}

      {section === "master" && (
        <div style={CARD}>
          <SlidePanel tabs={[{ id: "data", label: "マスタデータ" }, { id: "config", label: "システム設定" }]} activeId={masterTab} onChange={setMasterTab}>
            <div style={{ padding: 20 }}><MasterDataContent /></div>
            <div style={{ padding: 20 }}><SystemConfigContent /></div>
          </SlidePanel>
        </div>
      )}
    </div>
  );
}
