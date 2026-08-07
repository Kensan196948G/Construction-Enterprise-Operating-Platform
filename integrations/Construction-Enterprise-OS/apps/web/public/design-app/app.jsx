/* ========================================
   Construction Enterprise OS — Main App Shell
   Header, routing, page composition, mobile responsive
   ======================================== */

function AppHeader({ onToggleSidebar, currentPath, sidebarCollapsed, dark, activeRole, onSetTweak }) {
  const [showNotif, setShowNotif] = React.useState(false);
  const [showRoleMenu, setShowRoleMenu] = React.useState(false);

  const notifs = [
    { title: '承認依頼', desc: '施工計画書の承認依頼が届いています', time: '5分前', read: false },
    { title: 'IoTアラート', desc: '風速計#3が警告値を超過', time: '12分前', read: false },
    { title: '文書更新', desc: '構造図7Fが更新されました', time: '1時間前', read: true },
    { title: 'AI通知', desc: '品川タワーの工程遅延リスクを検知', time: '2時間前', read: true },
  ];

  // Breadcrumb from path
  const pathLabels = {
    '/dashboard': 'ダッシュボード',
    '/field/projects': '現場DX', '/field/progress': '現場進捗', '/field/schedule': '工程管理',
    '/field/daily': '作業日報', '/field/photos': '現場写真', '/field/measure': '出来形管理',
    '/field/safety': '安全管理', '/field/ky': 'KY活動', '/field/equipment': '重機管理',
    '/field/workers': '作業員管理', '/field/live': '現場ライブビュー',
    '/documents/pdf': '文書・図面管理', '/documents/cad': 'CAD図面', '/documents/bim': 'BIM/CIM',
    '/documents/photo': '写真管理', '/documents/video': '動画管理', '/documents/ocr': 'OCR',
    '/documents/board': '電子黒板', '/documents/deliver': '電子納品',
    '/documents/version': 'バージョン管理', '/documents/ai-search': 'AI文書検索',
    '/common/auth/entra': 'Entra ID', '/common/auth/ad': 'AD連携', '/common/auth/mfa': 'MFA',
    '/common/auth/sso': 'SSO', '/common/users': 'ユーザー管理', '/common/roles': '権限管理',
    '/common/api': 'API管理', '/common/api/logs': 'APIログ', '/common/master': 'マスタ管理',
    '/common/config': 'システム設定',
    '/partner/list': '協力会社連携', '/partner/entry': '入退場管理', '/partner/docs': '提出書類',
    '/partner/education': '安全教育', '/partner/contract': '契約管理', '/partner/invoice': '請求管理',
    '/gis/projects': 'GIS / 地図', '/gis/ocean': '海域マップ', '/gis/disaster': '災害情報',
    '/gis/drone': 'ドローン地図', '/gis/pointcloud': '点群データ', '/gis/hazard': 'ハザードマップ',
    '/gis/realtime': 'リアルタイム位置',
    '/ai/chat': 'AIチャット', '/ai/knowledge': 'ナレッジAI', '/ai/ocr': 'OCR AI',
    '/ai/vision': '画像解析AI', '/ai/predict': '予測AI', '/ai/anomaly': '異常検知AI', '/ai/agent': 'AI Agent',
    '/iot/sensors': 'IoT監視', '/iot/weather': '気象情報', '/iot/wave': '波浪監視',
    '/iot/water': '水位監視', '/iot/gateway': 'IoT Gateway', '/iot/edge': 'Edge AI',
    '/iot/alerts': 'アラート管理', '/iot/realtime': 'リアルタイム監視',
    '/erp/cost': 'ERP・経営管理', '/erp/budget': '予算管理', '/erp/contract': '契約管理',
    '/erp/purchase': '購買管理', '/erp/sales': '売上管理', '/erp/labor': '労務管理',
    '/erp/stock': '在庫管理', '/erp/ledger': '工事台帳', '/erp/bi': 'BIレポート',
    '/security/siem': 'SIEM', '/security/soc': 'SOC', '/security/vpn': 'VPN監視',
    '/security/edr': 'EDR', '/security/ot': 'OT監視', '/security/incident': 'インシデント',
    '/security/audit': '監査レポート',
    '/workflow/approval': '承認一覧', '/workflow/ringi': '稟議', '/workflow/permit': '作業許可',
    '/workflow/esign': '電子決裁', '/workflow/change': '変更管理',
    '/robotics/auto': '自動施工', '/robotics/drone': 'ドローン', '/robotics/rov': 'ROV',
    '/robotics/twin': 'デジタルツイン',
    '/system/server': 'サーバ監視', '/system/db': 'DB管理', '/system/backup': 'バックアップ',
    '/system/api-status': 'API状態', '/system/devops': 'DevOps/CI-CD',
  };

  const label = pathLabels[currentPath] || 'ダッシュボード';

  // Category from path
  const cats = {
    '/dashboard': 'ダッシュボード', '/field': '現場DX', '/documents': '文書・図面管理',
    '/common': '共通基盤', '/partner': '協力会社連携', '/gis': 'GIS / 地図',
    '/ai': 'AI・分析基盤', '/iot': 'IoT監視', '/erp': 'ERP・経営管理',
    '/security': 'セキュリティ', '/workflow': 'ワークフロー', '/robotics': '自動化・ロボティクス',
    '/system': 'システム管理',
  };
  const catKey = Object.keys(cats).find(k => currentPath.startsWith(k)) || '/dashboard';
  const category = cats[catKey];

  // Close dropdowns on outside click
  React.useEffect(() => {
    if (!showNotif && !showRoleMenu) return;
    const fn = (e) => {
      if (showNotif && !e.target.closest('[data-notif-panel]')) setShowNotif(false);
      if (showRoleMenu && !e.target.closest('[data-role-panel]')) setShowRoleMenu(false);
    };
    document.addEventListener('click', fn);
    return () => document.removeEventListener('click', fn);
  }, [showNotif, showRoleMenu]);

  return (
    <header style={{
      height: 52, display: 'flex', alignItems: 'center', gap: 12,
      padding: '0 16px', background: 'var(--header-bg, #fff)',
      borderBottom: '1px solid var(--border, #e2e8f0)', flexShrink: 0,
      fontFamily: "'Noto Sans JP', system-ui, sans-serif",
    }}>
      {/* Mobile menu toggle */}
      <button onClick={onToggleSidebar} className="mobile-menu-btn" style={{
        padding: 6, border: 'none', background: 'transparent',
        cursor: 'pointer', color: '#64748b', display: 'none', borderRadius: 6,
      }}>
        <Icon name="menu" size={20} />
      </button>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
        <span className="hide-mobile" style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{category}</span>
        {category !== label && (
          <React.Fragment>
            <svg className="hide-mobile" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" style={{ flexShrink: 0 }}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-heading)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
          </React.Fragment>
        )}
        {category === label && (
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-heading)' }}>{label}</span>
        )}
      </div>

      {/* Search */}
      <div className="hide-mobile" style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'var(--bg-input)', borderRadius: 8, padding: '5px 12px',
        border: '1px solid var(--border)', width: 260, flexShrink: 0,
      }}>
        <Icon name="search" size={14} style={{ color: 'var(--text-muted)' }} />
        <input placeholder="統合検索..." style={{
          border: 'none', outline: 'none', background: 'transparent',
          fontSize: 12, color: 'var(--text)', flex: 1, fontFamily: 'inherit',
        }} />
        <kbd style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--border)', padding: '1px 5px', borderRadius: 3, fontFamily: 'monospace' }}>⌘K</kbd>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {/* Dark mode toggle */}
        <button onClick={() => onSetTweak && onSetTweak('dark', !dark)} title={dark ? 'ライトモード' : 'ダークモード'} style={{
          padding: 7, border: 'none', background: 'transparent',
          cursor: 'pointer', color: 'var(--text-muted)', borderRadius: 6,
          transition: 'background 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-input)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <Icon name={dark ? 'sun' : 'moon'} size={18} />
        </button>

        {/* Role selector */}
        <div style={{ position: 'relative' }} data-role-panel>
          <button onClick={(e) => { e.stopPropagation(); setShowRoleMenu(!showRoleMenu); }} title="ロール切替" style={{
            padding: '4px 10px', border: '1px solid var(--border)', borderRadius: 6,
            background: activeRole ? (ROLES[activeRole]?.color || 'var(--accent)') + '15' : 'transparent',
            cursor: 'pointer', fontSize: 11, fontWeight: 500,
            color: activeRole ? (ROLES[activeRole]?.color || 'var(--accent)') : 'var(--text-muted)',
            display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit',
            transition: 'all 0.15s',
          }}>
            <Icon name="users" size={14} />
            <span className="hide-mobile">{activeRole && ROLES[activeRole] ? ROLES[activeRole].label : '全表示'}</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
          </button>

          {showRoleMenu && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, marginTop: 4,
              width: 200, background: 'var(--bg-card)', borderRadius: 10,
              boxShadow: '0 10px 40px var(--shadow)', border: '1px solid var(--border)',
              zIndex: 100, overflow: 'hidden', padding: 4,
            }}>
              <div style={{ padding: '6px 10px', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ロール切替</div>
              {[
                { value: '', label: '全表示（管理者）', color: '#64748b' },
                { value: 'field', label: '現場監督', color: '#f97316' },
                { value: 'exec', label: '経営層', color: '#1a56db' },
                { value: 'admin', label: 'IT管理者', color: '#16a34a' },
                { value: 'partner', label: '協力会社', color: '#eab308' },
                { value: 'safety', label: '安全管理者', color: '#dc2626' },
                { value: 'maintain', label: '維持管理', color: '#92400e' },
              ].map(r => (
                <button key={r.value} onClick={() => { onSetTweak && onSetTweak('role', r.value); setShowRoleMenu(false); }} style={{
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                  padding: '8px 10px', borderRadius: 6, border: 'none',
                  background: activeRole === r.value ? 'var(--accent-light)' : 'transparent',
                  cursor: 'pointer', fontSize: 12, fontWeight: activeRole === r.value ? 600 : 400,
                  color: activeRole === r.value ? r.color : 'var(--text)',
                  fontFamily: 'inherit', textAlign: 'left', transition: 'background 0.1s',
                }}
                  onMouseEnter={e => { if (activeRole !== r.value) e.currentTarget.style.background = 'var(--bg-card-hover)'; }}
                  onMouseLeave={e => { if (activeRole !== r.value) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: r.color, flexShrink: 0 }}></span>
                  <span>{r.label}</span>
                  {activeRole === r.value && <Icon name="check-circle" size={14} style={{ color: r.color, marginLeft: 'auto' }} />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div style={{ position: 'relative' }} data-notif-panel>
          <button onClick={(e) => { e.stopPropagation(); setShowNotif(!showNotif); }} style={{
            padding: 8, border: 'none', background: 'transparent',
            cursor: 'pointer', color: '#64748b', borderRadius: 6, position: 'relative',
          }}>
            <Icon name="bell" size={18} />
            <span style={{
              position: 'absolute', top: 4, right: 4,
              width: 14, height: 14, borderRadius: '50%',
              background: '#dc2626', color: '#fff',
              fontSize: 9, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>2</span>
          </button>

          {showNotif && (
            <div data-notif-panel style={{
              position: 'absolute', top: '100%', right: 0, marginTop: 4,
              width: 320, background: 'var(--bg-card)', borderRadius: 12,
              boxShadow: '0 10px 40px var(--shadow)', border: '1px solid var(--border)',
              zIndex: 100, overflow: 'hidden',
            }}>
              <div style={{
                padding: '12px 16px', borderBottom: '1px solid var(--border)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-heading)' }}>通知</span>
                <button style={{ fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>すべて既読</button>
              </div>
              {notifs.map((n, i) => (
                <div key={i} style={{
                  padding: '10px 16px', borderBottom: '1px solid var(--border-light)',
                  background: n.read ? 'transparent' : 'var(--accent-light)', cursor: 'pointer',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = n.read ? 'transparent' : 'var(--accent-light)'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{n.title}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{n.time}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{n.desc}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User */}
        <div className="hide-mobile" style={{
          display: 'flex', alignItems: 'center', gap: 8,
          marginLeft: 4, cursor: 'pointer', padding: '4px 8px', borderRadius: 8,
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: '#1e3a8a', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            color: '#93c5fd', fontSize: 11, fontWeight: 700,
          }}>TK</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>田中 健一</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>現場監督</div>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ========================================
   Main App — routing and state
   ======================================== */
function App() {
  const [currentPath, setCurrentPath] = React.useState('/dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const tweaks = window.__TWEAKS || {};
  const activeRole = tweaks.role || '';
  const setTweak = window.__SET_TWEAK || null;

  const navigate = (path) => {
    setCurrentPath(path);
    setMobileOpen(false); // Close mobile sidebar on navigate
  };

  // Route to page component — pass subPath to every page
  const renderPage = () => {
    const p = currentPath;
    if (p.startsWith('/common'))     return <CommonPage subPath={p} />;
    if (p.startsWith('/field'))      return <FieldDXPage subPath={p} />;
    if (p.startsWith('/documents'))  return <DocumentsPage subPath={p} />;
    if (p.startsWith('/partner'))    return <PartnerPage subPath={p} />;
    if (p.startsWith('/gis'))        return <GISPage subPath={p} />;
    if (p.startsWith('/ai'))         return <AIPage subPath={p} />;
    if (p.startsWith('/iot'))        return <IoTMonitorPage subPath={p} />;
    if (p.startsWith('/erp'))        return <ERPPage subPath={p} />;
    if (p.startsWith('/security'))   return <SecurityPage subPath={p} />;
    if (p.startsWith('/workflow'))   return <WorkflowPage subPath={p} />;
    if (p.startsWith('/robotics'))   return <RoboticsPage subPath={p} />;
    if (p.startsWith('/system'))     return <SystemPage subPath={p} />;
    return <DashboardPage subPath={p} />;
  };

  return (
    <div style={{
      display: 'flex', height: '100vh', overflow: 'hidden',
      fontFamily: "'Noto Sans JP', system-ui, sans-serif",
      background: 'var(--bg-page, #f8fafc)',
      color: 'var(--text, #0f172a)',
    }}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          zIndex: 40, display: 'none',
        }} className="mobile-overlay" />
      )}

      {/* Sidebar wrapper */}
      <div className={mobileOpen ? 'sidebar-mobile-open' : ''} style={{ flexShrink: 0, zIndex: 50 }}>
        <Sidebar
          currentPath={currentPath}
          onNavigate={navigate}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          activeRole={activeRole}
        />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <AppHeader
          onToggleSidebar={() => setMobileOpen(!mobileOpen)}
          currentPath={currentPath}
          sidebarCollapsed={sidebarCollapsed}
          dark={tweaks.dark || false}
          activeRole={activeRole}
          onSetTweak={setTweak}
        />
        <main style={{ flex: 1, overflow: 'auto' }}>
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

window.AppHeader = AppHeader;
window.App = App;
