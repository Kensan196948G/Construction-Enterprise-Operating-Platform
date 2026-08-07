import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import api from "@/api/client";
import {
  notificationPreferencesApi,
  type NotificationPreferences,
} from "@/api/notificationPreferences";
import {
  Settings, Shield, FileText, Plug, Bell, User, Lock,
  Server, HardDrive, Clock, Globe, CheckCircle2, AlertTriangle,
  Eye, EyeOff, RefreshCw, Save, Building2, Zap,
  Users, UserPlus, UserCheck, UserX, Key, LogIn, Trash2,
} from "lucide-react";

interface PasswordForm {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "管理者",
  PROJECT_MANAGER: "プロジェクトマネージャー",
  SITE_SUPERVISOR: "現場監督",
  COST_MANAGER: "原価管理",
  WORKER: "作業員",
  VIEWER: "閲覧者",
};

const EVENT_LABELS: Record<string, string> = {
  daily_report_submitted: "日報提出時",
  safety_incident_created: "安全インシデント発生時",
  change_request_pending_approval: "変更要求承認待ち",
  incident_assigned: "ITSM インシデント割当時",
  project_status_changed: "案件ステータス変更時",
};

const SYSTEM_INFO = [
  { label: "アプリケーション",  value: "ServiceHub 工事管理プラットフォーム" },
  { label: "バージョン",        value: "v1.4.2" },
  { label: "環境",              value: "Development" },
  { label: "バックエンド",      value: "FastAPI 0.136 / Python 3.12" },
  { label: "フロントエンド",    value: "React 18.3 / TypeScript 5.9" },
  { label: "データベース",      value: "PostgreSQL 15" },
  { label: "キャッシュ",        value: "Redis 7" },
  { label: "ストレージ",        value: "MinIO (S3互換)" },
  { label: "最終デプロイ",      value: "2026-05-20 10:49 JST" },
  { label: "稼働時間",          value: "7 日 16 時間 52 分" },
];

const BACKUP_HISTORY = [
  { id: "BK-0042", date: "2026-05-20 03:00", size: "2.1 GB", status: "success", type: "自動" },
  { id: "BK-0041", date: "2026-05-19 03:00", size: "2.0 GB", status: "success", type: "自動" },
  { id: "BK-0040", date: "2026-05-18 03:00", size: "1.9 GB", status: "success", type: "自動" },
  { id: "BK-0039", date: "2026-05-17 03:00", size: "1.9 GB", status: "success", type: "自動" },
  { id: "BK-0038", date: "2026-05-16 03:00", size: "1.8 GB", status: "failed",  type: "自動" },
  { id: "BK-0037", date: "2026-05-15 14:12", size: "1.8 GB", status: "success", type: "手動" },
  { id: "BK-0036", date: "2026-05-15 03:00", size: "1.8 GB", status: "success", type: "自動" },
  { id: "BK-0035", date: "2026-05-14 03:00", size: "1.7 GB", status: "success", type: "自動" },
  { id: "BK-0034", date: "2026-05-13 03:00", size: "1.7 GB", status: "success", type: "自動" },
  { id: "BK-0033", date: "2026-05-12 03:00", size: "1.6 GB", status: "success", type: "自動" },
];

const LOG_ENTRIES = [
  { ts: "2026-05-20 10:49:18", level: "INFO",  msg: "Frontend Docker イメージを再ビルドしました" },
  { ts: "2026-05-20 09:32:01", level: "INFO",  msg: "ユーザー admin@example.com がログインしました" },
  { ts: "2026-05-20 09:12:44", level: "WARN",  msg: "原価記録 c8a2 が削除されました (by admin)" },
  { ts: "2026-05-20 08:44:14", level: "ERROR", msg: "不明 IP (203.0.113.99) からの認証試行 × 3 回 — ブロック" },
  { ts: "2026-05-20 08:30:00", level: "INFO",  msg: "デモデータシード完了: photos=10 quality=10" },
  { ts: "2026-05-20 03:00:02", level: "INFO",  msg: "自動バックアップ完了: BK-0042 (2.1 GB)" },
  { ts: "2026-05-19 18:00:00", level: "INFO",  msg: "日次レポート生成完了" },
  { ts: "2026-05-19 17:55:00", level: "WARN",  msg: "変更要求 CRQ-2026-011 をリスク:高 で承認" },
  { ts: "2026-05-19 17:20:33", level: "WARN",  msg: "ユーザー test@example.com を無効化 (by admin)" },
  { ts: "2026-05-19 16:00:00", level: "INFO",  msg: "安全確認 2026-05-19 — 15項目 全て完了" },
];

type ManagedUser = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  last_login: string | null;
};

const INITIAL_USERS: ManagedUser[] = [
  { id: "1", email: "admin@example.com",      full_name: "システム管理者",  role: "ADMIN",           is_active: true,  last_login: "2026-05-20 09:32" },
  { id: "2", email: "pm@example.com",          full_name: "工事部長 田中",    role: "PROJECT_MANAGER", is_active: true,  last_login: "2026-05-20 08:15" },
  { id: "3", email: "supervisor@example.com",  full_name: "現場監督 鈴木",    role: "SITE_SUPERVISOR", is_active: true,  last_login: "2026-05-19 17:30" },
  { id: "4", email: "cost@example.com",        full_name: "原価管理 山田",    role: "COST_MANAGER",    is_active: true,  last_login: "2026-05-20 07:55" },
  { id: "5", email: "safety@example.com",      full_name: "安全管理 高橋",    role: "SAFETY_OFFICER",  is_active: true,  last_login: "2026-05-19 15:00" },
  { id: "6", email: "itop@example.com",        full_name: "IT運用 佐藤",      role: "IT_OPERATOR",     is_active: true,  last_login: "2026-05-18 10:20" },
  { id: "7", email: "viewer@example.com",      full_name: "閲覧ユーザー",    role: "VIEWER",          is_active: false, last_login: "2026-05-17 11:00" },
];

type RoleMapping = { id: string; group: string; role: string };
const INITIAL_ROLE_MAPPING: RoleMapping[] = [
  { id: "rm-1", group: "ServiceHub-Admins",       role: "ADMIN" },
  { id: "rm-2", group: "ServiceHub-PMs",           role: "PROJECT_MANAGER" },
  { id: "rm-3", group: "ServiceHub-Supervisors",   role: "SITE_SUPERVISOR" },
  { id: "rm-4", group: "ServiceHub-CostManagers",  role: "COST_MANAGER" },
  { id: "rm-5", group: "ServiceHub-Workers",       role: "VIEWER" },
];

type ApiIntegration = {
  name: string;
  key: string;
  status: "connected" | "disconnected" | "pending";
  desc: string;
  category: string;
  value: string;
  lastTested?: string;
};

const INITIAL_APIS: ApiIntegration[] = [
  { name: "Anthropic Claude API", key: "ANTHROPIC_API_KEY", status: "connected",    desc: "Legal Tech 契約解析・AI 分析",   category: "AI",        value: "sk-ant-api03-••••••••", lastTested: "2026-05-20 09:30" },
  { name: "OpenAI API",           key: "OPENAI_API_KEY",    status: "disconnected", desc: "ナレッジ AI 検索",               category: "AI",        value: "" },
  { name: "MinIO S3",             key: "MINIO_ENDPOINT",    status: "connected",    desc: "写真・資料ストレージ",           category: "Storage",   value: "minio:9000",           lastTested: "2026-05-20 09:00" },
  { name: "SMTP メール",          key: "SMTP_HOST",         status: "connected",    desc: "通知メール送信",                category: "通知",      value: "mailhog",              lastTested: "2026-05-20 08:00" },
  { name: "Slack Webhook",        key: "SLACK_WEBHOOK_URL", status: "disconnected", desc: "Slack 通知連携",               category: "通知",      value: "" },
  { name: "Prometheus",           key: "PROMETHEUS_URL",    status: "connected",    desc: "メトリクス収集・監視",           category: "監視",      value: "http://prometheus:9090", lastTested: "2026-05-20 09:00" },
  { name: "Grafana",              key: "GRAFANA_URL",       status: "connected",    desc: "ダッシュボード可視化",           category: "監視",      value: "http://grafana:3000",   lastTested: "2026-05-20 09:00" },
  { name: "GitHub Actions",       key: "GITHUB_TOKEN",      status: "connected",    desc: "CI/CD パイプライン",            category: "DevOps",    value: "ghp_••••••••",         lastTested: "2026-05-20 00:41" },
  { name: "CodeRabbit",           key: "CODERABBIT_TOKEN",  status: "connected",    desc: "AI コードレビュー",             category: "DevOps",    value: "cr-••••••••",          lastTested: "2026-05-20 00:44" },
  { name: "CCUS API",             key: "CCUS_API_KEY",      status: "pending",      desc: "建設キャリアアップシステム（準備中）", category: "業界", value: "" },
];

type SettingsTab = "profile" | "security" | "notifications" | "m365" | "api" | "system" | "backup" | "logs";

const TABS: { key: SettingsTab; label: string; icon: typeof Settings }[] = [
  { key: "profile",       label: "ユーザー設定",       icon: User },
  { key: "security",      label: "セキュリティ",        icon: Lock },
  { key: "notifications", label: "通知設定",            icon: Bell },
  { key: "m365",          label: "Microsoft 365",      icon: Building2 },
  { key: "api",           label: "API 連携",            icon: Plug },
  { key: "system",        label: "システム情報",        icon: Server },
  { key: "backup",        label: "バックアップ",        icon: HardDrive },
  { key: "logs",          label: "システムログ",        icon: FileText },
];

function Section({ title, icon: Icon, children, "data-testid": testId }: {
  title: string; icon: typeof Settings; children: React.ReactNode; "data-testid"?: string;
}) {
  return (
    <section data-testid={testId} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
        <Icon className="w-5 h-5 text-primary-600" />
        {title}
      </h2>
      {children}
    </section>
  );
}

function StatusBadge({ status }: { status: ApiIntegration["status"] }) {
  if (status === "connected")
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 whitespace-nowrap"><CheckCircle2 className="w-3 h-3" />接続済</span>;
  if (status === "pending")
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 whitespace-nowrap"><Clock className="w-3 h-3" />準備中</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 whitespace-nowrap"><AlertTriangle className="w-3 h-3" />未接続</span>;
}

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

  // ── パスワード変更 ────────────────────────────────────────────
  const [form, setForm] = useState<PasswordForm>({ current_password: "", new_password: "", confirm_password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ── プロフィール編集 ──────────────────────────────────────────
  const [profileForm, setProfileForm] = useState({ full_name: user?.full_name ?? "", email: user?.email ?? "", phone: "", department: "工事部" });
  const [profileSaved, setProfileSaved] = useState(false);

  // ── 通知設定 ─────────────────────────────────────────────────
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [prefsSuccessMsg, setPrefsSuccessMsg] = useState<string | null>(null);
  const [prefsErrorMsg, setPrefsErrorMsg] = useState<string | null>(null);

  // ── Microsoft 365 / EntraID 設定 ──────────────────────────────
  const [m365, setM365] = useState({
    tenantId: "",
    clientId: "",
    clientSecret: "",
    authFlow: "client_credentials" as "client_credentials" | "device_code",
    scopes: "https://graph.microsoft.com/.default",
    userPrincipalSync: true,
    groupSync: false,
    syncInterval: 60,
    enabled: false,
  });
  const [m365ShowSecret, setM365ShowSecret] = useState(false);
  const [m365Testing, setM365Testing] = useState(false);
  const [m365TestResult, setM365TestResult] = useState<"success" | "error" | null>(null);
  const [m365Saved, setM365Saved] = useState(false);

  // ── API 連携 ─────────────────────────────────────────────────
  const [apis, setApis] = useState<ApiIntegration[]>(INITIAL_APIS);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [testingApi, setTestingApi] = useState<string | null>(null);

  // ── ユーザー管理 ─────────────────────────────────────────────
  const [userList, setUserList] = useState<ManagedUser[]>(INITIAL_USERS);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("VIEWER");
  const [inviteSent, setInviteSent] = useState(false);

  // ── M365 SSO ────────────────────────────────────────────────
  const [m365Sso, setM365Sso] = useState({
    enabled: false,
    buttonText: "Microsoft アカウントでサインイン",
    allowLocalLogin: true,
    autoProvision: true,
  });
  const [roleMapping, setRoleMapping] = useState<RoleMapping[]>(INITIAL_ROLE_MAPPING);
  const [newGroup, setNewGroup] = useState("");
  const [newRole, setNewRole] = useState("VIEWER");
  const [m365SsoSaved, setM365SsoSaved] = useState(false);

  // ── アプリ設定 ────────────────────────────────────────────────
  const [appSettings, setAppSettings] = useState({
    language: "ja", timezone: "Asia/Tokyo", dateFormat: "YYYY-MM-DD",
    sessionTimeout: 60, maxLoginAttempts: 5, passwordMinLength: 8, requireUppercase: true,
    backupSchedule: "daily", backupRetentionDays: 30,
    logLevel: "INFO", logRetentionDays: 90,
  });
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    notificationPreferencesApi.get()
      .then((data) => { if (!cancelled) setPrefs(data); })
      .catch(() => { if (!cancelled) setPrefsErrorMsg("通知設定の取得に失敗しました"); })
      .finally(() => { if (!cancelled) setPrefsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.new_password !== form.confirm_password) { setErrorMsg("新しいパスワードが一致しません"); return; }
    if (form.new_password.length < 8) { setErrorMsg("パスワードは8文字以上で入力してください"); return; }
    setSubmitting(true);
    try {
      await api.patch("/users/me/password", { current_password: form.current_password, new_password: form.new_password });
      setSuccessMsg("パスワードを変更しました");
      setForm({ current_password: "", new_password: "", confirm_password: "" });
    } catch { setErrorMsg("パスワードの変更に失敗しました"); }
    finally { setSubmitting(false); }
  };

  const handleSavePrefs = async () => {
    if (!prefs) return;
    setPrefsSaving(true);
    try {
      const updated = await notificationPreferencesApi.update({
        email_enabled: prefs.email_enabled, slack_enabled: prefs.slack_enabled,
        slack_webhook_url: prefs.slack_webhook_url, events: prefs.events,
      });
      setPrefs(updated);
      setPrefsSuccessMsg("通知設定を保存しました");
    } catch { setPrefsErrorMsg("通知設定の保存に失敗しました"); }
    finally { setPrefsSaving(false); }
  };

  const handleSaveSettings = () => {
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2500);
  };

  const handleProfileSave = () => {
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  // M365 接続テスト（模擬）
  const handleM365Test = async () => {
    setM365Testing(true);
    setM365TestResult(null);
    await new Promise(r => setTimeout(r, 1500));
    setM365TestResult(m365.tenantId && m365.clientId && m365.clientSecret ? "success" : "error");
    setM365Testing(false);
  };

  const handleM365Save = () => {
    setM365Saved(true);
    setTimeout(() => setM365Saved(false), 2500);
  };

  // API 連携: 接続テスト（模擬）
  const handleApiTest = async (key: string) => {
    setTestingApi(key);
    await new Promise(r => setTimeout(r, 1200));
    const now = new Date().toLocaleString("ja-JP", { hour12: false }).replace(",", "");
    setApis(prev => prev.map(a => a.key === key
      ? { ...a, status: a.value ? "connected" : "disconnected", lastTested: now }
      : a));
    setTestingApi(null);
  };

  const handleApiSave = (key: string) => {
    setApis(prev => prev.map(a => a.key === key
      ? { ...a, value: editValue, status: editValue ? "connected" : "disconnected" }
      : a));
    setEditingKey(null);
  };

  const handleInviteUser = () => {
    if (!inviteEmail) return;
    const newUser: ManagedUser = {
      id: `tmp-${Date.now()}`, email: inviteEmail, full_name: inviteEmail.split("@")[0],
      role: inviteRole, is_active: true, last_login: null,
    };
    setUserList(prev => [...prev, newUser]);
    setInviteEmail("");
    setInviteSent(true);
    setTimeout(() => setInviteSent(false), 2500);
  };

  const handleToggleUser = (id: string) =>
    setUserList(prev => prev.map(u => u.id === id ? { ...u, is_active: !u.is_active } : u));

  const handleRoleChange = (id: string, role: string) =>
    setUserList(prev => prev.map(u => u.id === id ? { ...u, role } : u));

  const handleAddMapping = () => {
    if (!newGroup) return;
    setRoleMapping(prev => [...prev, { id: `rm-${Date.now()}`, group: newGroup, role: newRole }]);
    setNewGroup("");
  };

  const handleRemoveMapping = (id: string) =>
    setRoleMapping(prev => prev.filter(m => m.id !== id));

  const handleSaveM365Sso = () => {
    setM365SsoSaved(true);
    setTimeout(() => setM365SsoSaved(false), 2500);
  };

  const authorityUrl = m365.tenantId
    ? `https://login.microsoftonline.com/${m365.tenantId}/v2.0`
    : "https://login.microsoftonline.com/{tenant_id}/v2.0";

  const inputCls = "w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500";
  const btnPrimary = "inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 disabled:opacity-50 transition-colors";
  const btnSecondary = "inline-flex items-center gap-1.5 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors";

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
        <Settings className="w-7 h-7 text-primary-600" />
        システム設定
      </h1>

      {/* タブ */}
      <div className="flex flex-wrap gap-1 border-b border-gray-200 dark:border-gray-700">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === key
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {/* ── ユーザー設定 ── */}
      {activeTab === "profile" && (
        <div className="space-y-4">
          <Section title="プロフィール情報" icon={User}>
            <div className="space-y-4 max-w-lg">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-primary-600 text-white flex items-center justify-center text-2xl font-bold flex-shrink-0">
                  {(user?.full_name ?? user?.email ?? "?").slice(0, 2)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{user?.full_name ?? "—"}</p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                  <p className="text-sm text-gray-500">{ROLE_LABELS[user?.role ?? ""] ?? user?.role}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">氏名</label>
                  <input type="text" className={inputCls} value={profileForm.full_name}
                    onChange={e => setProfileForm(p => ({ ...p, full_name: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">部署</label>
                  <input type="text" className={inputCls} value={profileForm.department}
                    onChange={e => setProfileForm(p => ({ ...p, department: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">メールアドレス</label>
                <input type="email" className={inputCls} value={profileForm.email}
                  onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">電話番号（任意）</label>
                <input type="tel" className={inputCls} value={profileForm.phone}
                  onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder="090-0000-0000" />
              </div>
              <button onClick={handleProfileSave} className={btnPrimary}>
                <Save className="w-4 h-4" />
                {profileSaved ? "✅ 保存しました" : "プロフィールを保存"}
              </button>
            </div>
          </Section>

          <Section title="パスワード変更" icon={Lock}>
            {successMsg && <div role="status" className="mb-4 p-3 rounded bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm">{successMsg}</div>}
            {errorMsg   && <div role="alert"  className="mb-4 p-3 rounded bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">{errorMsg}</div>}
            <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
              {([
                ["current_password", "現在のパスワード"],
                ["new_password",     "新しいパスワード"],
                ["confirm_password", "新しいパスワード（確認）"],
              ] as const).map(([name, label]) => (
                <div key={name}>
                  <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
                  <input id={name} name={name} type="password" required
                    value={form[name]} onChange={e => { setForm(p => ({ ...p, [name]: e.target.value })); setSuccessMsg(null); setErrorMsg(null); }}
                    className={inputCls} />
                </div>
              ))}
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={submitting} className={btnPrimary}>
                  {submitting ? "更新中…" : "パスワードを変更"}
                </button>
                <button type="button" onClick={() => { setForm({ current_password: "", new_password: "", confirm_password: "" }); setSuccessMsg(null); setErrorMsg(null); }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                  キャンセル
                </button>
              </div>
            </form>
          </Section>

          {/* ユーザー管理 — ADMIN のみ表示 */}
          {user?.role === "ADMIN" && (
            <Section title="ユーザー管理" icon={Users}>
              {/* ユーザー一覧 */}
              <div className="overflow-x-auto mb-6">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                    <tr>
                      {["ユーザー", "メール", "ロール", "ステータス", "最終ログイン", "操作"].map(h => (
                        <th key={h} className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {userList.map(u => (
                      <tr key={u.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${!u.is_active ? "opacity-50" : ""}`}>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {u.full_name.slice(0, 1)}
                            </div>
                            <span className="text-gray-900 dark:text-white font-medium whitespace-nowrap">{u.full_name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-gray-500 dark:text-gray-400 text-xs">{u.email}</td>
                        <td className="px-3 py-2">
                          <select
                            value={u.role}
                            onChange={e => handleRoleChange(u.id, e.target.value)}
                            disabled={u.email === user?.email}
                            className="text-xs border border-gray-300 dark:border-gray-600 rounded px-1.5 py-1 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 disabled:opacity-50"
                          >
                            {Object.entries(ROLE_LABELS).map(([k, v]) => (
                              <option key={k} value={k}>{v}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          {u.is_active
                            ? <span className="flex items-center gap-1 text-green-600 text-xs whitespace-nowrap"><UserCheck className="w-3.5 h-3.5" />有効</span>
                            : <span className="flex items-center gap-1 text-gray-400 text-xs whitespace-nowrap"><UserX className="w-3.5 h-3.5" />無効</span>}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-400 whitespace-nowrap">
                          {u.last_login ?? "未ログイン"}
                        </td>
                        <td className="px-3 py-2">
                          {u.email !== user?.email && (
                            <button
                              onClick={() => handleToggleUser(u.id)}
                              className={`text-xs px-2 py-1 rounded border transition-colors whitespace-nowrap ${
                                u.is_active
                                  ? "border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                  : "border-green-300 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                              }`}
                            >
                              {u.is_active ? "無効化" : "有効化"}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ユーザー招待 */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-primary-600" />新規ユーザー招待
                </p>
                <div className="flex flex-wrap gap-3 items-end max-w-2xl">
                  <div className="flex-1 min-w-48">
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">メールアドレス</label>
                    <input type="email" className={inputCls} value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)} placeholder="user@example.com" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">ロール</label>
                    <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                      className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                      {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <button onClick={handleInviteUser} className={btnPrimary}>
                    <UserPlus className="w-4 h-4" />
                    {inviteSent ? "✅ 招待メール送信" : "招待する"}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">招待メールにアカウント設定リンクが送付されます。</p>
              </div>
            </Section>
          )}
        </div>
      )}

      {/* ── セキュリティ ── */}
      {activeTab === "security" && (
        <Section title="セキュリティポリシー" icon={Shield}>
          <div className="space-y-4 max-w-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">セッションタイムアウト（分）</label>
                <input type="number" min={5} max={480} value={appSettings.sessionTimeout}
                  onChange={e => setAppSettings(p => ({ ...p, sessionTimeout: +e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ログイン失敗上限（回）</label>
                <input type="number" min={3} max={20} value={appSettings.maxLoginAttempts}
                  onChange={e => setAppSettings(p => ({ ...p, maxLoginAttempts: +e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">パスワード最低文字数</label>
                <input type="number" min={6} max={32} value={appSettings.passwordMinLength}
                  onChange={e => setAppSettings(p => ({ ...p, passwordMinLength: +e.target.value }))} className={inputCls} />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={appSettings.requireUppercase}
                    onChange={e => setAppSettings(p => ({ ...p, requireUppercase: e.target.checked }))}
                    className="w-4 h-4 text-primary-600 rounded" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">大文字必須</span>
                </label>
              </div>
            </div>
            <button onClick={handleSaveSettings} className={btnPrimary}>
              <Save className="w-4 h-4" />{settingsSaved ? "✅ 保存しました" : "設定を保存"}
            </button>
          </div>
        </Section>
      )}

      {/* ── 通知設定 ── */}
      {activeTab === "notifications" && (
        <Section title="通知設定" icon={Bell} data-testid="notification-preferences-section">
          {prefsSuccessMsg && <div role="status" className="mb-4 p-3 rounded bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm">{prefsSuccessMsg}</div>}
          {prefsErrorMsg   && <div role="alert"  className="mb-4 p-3 rounded bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">{prefsErrorMsg}</div>}
          {prefsLoading ? <p className="text-sm text-gray-500">読み込み中…</p>
          : prefs ? (
            <div className="space-y-5">
              <div className="space-y-3">
                {(["email_enabled", "slack_enabled"] as const).map(key => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={prefs[key]}
                      onChange={e => setPrefs(p => p ? { ...p, [key]: e.target.checked } : p)}
                      className="w-4 h-4 text-primary-600 rounded" />
                    <span className="text-sm text-gray-800 dark:text-gray-200">
                      {key === "email_enabled" ? "メール通知を有効にする" : "Slack 通知を有効にする"}
                    </span>
                  </label>
                ))}
              </div>
              {prefs.slack_enabled && (
                <div className="max-w-md">
                  <label htmlFor="slack_url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Slack Webhook URL</label>
                  <input id="slack_url" type="password" className={inputCls}
                    value={prefs.slack_webhook_url ?? ""}
                    onChange={e => setPrefs(p => p ? { ...p, slack_webhook_url: e.target.value || null } : p)}
                    placeholder="https://hooks.slack.com/services/..." />
                </div>
              )}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">イベント別通知</h3>
                <div className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium text-gray-600 dark:text-gray-300">イベント</th>
                        <th className="text-center px-3 py-2 font-medium text-gray-600 dark:text-gray-300 w-20">メール</th>
                        <th className="text-center px-3 py-2 font-medium text-gray-600 dark:text-gray-300 w-20">Slack</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {Object.entries(EVENT_LABELS).map(([key, label]) => {
                        const ch = prefs.events[key] ?? { email: false, slack: false };
                        return (
                          <tr key={key}>
                            <td className="px-3 py-2 text-gray-800 dark:text-gray-200">{label}</td>
                            {(["email", "slack"] as const).map(ck => (
                              <td key={ck} className="px-3 py-2 text-center">
                                <input type="checkbox" checked={ch[ck]}
                                  aria-label={`${label} の${ck === "email" ? "メール" : "Slack"}通知`}
                                  onChange={() => setPrefs(p => {
                                    if (!p) return p;
                                    const cur = p.events[key] ?? { email: false, slack: false };
                                    return { ...p, events: { ...p.events, [key]: { ...cur, [ck]: !cur[ck] } } };
                                  })}
                                  className="w-4 h-4 text-primary-600 rounded" />
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              <button onClick={handleSavePrefs} disabled={prefsSaving} className={btnPrimary}>
                {prefsSaving ? "保存中…" : "通知設定を保存"}
              </button>
            </div>
          ) : <p className="text-sm text-gray-500">通知設定を表示できません</p>}
        </Section>
      )}

      {/* ── Microsoft 365 / EntraID 連携 ── */}
      {activeTab === "m365" && (
        <div className="space-y-4">
          <Section title="Microsoft 365 / Entra ID 連携" icon={Building2}>
            <div className="space-y-5 max-w-2xl">
              {/* 有効化スイッチ */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Microsoft 365 連携を有効にする</p>
                  <p className="text-xs text-gray-500 mt-0.5">Entra ID (旧 Azure AD) によるシングルサインオンと組織ユーザー同期</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={m365.enabled}
                    onChange={e => setM365(p => ({ ...p, enabled: e.target.checked }))}
                    className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-primary-600" />
                </label>
              </div>

              {/* 認証フロー選択 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">認証フロー</label>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    { value: "client_credentials", label: "クライアント資格情報", desc: "非対話式（推奨）— ユーザーログイン不要、バックグラウンド処理向け" },
                    { value: "device_code",        label: "デバイスコード",      desc: "対話式 — ユーザーがブラウザで認証するフロー" },
                  ] as const).map(opt => (
                    <button key={opt.value} type="button"
                      onClick={() => setM365(p => ({ ...p, authFlow: opt.value }))}
                      className={`p-3 rounded-lg border-2 text-left transition-colors ${
                        m365.authFlow === opt.value
                          ? "border-primary-600 bg-primary-50 dark:bg-primary-900/20"
                          : "border-gray-200 hover:border-gray-300 dark:border-gray-600"
                      }`}>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{opt.label}</p>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{opt.desc}</p>
                    </button>
                  ))}
                </div>
                {m365.authFlow === "client_credentials" && (
                  <p className="text-xs text-primary-600 dark:text-primary-400 mt-2 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" />
                    クライアント資格情報フローはサービス間認証（非対話式）に最適です。Windows の PC 起動時の自動処理にも対応します。
                  </p>
                )}
              </div>

              {/* 資格情報入力 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    テナント ID <span className="text-red-500">*</span>
                  </label>
                  <input type="text" className={inputCls} value={m365.tenantId}
                    onChange={e => setM365(p => ({ ...p, tenantId: e.target.value }))}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
                  <p className="text-xs text-gray-400 mt-1">Azure Portal → Microsoft Entra ID → テナント ID</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    クライアント ID (アプリ ID) <span className="text-red-500">*</span>
                  </label>
                  <input type="text" className={inputCls} value={m365.clientId}
                    onChange={e => setM365(p => ({ ...p, clientId: e.target.value }))}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
                  <p className="text-xs text-gray-400 mt-1">アプリの登録 → アプリケーション (クライアント) ID</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  クライアントシークレット <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={m365ShowSecret ? "text" : "password"}
                    className={`${inputCls} pr-10`}
                    value={m365.clientSecret}
                    onChange={e => setM365(p => ({ ...p, clientSecret: e.target.value }))}
                    placeholder="アプリ登録 → 証明書とシークレット で生成した値"
                  />
                  <button type="button" onClick={() => setM365ShowSecret(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {m365ShowSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">スコープ</label>
                <input type="text" className={inputCls} value={m365.scopes}
                  onChange={e => setM365(p => ({ ...p, scopes: e.target.value }))} />
                <p className="text-xs text-gray-400 mt-1">非対話式認証では <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">https://graph.microsoft.com/.default</code> を使用</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Authority URL（自動入力）</label>
                <input type="text" readOnly className={`${inputCls} bg-gray-50 dark:bg-gray-600 text-gray-500`}
                  value={authorityUrl} />
              </div>

              {/* ユーザー同期設定 */}
              <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">同期設定</p>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={m365.userPrincipalSync}
                      onChange={e => setM365(p => ({ ...p, userPrincipalSync: e.target.checked }))}
                      className="w-4 h-4 text-primary-600 rounded" />
                    <span className="text-sm text-gray-800 dark:text-gray-200">ユーザー情報を自動同期（氏名・メール・役職）</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={m365.groupSync}
                      onChange={e => setM365(p => ({ ...p, groupSync: e.target.checked }))}
                      className="w-4 h-4 text-primary-600 rounded" />
                    <span className="text-sm text-gray-800 dark:text-gray-200">セキュリティグループを ServiceHub ロールにマッピング</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">同期間隔（分）:</label>
                    <input type="number" min={15} max={1440} value={m365.syncInterval}
                      onChange={e => setM365(p => ({ ...p, syncInterval: +e.target.value }))}
                      className={`${inputCls} w-24`} />
                  </div>
                </div>
              </div>

              {/* テスト・保存ボタン */}
              <div className="flex gap-3 pt-2">
                <button onClick={handleM365Test} disabled={m365Testing} className={btnSecondary}>
                  {m365Testing ? <><RefreshCw className="w-4 h-4 animate-spin" />テスト中...</> : <><RefreshCw className="w-4 h-4" />接続テスト</>}
                </button>
                <button onClick={handleM365Save} className={btnPrimary}>
                  <Save className="w-4 h-4" />{m365Saved ? "✅ 保存しました" : "設定を保存"}
                </button>
              </div>
              {m365TestResult === "success" && (
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />接続テスト成功。Entra ID と正常に通信できました。
                </div>
              )}
              {m365TestResult === "error" && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />接続失敗。テナント ID・クライアント ID・シークレットを確認してください。
                </div>
              )}
            </div>
          </Section>

          {/* SSO ログイン設定 */}
          <Section title="SSO ログイン設定（EntraID）" icon={LogIn}>
            <div className="space-y-4 max-w-2xl">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700 text-sm text-blue-800 dark:text-blue-200">
                SSO を有効にすると、ログインページに「Microsoft アカウントでサインイン」ボタンが表示されます。
                非対話式認証（Client Credentials）のため、バックグラウンド連携やシングルサインオンが可能です。
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">SSO ログインを有効にする</p>
                  <p className="text-xs text-gray-500 mt-0.5">ログインページに Microsoft サインインボタンを表示</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={m365Sso.enabled}
                    onChange={e => setM365Sso(p => ({ ...p, enabled: e.target.checked }))}
                    className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-primary-600" />
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ログインボタンのテキスト</label>
                <input type="text" className={inputCls} value={m365Sso.buttonText}
                  onChange={e => setM365Sso(p => ({ ...p, buttonText: e.target.value }))} />
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={m365Sso.allowLocalLogin}
                    onChange={e => setM365Sso(p => ({ ...p, allowLocalLogin: e.target.checked }))}
                    className="w-4 h-4 text-primary-600 rounded" />
                  <span className="text-sm text-gray-800 dark:text-gray-200">
                    ローカルログイン（メール＋パスワード）を引き続き許可する
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={m365Sso.autoProvision}
                    onChange={e => setM365Sso(p => ({ ...p, autoProvision: e.target.checked }))}
                    className="w-4 h-4 text-primary-600 rounded" />
                  <span className="text-sm text-gray-800 dark:text-gray-200">
                    初回 SSO ログイン時にアカウントを自動プロビジョニング
                  </span>
                </label>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-3 flex items-center gap-1"><Globe className="w-3.5 h-3.5" />ログインページ プレビュー</p>
                <button type="button" disabled
                  className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 opacity-80 cursor-default">
                  <svg viewBox="0 0 21 21" className="w-5 h-5 flex-shrink-0" aria-hidden="true">
                    <rect width="10" height="10" fill="#f25022"/>
                    <rect x="11" width="10" height="10" fill="#7fba00"/>
                    <rect y="11" width="10" height="10" fill="#00a4ef"/>
                    <rect x="11" y="11" width="10" height="10" fill="#ffb900"/>
                  </svg>
                  {m365Sso.buttonText || "Microsoft アカウントでサインイン"}
                </button>
              </div>

              <button onClick={handleSaveM365Sso} className={btnPrimary}>
                <Save className="w-4 h-4" />{m365SsoSaved ? "✅ 保存しました" : "SSO 設定を保存"}
              </button>
            </div>
          </Section>

          {/* ロールマッピング */}
          <Section title="ロールマッピング（Entra グループ → ServiceHub ロール）" icon={Key}>
            <div className="space-y-4 max-w-2xl">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                EntraID のセキュリティグループを ServiceHub ロールに自動マッピングします。
                ユーザーが属するグループに基づいてロールが付与されます。
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                    <tr>
                      {["Entra グループ名", "ServiceHub ロール", "操作"].map(h => (
                        <th key={h} className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {roleMapping.map(m => (
                      <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-3 py-2 font-mono text-xs text-gray-700 dark:text-gray-300">{m.group}</td>
                        <td className="px-3 py-2">
                          <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                            {ROLE_LABELS[m.role] ?? m.role}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <button onClick={() => handleRemoveMapping(m.id)}
                            className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 border border-red-300 rounded px-2 py-0.5 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                            <Trash2 className="w-3 h-3" />削除
                          </button>
                        </td>
                      </tr>
                    ))}
                    {roleMapping.length === 0 && (
                      <tr><td colSpan={3} className="px-3 py-4 text-center text-gray-400 text-xs">マッピングがありません</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex flex-wrap gap-3 items-end">
                <div className="flex-1 min-w-40">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Entra グループ名</label>
                  <input type="text" className={inputCls} value={newGroup}
                    onChange={e => setNewGroup(e.target.value)}
                    placeholder="ServiceHub-Managers" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">割り当てロール</label>
                  <select value={newRole} onChange={e => setNewRole(e.target.value)}
                    className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                    {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <button onClick={handleAddMapping} className={btnPrimary}>
                  <UserPlus className="w-4 h-4" />追加
                </button>
              </div>
              <p className="text-xs text-gray-400">追加後、「SSO 設定を保存」で確定してください。</p>
            </div>
          </Section>

          {/* セットアップ手順 */}
          <Section title="Azure AD アプリ登録 手順" icon={FileText}>
            <ol className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
              {[
                "Azure Portal (portal.azure.com) → 「Microsoft Entra ID」→「アプリの登録」→「新規登録」",
                "アプリ名: ServiceHub、サポートされるアカウントの種類: 組織のディレクトリ内のアカウントのみ",
                "「API のアクセス許可」→「アクセス許可の追加」→ Microsoft Graph → アプリケーションの許可 → User.Read.All, Group.Read.All を追加 → 管理者の同意を付与",
                "「証明書とシークレット」→「新しいクライアントシークレット」→ 説明と有効期限を設定 → 生成された値をコピー（1度しか表示されない）",
                "「概要」から テナント ID と アプリケーション (クライアント) ID をコピー → 上のフォームに入力",
              ].map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </Section>
        </div>
      )}

      {/* ── API 連携 ── */}
      {activeTab === "api" && (
        <Section title="API 連携設定" icon={Plug}>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            各サービスの API キーや接続先を編集できます。キーは暗号化して保存されます。
          </p>
          <div className="space-y-3">
            {apis.map((integration) => (
              <div key={integration.key}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3 hover:border-gray-300 dark:hover:border-gray-500 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-gray-900 dark:text-white">{integration.name}</span>
                      <StatusBadge status={integration.status} />
                      <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 px-1.5 py-0.5 rounded">{integration.category}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{integration.desc}</p>
                    {integration.lastTested && (
                      <p className="text-xs text-gray-400 mt-0.5">最終テスト: {integration.lastTested}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => handleApiTest(integration.key)}
                      disabled={testingApi === integration.key}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      {testingApi === integration.key
                        ? <RefreshCw className="w-3 h-3 animate-spin" />
                        : <RefreshCw className="w-3 h-3" />}
                      テスト
                    </button>
                  </div>
                </div>

                {/* API キー入力エリア */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showKeys[integration.key] ? "text" : "password"}
                      className={`${inputCls} pr-10 font-mono text-xs`}
                      value={editingKey === integration.key ? editValue : (integration.value || "")}
                      onChange={e => {
                        if (editingKey === integration.key) setEditValue(e.target.value);
                      }}
                      onFocus={() => {
                        if (editingKey !== integration.key) {
                          setEditingKey(integration.key);
                          setEditValue(integration.value);
                        }
                      }}
                      placeholder={`${integration.key} を入力...`}
                      readOnly={editingKey !== integration.key}
                    />
                    <button type="button"
                      onClick={() => setShowKeys(p => ({ ...p, [integration.key]: !p[integration.key] }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showKeys[integration.key] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {editingKey === integration.key && (
                    <>
                      <button onClick={() => handleApiSave(integration.key)} className="px-3 py-1.5 bg-primary-600 text-white text-xs rounded hover:bg-primary-700">
                        保存
                      </button>
                      <button onClick={() => setEditingKey(null)} className="px-3 py-1.5 border border-gray-300 text-gray-600 dark:text-gray-300 text-xs rounded hover:bg-gray-50 dark:hover:bg-gray-700">
                        キャンセル
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── システム情報 ── */}
      {activeTab === "system" && (
        <div className="space-y-4">
          <Section title="システム情報" icon={Server}>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
              {SYSTEM_INFO.map(({ label, value }) => (
                <div key={label} className="flex gap-3">
                  <dt className="w-36 text-sm text-gray-500 dark:text-gray-400 shrink-0">{label}</dt>
                  <dd className="text-sm text-gray-900 dark:text-gray-100 font-medium break-all">{value}</dd>
                </div>
              ))}
            </dl>
          </Section>
          <Section title="アプリケーション設定" icon={Globe}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
              {([
                { key: "language",   label: "言語",        options: [{ v: "ja", l: "日本語" }, { v: "en", l: "English" }] },
                { key: "timezone",   label: "タイムゾーン", options: [{ v: "Asia/Tokyo", l: "Asia/Tokyo (JST)" }, { v: "UTC", l: "UTC" }] },
                { key: "dateFormat", label: "日付形式",     options: [{ v: "YYYY-MM-DD", l: "YYYY-MM-DD" }, { v: "MM/DD/YYYY", l: "MM/DD/YYYY" }, { v: "DD/MM/YYYY", l: "DD/MM/YYYY" }] },
              ] as const).map(({ key, label, options }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
                  <select value={appSettings[key]}
                    onChange={e => setAppSettings(p => ({ ...p, [key]: e.target.value }))} className={inputCls}>
                    {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <button onClick={handleSaveSettings} className={`mt-4 ${btnPrimary}`}>
              <Save className="w-4 h-4" />{settingsSaved ? "✅ 保存しました" : "設定を保存"}
            </button>
          </Section>
        </div>
      )}

      {/* ── バックアップ ── */}
      {activeTab === "backup" && (
        <div className="space-y-4">
          <Section title="バックアップ設定" icon={HardDrive}>
            <div className="grid grid-cols-2 gap-4 max-w-md mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">スケジュール</label>
                <select value={appSettings.backupSchedule}
                  onChange={e => setAppSettings(p => ({ ...p, backupSchedule: e.target.value }))} className={inputCls}>
                  <option value="hourly">毎時</option>
                  <option value="daily">毎日（推奨）</option>
                  <option value="weekly">毎週</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">保持期間（日数）</label>
                <input type="number" min={7} max={365} value={appSettings.backupRetentionDays}
                  onChange={e => setAppSettings(p => ({ ...p, backupRetentionDays: +e.target.value }))} className={inputCls} />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleSaveSettings} className={btnPrimary}>
                <Save className="w-4 h-4" />{settingsSaved ? "✅ 保存しました" : "設定を保存"}
              </button>
              <button className={btnSecondary}><HardDrive className="w-4 h-4" />今すぐバックアップ</button>
            </div>
          </Section>
          <Section title="バックアップ履歴" icon={Clock}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <tr>{["ID", "日時", "サイズ", "種別", "状態"].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {BACKUP_HISTORY.map(b => (
                    <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-3 py-2 font-mono text-xs text-gray-500">{b.id}</td>
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{b.date}</td>
                      <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{b.size}</td>
                      <td className="px-3 py-2 text-gray-500 dark:text-gray-400">{b.type}</td>
                      <td className="px-3 py-2">
                        {b.status === "success"
                          ? <span className="flex items-center gap-1 text-green-600 text-xs"><CheckCircle2 className="w-3.5 h-3.5" />成功</span>
                          : <span className="flex items-center gap-1 text-red-600 text-xs"><AlertTriangle className="w-3.5 h-3.5" />失敗</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        </div>
      )}

      {/* ── システムログ ── */}
      {activeTab === "logs" && (
        <div className="space-y-4">
          <Section title="ログ設定" icon={Settings}>
            <div className="grid grid-cols-2 gap-4 max-w-sm mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ログレベル</label>
                <select value={appSettings.logLevel}
                  onChange={e => setAppSettings(p => ({ ...p, logLevel: e.target.value }))} className={inputCls}>
                  {["DEBUG", "INFO", "WARN", "ERROR"].map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">保持期間（日数）</label>
                <input type="number" min={7} max={365} value={appSettings.logRetentionDays}
                  onChange={e => setAppSettings(p => ({ ...p, logRetentionDays: +e.target.value }))} className={inputCls} />
              </div>
            </div>
            <button onClick={handleSaveSettings} className={btnPrimary}>
              <Save className="w-4 h-4" />{settingsSaved ? "✅ 保存しました" : "設定を保存"}
            </button>
          </Section>
          <Section title="最近のシステムログ" icon={FileText}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-mono">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <tr>{["タイムスタンプ", "レベル", "メッセージ"].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300 font-sans">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {LOG_ENTRIES.map((log, i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">{log.ts}</td>
                      <td className="px-3 py-2">
                        <span className={`text-xs font-bold ${log.level === "ERROR" ? "text-red-600" : log.level === "WARN" ? "text-yellow-600" : "text-green-600"}`}>
                          {log.level}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-700 dark:text-gray-300 break-all">{log.msg}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}
