/* ─── 配布アプリ管理ページ ─── */

const APPS_CATALOG = [
  /* ── 業務アプリ ── */
  {
    id: "libreoffice", name: "LibreOffice 7.6", category: "business",
    icon: "📝", desc: "Writer / Calc / Impress 統合オフィス",
    pkg: "libreoffice", method: "apt", size: 350, unit: "MB",
    profiles: ["standard", "field"], recommended: true,
    detail: "Microsoft Office互換。建設現場の報告書・工程表・プレゼン作成に対応。"
  },
  {
    id: "firefox-esr", name: "Firefox ESR", category: "business",
    icon: "🌐", desc: "企業向け長期サポート Webブラウザ",
    pkg: "firefox-esr", method: "apt", size: 70, unit: "MB",
    profiles: ["standard", "field", "kiosk"], recommended: true,
    detail: "セキュリティ更新が長期保証。社内システム・電子申請に使用。"
  },
  {
    id: "thunderbird", name: "Thunderbird 115", category: "business",
    icon: "📧", desc: "高機能メール / カレンダークライアント",
    pkg: "thunderbird", method: "apt", size: 80, unit: "MB",
    profiles: ["standard"], recommended: false,
    detail: "Exchange/GMailアカウント対応。カレンダー・タスク管理機能付き。"
  },
  {
    id: "evince", name: "Evince (PDF Viewer)", category: "business",
    icon: "📄", desc: "PDF / 施工図面ビューア (軽量)",
    pkg: "evince", method: "apt", size: 20, unit: "MB",
    profiles: ["standard", "field", "kiosk"], recommended: true,
    detail: "PDF・DjVu・TIFF対応。現場での図面確認に最適な軽量ビューア。"
  },

  /* ── 建設専用 ── */
  {
    id: "qgis", name: "QGIS 3.x", category: "construction",
    icon: "🗺️", desc: "地理情報システム (GIS) — 現場測量・地図",
    pkg: "qgis", method: "apt", size: 450, unit: "MB",
    profiles: ["field"], recommended: true,
    detail: "GPS測量データの可視化、現場地図作成、土地情報管理に使用。国土地理院データ対応。"
  },
  {
    id: "freecad", name: "FreeCAD 0.21", category: "construction",
    icon: "🏗️", desc: "3D パラメトリック CAD / BIM 対応",
    pkg: "freecad", method: "apt", size: 300, unit: "MB",
    profiles: ["standard", "field"], recommended: false,
    detail: "BIMモジュール搭載。建築・構造設計の3Dモデリングと図面生成が可能。"
  },
  {
    id: "inkscape", name: "Inkscape 1.3", category: "construction",
    icon: "✏️", desc: "ベクター図形編集 — 施工図・標識作成",
    pkg: "inkscape", method: "apt", size: 200, unit: "MB",
    profiles: ["standard"], recommended: false,
    detail: "DXF/SVG/PDFのベクター編集。施工計画図・注意標識・看板デザインに。"
  },
  {
    id: "gimp", name: "GIMP 2.10", category: "construction",
    icon: "🖼️", desc: "画像編集 — 現場写真・施工記録",
    pkg: "gimp", method: "apt", size: 120, unit: "MB",
    profiles: ["standard", "field"], recommended: false,
    detail: "現場写真の補正・注釈追加・工程記録画像の編集。RAW現像も対応。"
  },
  {
    id: "jwcad", name: "Jw_cad (Wine経由)", category: "construction",
    icon: "📐", desc: "日本建設業界標準 2D CAD (Wine実行)",
    pkg: "wine jwcad", method: "wine", size: 50, unit: "MB",
    profiles: ["standard", "field"], recommended: true,
    detail: "国内建設現場で最も普及した2D CAD。既存dwg/jww図面との互換性が高い。Wine 8.0で動作確認済み。"
  },

  /* ── ユーティリティ ── */
  {
    id: "remmina", name: "Remmina", category: "utility",
    icon: "🖥️", desc: "リモートデスクトップ (RDP / VNC / SSH)",
    pkg: "remmina", method: "apt", size: 40, unit: "MB",
    profiles: ["standard"], recommended: true,
    detail: "Windowsサーバー・本社システムへのRDP接続。VNC/SSH対応でサーバー管理にも使用。"
  },
  {
    id: "vlc", name: "VLC 3.x", category: "utility",
    icon: "▶️", desc: "マルチメディアプレイヤー — 現場動画確認",
    pkg: "vlc", method: "apt", size: 120, unit: "MB",
    profiles: ["standard", "field"], recommended: false,
    detail: "ほぼ全動画形式対応。ドローン映像・工事進捗動画の再生確認に。"
  },
  {
    id: "timeshift", name: "Timeshift", category: "utility",
    icon: "⏱️", desc: "システムスナップショット / バックアップ",
    pkg: "timeshift", method: "apt", size: 30, unit: "MB",
    profiles: ["standard"], recommended: false,
    detail: "BTRFS/rsyncスナップショット。システム変更前の安全ポイント作成に推奨。"
  },
  {
    id: "gparted", name: "GParted", category: "utility",
    icon: "💾", desc: "GUI パーティション管理ツール",
    pkg: "gparted", method: "apt", size: 20, unit: "MB",
    profiles: ["standard"], recommended: false,
    detail: "ディスクパーティション作成・変更・フォーマット。端末セットアップ時に使用。"
  },

  /* ── セキュリティ ── */
  {
    id: "clamav", name: "ClamAV + ClamTk", category: "security",
    icon: "🦠", desc: "オープンソースアンチウイルス (GUI付き)",
    pkg: "clamav clamtk", method: "apt", size: 200, unit: "MB",
    profiles: ["standard", "field", "kiosk"], recommended: true,
    detail: "オフライン定義ファイル更新対応。USB経由マルウェア対策として全端末に推奨。"
  },
  {
    id: "keepassxc", name: "KeePassXC 2.7", category: "security",
    icon: "🔑", desc: "パスワードマネージャー (ローカル保管)",
    pkg: "keepassxc", method: "apt", size: 80, unit: "MB",
    profiles: ["standard"], recommended: true,
    detail: "暗号化ローカルDB。パスワードをクラウド非依存で管理。TOTP/SSHエージェント対応。"
  },
  {
    id: "veracrypt", name: "VeraCrypt 1.26", category: "security",
    icon: "🔒", desc: "ディスク / ファイル暗号化コンテナ",
    pkg: "veracrypt", method: "deb", size: 60, unit: "MB",
    profiles: ["standard", "field"], recommended: false,
    detail: "持ち出しUSB・機密図面フォルダの暗号化。AES-256/Serpent対応。情報漏洩対策必須現場向け。"
  },

  /* ── コミュニケーション ── */
  {
    id: "zoom", name: "Zoom 6.x", category: "communication",
    icon: "📹", desc: "オンライン会議 / 現場遠隔立会い",
    pkg: "zoom", method: "deb", size: 150, unit: "MB",
    profiles: ["standard", "field"], recommended: true,
    detail: "本社・現場間の遠隔立会い・工程会議。Webカメラ・画面共有対応。"
  },
  {
    id: "teams", name: "Microsoft Teams (Flatpak)", category: "communication",
    icon: "💬", desc: "チームコラボレーション / チャット",
    pkg: "com.microsoft.Teams", method: "flatpak", size: 200, unit: "MB",
    profiles: ["standard"], recommended: false,
    detail: "SharePoint・OneDrive連携。Office365環境の企業向け。Flatpak版でLinux公式サポート。"
  },
  {
    id: "slack", name: "Slack Desktop", category: "communication",
    icon: "💼", desc: "チャット / ファイル共有 / ワークフロー自動化",
    pkg: "slack", method: "deb", size: 180, unit: "MB",
    profiles: ["standard"], recommended: false,
    detail: "チャンネル別情報共有。建設現場の工種別・現場別コミュニケーション管理。"
  },
];

const APP_CATEGORIES = [
  { id: "all", label: "すべて", icon: "🗂️" },
  { id: "business", label: "業務アプリ", icon: "📝" },
  { id: "construction", label: "建設専用", icon: "🏗️" },
  { id: "utility", label: "ユーティリティ", icon: "🔧" },
  { id: "security", label: "セキュリティ", icon: "🔒" },
  { id: "communication", label: "コミュニケーション", icon: "💬" },
];

const METHOD_BADGE = {
  apt:     { label: "APT", color: "#2563eb", bg: "#eff6ff" },
  deb:     { label: ".deb", color: "#7c3aed", bg: "#f5f3ff" },
  flatpak: { label: "Flatpak", color: "#0891b2", bg: "#ecfeff" },
  wine:    { label: "Wine", color: "#b45309", bg: "#fffbeb" },
};

Object.assign(window, { APPS_CATALOG, APP_CATEGORIES, METHOD_BADGE });

/* ─────────────────────────────────────────── */
function AppsPage() {
  const [catFilter, setCatFilter] = React.useState("all");
  const [selected, setSelected] = React.useState(new Set());
  const [profileFilter, setProfileFilter] = React.useState("all");
  const [search, setSearch] = React.useState("");
  const [showIsoModal, setShowIsoModal] = React.useState(false);

  const filtered = APPS_CATALOG.filter(a => {
    if (catFilter !== "all" && a.category !== catFilter) return false;
    if (profileFilter !== "all" && !a.profiles.includes(profileFilter)) return false;
    if (search && !a.name.toLowerCase().includes(search.toLowerCase()) &&
        !a.desc.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const toggleApp = id => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(filtered.map(a => a.id)));
  const selectRecommended = () => setSelected(new Set(APPS_CATALOG.filter(a => a.recommended).map(a => a.id)));
  const clearAll = () => setSelected(new Set());

  const selectedApps = APPS_CATALOG.filter(a => selected.has(a.id));
  const totalSizeMB = selectedApps.reduce((s, a) => s + a.size, 0);
  const totalSizeStr = totalSizeMB >= 1000 ? `${(totalSizeMB / 1024).toFixed(1)} GB` : `${totalSizeMB} MB`;

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
          📦 配布アプリ管理
        </h2>
        <p style={{ fontSize: 12, color: "#64748b" }}>
          ISO ビルドに含めるアプリを選択します。選択内容はプロファイル別に保存でき、ISO 配布時に自動インストールされます。
        </p>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "利用可能アプリ", value: APPS_CATALOG.length, icon: "📦", color: "#3b82f6" },
          { label: "選択中", value: selected.size, icon: "✅", color: "#22c55e" },
          { label: "推定追加サイズ", value: totalSizeStr, icon: "💾", color: "#f59e0b" },
          { label: "対象プロファイル", value: profileFilter === "all" ? "全プロファイル" : profileFilter, icon: "🏷️", color: "#8b5cf6" },
        ].map(c => (
          <div key={c.label} style={{ ...cardStyle, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 22 }}>{c.icon}</div>
            <div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 2 }}>{c.label}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: c.color }}>{c.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ ...cardStyle, marginBottom: 16, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <input
          type="text" placeholder="アプリを検索..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{
            padding: "7px 12px", borderRadius: 8, border: "1px solid #e2e8f0",
            fontSize: 12, outline: "none", flex: "1 1 180px", minWidth: 140
          }}
        />
        <select
          value={profileFilter} onChange={e => setProfileFilter(e.target.value)}
          style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, background: "#fff" }}
        >
          <option value="all">全プロファイル</option>
          <option value="standard">standard</option>
          <option value="field">field</option>
          <option value="kiosk">kiosk</option>
        </select>
        <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
          <button onClick={selectRecommended} style={actionBtnStyle("#2563eb")}>推奨を選択</button>
          <button onClick={selectAll} style={actionBtnStyle("#64748b")}>すべて選択</button>
          <button onClick={clearAll} style={actionBtnStyle("#94a3b8")}>クリア</button>
          <button
            onClick={() => selected.size > 0 && setShowIsoModal(true)}
            disabled={selected.size === 0}
            style={actionBtnStyle(selected.size > 0 ? "#22c55e" : "#cbd5e1", selected.size === 0)}
          >
            🚀 ISO ビルドへ追加
          </button>
        </div>
      </div>

      {/* Category tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {APP_CATEGORIES.map(cat => {
          const count = cat.id === "all"
            ? APPS_CATALOG.length
            : APPS_CATALOG.filter(a => a.category === cat.id).length;
          return (
            <button key={cat.id} onClick={() => setCatFilter(cat.id)} style={{
              padding: "6px 14px", borderRadius: 20, border: "1px solid",
              fontSize: 12, cursor: "pointer", fontWeight: catFilter === cat.id ? 600 : 400,
              borderColor: catFilter === cat.id ? "#2563eb" : "#e2e8f0",
              background: catFilter === cat.id ? "#eff6ff" : "#fff",
              color: catFilter === cat.id ? "#2563eb" : "#475569",
              display: "flex", alignItems: "center", gap: 5
            }}>
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
              <span style={{
                background: catFilter === cat.id ? "#2563eb" : "#e2e8f0",
                color: catFilter === cat.id ? "#fff" : "#64748b",
                borderRadius: 10, padding: "1px 6px", fontSize: 10, fontWeight: 600
              }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* App grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))", gap: 12 }}>
        {filtered.map(app => (
          <AppCard key={app.id} app={app} selected={selected.has(app.id)} onToggle={toggleApp} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8", fontSize: 13 }}>
          該当するアプリが見つかりません
        </div>
      )}

      {/* Selected apps footer */}
      {selected.size > 0 && (
        <div style={{
          ...cardStyle, marginTop: 20,
          borderLeft: "4px solid #22c55e", background: "#f0fdf4"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#16a34a" }}>
              ✅ 選択中のアプリ ({selected.size}件 / 推定 {totalSizeStr})
            </div>
            <button onClick={clearAll} style={{ fontSize: 11, color: "#94a3b8", background: "none", border: "none", cursor: "pointer" }}>
              クリア
            </button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {selectedApps.map(app => (
              <span key={app.id} style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "4px 10px", borderRadius: 16,
                background: "#dcfce7", color: "#16a34a", fontSize: 11, fontWeight: 500
              }}>
                {app.icon} {app.name}
                <button onClick={() => toggleApp(app.id)} style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "#16a34a", fontSize: 12, padding: 0, lineHeight: 1
                }}>×</button>
              </span>
            ))}
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <button onClick={() => setShowIsoModal(true)} style={actionBtnStyle("#22c55e")}>
              🚀 ISO ビルドへ追加してビルド開始
            </button>
            <button style={actionBtnStyle("#3b82f6")}>
              💾 プロファイルに保存
            </button>
          </div>
        </div>
      )}

      {/* Profile assignment section */}
      <ProfileAssignSection selected={selected} onToggle={toggleApp} />

      {/* ISO build modal */}
      {showIsoModal && (
        <IsoBuildModal selectedApps={selectedApps} totalSize={totalSizeStr} onClose={() => setShowIsoModal(false)} />
      )}
    </div>
  );
}

/* ── App Card component ── */
function AppCard({ app, selected, onToggle }) {
  const mb = METHOD_BADGE[app.method] || METHOD_BADGE.apt;
  return (
    <div
      onClick={() => onToggle(app.id)}
      style={{
        ...cardStyle, cursor: "pointer",
        borderColor: selected ? "#22c55e" : "#e8ecf1",
        borderWidth: selected ? 2 : 1,
        background: selected ? "#f0fdf4" : "#fff",
        transition: "all 120ms", position: "relative"
      }}
    >
      {app.recommended && (
        <span style={{
          position: "absolute", top: 10, right: 10,
          fontSize: 10, background: "#fef3c7", color: "#d97706",
          borderRadius: 10, padding: "2px 7px", fontWeight: 600
        }}>★ 推奨</span>
      )}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 10, flexShrink: 0,
          background: selected ? "#dcfce7" : "#f1f5f9",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20
        }}>{app.icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{app.name}</div>
            <span style={{
              fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 4,
              background: mb.bg, color: mb.color
            }}>{mb.label}</span>
          </div>
          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6, lineHeight: 1.4 }}>{app.desc}</div>
          <div style={{ fontSize: 10, color: "#94a3b8", lineHeight: 1.4 }}>{app.detail}</div>
        </div>
      </div>
      <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 4 }}>
          {app.profiles.map(p => (
            <span key={p} style={{
              fontSize: 10, padding: "2px 6px", borderRadius: 4,
              background: "#f1f5f9", color: "#475569"
            }}>{p}</span>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 10, color: "#94a3b8" }}>~{app.size}{app.unit}</span>
          <div style={{
            width: 18, height: 18, borderRadius: 4, border: "2px solid",
            borderColor: selected ? "#22c55e" : "#cbd5e1",
            background: selected ? "#22c55e" : "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, color: "#fff"
          }}>{selected ? "✓" : ""}</div>
        </div>
      </div>
    </div>
  );
}

/* ── Profile assignment section ── */
function ProfileAssignSection({ selected, onToggle }) {
  const profiles = ["standard", "field", "kiosk"];
  const profileNames = { standard: "Standard (事務・本社)", field: "Field (現場・巡回)", kiosk: "Kiosk (受付・共用)" };
  const profileIcons = { standard: "💼", field: "🦺", kiosk: "📺" };

  return (
    <div style={{ ...cardStyle, marginTop: 20 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 4 }}>
        🏷️ プロファイル別推奨アプリ
      </div>
      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 14 }}>
        各プロファイル (端末種別) に対して推奨されるアプリ一覧です。「プロファイル選択」でまとめて選択できます。
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
        {profiles.map(prof => {
          const apps = APPS_CATALOG.filter(a => a.profiles.includes(prof) && a.recommended);
          const selectedCount = apps.filter(a => selected.has(a.id)).length;
          return (
            <div key={prof} style={{
              background: "#f8fafc", borderRadius: 10, padding: "12px 14px",
              border: "1px solid #e8ecf1"
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 16 }}>{profileIcons[prof]}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{prof}</div>
                    <div style={{ fontSize: 10, color: "#94a3b8" }}>{profileNames[prof]}</div>
                  </div>
                </div>
                <span style={{
                  fontSize: 10, padding: "2px 7px", borderRadius: 10,
                  background: selectedCount === apps.length && apps.length > 0 ? "#dcfce7" : "#f1f5f9",
                  color: selectedCount === apps.length && apps.length > 0 ? "#16a34a" : "#64748b",
                  fontWeight: 600
                }}>{selectedCount}/{apps.length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
                {apps.map(a => (
                  <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#475569" }}>
                    <span style={{ color: selected.has(a.id) ? "#22c55e" : "#cbd5e1" }}>
                      {selected.has(a.id) ? "✓" : "○"}
                    </span>
                    <span>{a.icon}</span>
                    <span>{a.name}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => apps.forEach(a => !selected.has(a.id) && onToggle(a.id))}
                style={{
                  width: "100%", padding: "5px 0", borderRadius: 6,
                  border: "1px solid #e2e8f0", background: "#fff",
                  fontSize: 11, cursor: "pointer", color: "#2563eb", fontWeight: 500
                }}
              >
                {selectedCount === apps.length ? "✅ 選択済み" : "推奨アプリを一括選択"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── ISO Build Modal ── */
function IsoBuildModal({ selectedApps, totalSize, onClose }) {
  const [profile, setProfile] = React.useState("standard");
  const [gitRef, setGitRef] = React.useState("main");
  const [notes, setNotes] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(onClose, 2500);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.45)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
    }}>
      <div style={{
        background: "#fff", borderRadius: 14, padding: 28,
        width: 540, maxWidth: "90vw", maxHeight: "85vh", overflowY: "auto",
        boxShadow: "0 20px 60px rgba(0,0,0,.2)"
      }}>
        {submitted ? (
          <div style={{ textAlign: "center", padding: "30px 0" }}>
            <div style={{ fontSize: 42, marginBottom: 12 }}>🚀</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#16a34a", marginBottom: 6 }}>
              ISO ビルドをキューに追加しました
            </div>
            <div style={{ fontSize: 12, color: "#64748b" }}>
              「ISO 配布」ページでビルド進捗を確認できます
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
              🚀 アプリを含めて ISO ビルド
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 20 }}>
              選択したアプリを ISO に同梱してビルドします。ビルド完了後に端末へ配布されます。
            </div>

            {/* Selected apps summary */}
            <div style={{ background: "#f0fdf4", borderRadius: 10, padding: "10px 14px", marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#16a34a", marginBottom: 6 }}>
                含めるアプリ ({selectedApps.length}件 / 合計 {totalSize})
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {selectedApps.map(a => (
                  <span key={a.id} style={{
                    fontSize: 11, padding: "3px 9px", borderRadius: 12,
                    background: "#dcfce7", color: "#16a34a"
                  }}>{a.icon} {a.name}</span>
                ))}
              </div>
            </div>

            {/* Build params */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
                  プロファイル
                </label>
                <select value={profile} onChange={e => setProfile(e.target.value)} style={{
                  width: "100%", padding: "8px 10px", borderRadius: 8,
                  border: "1px solid #e2e8f0", fontSize: 12, background: "#fff"
                }}>
                  <option value="standard">standard — 事務・本社</option>
                  <option value="field">field — 現場・巡回</option>
                  <option value="kiosk">kiosk — 受付・共用端末</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
                  Git Ref (ブランチ / タグ)
                </label>
                <input value={gitRef} onChange={e => setGitRef(e.target.value)} style={{
                  width: "100%", padding: "8px 10px", borderRadius: 8,
                  border: "1px solid #e2e8f0", fontSize: 12, outline: "none"
                }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
                  備考 (任意)
                </label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} style={{
                  width: "100%", padding: "8px 10px", borderRadius: 8,
                  border: "1px solid #e2e8f0", fontSize: 12, outline: "none", resize: "vertical"
                }} placeholder="例: LibreOffice + QGIS 同梱 現場用カスタムISO" />
              </div>
            </div>

            {/* Estimate */}
            <div style={{
              background: "#fffbeb", borderRadius: 8, padding: "10px 14px",
              fontSize: 11, color: "#92400e", marginBottom: 16
            }}>
              💾 ベース ISO (~1.8 GB) + アプリ ({totalSize}) = 推定 ISO サイズ増加あり。
              ビルド時間: 通常 40〜70 分。
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={onClose} style={{
                padding: "8px 18px", borderRadius: 8, border: "1px solid #e2e8f0",
                background: "#fff", fontSize: 12, cursor: "pointer", color: "#475569"
              }}>キャンセル</button>
              <button onClick={handleSubmit} style={{
                padding: "8px 20px", borderRadius: 8, border: "none",
                background: "#22c55e", fontSize: 12, cursor: "pointer",
                color: "#fff", fontWeight: 600
              }}>🚀 ビルド開始</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── helper ── */
function actionBtnStyle(color, disabled = false) {
  return {
    padding: "7px 14px", borderRadius: 8, border: "none",
    background: disabled ? "#e2e8f0" : color, color: disabled ? "#94a3b8" : "#fff",
    fontSize: 12, cursor: disabled ? "not-allowed" : "pointer", fontWeight: 500
  };
}
