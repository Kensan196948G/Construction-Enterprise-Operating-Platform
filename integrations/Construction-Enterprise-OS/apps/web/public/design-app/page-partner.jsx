/* ========================================
   Construction Enterprise OS — 協力会社連携 Page
   Partner management, entry/exit, contracts, invoices
   ======================================== */

function PartnerPage({ subPath }) {
  const tabFromPath = { '/partner/list': 'overview', '/partner/entry': 'entry', '/partner/docs': 'docs', '/partner/education': 'safety', '/partner/contract': 'overview', '/partner/invoice': 'invoice' };
  const [selectedPartner, setSelectedPartner] = React.useState(0);
  const [activeTab, setActiveTab] = React.useState(tabFromPath[subPath] || 'overview');
  React.useEffect(() => { if (tabFromPath[subPath]) setActiveTab(tabFromPath[subPath]); }, [subPath]);
  const cs = { background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' };

  const partners = [
    { name: '(株)中村建設', type: '鉄骨工事', workers: 18, rating: 'A', contract: '継続', docs: 2, safety: 98, risk: 'low' },
    { name: '(株)佐々木電気', type: '電気設備', workers: 12, rating: 'A', contract: '継続', docs: 0, safety: 95, risk: 'low' },
    { name: '山本配管工業', type: '給排水', workers: 8, rating: 'B', contract: '継続', docs: 4, safety: 88, risk: 'medium' },
    { name: '(株)高橋塗装', type: '塗装工事', workers: 6, rating: 'B', contract: '単発', docs: 1, safety: 92, risk: 'low' },
    { name: '関東足場(株)', type: '足場工事', workers: 15, rating: 'A', contract: '継続', docs: 0, safety: 96, risk: 'low' },
    { name: '(株)東京クレーン', type: '揚重工事', workers: 5, rating: 'A', contract: '継続', docs: 3, safety: 90, risk: 'medium' },
  ];

  const entryLogs = [
    { name: '中村 太郎', company: '(株)中村建設', time: '07:45', type: '入場', helmet: 'OK', vest: 'OK' },
    { name: '佐々木 健', company: '(株)佐々木電気', time: '07:50', type: '入場', helmet: 'OK', vest: 'OK' },
    { name: '山本 一郎', company: '山本配管工業', time: '07:55', type: '入場', helmet: 'OK', vest: '未着用' },
    { name: '高橋 誠', company: '(株)高橋塗装', time: '08:02', type: '入場', helmet: 'OK', vest: 'OK' },
    { name: '木村 大輔', company: '関東足場(株)', time: '08:10', type: '入場', helmet: 'OK', vest: 'OK' },
  ];

  const invoices = [
    { company: '(株)中村建設', month: '2026/04', amount: '¥12,500,000', status: '支払済', due: '2026/05/31' },
    { company: '(株)佐々木電気', month: '2026/04', amount: '¥8,200,000', status: '承認済', due: '2026/05/31' },
    { company: '山本配管工業', month: '2026/04', amount: '¥4,800,000', status: '審査中', due: '2026/05/31' },
    { company: '(株)高橋塗装', month: '2026/04', amount: '¥2,100,000', status: '承認待ち', due: '2026/06/15' },
    { company: '関東足場(株)', month: '2026/04', amount: '¥6,400,000', status: '支払済', due: '2026/05/31' },
  ];

  const riskColor = { low: '#16a34a', medium: '#f97316', high: '#dc2626' };
  const riskLabel = { low: '低', medium: '中', high: '高' };
  const invoiceStatusColor = {
    '支払済': { bg: '#dcfce7', color: '#166534' }, '承認済': { bg: '#dbeafe', color: '#1e40af' },
    '審査中': { bg: '#fff7ed', color: '#92400e' }, '承認待ち': { bg: '#fef3c7', color: '#92400e' },
  };

  const tabStyle = (active) => ({
    padding: '8px 16px', fontSize: 12, fontWeight: active ? 600 : 400,
    color: active ? '#1a56db' : '#64748b', cursor: 'pointer',
    borderBottom: active ? '2px solid #1a56db' : '2px solid transparent',
    background: 'none', border: 'none', borderBottomStyle: 'solid', fontFamily: 'inherit',
  });

  const p = partners[selectedPartner];

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0 }}>協力会社連携</h1>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>入退場管理・提出書類・契約・請求の統合管理</p>
        </div>
        <button style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#1a56db', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
          <Icon name="plus" size={14} />協力会社登録
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: '登録会社数', value: '186', icon: 'building', color: '#1a56db', bg: '#eff6ff' },
          { label: '本日入場者', value: '142', icon: 'users', color: '#16a34a', bg: '#f0fdf4' },
          { label: '未提出書類', value: '10', icon: 'file-text', color: '#f97316', bg: '#fff7ed' },
          { label: '未払請求', value: '¥15.1M', icon: 'clipboard', color: '#dc2626', bg: '#fef2f2' },
        ].map((s, i) => (
          <div key={i} style={{ ...cs, padding: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={s.icon} size={16} style={{ color: s.color }} />
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#94a3b8' }}>{s.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>
        {/* Partner list */}
        <div style={{ ...cs, padding: 0 }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>協力会社一覧</div>
          </div>
          {partners.map((pa, i) => (
            <div key={i} onClick={() => setSelectedPartner(i)} style={{
              padding: '12px 16px', cursor: 'pointer',
              background: i === selectedPartner ? '#eff6ff' : 'transparent',
              borderLeft: i === selectedPartner ? '3px solid #1a56db' : '3px solid transparent',
              borderBottom: '1px solid #f1f5f9', transition: 'all 0.12s',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{pa.name}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{pa.type}</div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: pa.rating === 'A' ? '#dcfce7' : '#fef3c7', color: pa.rating === 'A' ? '#166534' : '#92400e' }}>{pa.rating}ランク</span>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 10, color: '#94a3b8' }}>
                <span>{pa.workers}名</span>
                <span>安全{pa.safety}%</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: riskColor[pa.risk] }}></span>
                  リスク{riskLabel[pa.risk]}
                </span>
                {pa.docs > 0 && <span style={{ color: '#f97316', fontWeight: 600 }}>未提出{pa.docs}件</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Detail area */}
        <div>
          {/* Partner header */}
          <div style={{ ...cs, padding: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 10, background: '#1a56db12', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#1a56db' }}>{p.name[0]}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{p.name}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>{p.type} · {p.contract}契約 · 作業員{p.workers}名</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ textAlign: 'center', padding: '4px 12px' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#16a34a' }}>{p.safety}%</div>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>安全スコア</div>
              </div>
              <div style={{ textAlign: 'center', padding: '4px 12px' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: riskColor[p.risk] }}>{riskLabel[p.risk]}</div>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>AIリスク</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={cs}>
            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', padding: '0 16px' }}>
              {[{ id: 'overview', label: '概要' }, { id: 'entry', label: '入退場' }, { id: 'docs', label: '提出書類' }, { id: 'invoice', label: '請求管理' }, { id: 'safety', label: '安全教育' }].map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)} style={tabStyle(activeTab === t.id)}>{t.label}</button>
              ))}
            </div>
            <div style={{ padding: 20 }}>
              {activeTab === 'overview' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 12 }}>基本情報</div>
                    {[['会社名', p.name], ['業種', p.type], ['作業員数', `${p.workers}名`], ['契約形態', p.contract], ['評価ランク', p.rating], ['安全スコア', `${p.safety}%`]].map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: 12 }}>
                        <span style={{ color: '#94a3b8' }}>{k}</span>
                        <span style={{ color: '#0f172a', fontWeight: 500 }}>{v}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: 14, borderRadius: 8, background: '#f5f3ff', border: '1px solid #ede9fe' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <Icon name="brain" size={14} style={{ color: '#7c3aed' }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#7c3aed' }}>AIリスク評価</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
                      過去12ヶ月の実績分析に基づくリスク評価: {riskLabel[p.risk]}。安全教育の受講率が高く、書類提出も概ね期限内。{p.docs > 0 ? `ただし、現在${p.docs}件の未提出書類があります。早急な対応を推奨します。` : '全書類提出済み。優良パートナーです。'}
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'entry' && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 12 }}>本日の入退場記録</div>
                  <div style={{ borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 60px 60px 60px', gap: 8, padding: '8px 14px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: 11, fontWeight: 600, color: '#94a3b8' }}>
                      <span>氏名</span><span>会社</span><span>時刻</span><span>種別</span><span>ヘルメット</span><span>ベスト</span>
                    </div>
                    {entryLogs.map((e, i) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 60px 60px 60px', gap: 8, padding: '10px 14px', alignItems: 'center', borderBottom: i < entryLogs.length - 1 ? '1px solid #f1f5f9' : 'none', fontSize: 12 }}>
                        <span style={{ fontWeight: 500, color: '#0f172a' }}>{e.name}</span>
                        <span style={{ color: '#64748b' }}>{e.company}</span>
                        <span style={{ color: '#64748b', fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{e.time}</span>
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: '#dcfce7', color: '#166534' }}>{e.type}</span>
                        <span style={{ color: '#16a34a', fontSize: 11 }}>{e.helmet}</span>
                        <span style={{ color: e.vest === 'OK' ? '#16a34a' : '#dc2626', fontSize: 11, fontWeight: e.vest !== 'OK' ? 600 : 400 }}>{e.vest}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {activeTab === 'invoice' && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 12 }}>請求管理</div>
                  <div style={{ borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 80px 120px 80px 100px', gap: 8, padding: '8px 14px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: 11, fontWeight: 600, color: '#94a3b8' }}>
                      <span>会社名</span><span>対象月</span><span>金額</span><span>状態</span><span>支払期限</span>
                    </div>
                    {invoices.map((inv, i) => {
                      const sc = invoiceStatusColor[inv.status] || { bg: '#f1f5f9', color: '#475569' };
                      return (
                        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.2fr 80px 120px 80px 100px', gap: 8, padding: '10px 14px', alignItems: 'center', borderBottom: i < invoices.length - 1 ? '1px solid #f1f5f9' : 'none', fontSize: 12 }}>
                          <span style={{ fontWeight: 500, color: '#0f172a' }}>{inv.company}</span>
                          <span style={{ color: '#64748b' }}>{inv.month}</span>
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", color: '#0f172a', fontWeight: 600 }}>{inv.amount}</span>
                          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: sc.bg, color: sc.color }}>{inv.status}</span>
                          <span style={{ color: '#64748b', fontSize: 11 }}>{inv.due}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {(activeTab === 'docs') && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 12 }}>提出書類管理</div>
                  <div style={{ borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 100px 80px 80px', gap: 8, padding: '8px 14px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: 11, fontWeight: 600, color: '#94a3b8' }}>
                      <span>書類名</span><span>種別</span><span>期限</span><span>状態</span>
                    </div>
                    {[
                      { name: '作業員名簿', type: '安全書類', deadline: '2026/05/30', status: '提出済' },
                      { name: '下請負業者届', type: '契約書類', deadline: '2026/05/25', status: '未提出' },
                      { name: '安全衛生責任者届', type: '安全書類', deadline: '2026/05/28', status: '提出済' },
                      { name: '工事保険証書', type: '保険書類', deadline: '2026/06/01', status: '未提出' },
                      { name: '資格証明書（玉掛け）', type: '資格書類', deadline: '—', status: '提出済' },
                      { name: '有機溶剤作業主任者証', type: '資格書類', deadline: '—', status: '期限切れ' },
                    ].map((d,i) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.5fr 100px 80px 80px', gap: 8, padding: '10px 14px', alignItems: 'center', borderBottom: '1px solid #f1f5f9', fontSize: 12 }}>
                        <span style={{ fontWeight: 500, color: '#0f172a' }}>{d.name}</span>
                        <span style={{ fontSize: 10, color: '#64748b' }}>{d.type}</span>
                        <span style={{ fontSize: 11, color: '#64748b' }}>{d.deadline}</span>
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: d.status==='提出済'?'#dcfce7':d.status==='未提出'?'#fff7ed':'#fef2f2', color: d.status==='提出済'?'#166534':d.status==='未提出'?'#92400e':'#991b1b' }}>{d.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {(activeTab === 'safety') && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 12 }}>安全教育記録</div>
                  <div style={{ borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 100px 80px', gap: 8, padding: '8px 14px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: 11, fontWeight: 600, color: '#94a3b8' }}>
                      <span>教育名</span><span>対象者</span><span>受講日</span><span>状態</span>
                    </div>
                    {[
                      { name: '新規入場者教育', target: '中村 太郎 他3名', date: '2026/05/24', status: '完了' },
                      { name: '特別教育（足場）', target: '木村 大輔 他2名', date: '2026/05/20', status: '完了' },
                      { name: '職長教育', target: '佐々木 健', date: '2026/05/15', status: '完了' },
                      { name: '技能講習（玉掛け）', target: '山本 一郎', date: '2026/04/28', status: '完了' },
                      { name: '熱中症対策講習', target: '全作業員', date: '2026/05/01', status: '完了' },
                      { name: '酸欠危険作業教育', target: '高橋 隆', date: '予定', status: '未受講' },
                    ].map((e,i) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 100px 80px', gap: 8, padding: '10px 14px', alignItems: 'center', borderBottom: '1px solid #f1f5f9', fontSize: 12 }}>
                        <span style={{ fontWeight: 500, color: '#0f172a' }}>{e.name}</span>
                        <span style={{ color: '#64748b', fontSize: 11 }}>{e.target}</span>
                        <span style={{ fontSize: 11, color: '#64748b' }}>{e.date}</span>
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: e.status==='完了'?'#dcfce7':'#fff7ed', color: e.status==='完了'?'#166534':'#92400e' }}>{e.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.PartnerPage = PartnerPage;
