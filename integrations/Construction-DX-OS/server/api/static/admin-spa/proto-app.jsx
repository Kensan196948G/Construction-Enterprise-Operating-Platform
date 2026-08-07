/* ─── Main App Shell (Sidebar + Pages) ─── */

const NAV = [
  { id: "dashboard", label: "ダッシュボード",     icon: "📊", group: "overview" },
  { id: "devices",    label: "端末管理",           icon: "💻", group: "deploy" },
  { id: "deployment", label: "OS・認証設定",      icon: "🔐", group: "deploy" },
  { id: "register",   label: "展開台帳",          icon: "📋", group: "deploy" },
  { id: "apps",       label: "配布アプリ",        icon: "📦", group: "deploy" },
  { id: "iso",       label: "ISO 配布",           icon: "💿", group: "deploy" },
  { id: "rings",     label: "更新リング管理",      icon: "🔄", group: "deploy" },
  { id: "pxe",       label: "PXE 展開管理",       icon: "🖥️", group: "deploy" },
  { id: "security",  label: "セキュリティ・ポリシー", icon: "🛡️", group: "govern" },
  { id: "logs",      label: "監査ログ",           icon: "📋", group: "govern" },
  { id: "settings",  label: "システム設定",        icon: "⚙️", group: "govern" },
];

const NAV_GROUPS = [
  { id: "overview", label: null },
  { id: "deploy",   label: "展開フロー" },
  { id: "govern",   label: "管理・ガバナンス" },
];

function App() {
  const [nav, setNav] = React.useState("dashboard");

  const renderPage = () => {
    switch (nav) {
      case "dashboard": return <DashboardPage />;
      case "devices": return <DevicesPage />;
      case "iso": return <IsoPage />;
      case "deployment": return <DeploymentPage />;
      case "register":   return <RegisterPage />;
      case "apps": return <AppsPage />;
      case "rings": return <RingsPage />;
      case "pxe": return <PxePage />;
      case "security": return <SecurityPage />;

      case "logs": return <LogsPage />;
      case "settings": return <SettingsPage />;
      default: return <DashboardPage />;
    }
  };

  return (
    <div style={{
      width: "100vw", height: "100vh", background: "#f8fafc",
      fontFamily: "'Plus Jakarta Sans', 'Noto Sans JP', sans-serif",
      display: "flex", overflow: "hidden"
    }}>
      {/* Sidebar */}
      <div style={{
        width: 220, background: "#fff", borderRight: "1px solid #e8ecf1",
        display: "flex", flexDirection: "column", flexShrink: 0
      }}>
        <div style={{ padding: "18px 18px 14px", borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 8,
              background: "linear-gradient(135deg, #2563eb, #3b82f6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: 15, fontWeight: 700
            }}>C</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>建設DX OS</div>
              <div style={{ fontSize: 10, color: "#94a3b8" }}>中央管理コンソール</div>
            </div>
          </div>
        </div>
        <div style={{ padding: "8px 8px", flex: 1, display: "flex", flexDirection: "column", gap: 1, overflowY: "auto" }}>
          {NAV_GROUPS.map(grp => {
            const items = NAV.filter(n => n.group === grp.id);
            return (
              <div key={grp.id}>
                {grp.label && (
                  <div style={{
                    fontSize: 9, fontWeight: 700, color: "#cbd5e1", letterSpacing: "0.08em",
                    textTransform: "uppercase", padding: "10px 14px 4px"
                  }}>{grp.label}</div>
                )}
                {items.map(item => (
                  <button key={item.id} onClick={() => setNav(item.id)} style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "8px 14px",
                    borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12.5, textAlign: "left",
                    width: "100%",
                    background: nav === item.id ? "#eff6ff" : "transparent",
                    color: nav === item.id ? "#2563eb" : "#475569",
                    fontWeight: nav === item.id ? 600 : 400,
                    transition: "all 100ms"
                  }}>
                    <span style={{ fontSize: 14 }}>{item.icon}</span>{item.label}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
        {/* System status */}
        <div style={{ padding: "14px 16px", borderTop: "1px solid #f1f5f9" }}>
          <div style={{ background: "#f0fdf4", borderRadius: 8, padding: "10px 12px", fontSize: 11 }}>
            <div style={{ fontWeight: 600, color: "#16a34a", marginBottom: 4 }}>システム正常</div>
            <div style={{ color: "#64748b" }}>PostgreSQL: OK</div>
            <div style={{ color: "#64748b" }}>Redis: 接続中</div>
            <div style={{ color: "#64748b" }}>API: 7 endpoints</div>
          </div>
          <div style={{ marginTop: 8, fontSize: 10, color: "#cbd5e1", textAlign: "center" }}>
            cdx-server v0.1.0
          </div>
        </div>
      </div>
      {/* Main area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Top bar */}
        <div style={{
          padding: "12px 28px", background: "#fff", borderBottom: "1px solid #e8ecf1",
          display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0
        }}>
          <div style={{ fontSize: 12, color: "#94a3b8" }}>
            建設DX OS 中央管理コンソール — OS配布・端末標準化・セキュリティ統制
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>2026-05-06 09:30 JST</span>
            <div style={{
              width: 30, height: 30, borderRadius: "50%", background: "#eff6ff",
              color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 600, fontSize: 12
            }}>管</div>
          </div>
        </div>
        {/* Content */}
        <div style={{ flex: 1, padding: "24px 28px", overflowY: "auto" }}>
          {renderPage()}
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
