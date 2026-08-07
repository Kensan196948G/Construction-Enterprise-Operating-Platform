/* ─── Settings Page — Full System Management ─── */

/* AD ユーザーモックデータ (実装時は /api/v1/ad/users LDAP proxy に差し替え) */
const AD_USERS_MOCK = [
  { dn: "CN=田中 太郎,OU=本社,DC=mirai,DC=local",        cn: "田中 太郎",   sam: "T001", dept: "工事部",     title: "工事部長",      email: "t001@mirai.local", ou: "本社",  enabled: true,  lastLogon: "2026-05-14 09:12" },
  { dn: "CN=鈴木 花子,OU=本社,DC=mirai,DC=local",        cn: "鈴木 花子",   sam: "T002", dept: "総務部",     title: "総務課長",      email: "t002@mirai.local", ou: "本社",  enabled: true,  lastLogon: "2026-05-13 17:45" },
  { dn: "CN=山田 次郎,OU=大阪支店,DC=mirai,DC=local",    cn: "山田 次郎",   sam: "T003", dept: "営業部",     title: "営業担当",      email: "t003@mirai.local", ou: "大阪支店", enabled: true,  lastLogon: "2026-05-14 08:55" },
  { dn: "CN=佐藤 三郎,OU=本社,DC=mirai,DC=local",        cn: "佐藤 三郎",   sam: "T004", dept: "設計部",     title: "主任設計士",    email: "t004@mirai.local", ou: "本社",  enabled: true,  lastLogon: "2026-05-12 10:30" },
  { dn: "CN=伊藤 美咲,OU=名古屋支店,DC=mirai,DC=local",  cn: "伊藤 美咲",   sam: "T005", dept: "施工管理部", title: "現場監督",      email: "t005@mirai.local", ou: "名古屋支店", enabled: true, lastLogon: "2026-05-14 07:20" },
  { dn: "CN=渡辺 健一,OU=大阪支店,DC=mirai,DC=local",    cn: "渡辺 健一",   sam: "T006", dept: "施工管理部", title: "施工主任",      email: "t006@mirai.local", ou: "大阪支店", enabled: true,  lastLogon: "2026-05-11 16:00" },
  { dn: "CN=中村 由美,OU=本社,DC=mirai,DC=local",        cn: "中村 由美",   sam: "T007", dept: "経理部",     title: "経理担当",      email: "t007@mirai.local", ou: "本社",  enabled: true,  lastLogon: "2026-05-14 09:00" },
  { dn: "CN=小林 正道,OU=福岡支店,DC=mirai,DC=local",    cn: "小林 正道",   sam: "T008", dept: "工事部",     title: "現場担当",      email: "t008@mirai.local", ou: "福岡支店", enabled: true,  lastLogon: "2026-05-10 12:15" },
  { dn: "CN=加藤 裕子,OU=本社,DC=mirai,DC=local",        cn: "加藤 裕子",   sam: "T009", dept: "人事部",     title: "人事担当",      email: "t009@mirai.local", ou: "本社",  enabled: true,  lastLogon: "2026-05-13 11:40" },
  { dn: "CN=吉田 浩二,OU=川崎現場,DC=mirai,DC=local",    cn: "吉田 浩二",   sam: "T010", dept: "施工管理部", title: "現場監督",      email: "t010@mirai.local", ou: "川崎現場", enabled: true,  lastLogon: "2026-05-14 06:45" },
  { dn: "CN=松本 聡,OU=大阪支店,DC=mirai,DC=local",      cn: "松本 聡",     sam: "T011", dept: "設計部",     title: "CADオペレーター", email: "t011@mirai.local", ou: "大阪支店", enabled: true, lastLogon: "2026-05-13 14:20" },
  { dn: "CN=井上 拓也,OU=横浜現場,DC=mirai,DC=local",    cn: "井上 拓也",   sam: "T012", dept: "工事部",     title: "現場担当",      email: "t012@mirai.local", ou: "横浜現場", enabled: false, lastLogon: "2026-04-30 17:00" },
  { dn: "CN=木村 美穂,OU=本社,DC=mirai,DC=local",        cn: "木村 美穂",   sam: "T013", dept: "総務部",     title: "受付",          email: "t013@mirai.local", ou: "本社",  enabled: true,  lastLogon: "2026-05-14 08:30" },
  { dn: "CN=林 大輔,OU=名古屋支店,DC=mirai,DC=local",    cn: "林 大輔",     sam: "T014", dept: "営業部",     title: "営業課長",      email: "t014@mirai.local", ou: "名古屋支店", enabled: true, lastLogon: "2026-05-13 18:00" },
  { dn: "CN=清水 智子,OU=本社,DC=mirai,DC=local",        cn: "清水 智子",   sam: "T015", dept: "経理部",     title: "経理課長",      email: "t015@mirai.local", ou: "本社",  enabled: true,  lastLogon: "2026-05-14 08:45" },
];

const SETTINGS_HISTORY = [
  { at: "2026-05-06 09:00", actor: "admin", key: "CDX_LOG_LEVEL", from: "DEBUG", to: "INFO" },
  { at: "2026-05-05 18:00", actor: "admin", key: "CDX_WORKER_MOCK", from: "0", to: "1" },
  { at: "2026-05-04 10:00", actor: "admin", key: "CDX_DB_POOL_SIZE", from: "3", to: "5" },
  { at: "2026-05-01 00:00", actor: "system", key: "HMAC shared_secret", from: "rotate-04", to: "rotate-05" },
];

const ACTIVE_SESSIONS = [
  { id: "sess-001", user: "admin", ip: "192.168.1.5", startedAt: "2026-05-06 08:30", lastActive: "09:30", browser: "Chromium 124" },
  { id: "sess-002", user: "tanaka", ip: "192.168.2.10", startedAt: "2026-05-06 09:10", lastActive: "09:28", browser: "Firefox 126" },
];

const SettingsPage = () => {
  const [activeTab, setActiveTab] = React.useState("server");
  const [editMode, setEditMode] = React.useState(false);
  const [showHistory, setShowHistory] = React.useState(false);
  const [showMask, setShowMask] = React.useState(true);
  const [maintenanceMode, setMaintenanceMode] = React.useState(false);
  const [actionLog, setActionLog] = React.useState([]);

  // User management
  const [users, setUsers] = React.useState([
    { id: "usr-001", username: "admin", displayName: "管理者", email: "admin@construction-dx.local", role: "admin", status: "active", lastLogin: "2026-05-06 08:30", createdAt: "2026-04-10", mfa: true, loginCount: 142 },
    { id: "usr-002", username: "tanaka", displayName: "田中 太郎", email: "tanaka@construction-dx.local", role: "operator", status: "active", lastLogin: "2026-05-06 09:10", createdAt: "2026-04-15", mfa: true, loginCount: 87 },
    { id: "usr-003", username: "suzuki", displayName: "鈴木 花子", email: "suzuki@construction-dx.local", role: "operator", status: "active", lastLogin: "2026-05-05 16:45", createdAt: "2026-04-20", mfa: false, loginCount: 53 },
    { id: "usr-004", username: "yamada", displayName: "山田 一郎", email: "yamada@construction-dx.local", role: "viewer", status: "active", lastLogin: "2026-05-04 11:20", createdAt: "2026-04-22", mfa: false, loginCount: 21 },
    { id: "usr-005", username: "sato", displayName: "佐藤 次郎", email: "sato@construction-dx.local", role: "viewer", status: "disabled", lastLogin: "2026-04-30 09:00", createdAt: "2026-04-25", mfa: false, loginCount: 8 },
  ]);
  const [editingUser, setEditingUser] = React.useState(null);
  const [showNewUser, setShowNewUser] = React.useState(false);
  const [newUser, setNewUser] = React.useState({ username: "", displayName: "", email: "", role: "viewer", password: "" });
  const [userDetail, setUserDetail] = React.useState(null);

  const ROLES = [
    { id: "admin", label: "管理者", desc: "全機能へのフルアクセス。ユーザー管理、設定変更、メンテナンスモード", color: "#ef4444", permissions: ["ダッシュボード", "端末管理", "ISO配布", "更新リング", "セキュリティ・ポリシー", "監査ログ", "システム設定", "ユーザー管理"] },
    { id: "operator", label: "オペレーター", desc: "端末管理・ISO配布・リング管理の操作権限。設定変更は不可", color: "#f59e0b", permissions: ["ダッシュボード", "端末管理", "ISO配布", "更新リング", "セキュリティ・ポリシー", "監査ログ"] },
    { id: "viewer", label: "閲覧者", desc: "全画面の閲覧のみ。操作・変更は不可", color: "#3b82f6", permissions: ["ダッシュボード(閲覧)", "端末管理(閲覧)", "ISO配布(閲覧)", "監査ログ(閲覧)"] },
  ];

  const roleColor = (r) => ROLES.find(x => x.id === r)?.color || "#94a3b8";
  const roleLabel = (r) => ROLES.find(x => x.id === r)?.label || r;

  const [envVars, setEnvVars] = React.useState([
    { k: "CDX_REGISTRATION_TOKEN", v: "a3f8c2e1d4b5...", desc: "デバイス登録 Bearer Token（必須）", sensitive: true, editable: true },
    { k: "CDX_ADMIN_TOKEN", v: "7b9e4f2a1c8d...", desc: "Admin UI Basic Auth Token", sensitive: true, editable: true },
    { k: "CDX_ADMIN_ENABLED", v: "true", desc: "Admin UI 有効化フラグ", sensitive: false, editable: true },
    { k: "CDX_WORKER_MOCK", v: "1", desc: "ISO build-worker モックモード", sensitive: false, editable: true },
    { k: "CDX_LOG_LEVEL", v: "INFO", desc: "ログ出力レベル (DEBUG/INFO/WARNING/ERROR)", sensitive: false, editable: true },
    { k: "CDX_LOG_FORMAT", v: "json", desc: "ログ形式 (json / text)", sensitive: false, editable: true },
    { k: "DATABASE_URL", v: "postgresql://cdx:***@localhost:5432/cdx", desc: "PostgreSQL 接続 URL", sensitive: true, editable: true },
    { k: "REDIS_URL", v: "redis://localhost:6379/0", desc: "Redis 接続 URL", sensitive: false, editable: true },
  ]);

  // Domain / AD global settings
  const [domainConfig, setDomainConfig] = React.useState({
    enabled: true,
    domain: "mirai.local",
    netbiosName: "MIRAI",
    dcHost: "VMSV3001",
    dcBackup: "",
    joinUser: "svc-domainjoin",
    joinPassword: "",
    defaultOu: "OU=Workstations,DC=mirai,DC=local",
    loginFormat: "sam",
    kerberosRealm: "MIRAI.LOCAL",
    ldapBaseDn: "DC=mirai,DC=local",
    syncInterval: 60,
    enableSso: false,
    adSaved: false,
  });
  const setDomain = (key, val) => setDomainConfig(prev => ({ ...prev, [key]: val, adSaved: false }));
  const [adTestResult, setAdTestResult] = React.useState(null);
  const [showAdPassword, setShowAdPassword] = React.useState(false);

  // AD user browse state
  const [adBrowse, setAdBrowse] = React.useState({
    host: "VMSV3001",
    user: "administrator",
    password: "",
    searchBase: "",
    searchFilter: "",
  });
  const [adBrowseStatus, setAdBrowseStatus] = React.useState("idle"); // idle / connecting / success / error
  const [adUserList, setAdUserList] = React.useState([]);
  const [selectedAdUsers, setSelectedAdUsers] = React.useState(new Set());
  const [adUserSearch, setAdUserSearch] = React.useState("");
  const [showAdPw, setShowAdPw] = React.useState(false);
  const [adOuFilter, setAdOuFilter] = React.useState("all");

  const handleAdConnect = () => {
    if (!adBrowse.host || !adBrowse.user) return;
    setAdBrowseStatus("connecting");
    setAdUserList([]);
    setTimeout(() => {
      // Simulate LDAP query — backend would call python-ldap / ldap3 here
      setAdBrowseStatus("success");
      setAdUserList(AD_USERS_MOCK);
    }, 1800);
  };

  const toggleAdUser = (sam) => {
    setSelectedAdUsers(prev => {
      const next = new Set(prev);
      next.has(sam) ? next.delete(sam) : next.add(sam);
      return next;
    });
  };

  const adOus = ["all", ...new Set(AD_USERS_MOCK.map(u => u.ou))];
  const filteredAdUsers = adUserList.filter(u => {
    if (adOuFilter !== "all" && u.ou !== adOuFilter) return false;
    if (adUserSearch) {
      const q = adUserSearch.toLowerCase();
      return u.cn.toLowerCase().includes(q) || u.sam.toLowerCase().includes(q) || u.dept.toLowerCase().includes(q);
    }
    return true;
  });

  const [notifications, setNotifications] = React.useState([
    { type: "email", enabled: true, target: "admin@construction-dx.local" },
    { type: "webhook", enabled: false, target: "" },
    { type: "slack", enabled: false, target: "" },
  ]);

  const executeAction = (action, detail) => {
    const now = new Date().toLocaleTimeString("ja-JP");
    setActionLog(prev => [{ at: now, action, detail, status: "実行中" }, ...prev]);
    setTimeout(() => setActionLog(prev => prev.map((l, i) => i === 0 ? { ...l, status: "完了" } : l)), 1500);
  };

  const tabs = [
    { id: "server", label: "サーバー設定" },
    { id: "health", label: "ヘルスチェック" },
    { id: "users", label: "ユーザー管理" },
    { id: "auth", label: "認証・認可" },
    { id: "domain", label: "🏢 ドメイン・AD" },
    { id: "database", label: "データベース" },
    { id: "agent", label: "Agent 設定" },
    { id: "network", label: "ネットワーク" },
    { id: "notifications", label: "通知設定" },
    { id: "maintenance", label: "メンテナンス" },
    { id: "system", label: "システム情報" },
  ];

  // Simulated health data
  const [healthData, setHealthData] = React.useState({
    postgres: { status: "ok", responseMs: 3, uptime: "12d 4h" },
    redis: { status: "ok", responseMs: 1, uptime: "12d 4h" },
    minio: { status: "ok", responseMs: 8, uptime: "12d 4h" },
    prometheus: { status: "ok", responseMs: 12, uptime: "12d 4h" },
    server: { cpu: 12, mem: 34, disk: 45, uptime: "12d 4h", pid: 28451 },
  });

  React.useEffect(() => {
    const interval = setInterval(() => {
      setHealthData(prev => ({
        ...prev,
        postgres: { ...prev.postgres, responseMs: Math.max(1, prev.postgres.responseMs + Math.floor(Math.random() * 3) - 1) },
        redis: { ...prev.redis, responseMs: Math.max(0, prev.redis.responseMs + Math.floor(Math.random() * 2) - 1) },
        minio: { ...prev.minio, responseMs: Math.max(1, prev.minio.responseMs + Math.floor(Math.random() * 5) - 2) },
        server: { ...prev.server, cpu: Math.max(1, Math.min(100, prev.server.cpu + Math.floor(Math.random() * 7) - 3)), mem: Math.max(10, Math.min(100, prev.server.mem + Math.floor(Math.random() * 3) - 1)) },
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0 }}>システム設定</h2>
          <p style={{ fontSize: 12, color: "#94a3b8", margin: "2px 0 0" }}>cdx-server 環境設定・認証・データベース・Agent設定の一元管理</p>
        </div>
        {maintenanceMode && (
          <div style={{ padding: "6px 14px", borderRadius: 8, background: "#fef2f2", border: "1px solid #fecaca", fontSize: 12, color: "#dc2626", fontWeight: 600 }}>⚠ メンテナンスモード ON</div>
        )}
      </div>

      <div style={{ display: "flex", gap: 2, marginBottom: 16, borderBottom: "1px solid #e8ecf1", flexWrap: "wrap" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ padding: "8px 12px", fontSize: 11, border: "none", cursor: "pointer", borderBottom: activeTab === t.id ? "2px solid #2563eb" : "2px solid transparent", color: activeTab === t.id ? "#2563eb" : "#64748b", fontWeight: activeTab === t.id ? 600 : 400, background: "transparent", marginBottom: -1 }}>{t.label}</button>
        ))}
      </div>

      {/* Server Config */}
      {activeTab === "server" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>環境変数</span>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => setShowMask(!showMask)} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #e8ecf1", fontSize: 10, cursor: "pointer", background: "#fff", color: "#64748b" }}>{showMask ? "🔒 機密値を表示" : "🔓 機密値を隠す"}</button>
              <button onClick={() => setEditMode(!editMode)} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #e8ecf1", fontSize: 10, cursor: "pointer", background: editMode ? "#eff6ff" : "#fff", color: editMode ? "#2563eb" : "#64748b", fontWeight: editMode ? 600 : 400 }}>{editMode ? "✓ 完了" : "✏ 編集"}</button>
              <button onClick={() => setShowHistory(!showHistory)} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #e8ecf1", fontSize: 10, cursor: "pointer", background: "#fff", color: "#64748b" }}>📋 変更履歴</button>
              <button onClick={() => executeAction("設定バックアップ", "全環境変数をJSON出力")} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #e8ecf1", fontSize: 10, cursor: "pointer", background: "#fff", color: "#64748b" }}>💾 バックアップ</button>
            </div>
          </div>
          {showHistory && (
            <div style={{ ...cardStyle, marginBottom: 12, background: "#f8fafc" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", marginBottom: 8 }}>設定変更履歴</div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr style={{ borderBottom: "1px solid #e8ecf1" }}>
                  {["日時", "変更者", "項目", "旧値", "新値"].map(h => <th key={h} style={thStyle}>{h}</th>)}
                </tr></thead>
                <tbody>{SETTINGS_HISTORY.map((h, i) => (
                  <tr key={i} style={{ borderTop: "1px solid #f1f5f9" }}>
                    <td style={{ ...tdStyle, color: "#94a3b8", fontSize: 11 }}>{h.at}</td>
                    <td style={{ ...tdStyle, color: "#475569", fontWeight: 500 }}>{h.actor}</td>
                    <td style={tdStyle}><code style={{ fontSize: 11, color: "#2563eb" }}>{h.key}</code></td>
                    <td style={{ ...tdStyle, color: "#dc2626" }}>{h.from}</td>
                    <td style={{ ...tdStyle, color: "#22c55e", fontWeight: 600 }}>{h.to}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
          <div style={cardStyle}>
            {envVars.map((r, i) => (
              <div key={i} style={{ padding: "10px 0", borderBottom: i < envVars.length - 1 ? "1px solid #f8fafc" : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <code style={{ color: "#0f172a", fontSize: 12, fontWeight: 500 }}>{r.k}</code>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {r.sensitive && <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, background: "#fef2f2", color: "#ef4444" }}>機密</span>}
                    {editMode && r.editable ? (
                      <input type={r.sensitive && showMask ? "password" : "text"} defaultValue={r.v} style={{ padding: "3px 8px", borderRadius: 4, border: "1px solid #bfdbfe", fontSize: 11, width: 250, color: "#0f172a" }} onChange={e => { const nv = [...envVars]; nv[i] = { ...nv[i], v: e.target.value }; setEnvVars(nv); }} />
                    ) : (
                      <code style={{ color: "#2563eb", fontSize: 11, background: "#eff6ff", padding: "2px 8px", borderRadius: 4 }}>{r.sensitive && showMask ? "••••••••••••" : r.v}</code>
                    )}
                  </div>
                </div>
                <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{r.desc}</div>
              </div>
            ))}
            {editMode && (
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button onClick={() => { executeAction("設定保存", "環境変数更新"); setEditMode(false); }} style={{ padding: "6px 16px", borderRadius: 6, background: "#2563eb", color: "#fff", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>保存</button>
                <button onClick={() => executeAction("バリデーション", "DB接続テスト + Redis疎通確認")} style={{ padding: "6px 16px", borderRadius: 6, background: "#fff", color: "#2563eb", border: "1px solid #bfdbfe", fontSize: 12, cursor: "pointer" }}>🔍 接続テスト</button>
              </div>
            )}
          </div>
          {/* Backup/Restore */}
          <div style={{ ...cardStyle, marginTop: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 10 }}>バックアップ・リストア</div>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1, padding: "14px", background: "#f8fafc", borderRadius: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", marginBottom: 6 }}>エクスポート</div>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8 }}>全設定をJSON形式でエクスポート（機密値はハッシュ化）</div>
                <button onClick={() => executeAction("設定エクスポート", "cdx-settings-20260506.json")} style={{ padding: "5px 12px", borderRadius: 6, background: "#2563eb", color: "#fff", border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>📤 エクスポート</button>
              </div>
              <div style={{ flex: 1, padding: "14px", background: "#f8fafc", borderRadius: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", marginBottom: 6 }}>インポート</div>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8 }}>JSONファイルから設定を復元（バリデーション実行後に適用）</div>
                <button onClick={() => executeAction("設定インポート", "ファイル選択待ち")} style={{ padding: "5px 12px", borderRadius: 6, background: "#fff", color: "#475569", border: "1px solid #e2e8f0", fontSize: 11, cursor: "pointer" }}>📥 インポート</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Health Check Dashboard */}
      {activeTab === "health" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
            {[
              { name: "PostgreSQL", ...healthData.postgres, icon: "🐘" },
              { name: "Redis", ...healthData.redis, icon: "🔴" },
              { name: "MinIO / S3", ...healthData.minio, icon: "🪣" },
              { name: "Prometheus", ...healthData.prometheus, icon: "📊" },
            ].map((s, i) => (
              <div key={i} style={cardStyle}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 18 }}>{s.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{s.name}</span>
                  <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 500, color: s.status === "ok" ? "#22c55e" : "#ef4444" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.status === "ok" ? "#22c55e" : "#ef4444" }}></span>{s.status === "ok" ? "正常" : "異常"}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748b" }}>
                  <span>応答時間</span><span style={{ fontWeight: 600, color: s.responseMs < 10 ? "#22c55e" : s.responseMs < 50 ? "#f59e0b" : "#ef4444" }}>{s.responseMs}ms</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748b", marginTop: 4 }}>
                  <span>稼働時間</span><span style={{ fontWeight: 500 }}>{s.uptime}</span>
                </div>
              </div>
            ))}
          </div>
          {/* Server resource */}
          <div style={cardStyle}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 12 }}>cdx-server リソース使用状況</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              {[
                { label: "CPU", val: healthData.server.cpu },
                { label: "メモリ", val: healthData.server.mem },
                { label: "ディスク", val: healthData.server.disk },
              ].map((r, i) => (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                    <span style={{ color: "#475569" }}>{r.label}</span>
                    <span style={{ fontWeight: 600, color: usageColor(r.val) }}>{r.val}%</span>
                  </div>
                  <div style={{ height: 10, background: "#f1f5f9", borderRadius: 5 }}>
                    <div style={{ height: "100%", width: r.val + "%", background: usageColor(r.val), borderRadius: 5, transition: "width 500ms" }}></div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 11, color: "#94a3b8" }}>
              <span>PID: {healthData.server.pid}</span>
              <span>稼働: {healthData.server.uptime}</span>
              <span>ワーカー: 4</span>
            </div>
          </div>
        </div>
      )}

      {/* Users */}
      {activeTab === "users" && (
        <div>
          {/* User detail view */}
          {userDetail && (() => {
            const u = users.find(x => x.id === userDetail);
            if (!u) return null;
            const role = ROLES.find(r => r.id === u.role);
            return (
              <div>
                <button onClick={() => setUserDetail(null)} style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: 13, marginBottom: 16, padding: 0 }}>← ユーザー一覧へ戻る</button>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div style={cardStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                      <div style={{ width: 48, height: 48, borderRadius: "50%", background: roleColor(u.role) + "20", color: roleColor(u.role), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700 }}>{u.displayName[0]}</div>
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>{u.displayName}</div>
                        <div style={{ fontSize: 12, color: "#94a3b8" }}>@{u.username}</div>
                      </div>
                      <span style={{ marginLeft: "auto", fontSize: 11, padding: "3px 10px", borderRadius: 6, background: u.status === "active" ? "#f0fdf4" : "#f8fafc", color: u.status === "active" ? "#22c55e" : "#94a3b8", fontWeight: 600 }}>{u.status === "active" ? "有効" : "無効"}</span>
                    </div>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <tbody>
                        {[["ユーザーID", u.id], ["ユーザー名", u.username], ["表示名", u.displayName], ["メールアドレス", u.email], ["ロール", roleLabel(u.role)], ["MFA", u.mfa ? "有効" : "未設定"], ["作成日", u.createdAt], ["最終ログイン", u.lastLogin], ["ログイン回数", u.loginCount + "回"]].map(([k, v], i) => (
                          <tr key={i} style={{ borderBottom: "1px solid #f8fafc" }}>
                            <td style={{ padding: "7px 10px", color: "#94a3b8", fontWeight: 500, width: 130, fontSize: 12 }}>{k}</td>
                            <td style={{ padding: "7px 10px", color: k === "ロール" ? roleColor(u.role) : k === "MFA" ? (u.mfa ? "#22c55e" : "#f59e0b") : "#0f172a", fontWeight: (k === "ロール" || k === "MFA") ? 600 : 400, fontSize: 12 }}>{v}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
                      <button onClick={() => { setEditingUser(u.id); setUserDetail(null); }} style={{ padding: "6px 14px", borderRadius: 6, background: "#2563eb", color: "#fff", border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>編集</button>
                      <button onClick={() => executeAction("パスワードリセット", u.username)} style={{ padding: "6px 14px", borderRadius: 6, background: "#fff", color: "#f59e0b", border: "1px solid #fde68a", fontSize: 11, cursor: "pointer" }}>パスワードリセット</button>
                      <button onClick={() => { const nu = users.map(x => x.id === u.id ? { ...x, mfa: !x.mfa } : x); setUsers(nu); executeAction(u.mfa ? "MFA無効化" : "MFA有効化", u.username); }} style={{ padding: "6px 14px", borderRadius: 6, background: "#fff", color: "#475569", border: "1px solid #e2e8f0", fontSize: 11, cursor: "pointer" }}>{u.mfa ? "MFA無効化" : "MFA有効化"}</button>
                      <button onClick={() => { const nu = users.map(x => x.id === u.id ? { ...x, status: x.status === "active" ? "disabled" : "active" } : x); setUsers(nu); executeAction(u.status === "active" ? "アカウント無効化" : "アカウント有効化", u.username); }} style={{ padding: "6px 14px", borderRadius: 6, background: "#fff", color: u.status === "active" ? "#dc2626" : "#22c55e", border: `1px solid ${u.status === "active" ? "#fecaca" : "#bbf7d0"}`, fontSize: 11, cursor: "pointer" }}>{u.status === "active" ? "無効化" : "有効化"}</button>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={cardStyle}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 10 }}>ロール権限: {role?.label}</div>
                      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 10 }}>{role?.desc}</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {role?.permissions.map((p, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: roleColor(u.role), flexShrink: 0 }}></span>
                            <span style={{ color: "#475569" }}>{p}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={cardStyle}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 10 }}>ログイン履歴 (直近)</div>
                      {[
                        { at: u.lastLogin, ip: "192.168.1.5", result: "成功" },
                        { at: "2026-05-05 17:30", ip: "192.168.1.5", result: "成功" },
                        { at: "2026-05-05 08:45", ip: "192.168.1.5", result: "成功" },
                        { at: "2026-05-04 09:00", ip: "192.168.2.10", result: "成功" },
                        { at: "2026-05-03 14:20", ip: "10.0.1.50", result: "失敗 (パスワード不一致)" },
                      ].map((h, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 0", borderBottom: i < 4 ? "1px solid #f8fafc" : "none", fontSize: 11 }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: h.result === "成功" ? "#22c55e" : "#ef4444", flexShrink: 0 }}></span>
                          <span style={{ color: "#94a3b8", width: 120 }}>{h.at}</span>
                          <span style={{ color: "#64748b" }}>{h.ip}</span>
                          <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 500, color: h.result === "成功" ? "#22c55e" : "#ef4444" }}>{h.result}</span>
                        </div>
                      ))}
                    </div>
                    <div style={cardStyle}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 10 }}>操作履歴 (直近)</div>
                      {AUDIT_LOG.filter(a => a.actor === u.username).slice(0, 5).map((a, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", borderBottom: i < 4 ? "1px solid #f8fafc" : "none", fontSize: 11 }}>
                          <span style={{ color: "#94a3b8", width: 120 }}>{a.at}</span>
                          <code style={{ fontSize: 10, background: "#f1f5f9", padding: "1px 5px", borderRadius: 3, color: "#475569" }}>{a.action}</code>
                          <span style={{ color: "#64748b", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.detail}</span>
                        </div>
                      ))}
                      {AUDIT_LOG.filter(a => a.actor === u.username).length === 0 && <div style={{ fontSize: 11, color: "#94a3b8" }}>操作履歴なし</div>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Edit user form */}
          {editingUser && !userDetail && (() => {
            const u = users.find(x => x.id === editingUser);
            if (!u) return null;
            return (
              <div>
                <button onClick={() => setEditingUser(null)} style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: 13, marginBottom: 16, padding: 0 }}>← ユーザー一覧へ戻る</button>
                <div style={{ ...cardStyle, maxWidth: 600 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 16px" }}>ユーザー編集: {u.displayName}</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {[
                      { label: "ユーザー名", key: "username", type: "text", disabled: true },
                      { label: "表示名", key: "displayName", type: "text" },
                      { label: "メールアドレス", key: "email", type: "email" },
                    ].map(f => (
                      <div key={f.key}>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>{f.label}</label>
                        <input type={f.type} defaultValue={u[f.key]} disabled={f.disabled} onChange={e => { const nu = users.map(x => x.id === u.id ? { ...x, [f.key]: e.target.value } : x); setUsers(nu); }} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, color: f.disabled ? "#94a3b8" : "#0f172a", background: f.disabled ? "#f8fafc" : "#fff", boxSizing: "border-box" }} />
                      </div>
                    ))}
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>ロール</label>
                      <div style={{ display: "flex", gap: 8 }}>
                        {ROLES.map(r => (
                          <button key={r.id} onClick={() => { const nu = users.map(x => x.id === u.id ? { ...x, role: r.id } : x); setUsers(nu); }} style={{ flex: 1, padding: "10px", borderRadius: 8, border: `2px solid ${u.role === r.id ? r.color : "#e2e8f0"}`, cursor: "pointer", background: u.role === r.id ? r.color + "10" : "#fff", textAlign: "center" }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: r.color }}>{r.label}</div>
                            <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 2 }}>{r.desc.split("。")[0]}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>新しいパスワード（変更する場合のみ）</label>
                      <input type="password" placeholder="••••••••" style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, boxSizing: "border-box" }} />
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                      <button onClick={() => { executeAction("ユーザー更新", u.username); setEditingUser(null); }} style={{ padding: "8px 20px", borderRadius: 8, background: "#2563eb", color: "#fff", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>保存</button>
                      <button onClick={() => setEditingUser(null)} style={{ padding: "8px 16px", borderRadius: 8, background: "#fff", color: "#64748b", border: "1px solid #e2e8f0", fontSize: 12, cursor: "pointer" }}>キャンセル</button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* New user form */}
          {showNewUser && !editingUser && !userDetail && (
            <div style={{ ...cardStyle, marginBottom: 16, background: "#eff6ff", border: "1px solid #bfdbfe" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#2563eb", marginBottom: 12 }}>新規ユーザー作成</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>ユーザー名 *</label>
                  <input type="text" value={newUser.username} onChange={e => setNewUser(p => ({ ...p, username: e.target.value }))} placeholder="例: nakamura" style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #bfdbfe", fontSize: 12, boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>表示名 *</label>
                  <input type="text" value={newUser.displayName} onChange={e => setNewUser(p => ({ ...p, displayName: e.target.value }))} placeholder="例: 中村 三郎" style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #bfdbfe", fontSize: 12, boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>メールアドレス *</label>
                  <input type="email" value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} placeholder="例: nakamura@construction-dx.local" style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #bfdbfe", fontSize: 12, boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>初期パスワード *</label>
                  <input type="password" value={newUser.password} onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))} placeholder="8文字以上" style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #bfdbfe", fontSize: 12, boxSizing: "border-box" }} />
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 6 }}>ロール</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {ROLES.map(r => (
                    <button key={r.id} onClick={() => setNewUser(p => ({ ...p, role: r.id }))} style={{ flex: 1, padding: "10px", borderRadius: 8, border: `2px solid ${newUser.role === r.id ? r.color : "#e2e8f0"}`, cursor: "pointer", background: newUser.role === r.id ? r.color + "10" : "#fff", textAlign: "center" }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: r.color }}>{r.label}</div>
                      <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 2 }}>{r.desc.split("。")[0]}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <button onClick={() => { if (!newUser.username || !newUser.displayName || !newUser.email || !newUser.password) return; const u = { id: "usr-" + Date.now(), ...newUser, status: "active", lastLogin: "—", createdAt: "2026-05-06", mfa: false, loginCount: 0 }; setUsers(prev => [...prev, u]); executeAction("ユーザー作成", u.username + " (" + roleLabel(u.role) + ")"); setShowNewUser(false); setNewUser({ username: "", displayName: "", email: "", role: "viewer", password: "" }); }} disabled={!newUser.username || !newUser.displayName || !newUser.email || !newUser.password} style={{ padding: "8px 20px", borderRadius: 8, background: newUser.username && newUser.displayName && newUser.email && newUser.password ? "#2563eb" : "#e2e8f0", color: newUser.username && newUser.displayName && newUser.email && newUser.password ? "#fff" : "#94a3b8", border: "none", fontSize: 12, fontWeight: 600, cursor: newUser.username ? "pointer" : "not-allowed" }}>作成</button>
                <button onClick={() => setShowNewUser(false)} style={{ padding: "8px 16px", borderRadius: 8, background: "#fff", color: "#64748b", border: "1px solid #e2e8f0", fontSize: 12, cursor: "pointer" }}>キャンセル</button>
              </div>
            </div>
          )}

          {/* User list */}
          {!editingUser && !userDetail && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>ログインユーザー ({users.length})</span>
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>有効: {users.filter(u => u.status === "active").length} / 無効: {users.filter(u => u.status === "disabled").length}</span>
                </div>
                <button onClick={() => setShowNewUser(!showNewUser)} style={{ padding: "6px 14px", borderRadius: 8, background: "#2563eb", color: "#fff", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>+ 新規ユーザー</button>
              </div>
              {/* Role summary */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
                {ROLES.map(r => {
                  const count = users.filter(u => u.role === r.id).length;
                  return (
                    <div key={r.id} style={{ ...cardStyle, borderLeft: `3px solid ${r.color}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: r.color }}>{r.label}</span>
                        <span style={{ fontSize: 18, fontWeight: 700, color: r.color }}>{count}</span>
                      </div>
                      <div style={{ fontSize: 10, color: "#94a3b8", lineHeight: 1.4 }}>{r.desc}</div>
                    </div>
                  );
                })}
              </div>
              {/* User table */}
              <div style={cardStyle}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr style={{ background: "#f8fafc" }}>
                    {["", "ユーザー名", "表示名", "メール", "ロール", "MFA", "状態", "最終ログイン", "ログイン数", "操作"].map(h => <th key={h} style={thStyle}>{h}</th>)}
                  </tr></thead>
                  <tbody>{users.map(u => (
                    <tr key={u.id} style={{ borderTop: "1px solid #f1f5f9", background: u.status === "disabled" ? "#fafafa" : "", opacity: u.status === "disabled" ? 0.6 : 1 }}>
                      <td style={{ ...tdStyle, width: 32 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: roleColor(u.role) + "20", color: roleColor(u.role), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>{u.displayName[0]}</div>
                      </td>
                      <td style={{ ...tdStyle, color: "#2563eb", fontWeight: 500, cursor: "pointer" }} onClick={() => setUserDetail(u.id)}>{u.username}</td>
                      <td style={{ ...tdStyle, color: "#0f172a" }}>{u.displayName}</td>
                      <td style={{ ...tdStyle, color: "#64748b", fontSize: 11 }}>{u.email}</td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 6, background: roleColor(u.role) + "15", color: roleColor(u.role) }}>{roleLabel(u.role)}</span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: 10, fontWeight: 500, color: u.mfa ? "#22c55e" : "#f59e0b" }}>{u.mfa ? "✓ 有効" : "— 未設定"}</span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "1px 7px", borderRadius: 8, fontSize: 10, fontWeight: 500, background: u.status === "active" ? "#f0fdf4" : "#f8fafc", color: u.status === "active" ? "#22c55e" : "#94a3b8" }}>
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: u.status === "active" ? "#22c55e" : "#94a3b8" }}></span>
                          {u.status === "active" ? "有効" : "無効"}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, color: "#94a3b8", fontSize: 11 }}>{u.lastLogin}</td>
                      <td style={{ ...tdStyle, color: "#475569", fontSize: 11 }}>{u.loginCount}</td>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", gap: 3 }}>
                          <button onClick={() => setUserDetail(u.id)} title="詳細" style={{ padding: "2px 6px", borderRadius: 4, border: "1px solid #e8ecf1", fontSize: 10, cursor: "pointer", background: "#fff", color: "#2563eb" }}>詳細</button>
                          <button onClick={() => setEditingUser(u.id)} title="編集" style={{ padding: "2px 6px", borderRadius: 4, border: "1px solid #e8ecf1", fontSize: 10, cursor: "pointer", background: "#fff", color: "#64748b" }}>編集</button>
                          <button onClick={() => { const nu = users.map(x => x.id === u.id ? { ...x, status: x.status === "active" ? "disabled" : "active" } : x); setUsers(nu); executeAction(u.status === "active" ? "無効化" : "有効化", u.username); }} title={u.status === "active" ? "無効化" : "有効化"} style={{ padding: "2px 6px", borderRadius: 4, border: `1px solid ${u.status === "active" ? "#fecaca" : "#bbf7d0"}`, fontSize: 10, cursor: "pointer", background: "#fff", color: u.status === "active" ? "#dc2626" : "#22c55e" }}>{u.status === "active" ? "無効" : "有効"}</button>
                        </div>
                      </td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Auth */}
      {activeTab === "auth" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={cardStyle}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 12 }}>認証バックエンド</div>
            {[{k:"AUTH_BACKEND",v:"basic",desc:"認証方式 (basic / oidc)"},{k:"OIDC 対応",v:"準備済",desc:"AUTH_BACKEND=oidc で切替可能"},{k:"Admin認証",v:"HTTP Basic Auth",desc:"CDX_ADMIN_TOKEN 定数時間比較"},{k:"デバイス認証",v:"HMAC-SHA256",desc:"共有鍵 + timestamp bucket"},{k:"登録認証",v:"Bearer Token",desc:"closed-by-default"}].map((r,i) => (
              <div key={i} style={{ padding: "8px 0", borderBottom: i < 4 ? "1px solid #f8fafc" : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}><span style={{ color: "#475569", fontWeight: 500 }}>{r.k}</span><span style={{ color: "#2563eb", fontWeight: 600 }}>{r.v}</span></div>
                <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{r.desc}</div>
              </div>
            ))}
            {/* Token rotation */}
            <div style={{ marginTop: 12, padding: "12px", background: "#f8fafc", borderRadius: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", marginBottom: 8 }}>トークンローテーション</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => executeAction("トークン再生成", "CDX_REGISTRATION_TOKEN")} style={{ padding: "5px 12px", borderRadius: 6, background: "#fff", color: "#f59e0b", border: "1px solid #fde68a", fontSize: 10, cursor: "pointer", fontWeight: 600 }}>🔄 REGISTRATION_TOKEN</button>
                <button onClick={() => executeAction("トークン再生成", "CDX_ADMIN_TOKEN")} style={{ padding: "5px 12px", borderRadius: 6, background: "#fff", color: "#f59e0b", border: "1px solid #fde68a", fontSize: 10, cursor: "pointer", fontWeight: 600 }}>🔄 ADMIN_TOKEN</button>
              </div>
              <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 6 }}>⚠ 再生成後は全端末・管理者に新トークンを配布してください</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={cardStyle}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 12 }}>アクティブセッション</div>
              {ACTIVE_SESSIONS.map((s, i) => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < ACTIVE_SESSIONS.length - 1 ? "1px solid #f8fafc" : "none", fontSize: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e" }}></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, color: "#0f172a" }}>{s.user} <span style={{ color: "#94a3b8", fontWeight: 400 }}>({s.ip})</span></div>
                    <div style={{ fontSize: 10, color: "#94a3b8" }}>{s.browser} · 開始: {s.startedAt} · 最終: {s.lastActive}</div>
                  </div>
                  <button onClick={() => executeAction("セッション終了", s.user + " (" + s.id + ")")} style={{ padding: "3px 10px", borderRadius: 5, border: "1px solid #fecaca", fontSize: 10, cursor: "pointer", background: "#fff", color: "#dc2626" }}>切断</button>
                </div>
              ))}
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 12 }}>レート制限</div>
              {[{e:"heartbeat",l:"10/min"},{e:"inventory",l:"3/h"},{e:"register",l:"5/min"},{e:"policy",l:"10/min"}].map((r,i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 0", borderBottom: i < 3 ? "1px solid #f8fafc" : "none", fontSize: 12 }}>
                  <code style={{ color: "#475569", fontWeight: 500, width: 80 }}>{r.e}</code><span style={{ color: "#2563eb", fontWeight: 600 }}>{r.l}</span><span style={{ marginLeft: "auto", fontSize: 10, color: "#94a3b8" }}>Redis sliding-window</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Domain / AD */}
      {activeTab === "domain" && (
        <div>
          {/* Header banner */}
          <div style={{
            background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10,
            padding: "10px 16px", display: "flex", gap: 10, alignItems: "center", marginBottom: 20
          }}>
            <span style={{ fontSize: 18 }}>💡</span>
            <div style={{ fontSize: 12, color: "#1d4ed8" }}>
              ここで設定したADドメインは<strong>グローバルデフォルト</strong>として機能します。
              <strong>OS・認証設定</strong>でプロファイル個別にオーバーライドできます（空欄の場合はここの値を継承）。
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {/* Primary AD config */}
            <div style={cardStyle}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", display: "flex", alignItems: "center", gap: 6 }}>
                  🏢 Active Directory グローバル設定
                </div>
                {/* AD join toggle */}
                <div
                  onClick={() => setDomain("enabled", !domainConfig.enabled)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
                    padding: "4px 12px", borderRadius: 20,
                    background: domainConfig.enabled ? "#f0fdf4" : "#f8fafc",
                    border: `1px solid ${domainConfig.enabled ? "#bbf7d0" : "#e2e8f0"}`
                  }}
                >
                  <div style={{
                    width: 32, height: 18, borderRadius: 9,
                    background: domainConfig.enabled ? "#22c55e" : "#e2e8f0",
                    position: "relative", transition: "background 200ms"
                  }}>
                    <div style={{
                      position: "absolute", top: 2, left: domainConfig.enabled ? 16 : 2,
                      width: 14, height: 14, borderRadius: "50%", background: "#fff",
                      transition: "left 200ms", boxShadow: "0 1px 2px rgba(0,0,0,.2)"
                    }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: domainConfig.enabled ? "#16a34a" : "#94a3b8" }}>
                    {domainConfig.enabled ? "AD 参加有効" : "AD 参加無効"}
                  </span>
                </div>
              </div>

              {domainConfig.enabled ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {/* Domain name — most important field */}
                  <div style={{
                    background: "#f0fdf4", borderRadius: 10, padding: "12px 14px",
                    border: "2px solid #22c55e"
                  }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#15803d", display: "block", marginBottom: 6 }}>
                      🌐 ADドメイン名（デフォルト） <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <input
                      value={domainConfig.domain}
                      onChange={e => setDomain("domain", e.target.value)}
                      placeholder="例: mirai.local"
                      style={{
                        width: "100%", padding: "9px 12px", borderRadius: 8,
                        border: "1px solid #86efac", fontSize: 14, fontWeight: 600,
                        outline: "none", color: "#0f172a", background: "#fff"
                      }}
                    />
                    <div style={{ fontSize: 10, color: "#16a34a", marginTop: 4 }}>
                      FQDN形式。OS・認証設定でプロファイル個別にオーバーライドできます。
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
                      NetBIOS ドメイン名
                    </label>
                    <input
                      value={domainConfig.netbiosName}
                      onChange={e => setDomain("netbiosName", e.target.value.toUpperCase())}
                      placeholder="例: MIRAI"
                      style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, outline: "none" }}
                    />
                    <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>
                      Windows NT互換のドメイン短縮名（大文字）。CORP\username 形式に使用。
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
                      Kerberos レルム
                    </label>
                    <input
                      value={domainConfig.kerberosRealm}
                      onChange={e => setDomain("kerberosRealm", e.target.value.toUpperCase())}
                      placeholder="例: MIRAI.LOCAL"
                      style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, outline: "none" }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
                      LDAP ベース DN
                    </label>
                    <input
                      value={domainConfig.ldapBaseDn}
                      onChange={e => setDomain("ldapBaseDn", e.target.value)}
                      placeholder="例: DC=mirai,DC=local"
                      style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, outline: "none" }}
                    />
                  </div>
                </div>
              ) : (
                <div style={{
                  background: "#f8fafc", borderRadius: 8, padding: "16px",
                  fontSize: 12, color: "#64748b", textAlign: "center"
                }}>
                  🔓 AD参加を無効化しています。<br />
                  全端末はローカル認証で運用されます。
                </div>
              )}
            </div>

            {/* DC & join account */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={cardStyle}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 12 }}>
                  🖥️ ドメインコントローラ
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
                      プライマリ DC (IP / FQDN) <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <input
                      value={domainConfig.dcHost}
                      onChange={e => setDomain("dcHost", e.target.value)}
                      placeholder="例: 192.168.1.10"
                      style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, outline: "none" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
                      バックアップ DC (任意)
                    </label>
                    <input
                      value={domainConfig.dcBackup}
                      onChange={e => setDomain("dcBackup", e.target.value)}
                      placeholder="例: 192.168.1.11"
                      style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, outline: "none" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
                      DC疎通テスト
                    </label>
                    <button
                      onClick={() => {
                        setAdTestResult("testing");
                        setTimeout(() => setAdTestResult(domainConfig.dcHost ? "ok" : "error"), 1500);
                      }}
                      style={{
                        padding: "6px 16px", borderRadius: 8, border: "1px solid #e2e8f0",
                        background: "#fff", fontSize: 12, cursor: "pointer", color: "#2563eb"
                      }}
                    >
                      🔍 LDAP ping テスト
                    </button>
                    {adTestResult === "testing" && (
                      <span style={{ fontSize: 11, color: "#3b82f6", marginLeft: 8 }}>テスト中...</span>
                    )}
                    {adTestResult === "ok" && (
                      <span style={{ fontSize: 11, color: "#22c55e", marginLeft: 8, fontWeight: 600 }}>✅ 接続成功</span>
                    )}
                    {adTestResult === "error" && (
                      <span style={{ fontSize: 11, color: "#ef4444", marginLeft: 8, fontWeight: 600 }}>❌ 接続失敗</span>
                    )}
                  </div>
                </div>
              </div>

              <div style={cardStyle}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 12 }}>
                  🔑 ドメイン参加アカウント
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
                      AD 参加ユーザー名 <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <input
                      value={domainConfig.joinUser}
                      onChange={e => setDomain("joinUser", e.target.value)}
                      placeholder="例: svc-domainjoin"
                      style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, outline: "none" }}
                    />
                    <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>
                      最小権限 SVC（コンピュータ参加のみ可）を推奨
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
                      パスワード
                    </label>
                    <div style={{ display: "flex", gap: 6 }}>
                      <input
                        type={showAdPassword ? "text" : "password"}
                        value={domainConfig.joinPassword}
                        onChange={e => setDomain("joinPassword", e.target.value)}
                        placeholder="••••••••"
                        style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, outline: "none" }}
                      />
                      <button
                        onClick={() => setShowAdPassword(!showAdPassword)}
                        style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 12 }}
                      >
                        {showAdPassword ? "🙈" : "👁️"}
                      </button>
                    </div>
                    <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>
                      パスワードはAES-256で暗号化して保管されます
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Default OU & login format (full width) */}
            <div style={{ ...cardStyle, gridColumn: "1 / -1" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 14 }}>
                🏷️ デフォルト設定
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
                    デフォルト OU パス
                  </label>
                  <input
                    value={domainConfig.defaultOu}
                    onChange={e => setDomain("defaultOu", e.target.value)}
                    placeholder="例: OU=Workstations,DC=mirai,DC=local"
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 11, outline: "none" }}
                  />
                  <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>
                    OS・認証設定でプロファイル別に上書き可能
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
                    ドメインログイン形式
                  </label>
                  <select
                    value={domainConfig.loginFormat}
                    onChange={e => setDomain("loginFormat", e.target.value)}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, background: "#fff" }}
                  >
                    <option value="sam">SAM アカウント名（tanaka）</option>
                    <option value="upn">UPN 形式（tanaka@mirai.local）</option>
                    <option value="netbios">NetBIOS 形式（MIRAI\tanaka）</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
                    AD 同期間隔（分）
                  </label>
                  <select
                    value={domainConfig.syncInterval}
                    onChange={e => setDomain("syncInterval", Number(e.target.value))}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, background: "#fff" }}
                  >
                    <option value={15}>15 分</option>
                    <option value={30}>30 分</option>
                    <option value={60}>60 分（推奨）</option>
                    <option value={120}>120 分</option>
                  </select>
                </div>
              </div>

              {/* Summary box */}
              {domainConfig.enabled && domainConfig.domain && (
                <div style={{
                  marginTop: 14, background: "#f0fdf4", borderRadius: 8,
                  padding: "10px 14px", border: "1px solid #bbf7d0", fontSize: 11
                }}>
                  <div style={{ fontWeight: 600, color: "#15803d", marginBottom: 4 }}>
                    ✅ グローバル AD 設定サマリー
                  </div>
                  <div style={{ color: "#166534", display: "flex", flexWrap: "wrap", gap: "4px 20px" }}>
                    <span>ドメイン: <strong>{domainConfig.domain}</strong></span>
                    <span>NetBIOS: <strong>{domainConfig.netbiosName}</strong></span>
                    <span>DC: <strong>{domainConfig.dcHost || "未設定"}</strong></span>
                    <span>参加SVC: <strong>{domainConfig.joinUser || "未設定"}</strong></span>
                    <span>ログイン形式: <strong>{
                      domainConfig.loginFormat === "sam" ? "SAM" :
                      domainConfig.loginFormat === "upn" ? "UPN" : "NetBIOS"
                    }</strong></span>
                  </div>
                </div>
              )}

              {/* Inheritance note */}
              <div style={{
                marginTop: 12, background: "#fffbeb", borderRadius: 8,
                padding: "8px 12px", border: "1px solid #fde68a", fontSize: 11, color: "#92400e"
              }}>
                <strong>📌 継承ルール:</strong> OS・認証設定でADドメイン名を空欄にすると、このグローバル設定「<strong>{domainConfig.domain}</strong>」が自動適用されます。
                プロファイル別に別ドメインを使う場合はOS・認証設定で個別に入力してください。
              </div>

              <div style={{ marginTop: 14, display: "flex", gap: 10, alignItems: "center" }}>
                {domainConfig.adSaved && (
                  <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 500 }}>✅ 保存しました</span>
                )}
                <button
                  onClick={() => {
                    setDomainConfig(prev => ({ ...prev, adSaved: true }));
                    executeAction("ADドメイン設定保存", domainConfig.domain);
                    setTimeout(() => setDomainConfig(prev => ({ ...prev, adSaved: false })), 3000);
                  }}
                  style={{
                    padding: "8px 20px", borderRadius: 8, border: "none",
                    background: "#2563eb", color: "#fff", fontSize: 12, cursor: "pointer", fontWeight: 600
                  }}
                >
                  💾 AD設定を保存
                </button>
                <button
                  onClick={() => setDomainConfig(prev => ({
                    ...prev, domain: "mirai.local", netbiosName: "MIRAI",
                    kerberosRealm: "MIRAI.LOCAL", ldapBaseDn: "DC=mirai,DC=local",
                    defaultOu: "OU=Workstations,DC=mirai,DC=local", loginFormat: "sam"
                  }))}
                  style={{
                    padding: "8px 16px", borderRadius: 8, border: "1px solid #e2e8f0",
                    background: "#fff", fontSize: 12, cursor: "pointer", color: "#64748b"
                  }}
                >
                  🔄 デフォルトにリセット (mirai.local)
                </button>
              </div>
            </div>

            {/* ── AD ユーザー参照・選択 (full width) ── */}
            <div style={{ ...cardStyle, gridColumn: "1 / -1", marginTop: 4 }}>
              {/* Security warning */}
              <div style={{
                background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 8,
                padding: "8px 14px", display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 16
              }}>
                <span style={{ fontSize: 16, lineHeight: 1.4 }}>⚠️</span>
                <div style={{ fontSize: 11, color: "#92400e" }}>
                  <strong>セキュリティ推奨:</strong> ADクエリには Domain Admin ではなく
                  <code style={{ background: "#fde68a", padding: "0 4px", borderRadius: 3, fontFamily: "monospace" }}>CN=svc-ldapread</code>
                  などの<strong>読み取り専用サービスアカウント</strong>の使用を推奨します。
                  パスワードはセッション中のみ保持され、ソースコードには記録されません。
                </div>
              </div>

              <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <span>👥</span> AD ユーザー参照・割り当て
                {adBrowseStatus === "success" && (
                  <span style={{ fontSize: 11, fontWeight: 500, color: "#16a34a", marginLeft: 4 }}>
                    ✅ {adUserList.length}名取得済み
                  </span>
                )}
              </div>

              {/* Connection form */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 10, marginBottom: 14, alignItems: "flex-end" }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
                    AD ホスト名 / IP <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    value={adBrowse.host}
                    onChange={e => setAdBrowse(p => ({ ...p, host: e.target.value }))}
                    placeholder="VMSV3001"
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, outline: "none" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
                    ユーザー名 (UPN or SAM) <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    value={adBrowse.user}
                    onChange={e => setAdBrowse(p => ({ ...p, user: e.target.value }))}
                    placeholder="administrator"
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, outline: "none" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
                    パスワード <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <div style={{ display: "flex", gap: 4 }}>
                    <input
                      type={showAdPw ? "text" : "password"}
                      value={adBrowse.password}
                      onChange={e => setAdBrowse(p => ({ ...p, password: e.target.value }))}
                      placeholder="••••••••••••"
                      style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, outline: "none" }}
                    />
                    <button onClick={() => setShowAdPw(!showAdPw)}
                      style={{ padding: "8px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 12 }}>
                      {showAdPw ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleAdConnect}
                  disabled={!adBrowse.host || !adBrowse.user || adBrowseStatus === "connecting"}
                  style={{
                    padding: "8px 20px", borderRadius: 8, border: "none",
                    background: adBrowseStatus === "connecting" ? "#93c5fd" :
                                (!adBrowse.host || !adBrowse.user) ? "#e2e8f0" : "#2563eb",
                    color: (!adBrowse.host || !adBrowse.user) ? "#94a3b8" : "#fff",
                    fontSize: 12, cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap"
                  }}
                >
                  {adBrowseStatus === "connecting" ? "⏳ 接続中..." : "🔍 AD接続 & ユーザー取得"}
                </button>
              </div>

              {/* Status / result */}
              {adBrowseStatus === "error" && (
                <div style={{
                  background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8,
                  padding: "10px 14px", fontSize: 12, color: "#dc2626", marginBottom: 12
                }}>
                  ❌ AD への接続に失敗しました。ホスト名・認証情報・ネットワーク疎通を確認してください。
                </div>
              )}

              {adBrowseStatus === "success" && adUserList.length > 0 && (
                <div>
                  {/* Filter toolbar */}
                  <div style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "center" }}>
                    <input
                      type="text" placeholder="氏名 / 社員番号 / 部署で検索..."
                      value={adUserSearch} onChange={e => setAdUserSearch(e.target.value)}
                      style={{ flex: 1, padding: "7px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, outline: "none" }}
                    />
                    <select value={adOuFilter} onChange={e => setAdOuFilter(e.target.value)}
                      style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, background: "#fff" }}>
                      {adOus.map(ou => <option key={ou} value={ou}>{ou === "all" ? "全OU" : ou}</option>)}
                    </select>
                    <span style={{ fontSize: 11, color: "#64748b", whiteSpace: "nowrap" }}>
                      選択中: <strong style={{ color: "#2563eb" }}>{selectedAdUsers.size}</strong>名
                    </span>
                    {selectedAdUsers.size > 0 && (
                      <button onClick={() => setSelectedAdUsers(new Set())}
                        style={{ fontSize: 11, color: "#94a3b8", background: "none", border: "none", cursor: "pointer" }}>
                        クリア
                      </button>
                    )}
                  </div>

                  {/* User table */}
                  <div style={{ border: "1px solid #e8ecf1", borderRadius: 10, overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: "#f8fafc" }}>
                          <th style={{ ...thStyle, width: 36 }}>
                            <input type="checkbox"
                              checked={filteredAdUsers.length > 0 && filteredAdUsers.every(u => selectedAdUsers.has(u.sam))}
                              onChange={e => {
                                if (e.target.checked) filteredAdUsers.forEach(u => setSelectedAdUsers(prev => new Set([...prev, u.sam])));
                                else setSelectedAdUsers(new Set());
                              }}
                              style={{ accentColor: "#2563eb" }}
                            />
                          </th>
                          {["CN（氏名）", "sAMAccountName（社員番号）", "部署", "役職", "OU（所属）", "最終ログイン", "状態"].map(h => (
                            <th key={h} style={{ ...thStyle, fontSize: 10 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAdUsers.map(u => (
                          <tr
                            key={u.sam}
                            onClick={() => toggleAdUser(u.sam)}
                            style={{
                              borderTop: "1px solid #f1f5f9", cursor: "pointer",
                              background: selectedAdUsers.has(u.sam) ? "#eff6ff" : "transparent"
                            }}
                          >
                            <td style={{ padding: "7px 10px", textAlign: "center" }}>
                              <input type="checkbox" checked={selectedAdUsers.has(u.sam)}
                                onChange={() => toggleAdUser(u.sam)}
                                style={{ accentColor: "#2563eb" }}
                                onClick={e => e.stopPropagation()}
                              />
                            </td>
                            <td style={{ ...tdStyle, fontWeight: selectedAdUsers.has(u.sam) ? 600 : 400, color: "#0f172a" }}>
                              {u.cn}
                            </td>
                            <td style={{ ...tdStyle }}>
                              <code style={{
                                fontSize: 11, padding: "2px 7px", borderRadius: 4,
                                background: selectedAdUsers.has(u.sam) ? "#dbeafe" : "#f1f5f9",
                                color: selectedAdUsers.has(u.sam) ? "#1d4ed8" : "#475569",
                                fontWeight: 600
                              }}>{u.sam}</code>
                            </td>
                            <td style={{ ...tdStyle, color: "#475569" }}>{u.dept}</td>
                            <td style={{ ...tdStyle, color: "#64748b", fontSize: 11 }}>{u.title}</td>
                            <td style={{ ...tdStyle, fontSize: 10, color: "#94a3b8" }}>{u.ou}</td>
                            <td style={{ ...tdStyle, fontSize: 10, color: "#64748b" }}>{u.lastLogon}</td>
                            <td style={{ ...tdStyle }}>
                              <span style={{
                                fontSize: 10, padding: "1px 7px", borderRadius: 10, fontWeight: 600,
                                background: u.enabled ? "#f0fdf4" : "#f8fafc",
                                color: u.enabled ? "#22c55e" : "#94a3b8"
                              }}>{u.enabled ? "有効" : "無効"}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Selected summary + assign action */}
                  {selectedAdUsers.size > 0 && (
                    <div style={{
                      marginTop: 12, background: "#eff6ff", borderRadius: 10,
                      padding: "12px 16px", border: "1px solid #bfdbfe"
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#1d4ed8", marginBottom: 8 }}>
                        ✅ 選択済みADユーザー ({selectedAdUsers.size}名)
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                        {[...selectedAdUsers].map(sam => {
                          const u = AD_USERS_MOCK.find(x => x.sam === sam);
                          return u ? (
                            <span key={sam} style={{
                              display: "flex", alignItems: "center", gap: 5,
                              padding: "3px 10px", borderRadius: 14,
                              background: "#dbeafe", color: "#1d4ed8", fontSize: 11, fontWeight: 500
                            }}>
                              {u.cn}
                              <code style={{ fontSize: 10, opacity: 0.8 }}>({u.sam})</code>
                              <button onClick={() => toggleAdUser(sam)} style={{
                                background: "none", border: "none", cursor: "pointer",
                                color: "#1d4ed8", fontSize: 12, padding: 0, lineHeight: 1
                              }}>×</button>
                            </span>
                          ) : null;
                        })}
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => executeAction("ADユーザー割り当て", `${selectedAdUsers.size}名 → 展開設定に保存`)}
                          style={{
                            padding: "8px 20px", borderRadius: 8, border: "none",
                            background: "#2563eb", color: "#fff", fontSize: 12, cursor: "pointer", fontWeight: 600
                          }}
                        >
                          💾 展開設定にユーザーを割り当て
                        </button>
                        <button
                          onClick={() => executeAction("ADユーザーエクスポート", `${selectedAdUsers.size}名 CSV出力`)}
                          style={{
                            padding: "8px 16px", borderRadius: 8, border: "1px solid #bfdbfe",
                            background: "#fff", fontSize: 12, cursor: "pointer", color: "#2563eb"
                          }}
                        >
                          📥 CSV エクスポート
                        </button>
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: 8, fontSize: 10, color: "#94a3b8" }}>
                    ※ 実装時は <code>/api/v1/ad/users</code> (LDAP proxy) がバックエンドでクエリを実行します。
                    プロトタイプはモックデータを表示しています。
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Database */}
      {activeTab === "database" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={cardStyle}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 12 }}>データベース接続</div>
            {[{k:"DATABASE_URL",v:"postgresql://cdx:***@localhost:5432/cdx"},{k:"Backend",v:"PostgresStorage (async)"},{k:"ドライバ",v:"asyncpg + AsyncSession"},{k:"ORM",v:"SQLAlchemy 2.0"},{k:"マイグレーション",v:"Alembic 0002"}].map((r,i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: i < 4 ? "1px solid #f8fafc" : "none", fontSize: 12 }}><span style={{ color: "#94a3b8" }}>{r.k}</span><span style={{ color: "#0f172a", fontWeight: 500 }}>{r.v}</span></div>
            ))}
            <div style={{ marginTop: 10, padding: "10px 12px", background: "#f8fafc", borderRadius: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}><span style={{ color: "#64748b" }}>プール使用</span><span style={{ fontWeight: 600, color: "#22c55e" }}>3/5</span></div>
              <div style={{ height: 6, background: "#e8ecf1", borderRadius: 3 }}><div style={{ height: "100%", width: "60%", background: "#22c55e", borderRadius: 3 }}></div></div>
            </div>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 12 }}>テーブル一覧</div>
            {[{n:"devices",r:10},{n:"heartbeats",r:2847},{n:"inventory_snapshots",r:42},{n:"iso_build_jobs",r:5},{n:"iso_build_audit",r:18}].map((t,i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 0", borderBottom: i < 4 ? "1px solid #f8fafc" : "none", fontSize: 12 }}>
                <code style={{ color: "#2563eb", fontWeight: 500, width: 160 }}>{t.n}</code><span style={{ color: "#475569", fontWeight: 600 }}>{t.r.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agent */}
      {activeTab === "agent" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={cardStyle}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 12 }}>cdx-agent 設定</div>
            {[{k:"CDX_DEVICE_ID",v:"(端末別)"},{k:"CDX_API_ENDPOINT",v:"https://cdx-server:8300/api/v1"},{k:"heartbeat間隔",v:"60秒"},{k:"inventory間隔",v:"3600秒"},{k:"policy poll",v:"300秒"}].map((r,i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i < 4 ? "1px solid #f8fafc" : "none", fontSize: 12 }}>
                <code style={{ color: "#475569", fontWeight: 500 }}>{r.k}</code><span style={{ color: "#2563eb", fontWeight: 600 }}>{r.v}</span>
              </div>
            ))}
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 12 }}>Agent コマンド / systemd</div>
            {[{c:"cdx-agent version"},{c:"cdx-agent config"},{c:"cdx-agent inventory"},{c:"cdx-agent heartbeat"},{c:"cdx-agent drain"},{c:"cdx-agent poll-policy"}].map((r,i) => (
              <div key={i} style={{ padding: "4px 0", borderBottom: i < 5 ? "1px solid #f8fafc" : "none", fontSize: 11 }}>
                <code style={{ color: "#2563eb", fontWeight: 500 }}>{r.c}</code>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Network */}
      {activeTab === "network" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={cardStyle}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 12 }}>API エンドポイント (12)</div>
            {[{m:"GET",p:"/health"},{m:"POST",p:"/api/v1/devices/register"},{m:"POST",p:"/api/v1/heartbeat"},{m:"POST",p:"/api/v1/inventory"},{m:"GET",p:"/api/v1/policy"},{m:"POST",p:"/api/v1/iso-builds"},{m:"GET",p:"/api/v1/iso-builds"},{m:"GET",p:"/api/v1/iso-builds/{id}"},{m:"GET",p:"/api/v1/iso-builds/{id}/log"},{m:"GET",p:"/api/v1/iso-builds/{id}/download"},{m:"POST",p:"/api/v1/iso-builds/{id}/cancel"},{m:"GET",p:"/metrics"}].map((r,i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 0", borderBottom: i < 11 ? "1px solid #f8fafc" : "none", fontSize: 11 }}>
                <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 3, background: r.m === "GET" ? "#eff6ff" : "#f0fdf4", color: r.m === "GET" ? "#2563eb" : "#22c55e", width: 32, textAlign: "center" }}>{r.m}</span>
                <code style={{ color: "#0f172a" }}>{r.p}</code>
              </div>
            ))}
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 12 }}>外部サービス / Docker</div>
            {[{s:"cdx-server",p:"8300"},{s:"postgres",p:"5432"},{s:"redis",p:"6379"},{s:"minio",p:"9000"},{s:"prometheus",p:"9090"}].map((r,i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: i < 4 ? "1px solid #f8fafc" : "none", fontSize: 12 }}>
                <code style={{ color: "#475569", fontWeight: 500, width: 100 }}>{r.s}</code><span style={{ color: "#94a3b8" }}>:{r.p}</span>
                <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#22c55e", fontWeight: 500 }}><span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e" }}></span>running</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notifications */}
      {activeTab === "notifications" && (
        <div style={cardStyle}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 12 }}>アラート通知設定</div>
          {notifications.map((n, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: i < notifications.length - 1 ? "1px solid #f8fafc" : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, width: 100 }}>
                <span style={{ fontSize: 16 }}>{n.type === "email" ? "📧" : n.type === "webhook" ? "🔗" : "💬"}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{n.type === "email" ? "メール" : n.type === "webhook" ? "Webhook" : "Slack"}</span>
              </div>
              <button onClick={() => { const nv = [...notifications]; nv[i] = { ...nv[i], enabled: !nv[i].enabled }; setNotifications(nv); }} style={{ padding: "4px 12px", borderRadius: 12, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, background: n.enabled ? "#f0fdf4" : "#f8fafc", color: n.enabled ? "#22c55e" : "#94a3b8" }}>{n.enabled ? "ON" : "OFF"}</button>
              <input type="text" placeholder={n.type === "email" ? "メールアドレス" : n.type === "webhook" ? "https://..." : "#channel"} value={n.target} onChange={e => { const nv = [...notifications]; nv[i] = { ...nv[i], target: e.target.value }; setNotifications(nv); }} style={{ flex: 1, padding: "6px 10px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 12, color: "#0f172a" }} />
              <button onClick={() => executeAction("通知テスト", n.type)} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 10, cursor: "pointer", background: "#fff", color: "#2563eb" }}>テスト送信</button>
            </div>
          ))}
          <div style={{ marginTop: 12, padding: "10px 14px", background: "#f8fafc", borderRadius: 8, fontSize: 11, color: "#64748b" }}>
            通知対象: critical/high アラート、デバイスオフライン、ISOビルド完了/失敗、トークンローテーション
          </div>
          <button onClick={() => executeAction("通知設定保存", "全チャンネル")} style={{ marginTop: 8, padding: "6px 16px", borderRadius: 6, background: "#2563eb", color: "#fff", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>保存</button>
        </div>
      )}

      {/* Maintenance */}
      {activeTab === "maintenance" && (
        <div>
          <div style={cardStyle}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 12 }}>メンテナンスモード</div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.6 }}>
                  メンテナンスモードを有効にすると、API が 503 Service Unavailable を返却し、端末からのリクエスト受付を一時停止します。管理WebUIは引き続きアクセス可能です。
                </div>
              </div>
              <button onClick={() => { setMaintenanceMode(!maintenanceMode); executeAction(maintenanceMode ? "メンテナンスモード解除" : "メンテナンスモード開始", "API 503 切替"); }} style={{ padding: "10px 24px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", background: maintenanceMode ? "#22c55e" : "#dc2626", color: "#fff" }}>
                {maintenanceMode ? "✓ 解除 (API受付再開)" : "⚠ メンテナンス開始"}
              </button>
            </div>
            <div style={{ padding: "12px 16px", borderRadius: 8, background: maintenanceMode ? "#fef2f2" : "#f0fdf4", border: `1px solid ${maintenanceMode ? "#fecaca" : "#bbf7d0"}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: maintenanceMode ? "#dc2626" : "#22c55e" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: maintenanceMode ? "#dc2626" : "#22c55e" }}></span>
                {maintenanceMode ? "メンテナンスモード: ON — API は 503 を返却中" : "通常運用中 — API は全リクエストを受付中"}
              </div>
            </div>
          </div>
          <div style={{ ...cardStyle, marginTop: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 10 }}>メンテナンス時の影響</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ padding: "12px", background: "#fef2f2", borderRadius: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#dc2626", marginBottom: 6 }}>停止される機能</div>
                {["heartbeat 受信", "inventory 受信", "デバイス登録", "ポリシー配信", "ISO ビルド開始"].map((f, i) => (
                  <div key={i} style={{ fontSize: 11, color: "#64748b", padding: "2px 0" }}>✕ {f}</div>
                ))}
              </div>
              <div style={{ padding: "12px", background: "#f0fdf4", borderRadius: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#22c55e", marginBottom: 6 }}>継続する機能</div>
                {["管理WebUI アクセス", "監査ログ閲覧", "設定変更", "/health エンドポイント", "Prometheus メトリクス"].map((f, i) => (
                  <div key={i} style={{ fontSize: 11, color: "#64748b", padding: "2px 0" }}>✓ {f}</div>
                ))}
              </div>
            </div>
            <div style={{ marginTop: 10, fontSize: 11, color: "#94a3b8" }}>
              ⚠ 端末側の cdx-agent はスプールにリクエストを蓄積し、メンテナンス解除後に自動再送します（backoff + retry）
            </div>
          </div>
        </div>
      )}

      {/* System Info */}
      {activeTab === "system" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={cardStyle}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 12 }}>プロジェクト情報</div>
            {[{k:"プロジェクト名",v:"建設DX OS"},{k:"目的",v:"建設会社向け業務用クライアント基盤"},{k:"ベースOS",v:"Debian 13 stable"},{k:"デスクトップ",v:"XFCE"},{k:"開発開始",v:"2026-04-10"},{k:"リリース目標",v:"2026-10-10"},{k:"現在フェーズ",v:"Phase 2"},{k:"リポジトリ",v:"Kensan196948G/Construction-DX-OS"}].map((r,i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: i < 7 ? "1px solid #f8fafc" : "none", fontSize: 12 }}><span style={{ color: "#94a3b8" }}>{r.k}</span><span style={{ color: "#0f172a", fontWeight: 500 }}>{r.v}</span></div>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={cardStyle}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 12 }}>コンポーネント</div>
              {[{k:"cdx-server",v:"0.1.0",s:"stable"},{k:"cdx-agent",v:"0.2.0",s:"stable"},{k:"build-worker",v:"0.1.0",s:"mock"},{k:"OpenAPI",v:"12 endpoints",s:"synced"},{k:"SDK (TS/Py)",v:"auto-gen",s:"synced"}].map((r,i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 0", borderBottom: i < 4 ? "1px solid #f8fafc" : "none", fontSize: 12 }}>
                  <span style={{ color: "#475569", fontWeight: 500, width: 100 }}>{r.k}</span><span style={{ color: "#2563eb", fontWeight: 600 }}>{r.v}</span>
                  <span style={{ marginLeft: "auto", fontSize: 10, padding: "1px 6px", borderRadius: 3, background: "#f0fdf4", color: "#22c55e" }}>{r.s}</span>
                </div>
              ))}
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 12 }}>テスト・品質</div>
              {[{k:"総テスト",v:"358件",c:"#22c55e"},{k:"CI",v:"8/8 green",c:"#22c55e"},{k:"カバレッジ",v:"97%",c:"#22c55e"},{k:"セキュリティ",v:"CVE 0",c:"#22c55e"}].map((r,i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: i < 3 ? "1px solid #f8fafc" : "none", fontSize: 12 }}>
                  <span style={{ color: "#94a3b8" }}>{r.k}</span><span style={{ color: r.c, fontWeight: 600 }}>{r.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Action log */}
      {actionLog.length > 0 && (
        <div style={{ ...cardStyle, marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>操作ログ</span>
            <button onClick={() => setActionLog([])} style={{ fontSize: 10, color: "#94a3b8", background: "none", border: "none", cursor: "pointer" }}>クリア</button>
          </div>
          {actionLog.slice(0, 10).map((a, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 0", borderBottom: i < actionLog.length - 1 ? "1px solid #f8fafc" : "none", fontSize: 12 }}>
              <span style={{ color: "#94a3b8", fontSize: 11 }}>{a.at}</span>
              <span style={{ fontWeight: 500, color: "#475569" }}>{a.action}</span>
              <span style={{ color: "#64748b" }}>{a.detail}</span>
              <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 6, background: a.status === "完了" ? "#f0fdf4" : "#eff6ff", color: a.status === "完了" ? "#22c55e" : "#3b82f6" }}>{a.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

window.SettingsPage = SettingsPage;
