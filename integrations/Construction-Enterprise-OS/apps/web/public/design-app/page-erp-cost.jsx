/* ========================================
   ERP Cost View — original cost management table
   ======================================== */

function ERPCostView() {
  const cs = { background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' };
  const costData = [
    { project: '品川タワー新築工事', budget: 4200, actual: 3860, forecast: 4350, status: 'warning' },
    { project: '横浜分譲マンション', budget: 2800, actual: 1150, forecast: 2780, status: 'normal' },
    { project: '大田区土木工事', budget: 1500, actual: 1280, forecast: 1520, status: 'warning' },
    { project: '新宿再開発ビル', budget: 6500, actual: 1420, forecast: 6400, status: 'normal' },
    { project: '川崎物流センター', budget: 3200, actual: 1760, forecast: 3380, status: 'danger' },
  ];
  const BarCompare = ({ budget, actual, forecast }) => {
    const max = Math.max(budget, actual, forecast);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 180 }}>
        {[{ label: '予算', value: budget, color: '#94a3b8' },{ label: '実績', value: actual, color: '#1a56db' },{ label: '予測', value: forecast, color: forecast>budget?'#dc2626':'#16a34a' }].map((b,i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 9, color: '#94a3b8', width: 24 }}>{b.label}</span>
            <div style={{ flex: 1, height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(b.value/max)*100}%`, background: b.color, borderRadius: 3 }}></div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0 }}>ERP・経営管理</h1>
        <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>原価管理・予算管理・経営分析</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
        {[{l:'年度売上高',v:'¥18.2B',s:'前年比+12%',c:'#1a56db',bg:'#eff6ff',i:'trending-up'},{l:'粗利率',v:'14.8%',s:'目標15%',c:'#f97316',bg:'#fff7ed',i:'activity'},{l:'受注残高',v:'¥42.5B',s:'24件',c:'#16a34a',bg:'#f0fdf4',i:'clipboard'},{l:'原価差異',v:'-¥180M',s:'超過3件',c:'#dc2626',bg:'#fef2f2',i:'alert-triangle'}].map((k,idx) => (
          <div key={idx} style={{ ...cs, padding: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={k.i} size={16} style={{ color: k.c }} /></div>
            <div><div style={{ fontSize: 10, color: '#94a3b8' }}>{k.l}</div><div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{k.v}</div><div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{k.s}</div></div>
          </div>
        ))}
      </div>
      <div style={cs}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>工事別 原価管理 <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 400, marginLeft: 8 }}>単位：百万円</span></div>
        <div style={{ borderRadius: 8, overflow: 'hidden', margin: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 80px 80px 80px 80px 180px', gap: 12, padding: '10px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: 11, fontWeight: 600, color: '#64748b' }}>
            <span>工事名</span><span>予算</span><span>実績</span><span>予測</span><span>差異</span><span>推移</span>
          </div>
          {costData.map((c,i) => {
            const diff = c.forecast-c.budget;
            return (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.5fr 80px 80px 80px 80px 180px', gap: 12, padding: '14px 16px', alignItems: 'center', borderBottom: i<costData.length-1?'1px solid #f1f5f9':'none' }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{c.project}</span>
                <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono',monospace", color: '#374151' }}>{c.budget.toLocaleString()}</span>
                <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono',monospace", color: '#374151' }}>{c.actual.toLocaleString()}</span>
                <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono',monospace", color: '#374151' }}>{c.forecast.toLocaleString()}</span>
                <span style={{ fontSize: 13, fontWeight: 600, fontFamily: "'JetBrains Mono',monospace", color: diff>0?'#dc2626':'#16a34a' }}>{diff>0?'+':''}{diff}</span>
                <BarCompare budget={c.budget} actual={c.actual} forecast={c.forecast} />
              </div>
            );
          })}
        </div>
        <div style={{ margin: '0 16px 16px', padding: 14, borderRadius: 8, background: '#f5f3ff', border: '1px solid #ede9fe', display: 'flex', gap: 10 }}>
          <Icon name="brain" size={16} style={{ color: '#7c3aed', flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#7c3aed', marginBottom: 4 }}>AI経営分析</div>
            <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.6 }}>川崎物流センターの原価超過リスクが高まっています。主因は鋼材価格の上昇（+8.3%）と基礎工事の手戻り。調達先の見直しと工程の最適化を推奨します。</div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.ERPCostView = ERPCostView;
