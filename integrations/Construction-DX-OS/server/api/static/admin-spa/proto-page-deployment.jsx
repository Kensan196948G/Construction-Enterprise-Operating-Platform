/* ─── OS・認証設定ページ ─── */

const DEPLOY_PROFILES_DEFAULT = {
  standard: {
    defaultUser: "cdxuser",
    passwordPolicy: "force_change",
    autoLogin: false,
    adJoin: true,
    adDomain: "mirai.local",
    adDcHost: "VMSV3001",
    adJoinUser: "svc-domainjoin",
    adOuPath: "OU=Workstations,OU=Standard,DC=mirai,DC=local",
    adLoginUser: "",
    hostnamePrefix: "CDX-HQ-",
    hostnameAuto: true,
    timezone: "Asia/Tokyo",
    locale: "ja_JP.UTF-8",
  },
  field: {
    defaultUser: "cdxfield",
    passwordPolicy: "force_change",
    autoLogin: false,
    adJoin: true,
    adDomain: "mirai.local",
    adDcHost: "VMSV3001",
    adJoinUser: "svc-domainjoin",
    adOuPath: "OU=Workstations,OU=Field,DC=mirai,DC=local",
    adLoginUser: "",
    hostnamePrefix: "CDX-FLD-",
    hostnameAuto: true,
    timezone: "Asia/Tokyo",
    locale: "ja_JP.UTF-8",
  },
  kiosk: {
    defaultUser: "kiosk",
    passwordPolicy: "fixed",
    autoLogin: true,
    adJoin: false,
    adDomain: "",
    adDcHost: "",
    adJoinUser: "",
    adOuPath: "",
    adLoginUser: "",
    hostnamePrefix: "CDX-KSK-",
    hostnameAuto: true,
    timezone: "Asia/Tokyo",
    locale: "ja_JP.UTF-8",
  },
};

Object.assign(window, { DEPLOY_PROFILES_DEFAULT });

/* ─────────────────────────────────────── */
function DeploymentPage() {
  const [activeProf, setActiveProf] = React.useState("standard");
  const [configs, setConfigs] = React.useState(
    JSON.parse(JSON.stringify(DEPLOY_PROFILES_DEFAULT))
  );
  const [saved, setSaved] = React.useState(false);
  const [showPreseed, setShowPreseed] = React.useState(false);

  const cfg = configs[activeProf];
  const set = (key, val) => {
    setConfigs(prev => ({
      ...prev,
      [activeProf]: { ...prev[activeProf], [key]: val }
    }));
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const profiles = [
    { id: "standard", label: "standard", desc: "事務・本社",  icon: "💼", color: "#3b82f6" },
    { id: "field",    label: "field",    desc: "現場・巡回",  icon: "🦺", color: "#f59e0b" },
    { id: "kiosk",    label: "kiosk",   desc: "受付・共用",   icon: "📺", color: "#8b5cf6" },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
          🔐 OS・認証設定
        </h2>
        <p style={{ fontSize: 12, color: "#64748b" }}>
          ISO ビルド時に preseed.cfg へ焼き込む、ログインアカウント・Active Directory 参加・ホスト名の設定をプロファイル別に管理します。
        </p>
      </div>

      {/* Info banner */}
      <div style={{
        background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10,
        padding: "10px 16px", display: "flex", gap: 10, alignItems: "center", marginBottom: 20
      }}>
        <span style={{ fontSize: 18 }}>💡</span>
        <div style={{ fontSize: 12, color: "#1d4ed8" }}>
          ここで設定した内容は <strong>ISO 配布ページでのビルド時</strong> に自動的に反映されます。
          プロファイルごとに異なる設定を保存できます。
        </div>
      </div>

      {/* Profile tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {profiles.map(p => (
          <button key={p.id} onClick={() => setActiveProf(p.id)} style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 20px", borderRadius: 10, border: "2px solid",
            borderColor: activeProf === p.id ? p.color : "#e2e8f0",
            background: activeProf === p.id ? p.color + "15" : "#fff",
            cursor: "pointer", transition: "all 120ms"
          }}>
            <span style={{ fontSize: 18 }}>{p.icon}</span>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 13, fontWeight: activeProf === p.id ? 700 : 500, color: activeProf === p.id ? p.color : "#0f172a" }}>
                {p.label}
              </div>
              <div style={{ fontSize: 10, color: "#94a3b8" }}>{p.desc}</div>
            </div>
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* ── ログイン設定 ── */}
        <div style={cardStyle}>
          <SectionTitle icon="👤" title="ログイン設定" />

          <FormField label="デフォルトユーザー名" required>
            <input
              value={cfg.defaultUser}
              onChange={e => set("defaultUser", e.target.value)}
              placeholder="例: cdxuser"
              style={inputStyle}
            />
            <div style={hintStyle}>OS インストール後に作成されるローカルユーザー名</div>
          </FormField>

          <FormField label="パスワードポリシー">
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { val: "force_change", label: "初回ログイン時に変更を強制", desc: "セキュリティ推奨" },
                { val: "fixed",        label: "固定パスワード",             desc: "kiosk 等の自動運用向け" },
              ].map(opt => (
                <label key={opt.val} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input
                    type="radio" name={`pw-${activeProf}`}
                    checked={cfg.passwordPolicy === opt.val}
                    onChange={() => set("passwordPolicy", opt.val)}
                    style={{ accentColor: "#2563eb" }}
                  />
                  <div>
                    <div style={{ fontSize: 12, color: "#0f172a" }}>{opt.label}</div>
                    <div style={{ fontSize: 10, color: "#94a3b8" }}>{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </FormField>

          <FormField label="自動ログイン">
            <ToggleSwitch
              checked={cfg.autoLogin}
              onChange={v => set("autoLogin", v)}
              label={cfg.autoLogin ? "有効（電源ON で自動ログイン）" : "無効"}
              color="#8b5cf6"
            />
            {cfg.autoLogin && (
              <div style={{ ...hintStyle, color: "#7c3aed", marginTop: 4 }}>
                ⚠️ kiosk 端末専用。セキュリティ上、一般端末には推奨しません。
              </div>
            )}
          </FormField>
        </div>

        {/* ── ホスト名設定 ── */}
        <div style={cardStyle}>
          <SectionTitle icon="🏷️" title="ホスト名・ロケール設定" />

          <FormField label="ホスト名プレフィックス">
            <input
              value={cfg.hostnamePrefix}
              onChange={e => set("hostnamePrefix", e.target.value)}
              placeholder="例: CDX-HQ-"
              style={inputStyle}
            />
            <div style={hintStyle}>端末番号と組み合わせて自動採番 (例: CDX-HQ-001)</div>
          </FormField>

          <FormField label="ホスト名採番">
            <ToggleSwitch
              checked={cfg.hostnameAuto}
              onChange={v => set("hostnameAuto", v)}
              label={cfg.hostnameAuto ? "自動採番（DHCP/PXE から払い出し）" : "手動設定"}
              color="#3b82f6"
            />
          </FormField>

          <FormField label="タイムゾーン">
            <select value={cfg.timezone} onChange={e => set("timezone", e.target.value)} style={{ ...inputStyle, padding: "7px 10px" }}>
              <option value="Asia/Tokyo">Asia/Tokyo (JST +0900)</option>
              <option value="UTC">UTC +0000</option>
              <option value="Asia/Osaka">Asia/Osaka (JST +0900)</option>
            </select>
          </FormField>

          <FormField label="ロケール">
            <select value={cfg.locale} onChange={e => set("locale", e.target.value)} style={{ ...inputStyle, padding: "7px 10px" }}>
              <option value="ja_JP.UTF-8">ja_JP.UTF-8（日本語）</option>
              <option value="en_US.UTF-8">en_US.UTF-8（英語）</option>
            </select>
          </FormField>
        </div>

        {/* ── AD参加設定 (full width) ── */}
        <div style={{ ...cardStyle, gridColumn: "1 / -1" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <SectionTitle icon="🏢" title="Active Directory 参加設定" noMargin />
            <ToggleSwitch
              checked={cfg.adJoin}
              onChange={v => set("adJoin", v)}
              label={cfg.adJoin ? "AD 参加あり" : "AD 参加なし（ローカル認証）"}
              color="#22c55e"
            />
          </div>

          {cfg.adJoin ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <FormField label="AD ドメイン名" required>
                <input
                  value={cfg.adDomain}
                  onChange={e => set("adDomain", e.target.value)}
                  placeholder="例: corp.kensetsu-dx.co.jp"
                  style={inputStyle}
                />
                <div style={hintStyle}>FQDN 形式で入力</div>
              </FormField>

              <FormField label="ドメインコントローラ IP / FQDN" required>
                <input
                  value={cfg.adDcHost}
                  onChange={e => set("adDcHost", e.target.value)}
                  placeholder="例: 192.168.1.10 または dc.corp.example.co.jp"
                  style={inputStyle}
                />
              </FormField>

              <FormField label="AD 参加アカウント名（ドメイン参加用 SVC）" required>
                <input
                  value={cfg.adJoinUser}
                  onChange={e => set("adJoinUser", e.target.value)}
                  placeholder="例: svc-domainjoin"
                  style={inputStyle}
                />
                <div style={hintStyle}>
                  ドメイン参加専用のサービスアカウント。最小権限（コンピュータ参加のみ）推奨。
                </div>
              </FormField>

              <FormField label="OU パス（参加先 OU）">
                <input
                  value={cfg.adOuPath}
                  onChange={e => set("adOuPath", e.target.value)}
                  placeholder="例: OU=Workstations,OU=HQ,DC=corp,DC=kensetsu-dx,DC=co,DC=jp"
                  style={inputStyle}
                />
                <div style={hintStyle}>空欄時はデフォルト OU (Computers) に参加</div>
              </FormField>

              <FormField label="ドメインログイン ユーザー名形式">
                <select
                  value={cfg.adLoginUser}
                  onChange={e => set("adLoginUser", e.target.value)}
                  style={{ ...inputStyle, padding: "7px 10px" }}
                >
                  <option value="">SAM アカウント名（例: tanaka）</option>
                  <option value="upn">UPN 形式（例: tanaka@corp.kensetsu-dx.co.jp）</option>
                  <option value="netbios">NetBIOS 形式（例: CORP\tanaka）</option>
                </select>
                <div style={hintStyle}>
                  ログイン画面でどの形式のユーザー名を使うかを設定
                </div>
              </FormField>

              {/* AD status summary */}
              <div style={{
                gridColumn: "1 / -1",
                background: cfg.adDomain && cfg.adJoinUser ? "#f0fdf4" : "#fffbeb",
                borderRadius: 8, padding: "10px 14px",
                border: `1px solid ${cfg.adDomain && cfg.adJoinUser ? "#bbf7d0" : "#fde68a"}`,
                fontSize: 11
              }}>
                {cfg.adDomain && cfg.adJoinUser ? (
                  <div style={{ color: "#15803d" }}>
                    ✅ <strong>{cfg.adJoinUser}</strong> アカウントで <strong>{cfg.adDomain}</strong> ドメインに参加します。
                    {cfg.adOuPath && <><br />OU: <code style={{ fontSize: 10 }}>{cfg.adOuPath}</code></>}
                  </div>
                ) : (
                  <div style={{ color: "#92400e" }}>
                    ⚠️ ADドメイン名と参加アカウント名を入力してください。
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{
              background: "#f8fafc", borderRadius: 8, padding: "14px 16px",
              fontSize: 12, color: "#64748b", display: "flex", gap: 10, alignItems: "center"
            }}>
              <span style={{ fontSize: 18 }}>🔓</span>
              <div>
                <div style={{ fontWeight: 500, marginBottom: 2 }}>ローカル認証モード</div>
                <div>AD に参加しません。デフォルトユーザーのローカルアカウントでログインします。
                キオスク端末・スタンドアロン現場端末向けです。</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action bar */}
      <div style={{
        ...cardStyle, marginTop: 16,
        display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <div style={{ fontSize: 12, color: "#64748b" }}>
          設定はプロファイル別に保存され、ISO ビルド時に自動反映されます。
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {saved && (
            <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 500 }}>✅ 保存しました</span>
          )}
          <button onClick={() => setShowPreseed(true)} style={{
            padding: "8px 16px", borderRadius: 8, border: "1px solid #e2e8f0",
            background: "#fff", fontSize: 12, cursor: "pointer", color: "#475569"
          }}>
            📄 preseed.cfg プレビュー
          </button>
          <button onClick={handleSave} style={{
            padding: "8px 20px", borderRadius: 8, border: "none",
            background: "#2563eb", color: "#fff", fontSize: 12, cursor: "pointer", fontWeight: 600
          }}>
            💾 設定を保存
          </button>
        </div>
      </div>

      {/* Preseed preview modal */}
      {showPreseed && (
        <PreseedModal cfg={cfg} profile={activeProf} onClose={() => setShowPreseed(false)} />
      )}
    </div>
  );
}

/* ── preseed.cfg preview modal ── */
function PreseedModal({ cfg, profile, onClose }) {
  const lines = [
    `# preseed.cfg — ${profile} profile (auto-generated)`,
    `# Generated by cdx-server OS・認証設定`,
    ``,
    `### Locale`,
    `d-i debian-installer/locale string ${cfg.locale}`,
    `d-i keyboard-configuration/xkb-keymap select jp`,
    ``,
    `### Clock`,
    `d-i time/zone string ${cfg.timezone}`,
    `d-i clock-setup/utc boolean true`,
    ``,
    `### User account`,
    `d-i passwd/user-fullname string ${cfg.defaultUser}`,
    `d-i passwd/username string ${cfg.defaultUser}`,
    `d-i passwd/user-password-crypted password $6$rounds=4096$CHANGEME`,
    cfg.passwordPolicy === "force_change"
      ? `# Force password change on first login (via chage -d 0)`
      : `# Fixed password — no expiry`,
    ``,
    cfg.autoLogin
      ? `### Auto-login (kiosk)\nd-i passwd/auto-login boolean true\nd-i passwd/auto-login-user string ${cfg.defaultUser}`
      : `### Auto-login disabled`,
    ``,
    `### Hostname`,
    cfg.hostnameAuto
      ? `d-i netcfg/hostname string ${cfg.hostnamePrefix}{{AUTO}}`
      : `d-i netcfg/hostname string ${cfg.hostnamePrefix}001`,
    ``,
    cfg.adJoin && (cfg.adDomain || "mirai.local") ? [
      `### Active Directory (realm join via post-install script)`,
      `# Domain:     ${cfg.adDomain}`,
      `# DC:         ${cfg.adDcHost}`,
      `# Join user:  ${cfg.adJoinUser}`,
      `# OU:         ${cfg.adOuPath || "(default)"}`,
      `# Login fmt:  ${cfg.adLoginUser || "SAM (username)"}`,
      `d-i preseed/late_command string \\`,
      `    in-target realm join --user=${cfg.adJoinUser} \\`,
      `    --computer-ou="${cfg.adOuPath}" \\`,
      `    ${cfg.adDomain}`,
    ].join("\n") : `# AD join: disabled (local auth only)`,
  ].join("\n");

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.5)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
    }}>
      <div style={{
        background: "#fff", borderRadius: 14, padding: 24,
        width: 700, maxWidth: "90vw", maxHeight: "80vh",
        display: "flex", flexDirection: "column",
        boxShadow: "0 20px 60px rgba(0,0,0,.2)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
            📄 preseed.cfg プレビュー — {profile} プロファイル
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#94a3b8"
          }}>✕</button>
        </div>
        <div style={{ fontSize: 11, color: "#64748b", marginBottom: 10 }}>
          ISO ビルド時に自動生成される設定ファイルのプレビューです。パスワードハッシュは実際のビルド時に置換されます。
        </div>
        <pre style={{
          background: "#1e1e2e", color: "#cdd6f4", borderRadius: 8,
          padding: "14px 16px", overflowY: "auto", flex: 1,
          fontSize: 11, lineHeight: 1.6, whiteSpace: "pre-wrap"
        }}>{lines}</pre>
        <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={{
            padding: "8px 20px", borderRadius: 8, border: "1px solid #e2e8f0",
            background: "#fff", fontSize: 12, cursor: "pointer", color: "#475569"
          }}>閉じる</button>
          <button style={{
            padding: "8px 20px", borderRadius: 8, border: "none",
            background: "#2563eb", color: "#fff", fontSize: 12, cursor: "pointer", fontWeight: 600
          }}>📋 クリップボードにコピー</button>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ── */
function SectionTitle({ icon, title, noMargin }) {
  return (
    <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: noMargin ? 0 : 14, display: "flex", alignItems: "center", gap: 6 }}>
      <span>{icon}</span>{title}
    </div>
  );
}

function FormField({ label, required, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>
        {label}{required && <span style={{ color: "#ef4444", marginLeft: 3 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function ToggleSwitch({ checked, onChange, label, color = "#22c55e" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: 40, height: 22, borderRadius: 11, cursor: "pointer",
          background: checked ? color : "#e2e8f0",
          position: "relative", transition: "background 200ms", flexShrink: 0
        }}
      >
        <div style={{
          position: "absolute", top: 3, left: checked ? 21 : 3,
          width: 16, height: 16, borderRadius: "50%", background: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,.2)", transition: "left 200ms"
        }} />
      </div>
      <span style={{ fontSize: 12, color: checked ? "#0f172a" : "#94a3b8" }}>{label}</span>
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "8px 10px", borderRadius: 8,
  border: "1px solid #e2e8f0", fontSize: 12, outline: "none",
  fontFamily: "inherit"
};

const hintStyle = { fontSize: 10, color: "#94a3b8", marginTop: 3, lineHeight: 1.4 };
