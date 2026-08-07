/* ========================================
   Construction Enterprise OS — Slide Tab Panel
   Reusable horizontal slide transition tabs
   ======================================== */

function SlideTabPanel({ tabs, activeTab, onTabChange, children }) {
  const containerRef = React.useRef(null);
  const idx = tabs.findIndex(t => t.id === activeTab);

  return (
    <div>
      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 2, padding: '0 4px',
        borderBottom: '1px solid var(--border)',
        position: 'relative', overflow: 'hidden',
      }}>
        {tabs.map((t, i) => (
          <button key={t.id} onClick={() => onTabChange(t.id)} style={{
            padding: '10px 18px', fontSize: 12, fontWeight: activeTab === t.id ? 600 : 400,
            color: activeTab === t.id ? 'var(--accent)' : 'var(--text-muted)',
            cursor: 'pointer', background: 'none', border: 'none',
            borderBottom: activeTab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
            fontFamily: 'inherit', transition: 'color 0.2s',
            whiteSpace: 'nowrap',
          }}>{t.label}</button>
        ))}
      </div>
      {/* Slide container */}
      <div style={{ overflow: 'hidden', position: 'relative' }} ref={containerRef}>
        <div style={{
          display: 'flex',
          transform: `translateX(-${idx * 100}%)`,
          transition: 'transform 0.35s cubic-bezier(.4,0,.2,1)',
        }}>
          {React.Children.map(children, (child, i) => (
            <div style={{ minWidth: '100%', flexShrink: 0 }}>
              {child}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

window.SlideTabPanel = SlideTabPanel;
