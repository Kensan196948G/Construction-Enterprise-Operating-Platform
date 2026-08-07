/* Construction DX One Platform v2 — App Shell */

function App() {
  const [currentPage, setCurrentPage] = React.useState('portal');
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const { DEPARTMENTS, ALERTS } = window.CDX_DATA;

  window.__cdxNavigate = setCurrentPage;

  const tweaks = window.__CDX_TWEAKS || {};
  const theme = tweaks.theme || 'light';
  const setTweakFn = window.__CDX_SET_TWEAK;
  React.useEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, [theme]);
  const toggleTheme = () => { if (setTweakFn) setTweakFn('theme', theme === 'dark' ? 'light' : 'dark'); };

  const currentDept = DEPARTMENTS.find(d => d.id === currentPage) || DEPARTMENTS[0];
  const dangerCount = (ALERTS || []).filter(a => a.severity === 'danger').length;

  const pageNames = {
    portal: 'PagePortal',
    datalake: 'PageDataLake', common: 'PageCommon', executive: 'PageExecutive',
    sales: 'PageSales', solution: 'PageSolution', construction: 'PageConstruction',
    technical: 'PageTechnical', safety: 'PageSafety', admin: 'PageAdmin',
    procurement: 'PageProcurement', marine: 'PageMarine', itsm: 'PageITSM',
    audit: 'PageAudit', settings: 'PageSettings',
  };
  const PageComponent = window[pageNames[currentPage]];

  /* Defensive: if page scripts haven't executed yet (bundled/async load), retry shortly */
  const [, forceTick] = React.useReducer(x => x + 1, 0);
  React.useEffect(() => {
    if (!PageComponent) {
      const t = setTimeout(forceTick, 150);
      return () => clearTimeout(t);
    }
  });

  const platformDepts = DEPARTMENTS.filter(d => ['portal', 'datalake', 'common'].includes(d.id));
  const mgmtDepts = DEPARTMENTS.filter(d => ['audit', 'settings'].includes(d.id));
  const departmentDepts = DEPARTMENTS.filter(d => !platformDepts.includes(d) && !mgmtDepts.includes(d));

  return React.createElement('div', { className: 'cdx-layout' },
    /* ── Sidebar ── */
    React.createElement('aside', { className: `cdx-sidebar ${sidebarCollapsed ? 'collapsed' : ''}` },
      React.createElement('div', { className: 'cdx-sidebar-logo' },
        React.createElement('div', { className: 'logo-mark' }, 'DX'),
        React.createElement('div', { className: 'logo-text' },
          React.createElement('div', { style: { lineHeight: 1.2, color: 'var(--text-primary)' } }, 'Construction DX'),
          React.createElement('div', { style: { fontSize: 9, color: 'var(--text-muted)', fontWeight: 400 } }, 'One Platform')
        )
      ),
      React.createElement('nav', { className: 'cdx-sidebar-nav' },
        /* Platform section */
        React.createElement('div', { className: 'cdx-nav-section' },
          React.createElement('div', { className: 'cdx-nav-section-label' }, '基盤'),
          platformDepts.map(dept => React.createElement(NavItem, { key: dept.id, dept, currentPage, setCurrentPage, sidebarCollapsed, dangerCount }))
        ),
        /* Department section */
        React.createElement('div', { className: 'cdx-nav-section' },
          React.createElement('div', { className: 'cdx-nav-section-label' }, '部門システム'),
          departmentDepts.map(dept => React.createElement(NavItem, { key: dept.id, dept, currentPage, setCurrentPage, sidebarCollapsed, dangerCount }))
        ),
        /* Management section */
        React.createElement('div', { className: 'cdx-nav-section' },
          React.createElement('div', { className: 'cdx-nav-section-label' }, '管理'),
          mgmtDepts.map(dept => React.createElement(NavItem, { key: dept.id, dept, currentPage, setCurrentPage, sidebarCollapsed, dangerCount }))
        )
      )
    ),

    /* ── Main ── */
    React.createElement('div', { className: 'cdx-main' },
      React.createElement('header', { className: 'cdx-header' },
        React.createElement('button', { className: 'cdx-btn cdx-btn-ghost cdx-btn-xs', onClick: () => setSidebarCollapsed(c => !c), style: { border: 'none', padding: 6 } },
          React.createElement(CDXIcon, { name: 'menu', size: 18 })
        ),
        React.createElement('div', null,
          React.createElement('span', { className: 'cdx-header-title' }, currentDept.name),
          currentDept.system && React.createElement('span', { className: 'cdx-header-breadcrumb', style: { marginLeft: 12 } }, currentDept.system)
        ),
        React.createElement('div', { className: 'cdx-header-actions' },
          React.createElement(ThemeToggle, { theme, onToggle: toggleTheme }),
          React.createElement('button', { className: 'cdx-btn cdx-btn-ghost cdx-btn-xs', style: { position: 'relative' } },
            React.createElement(CDXIcon, { name: 'bell', size: 16 }),
            dangerCount > 0 && React.createElement('span', { style: { position: 'absolute', top: -2, right: -2, width: 14, height: 14, borderRadius: '50%', background: 'var(--cdx-danger)', color: '#fff', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 } }, dangerCount)
          ),
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8 } },
            React.createElement('div', { style: { width: 28, height: 28, borderRadius: '50%', background: 'var(--cdx-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700 } }, 'CTO'),
            React.createElement('span', { style: { fontSize: 12, fontWeight: 600 } }, '管理者')
          )
        )
      ),
      React.createElement('div', { className: 'cdx-content' },
        PageComponent ? React.createElement(PageComponent, { key: currentPage }) : null
      )
    )
  );
}

/* ── Nav Item ── */
function NavItem({ dept, currentPage, setCurrentPage, sidebarCollapsed, dangerCount }) {
  return React.createElement('div', {
    className: `cdx-nav-item ${currentPage === dept.id ? 'active' : ''}`,
    onClick: () => setCurrentPage(dept.id),
    title: dept.name,
  },
    React.createElement('span', { className: 'cdx-nav-icon' },
      React.createElement(CDXIcon, { name: dept.icon, size: 16, color: currentPage === dept.id ? 'var(--cdx-primary)' : 'var(--text-sidebar)' })
    ),
    React.createElement('span', null, dept.name),
    dept.id === 'itsm' && dangerCount > 0 && React.createElement('span', { className: 'nav-badge' }, dangerCount)
  );
}

/* ── Tweaks ── */
function AppWithTweaks() {
  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{"theme":"light","accentDept":"04"}/*EDITMODE-END*/;
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  window.__CDX_TWEAKS = tweaks;
  window.__CDX_SET_TWEAK = setTweak;

  return React.createElement(React.Fragment, null,
    React.createElement(App, null),
    React.createElement(TweaksPanel, { title: 'Tweaks' },
      React.createElement(TweakSection, { label: 'テーマ' },
        React.createElement(TweakRadio, { label: '配色テーマ', options: ['light', 'dark'], optionLabels: ['ライト', 'ダーク'], value: tweaks.theme, onChange: v => setTweak('theme', v) })
      ),
      React.createElement(TweakSection, { label: '部門アクセント' },
        React.createElement(TweakSelect, { label: 'アクセント部門', value: tweaks.accentDept, onChange: v => setTweak('accentDept', v),
          options: ['04', '06', '10', '01', '02', '05'],
          optionLabels: ['施工管理', '安全品質', 'ITSM', '経営', '営業', '技術']
        })
      )
    )
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(AppWithTweaks));
