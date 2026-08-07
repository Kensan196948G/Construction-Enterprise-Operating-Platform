/* ========================================
   Construction Enterprise OS — ERP Sub-views
   Budget, Contract, Purchase, Sales, Labor, Stock, Ledger, BI
   ======================================== */

function ERPPage({ subPath }) {
  const cs = { background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' };
  const header = (title, desc) => (<div style={{ marginBottom: 20 }}><h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0 }}>{title}</h1><p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{desc}</p></div>);

  const kpis = [
    { label: '年度売上高', value: '¥18.2B', sub: '前年比+12%', color: '#1a56db', bg: '#eff6ff', icon: 'trending-up' },
    { label: '粗利率', value: '14.8%', sub: '目標15%', color: '#f97316', bg: '#fff7ed', icon: 'activity' },
    { label: '受注残高', value: '¥42.5B', sub: '24件', color: '#16a34a', bg: '#f0fdf4', icon: 'clipboard' },
    { label: '原価差異', value: '-¥180M', sub: '超過3件', color: '#dc2626', bg: '#fef2f2', icon: 'alert-triangle' },
  ];

  const KPICards = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
      {kpis.map((k,i) => (
        <div key={i} style={{ ...cs, padding: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={k.icon} size={16} style={{ color: k.color }} /></div>
          <div><div style={{ fontSize: 10, color: '#94a3b8' }}>{k.label}</div><div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{k.value}</div></div>
        </div>
      ))}
    </div>
  );

  if (subPath === '/erp/budget') {
    const budgets = [
      { project: '品川タワー新築工事', total: 4200, allocated: 4200, used: 2860, remaining: 1340 },
      { project: '横浜分譲マンション', total: 2800, allocated: 2800, used: 1150, remaining: 1650 },
      { project: '大田区土木工事', total: 1500, allocated: 1500, used: 1280, remaining: 220 },
      { project: '新宿再開発ビル', total: 6500, allocated: 6500, used: 1420, remaining: 5080 },
      { project: '川崎物流センター', total: 3200, allocated: 3200, used: 1760, remaining: 1440 },
    ];
    return (
      <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
        {header('予算管理', '工事別予算配分・消化率・残額管理')}
        <KPICards />
        <div style={cs}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 90px 90px 90px 90px 120px', gap: 12, padding: '10px 16px', borderBottom: '1px solid #e2e8f0', fontSize: 11, fontWeight: 600, color: '#94a3b8' }}>
            <span>工事名</span><span>総予算</span><span>配賦額</span><span>使用額</span><span>残額</span><span>消化率</span>
          </div>
          {budgets.map((b,i) => {
            const pct = Math.round((b.used/b.total)*100);
            return (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.5fr 90px 90px 90px 90px 120px', gap: 12, padding: '12px 16px', alignItems: 'center', borderBottom: i<budgets.length-1?'1px solid #f1f5f9':'none', fontSize: 12 }}>
                <span style={{ fontWeight: 500, color: '#0f172a' }}>{b.project}</span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>{b.total.toLocaleString()}</span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>{b.allocated.toLocaleString()}</span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>{b.used.toLocaleString()}</span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 600, color: b.remaining<500?'#dc2626':'#16a34a' }}>{b.remaining.toLocaleString()}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ flex: 1, height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: pct>80?'#dc2626':pct>60?'#f97316':'#1a56db', borderRadius: 3 }}></div>
                  </div>
                  <span style={{ fontSize: 10, color: '#64748b', width: 28 }}>{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (subPath === '/erp/contract') {
    const contracts = [
      { name: '品川タワー新築工事', client: '品川都市開発(株)', amount: '¥4,200M', period: '2025/04-2027/03', type: '総価契約', status: '履行中' },
      { name: '横浜分譲マンション', client: '横浜住宅(株)', amount: '¥2,800M', period: '2025/06-2027/09', type: '総価契約', status: '履行中' },
      { name: '大田区土木工事', client: '大田区', amount: '¥1,500M', period: '2025/08-2026/12', type: '単価契約', status: '履行中' },
      { name: '新宿再開発ビル', client: '新宿都市開発(株)', amount: '¥6,500M', period: '2026/01-2028/06', type: '総価契約', status: '履行中' },
    ];
    return (
      <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
        {header('契約管理', '工事請負契約・変更契約の管理')}
        <div style={cs}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 90px 120px 80px 70px', gap: 12, padding: '10px 16px', borderBottom: '1px solid #e2e8f0', fontSize: 11, fontWeight: 600, color: '#94a3b8' }}>
            <span>工事名</span><span>発注者</span><span>契約額</span><span>工期</span><span>契約形態</span><span>状態</span>
          </div>
          {contracts.map((c,i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 90px 120px 80px 70px', gap: 12, padding: '12px 16px', alignItems: 'center', borderBottom: i<contracts.length-1?'1px solid #f1f5f9':'none', fontSize: 12, cursor: 'pointer' }}
              onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <span style={{ fontWeight: 500, color: '#0f172a' }}>{c.name}</span>
              <span style={{ color: '#64748b' }}>{c.client}</span>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>{c.amount}</span>
              <span style={{ fontSize: 10, color: '#64748b' }}>{c.period}</span>
              <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: '#f1f5f9', color: '#475569' }}>{c.type}</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: '#16a34a' }}>{c.status}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (subPath === '/erp/purchase') {
    const orders = [
      { item: 'SD345 D25 鉄筋', qty: '120t', supplier: '東京鉄鋼(株)', amount: '¥14.4M', delivery: '2026/06/01', status: '発注済' },
      { item: 'H-400x200 鉄骨', qty: '85t', supplier: '日本製鉄(株)', amount: '¥25.5M', delivery: '2026/06/15', status: '製作中' },
      { item: 'コンクリート 30-18-20', qty: '450m³', supplier: '関東生コン', amount: '¥6.3M', delivery: '2026/05/28', status: '配車済' },
      { item: '型枠合板 12mm', qty: '2,000枚', supplier: '林業資材(株)', amount: '¥3.2M', delivery: '2026/05/27', status: '発注済' },
      { item: '安全ネット 5m幅', qty: '500m', supplier: '安全用品(株)', amount: '¥1.5M', delivery: '2026/05/30', status: '出荷済' },
    ];
    return (
      <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
        {header('購買管理', '資材発注・納品管理・サプライヤー管理')}
        <div style={cs}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 70px 1fr 80px 90px 70px', gap: 12, padding: '10px 16px', borderBottom: '1px solid #e2e8f0', fontSize: 11, fontWeight: 600, color: '#94a3b8' }}>
            <span>品目</span><span>数量</span><span>サプライヤー</span><span>金額</span><span>納期</span><span>状態</span>
          </div>
          {orders.map((o,i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.3fr 70px 1fr 80px 90px 70px', gap: 12, padding: '12px 16px', alignItems: 'center', borderBottom: i<orders.length-1?'1px solid #f1f5f9':'none', fontSize: 12 }}>
              <span style={{ fontWeight: 500, color: '#0f172a' }}>{o.item}</span>
              <span style={{ color: '#64748b' }}>{o.qty}</span>
              <span style={{ color: '#64748b' }}>{o.supplier}</span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 500 }}>{o.amount}</span>
              <span style={{ fontSize: 11, color: '#64748b' }}>{o.delivery}</span>
              <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: o.status==='出荷済'?'#dcfce7':o.status==='配車済'?'#dbeafe':'#fef3c7', color: o.status==='出荷済'?'#166534':o.status==='配車済'?'#1e40af':'#92400e' }}>{o.status}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (subPath === '/erp/labor') {
    return (
      <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
        {header('労務管理', '労務費・勤怠・配置計画')}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
          {[{l:'総労務者数',v:'1,248名',c:'#1a56db',bg:'#eff6ff'},{l:'本月労務費',v:'¥186M',c:'#f97316',bg:'#fff7ed'},{l:'平均残業',v:'18.5h',c:'#7c3aed',bg:'#f5f3ff'},{l:'有給取得率',v:'72%',c:'#16a34a',bg:'#f0fdf4'}].map((s,i) => (
            <div key={i} style={{ ...cs, padding: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="users" size={16} style={{ color: s.c }} /></div>
              <div><div style={{ fontSize: 10, color: '#94a3b8' }}>{s.l}</div><div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{s.v}</div></div>
            </div>
          ))}
        </div>
        <div style={cs}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>部門別労務配置</div>
          {[{dept:'施工管理部',staff:42,field:38,office:4},{dept:'技術部',staff:28,field:12,office:16},{dept:'安全管理部',staff:8,field:6,office:2},{dept:'購買部',staff:12,field:2,office:10}].map((d,i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid #f1f5f9', fontSize: 12 }}>
              <span style={{ width: 120, fontWeight: 500, color: '#0f172a' }}>{d.dept}</span>
              <span style={{ width: 60, color: '#374151' }}>{d.staff}名</span>
              <span style={{ width: 80, color: '#64748b', fontSize: 11 }}>現場{d.field}</span>
              <span style={{ width: 80, color: '#64748b', fontSize: 11 }}>内勤{d.office}</span>
              <div style={{ flex: 1, height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(d.field/d.staff)*100}%`, background: '#1a56db', borderRadius: 3 }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (subPath === '/erp/sales') {
    return (
      <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
        {header('売上管理', '工事別売上・出来高・請求管理')}
        <KPICards />
        <div style={cs}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>工事別売上</div>
          {[{name:'品川タワー',contract:4200,billed:2800,collected:2650},{name:'横浜マンション',contract:2800,billed:1100,collected:1050},{name:'大田区土木',contract:1500,billed:1250,collected:1200},{name:'新宿再開発',contract:6500,billed:1200,collected:1150}].map((p,i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.5fr 90px 90px 90px 120px', gap: 12, padding: '12px 16px', alignItems: 'center', borderBottom: '1px solid #f1f5f9', fontSize: 12 }}>
              <span style={{ fontWeight: 500, color: '#0f172a' }}>{p.name}</span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: '#64748b' }}>{p.contract.toLocaleString()}M</span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>{p.billed.toLocaleString()}M</span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: '#16a34a' }}>{p.collected.toLocaleString()}M</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ flex: 1, height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(p.collected/p.contract)*100}%`, background: '#1a56db', borderRadius: 3 }}></div>
                </div>
                <span style={{ fontSize: 10, color: '#64748b' }}>{Math.round((p.collected/p.contract)*100)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (subPath === '/erp/stock') {
    const items = [
      { name: 'SD345 D25 鉄筋', stock: '45t', min: '20t', status: '充足', location: '品川ヤード' },
      { name: 'H-400x200 鉄骨', stock: '12t', min: '15t', status: '不足', location: '品川ヤード' },
      { name: '型枠合板 12mm', stock: '800枚', min: '500枚', status: '充足', location: '横浜倉庫' },
      { name: 'セメント 普通', stock: '30t', min: '10t', status: '充足', location: '大田区現場' },
      { name: '安全帯 フルハーネス', stock: '25個', min: '30個', status: '不足', location: '本社倉庫' },
    ];
    return (
      <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
        {header('在庫管理', '資材在庫・発注点管理・拠点別在庫')}
        <div style={cs}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 80px 80px 70px 100px', gap: 12, padding: '10px 16px', borderBottom: '1px solid #e2e8f0', fontSize: 11, fontWeight: 600, color: '#94a3b8' }}>
            <span>品目</span><span>在庫数</span><span>発注点</span><span>状態</span><span>保管場所</span>
          </div>
          {items.map((it,i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.5fr 80px 80px 70px 100px', gap: 12, padding: '12px 16px', alignItems: 'center', borderBottom: i<items.length-1?'1px solid #f1f5f9':'none', fontSize: 12 }}>
              <span style={{ fontWeight: 500, color: '#0f172a' }}>{it.name}</span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>{it.stock}</span>
              <span style={{ fontSize: 11, color: '#64748b' }}>{it.min}</span>
              <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: it.status==='充足'?'#dcfce7':'#fef2f2', color: it.status==='充足'?'#166534':'#991b1b' }}>{it.status}</span>
              <span style={{ color: '#64748b', fontSize: 11 }}>{it.location}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (subPath === '/erp/ledger') {
    return (
      <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
        {header('工事台帳', '工事別損益・出来高・原価の統合台帳')}
        <div style={cs}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 90px 90px 90px 90px 70px', gap: 12, padding: '10px 16px', borderBottom: '1px solid #e2e8f0', fontSize: 11, fontWeight: 600, color: '#94a3b8' }}>
            <span>工事名</span><span>契約額</span><span>出来高</span><span>実行予算</span><span>実績原価</span><span>粗利率</span>
          </div>
          {[
            { name: '品川タワー新築', contract: 4200, dekidaka: 2800, budget: 3570, cost: 2380, margin: 15.0 },
            { name: '横浜分譲マンション', contract: 2800, dekidaka: 1100, budget: 2380, cost: 935, margin: 15.0 },
            { name: '大田区土木', contract: 1500, dekidaka: 1250, budget: 1305, cost: 1100, margin: 12.0 },
            { name: '新宿再開発ビル', contract: 6500, dekidaka: 1200, budget: 5525, cost: 1020, margin: 15.0 },
            { name: '川崎物流センター', contract: 3200, dekidaka: 1760, budget: 2720, cost: 1585, margin: 9.9 },
          ].map((p,i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.5fr 90px 90px 90px 90px 70px', gap: 12, padding: '12px 16px', alignItems: 'center', borderBottom: '1px solid #f1f5f9', fontSize: 12 }}>
              <span style={{ fontWeight: 500, color: '#0f172a' }}>{p.name}</span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>{p.contract.toLocaleString()}</span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>{p.dekidaka.toLocaleString()}</span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>{p.budget.toLocaleString()}</span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>{p.cost.toLocaleString()}</span>
              <span style={{ fontWeight: 600, color: p.margin<12?'#dc2626':p.margin<14?'#f97316':'#16a34a' }}>{p.margin}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (subPath === '/erp/bi') {
    return (
      <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
        {header('BIレポート', '経営分析・BI可視化ダッシュボード')}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {['売上推移レポート','原価分析レポート','受注状況レポート','安全管理レポート'].map((r,i) => (
            <div key={i} style={{ ...cs, padding: 0, cursor: 'pointer', overflow: 'hidden', transition: 'box-shadow 0.15s' }}
              onMouseEnter={e=>e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)'} onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}>
              <div style={{ height: 140, background: `hsl(${210+i*25},20%,92%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="chart-bar" size={36} style={{ color: '#94a3b8' }} />
              </div>
              <div style={{ padding: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{r}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>最終更新: 2026/05/24</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* Default: original cost view */
  return <ERPCostView />;
}

window.ERPPage = ERPPage;
