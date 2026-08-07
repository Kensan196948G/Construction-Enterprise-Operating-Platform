/* ========================================
   Construction Enterprise OS — ワークフロー Page
   Approvals, ringi, permits, e-signatures
   ======================================== */

function WorkflowPage({ subPath }) {
  const tabFromPath = { '/workflow/approval': 'approval', '/workflow/ringi': 'ringi', '/workflow/permit': 'permit', '/workflow/esign': 'esign', '/workflow/change': 'change' };
  const [activeWfTab, setActiveWfTab] = React.useState(tabFromPath[subPath] || 'approval');
  const [selectedItem, setSelectedItem] = React.useState(null);
  React.useEffect(() => { if (tabFromPath[subPath]) setActiveWfTab(tabFromPath[subPath]); }, [subPath]);
  const cs = { background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' };

  const tabStyle = (active) => ({
    padding: '8px 16px', fontSize: 12, fontWeight: active ? 600 : 400,
    color: active ? '#1a56db' : '#64748b', cursor: 'pointer',
    borderBottom: active ? '2px solid #1a56db' : '2px solid transparent',
    background: 'none', border: 'none', borderBottomStyle: 'solid', fontFamily: 'inherit',
  });

  const pendingItems = [
    { id: 'WF-2026-128', title: '施工計画書（躯体工事）承認依頼', type: '承認', requester: '田中 健一', project: '品川タワー', priority: 'high', created: '2026/05/24 08:30', deadline: '2026/05/25', step: '部長承認' },
    { id: 'WF-2026-127', title: '資材発注書（鉄筋 SD345）', type: '稟議', requester: '渡辺 誠', project: '横浜マンション', priority: 'medium', created: '2026/05/24 07:45', deadline: '2026/05/26', step: '課長承認' },
    { id: 'WF-2026-126', title: 'クレーン作業許可申請', type: '作業許可', requester: '佐藤 太郎', project: '品川タワー', priority: 'high', created: '2026/05/23 16:00', deadline: '2026/05/24', step: '安全確認' },
    { id: 'WF-2026-125', title: '設計変更申請（基礎構造）', type: '変更管理', requester: '山田 花子', project: '新宿再開発', priority: 'medium', created: '2026/05/23 14:20', deadline: '2026/05/27', step: '技術審査' },
    { id: 'WF-2026-124', title: '協力会社 新規登録申請', type: '承認', requester: '伊藤 裕子', project: '全社', priority: 'low', created: '2026/05/23 10:00', deadline: '2026/05/28', step: '外注管理確認' },
  ];

  const completedItems = [
    { id: 'WF-2026-123', title: '安全パトロール報告書', type: '承認', result: '承認', approver: '部長 木村', completed: '2026/05/23 17:30' },
    { id: 'WF-2026-122', title: 'コンクリート配合計画書', type: '承認', result: '承認', approver: '技術部長 林', completed: '2026/05/23 15:00' },
    { id: 'WF-2026-121', title: '重機搬入許可', type: '作業許可', result: '承認', approver: '安全管理 佐藤', completed: '2026/05/23 12:00' },
    { id: 'WF-2026-120', title: '月次原価報告書', type: '稟議', result: '差戻し', approver: '経理部長 加藤', completed: '2026/05/22 16:45' },
  ];

  const priorityColor = { high: '#dc2626', medium: '#f97316', low: '#16a34a' };
  const priorityLabel = { high: '高', medium: '中', low: '低' };
  const typeIcon = { '承認': 'check-circle', '稟議': 'file-text', '作業許可': 'shield', '変更管理': 'git-branch' };

  const flowSteps = [
    { label: '申請', status: 'done', user: '田中 健一', date: '05/24' },
    { label: '課長確認', status: 'done', user: '木下 誠', date: '05/24' },
    { label: '部長承認', status: 'active', user: '(承認待ち)', date: '' },
    { label: '完了', status: 'pending', user: '', date: '' },
  ];

  const stepColor = { done: '#16a34a', active: '#1a56db', pending: '#d1d5db' };

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0 }}>ワークフロー</h1>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>承認・稟議・作業許可・電子決裁の統合管理</p>
        </div>
        <button style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#1a56db', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
          <Icon name="plus" size={14} />新規申請
        </button>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: '承認待ち', value: '5', icon: 'clock', color: '#f97316', bg: '#fff7ed' },
          { label: '本日承認', value: '8', icon: 'check-circle', color: '#16a34a', bg: '#f0fdf4' },
          { label: '今月申請', value: '42', icon: 'file-text', color: '#1a56db', bg: '#eff6ff' },
          { label: 'SLA達成率', value: '94%', icon: 'activity', color: '#7c3aed', bg: '#f5f3ff' },
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

      <div style={{ display: 'grid', gridTemplateColumns: selectedItem !== null ? '1fr 380px' : '1fr', gap: 20 }}>
        <div style={cs}>
          <SlideTabPanel
            tabs={[
              { id: 'approval', label: '承認一覧' },
              { id: 'ringi', label: '稟議' },
              { id: 'permit', label: '作業許可' },
              { id: 'esign', label: '電子決裁' },
              { id: 'change', label: '変更管理' },
            ]}
            activeTab={activeWfTab} onTabChange={setActiveWfTab}>

            {/* 承認一覧 */}
            <div>
              {pendingItems.map((item, i) => (
                <WfListItem key={i} item={item} selected={selectedItem?.id === item.id} onClick={() => setSelectedItem(item)} typeIcon={typeIcon} priorityColor={priorityColor} priorityLabel={priorityLabel} />
              ))}
            </div>

            {/* 稟議 */}
            <div>
              {pendingItems.filter(it => it.type === '稟議').length > 0 ?
                pendingItems.filter(it => it.type === '稟議').map((item, i) => (
                  <WfListItem key={i} item={item} selected={selectedItem?.id === item.id} onClick={() => setSelectedItem(item)} typeIcon={typeIcon} priorityColor={priorityColor} priorityLabel={priorityLabel} />
                )) : (
                <div style={{ padding: '12px 20px' }}>
                  {[
                    { id: 'WF-R-001', title: '資材発注書（鉄筋 SD345）', type: '稟議', requester: '渡辺 誠', project: '横浜マンション', priority: 'medium', created: '2026/05/24 07:45', deadline: '2026/05/26', step: '課長承認' },
                    { id: 'WF-R-002', title: '外注費追加申請（足場工事）', type: '稟議', requester: '田中 健一', project: '品川タワー', priority: 'high', created: '2026/05/23 16:00', deadline: '2026/05/25', step: '部長決裁' },
                    { id: 'WF-R-003', title: '出張申請（技術研修）', type: '稟議', requester: '山田 花子', project: '全社', priority: 'low', created: '2026/05/23 10:00', deadline: '2026/05/28', step: '上長承認' },
                  ].map((item, i) => (
                    <WfListItem key={i} item={item} selected={selectedItem?.id === item.id} onClick={() => setSelectedItem(item)} typeIcon={typeIcon} priorityColor={priorityColor} priorityLabel={priorityLabel} />
                  ))
                  }
                </div>
              )}
            </div>

            {/* 作業許可 */}
            <div>
              {[
                { id: 'WF-P-001', title: 'クレーン作業許可申請', type: '作業許可', requester: '佐藤 太郎', project: '品川タワー', priority: 'high', created: '2026/05/24 06:30', deadline: '2026/05/24', step: '安全確認' },
                { id: 'WF-P-002', title: '高所作業許可（8F以上）', type: '作業許可', requester: '木村 大輔', project: '品川タワー', priority: 'high', created: '2026/05/24 07:00', deadline: '2026/05/24', step: '安全管理者' },
                { id: 'WF-P-003', title: '火気使用許可（溶接作業）', type: '作業許可', requester: '中村 太郎', project: '横浜マンション', priority: 'medium', created: '2026/05/24 07:30', deadline: '2026/05/24', step: '現場監督確認' },
              ].map((item, i) => (
                <WfListItem key={i} item={item} selected={selectedItem?.id === item.id} onClick={() => setSelectedItem(item)} typeIcon={typeIcon} priorityColor={priorityColor} priorityLabel={priorityLabel} />
              ))}
            </div>

            {/* 電子決裁 */}
            <div>
              {[
                { id: 'WF-E-001', title: '施工計画書（躯体工事）電子署名', type: '承認', requester: '田中 健一', project: '品川タワー', priority: 'high', created: '2026/05/24 08:30', deadline: '2026/05/25', step: '電子署名待ち' },
                { id: 'WF-E-002', title: '月次報告書 電子決裁', type: '承認', requester: '鈴木 一郎', project: '全社', priority: 'medium', created: '2026/05/23 16:00', deadline: '2026/05/27', step: '役員決裁' },
              ].map((item, i) => (
                <WfListItem key={i} item={item} selected={selectedItem?.id === item.id} onClick={() => setSelectedItem(item)} typeIcon={typeIcon} priorityColor={priorityColor} priorityLabel={priorityLabel} />
              ))}
            </div>

            {/* 変更管理 */}
            <div>
              {[
                { id: 'WF-C-001', title: '設計変更申請（基礎構造）', type: '変更管理', requester: '山田 花子', project: '新宿再開発', priority: 'medium', created: '2026/05/23 14:20', deadline: '2026/05/27', step: '技術審査' },
                { id: 'WF-C-002', title: '工程変更申請（雨天延期）', type: '変更管理', requester: '田中 健一', project: '品川タワー', priority: 'low', created: '2026/05/22 10:00', deadline: '2026/05/28', step: '発注者確認' },
              ].map((item, i) => (
                <WfListItem key={i} item={item} selected={selectedItem?.id === item.id} onClick={() => setSelectedItem(item)} typeIcon={typeIcon} priorityColor={priorityColor} priorityLabel={priorityLabel} />
              ))}
            </div>
          </SlideTabPanel>
        </div>

        {/* Detail panel */}
        {selectedItem !== null && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={cs}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>申請詳細</span>
                <button onClick={() => setSelectedItem(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', padding: 2 }}>
                  <Icon name="x" size={14} />
                </button>
              </div>
              <div style={{ padding: 16 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>{selectedItem.title}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 16 }}>{selectedItem.id}</div>

                {[['申請者', selectedItem.requester], ['種別', selectedItem.type], ['工事', selectedItem.project], ['優先度', priorityLabel[selectedItem.priority]], ['申請日', selectedItem.created], ['期限', selectedItem.deadline]].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f1f5f9', fontSize: 12 }}>
                    <span style={{ color: '#94a3b8' }}>{k}</span>
                    <span style={{ color: '#0f172a', fontWeight: 500 }}>{v}</span>
                  </div>
                ))}

                <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                  <button style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', background: '#16a34a', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>承認</button>
                  <button style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', background: '#dc2626', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>差戻し</button>
                </div>
              </div>
            </div>

            {/* Workflow flow */}
            <div style={cs}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>承認フロー</span>
              </div>
              <div style={{ padding: 16 }}>
                <div style={{ position: 'relative', paddingLeft: 20 }}>
                  <div style={{ position: 'absolute', left: 7, top: 8, bottom: 8, width: 2, background: '#e2e8f0' }}></div>
                  {flowSteps.map((step, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 18, position: 'relative' }}>
                      <div style={{
                        position: 'absolute', left: -16,
                        width: 14, height: 14, borderRadius: '50%', marginTop: 1,
                        background: stepColor[step.status],
                        border: step.status === 'active' ? '3px solid #bfdbfe' : '2px solid #fff',
                        boxShadow: step.status === 'active' ? '0 0 0 2px #1a56db40' : 'none',
                      }}></div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: step.status === 'active' ? 600 : 400, color: step.status === 'pending' ? '#94a3b8' : '#0f172a' }}>{step.label}</div>
                        {step.user && <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{step.user} {step.date && `· ${step.date}`}</div>}
                        {step.status === 'active' && (
                          <span style={{ display: 'inline-block', marginTop: 4, fontSize: 10, fontWeight: 600, color: '#1a56db', background: '#eff6ff', padding: '2px 8px', borderRadius: 10 }}>承認待ち</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI assist */}
            <div style={{ ...cs, background: '#f5f3ff', borderColor: '#ede9fe' }}>
              <div style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Icon name="brain" size={14} style={{ color: '#7c3aed' }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#7c3aed' }}>AI承認補助</span>
                </div>
                <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
                  この施工計画書は過去の類似承認と整合性があります。内容の主要ポイント: 躯体工事の品質管理基準・施工手順・安全対策が網羅されています。特記事項はありません。
                </div>
                <div style={{ marginTop: 8, fontSize: 11, color: '#16a34a', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Icon name="check-circle" size={12} />AI推奨: 承認可
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* Reusable workflow list item */
function WfListItem({ item, selected, onClick, typeIcon, priorityColor, priorityLabel }) {
  return (
    <div onClick={onClick} style={{
      padding: '14px 20px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer',
      background: selected ? '#eff6ff' : 'transparent', transition: 'background 0.1s',
    }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.background = '#f8fafc'; }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.background = 'transparent'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <div style={{ width: 28, height: 28, borderRadius: 6, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={typeIcon[item.type] || 'file-text'} size={14} style={{ color: '#1a56db' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{item.title}</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{item.id} · {item.requester} · {item.project}</div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: priorityColor[item.priority]+'15', color: priorityColor[item.priority] }}>{priorityLabel[item.priority]}</span>
          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: '#fff7ed', color: '#92400e', fontWeight: 500 }}>{item.step}</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, fontSize: 10, color: '#94a3b8', marginLeft: 38 }}>
        <span>{item.type}</span><span>申請: {item.created}</span>
        <span style={{ color: item.priority==='high'?'#dc2626':'#94a3b8' }}>期限: {item.deadline}</span>
      </div>
    </div>
  );
}

window.WorkflowPage = WorkflowPage;
