/* ========================================
   Construction Enterprise OS — 自動化・ロボティクス Page (v2)
   SlideTabPanel for all 4 sub-items
   ======================================== */

function RoboticsPage({ subPath }) {
  const tabFromPath = { '/robotics/auto': 'auto', '/robotics/drone': 'drone', '/robotics/rov': 'rov', '/robotics/twin': 'twin' };
  const [activeTab, setActiveTab] = React.useState(tabFromPath[subPath] || 'auto');
  React.useEffect(() => { if (tabFromPath[subPath]) setActiveTab(tabFromPath[subPath]); }, [subPath]);

  const cs = { background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)' };
  const statusColor = { '飛行中': '#16a34a', '稼働中': '#16a34a', '自動運転中': '#7c3aed', '待機': '#94a3b8', '充電中': '#f97316' };

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-heading)', margin: 0 }}>自動化・ロボティクス</h1>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>自動施工・ドローン・ROV・デジタルツイン</p>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: '自動施工機', value: '2/3', icon: 'hard-hat', color: '#16a34a', bg: '#f0fdf4' },
          { label: 'ドローン稼働', value: '2/4', icon: 'eye', color: '#7c3aed', bg: '#f5f3ff' },
          { label: 'ROV稼働', value: '1/2', icon: 'activity', color: '#1a56db', bg: '#eff6ff' },
          { label: 'データ処理', value: '12.4TB', icon: 'zap', color: '#f97316', bg: '#fff7ed' },
        ].map((s,i) => (
          <div key={i} style={{ ...cs, padding: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={s.icon} size={16} style={{ color: s.color }} /></div>
            <div><div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{s.label}</div><div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>{s.value}</div></div>
          </div>
        ))}
      </div>

      <div style={cs}>
        <SlideTabPanel
          tabs={[
            { id: 'auto', label: '自動施工' },
            { id: 'drone', label: 'ドローン' },
            { id: 'rov', label: 'ROV' },
            { id: 'twin', label: 'デジタルツイン' },
          ]}
          activeTab={activeTab} onTabChange={setActiveTab}>

          {/* 自動施工 */}
          <div style={{ padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>自動施工機械一覧</div>
            <div style={{ borderRadius: 8, border: '1px solid var(--border)', overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 100px 100px 80px 80px', gap: 12, padding: '10px 16px', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>
                <span>機械名</span><span>工事</span><span>状態</span><span>施工進捗</span><span>制御</span><span>GPS</span>
              </div>
              {[
                { name: '自動ブルドーザ D61', project: '大田区土木', status: '自動運転中', progress: 78, operator: 'AI制御', gps: 'RTK固定' },
                { name: '自動振動ローラ BW213', project: '大田区土木', status: '待機', progress: 0, operator: '手動', gps: 'RTK固定' },
                { name: 'マシンガイダンス PC200', project: '川崎物流', status: '稼働中', progress: 45, operator: 'MG支援', gps: 'RTK固定' },
              ].map((m,i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 100px 100px 80px 80px', gap: 12, padding: '12px 16px', alignItems: 'center', borderBottom: '1px solid var(--border-light)', fontSize: 12 }}>
                  <span style={{ fontWeight: 500, color: 'var(--text)' }}>{m.name}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{m.project}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: statusColor[m.status]||'#64748b', fontWeight: 500 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor[m.status]||'#64748b' }}></span>{m.status}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ flex: 1, height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${m.progress}%`, background: '#1a56db', borderRadius: 3 }}></div>
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{m.progress}%</span>
                  </div>
                  <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: m.operator==='AI制御'?'#7c3aed15':m.operator==='MG支援'?'#1a56db15':'var(--bg-subtle)', color: m.operator==='AI制御'?'#7c3aed':m.operator==='MG支援'?'#1a56db':'var(--text-muted)', fontWeight: 500 }}>{m.operator}</span>
                  <span style={{ fontSize: 10, color: '#16a34a', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 3 }}><Icon name="map-pin" size={10} />{m.gps}</span>
                </div>
              ))}
            </div>
            {/* AI control panel */}
            <div style={{ marginTop: 16, padding: 14, borderRadius: 8, background: '#f5f3ff', border: '1px solid #ede9fe' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}><Icon name="brain" size={14} style={{ color: '#7c3aed' }} /><span style={{ fontSize: 12, fontWeight: 600, color: '#7c3aed' }}>AI自動施工制御</span></div>
              <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.6 }}>ブルドーザD61はRTK-GNSSとIMUによる自動制御で施工中。設計面との誤差±3cm以内を維持。本日の施工量: 1,240m³（目標達成率 96%）。</div>
            </div>
          </div>

          {/* ドローン */}
          <div style={{ padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>ドローン管理</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14 }}>
              {[
                { id: 'DRN-001', name: 'Phantom 4 RTK', location: '品川タワー', status: '飛行中', battery: 72, mission: '測量撮影', altitude: '80m', speed: '5.2m/s' },
                { id: 'DRN-002', name: 'Matrice 300', location: '横浜マンション', status: '待機', battery: 95, mission: '—', altitude: '—', speed: '—' },
                { id: 'DRN-003', name: 'Mavic 3E', location: '川崎物流', status: '充電中', battery: 34, mission: '—', altitude: '—', speed: '—' },
                { id: 'DRN-004', name: 'Phantom 4 RTK', location: '千葉港湾', status: '飛行中', battery: 58, mission: '進捗確認', altitude: '50m', speed: '3.8m/s' },
              ].map((d,i) => (
                <div key={i} style={{ padding: 16, borderRadius: 10, border: '1px solid var(--border)', background: d.status==='飛行中'?'#f0fdf4':'var(--bg-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{d.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{d.id} · {d.location}</div>
                    </div>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600, color: statusColor[d.status] }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor[d.status] }}></span>{d.status}
                    </span>
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}><span>バッテリー</span><span style={{ fontWeight: 600, color: d.battery>50?'#16a34a':'#f97316' }}>{d.battery}%</span></div>
                    <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${d.battery}%`, borderRadius: 2, background: d.battery>50?'#16a34a':'#f97316' }}></div>
                    </div>
                  </div>
                  {d.status==='飛行中' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                      {[['任務',d.mission],['高度',d.altitude],['速度',d.speed]].map(([k,v]) => (
                        <div key={k} style={{ textAlign: 'center', padding: '5px 0', background: 'var(--bg-card)', borderRadius: 4, border: '1px solid var(--border)' }}>
                          <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{k}</div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)' }}>{v}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ROV */}
          <div style={{ padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>ROV（水中ロボット）管理</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14 }}>
              {[
                { id: 'ROV-001', name: 'BlueROV2', location: '千葉港湾 水中A', status: '稼働中', depth: '12m', battery: 65, mission: '護岸点検', temp: '18.2°C', visibility: '4m' },
                { id: 'ROV-002', name: 'Fifish V6', location: '千葉港湾 水中B', status: '待機', depth: '—', battery: 88, mission: '—', temp: '—', visibility: '—' },
              ].map((r,i) => (
                <div key={i} style={{ padding: 16, borderRadius: 10, border: '1px solid var(--border)', background: r.status==='稼働中'?'#eff6ff':'var(--bg-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{r.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{r.id} · {r.location}</div>
                    </div>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600, color: statusColor[r.status] }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor[r.status] }}></span>{r.status}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, marginBottom: 10 }}>
                    {[['深度',r.depth],['バッテリー',`${r.battery}%`],['水温',r.temp],['視界',r.visibility]].map(([k,v]) => (
                      <div key={k} style={{ textAlign: 'center', padding: '6px 0', background: 'var(--bg-card)', borderRadius: 4, border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{k}</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginTop: 2 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  {r.status==='稼働中' && (
                    <div style={{ padding: '8px 10px', borderRadius: 6, background: '#f5f3ff', fontSize: 11, color: '#7c3aed' }}>
                      <Icon name="eye" size={12} style={{ marginRight: 4 }} />任務: {r.mission} — 映像記録中
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* デジタルツイン */}
          <div style={{ padding: 20 }}>
            <div style={{ height: 360, borderRadius: 10, background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0f172a 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, position: 'relative', overflow: 'hidden' }}>
              <svg width="100%" height="100%" style={{ position: 'absolute', opacity: 0.15 }}>
                <defs><pattern id="twG2" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M 30 0 L 0 0 0 30" fill="none" stroke="#60a5fa" strokeWidth="0.5" /></pattern></defs>
                <rect fill="url(#twG2)" width="100%" height="100%" />
              </svg>
              <svg width="200" height="180" viewBox="0 0 200 180" style={{ position: 'relative' }}>
                <g stroke="#60a5fa" strokeWidth="1" fill="none" opacity="0.6">
                  <rect x="40" y="40" width="80" height="120" /><rect x="60" y="20" width="80" height="120" />
                  <line x1="40" y1="40" x2="60" y2="20" /><line x1="120" y1="40" x2="140" y2="20" />
                  <line x1="40" y1="160" x2="60" y2="140" /><line x1="120" y1="160" x2="140" y2="140" />
                  {[0,1,2,3,4].map(f => (<React.Fragment key={f}><line x1="40" y1={160-f*30} x2="120" y2={160-f*30} opacity="0.3" /><line x1="60" y1={140-f*30} x2="140" y2={140-f*30} opacity="0.3" /></React.Fragment>))}
                </g>
                <circle cx="100" cy="90" r="30" stroke="#7c3aed" strokeWidth="1" fill="none" opacity="0.3">
                  <animateTransform attributeName="transform" type="rotate" from="0 100 90" to="360 100 90" dur="10s" repeatCount="indefinite" />
                </circle>
              </svg>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#93c5fd', position: 'relative' }}>デジタルツイン ビューア</div>
              <div style={{ fontSize: 12, color: '#64748b', position: 'relative' }}>BIM/CIM + IoT + GIS統合3Dモデル</div>
              <div style={{ display: 'flex', gap: 8, position: 'relative', marginTop: 8 }}>
                {['BIM連携','IoTオーバーレイ','AI分析','シミュレーション'].map(b => (
                  <span key={b} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid #60a5fa40', color: '#93c5fd', fontSize: 11, fontWeight: 500, cursor: 'pointer' }}>{b}</span>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginTop: 16 }}>
              {[['同期デバイス','86台'],['更新頻度','5秒'],['データ量','2.4TB'],['モデルバージョン','v4.2']].map(([k,v]) => (
                <div key={k} style={{ padding: 10, borderRadius: 6, background: 'var(--bg-subtle)', border: '1px solid var(--border)', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{k}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginTop: 2 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </SlideTabPanel>
      </div>
    </div>
  );
}

window.RoboticsPage = RoboticsPage;
