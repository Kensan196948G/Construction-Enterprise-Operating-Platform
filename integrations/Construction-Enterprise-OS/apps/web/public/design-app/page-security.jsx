/* ========================================
   Construction Enterprise OS — セキュリティ・監査 Page (v2)
   SlideTabPanel for all 7 sub-items
   ======================================== */

function SecurityPage({ subPath }) {
  const tabFromPath = {
    '/security/siem': 'siem', '/security/soc': 'soc', '/security/vpn': 'vpn',
    '/security/edr': 'edr', '/security/ot': 'ot', '/security/incident': 'incident',
    '/security/audit': 'audit',
  };
  const [activeTab, setActiveTab] = React.useState(tabFromPath[subPath] || 'siem');
  React.useEffect(() => { if (tabFromPath[subPath]) setActiveTab(tabFromPath[subPath]); }, [subPath]);

  const cs = { background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)' };

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-heading)', margin: 0 }}>セキュリティ・監査</h1>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>SIEM・SOC・VPN・EDR・OT・インシデント・監査</p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: '脅威検知', value: '5', sub: '本日', icon: 'alert-triangle', color: '#dc2626', bg: '#fef2f2' },
          { label: 'ブロック', value: '2,481', sub: '今月', icon: 'shield', color: '#1a56db', bg: '#eff6ff' },
          { label: 'VPN接続', value: '28', sub: 'アクティブ', icon: 'globe', color: '#16a34a', bg: '#f0fdf4' },
          { label: 'EDRカバー', value: '98.5%', sub: '全端末', icon: 'check-circle', color: '#7c3aed', bg: '#f5f3ff' },
          { label: '未解決', value: '2', sub: 'インシデント', icon: 'clock', color: '#f97316', bg: '#fff7ed' },
        ].map((s,i) => (
          <div key={i} style={{ ...cs, padding: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 6, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={s.icon} size={16} style={{ color: s.color }} /></div>
            <div><div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{s.value}</div><div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{s.label}</div></div>
          </div>
        ))}
      </div>

      <div style={cs}>
        <SlideTabPanel
          tabs={[
            { id: 'siem', label: 'SIEM' },
            { id: 'soc', label: 'SOC' },
            { id: 'vpn', label: 'VPN監視' },
            { id: 'edr', label: 'EDR' },
            { id: 'ot', label: 'OT監視' },
            { id: 'incident', label: 'インシデント' },
            { id: 'audit', label: '監査レポート' },
          ]}
          activeTab={activeTab} onTabChange={setActiveTab}>

          {/* SIEM */}
          <div style={{ padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>SIEM — 脅威検知イベント</div>
            <div style={{ borderRadius: 8, border: '1px solid var(--border)', overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr 130px 100px 60px 80px', gap: 12, padding: '10px 16px', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>
                <span>時刻</span><span>種別</span><span>送信元</span><span>対象</span><span>深刻度</span><span>状態</span>
              </div>
              {[
                { time: '09:12', type: 'ブルートフォース', source: '203.0.113.55', target: 'auth-service', sev: 'high', status: 'ブロック済' },
                { time: '08:45', type: 'ポートスキャン', source: '198.51.100.77', target: 'gateway', sev: 'medium', status: '監視中' },
                { time: '07:30', type: '不正API呼出', source: '10.0.5.44', target: 'api-gateway', sev: 'low', status: '調査中' },
                { time: '06:15', type: 'マルウェア検知', source: 'PC-FIELD-023', target: 'endpoint', sev: 'high', status: '隔離済' },
                { time: '昨日', type: 'VPN異常接続', source: '172.16.99.1', target: 'vpn-gw', sev: 'medium', status: '解決済' },
              ].map((t,i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '70px 1fr 130px 100px 60px 80px', gap: 12, padding: '12px 16px', alignItems: 'center', borderBottom: '1px solid var(--border-light)', fontSize: 12 }}>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'var(--text-muted)' }}>{t.time}</span>
                  <span style={{ fontWeight: 500, color: 'var(--text)' }}>{t.type}</span>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'var(--text-muted)' }}>{t.source}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{t.target}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: ({high:'#fef2f2',medium:'#fff7ed',low:'#fefce8'})[t.sev], color: ({high:'#dc2626',medium:'#f97316',low:'#eab308'})[t.sev], textTransform: 'uppercase' }}>{t.sev}</span>
                  <span style={{ fontSize: 11, color: t.status==='ブロック済'||t.status==='解決済'?'#16a34a':'#f97316', fontWeight: 500 }}>{t.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* SOC */}
          <div style={{ padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>SOC — セキュリティオペレーションセンター</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 16 }}>
              {[{l:'監視対象',v:'248',s:'ノード',c:'#1a56db'},{l:'アラート(24h)',v:'12',s:'件',c:'#f97316'},{l:'対応完了率',v:'96%',s:'SLA達成',c:'#16a34a'}].map((s,i) => (
                <div key={i} style={{ padding: 14, borderRadius: 8, background: 'var(--bg-subtle)', border: '1px solid var(--border)', textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: s.c }}>{s.v}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.l} · {s.s}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: 16, borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>脅威検知推移 (24時間)</div>
              <svg width="100%" height="120" viewBox="0 0 600 120" preserveAspectRatio="none">
                {[0,1,2,3].map(i => <line key={i} x1="0" y1={i*35+10} x2="600" y2={i*35+10} stroke="var(--border-light)" strokeWidth="1" />)}
                <path d="M0,90 L25,85 L50,92 L75,70 L100,75 L125,80 L150,50 L175,45 L200,55 L225,60 L250,65 L275,40 L300,35 L325,50 L350,45 L375,60 L400,65 L425,70 L450,55 L475,50 L500,60 L525,65 L550,70 L575,75 L600,65" fill="none" stroke="#dc2626" strokeWidth="2" />
                <path d="M0,90 L25,85 L50,92 L75,70 L100,75 L125,80 L150,50 L175,45 L200,55 L225,60 L250,65 L275,40 L300,35 L325,50 L350,45 L375,60 L400,65 L425,70 L450,55 L475,50 L500,60 L525,65 L550,70 L575,75 L600,65 L600,120 L0,120 Z" fill="#dc262610" />
              </svg>
            </div>
          </div>

          {/* VPN監視 */}
          <div style={{ padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>VPNアクティブセッション</div>
            <div style={{ borderRadius: 8, border: '1px solid var(--border)', overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 120px 90px 80px 60px', gap: 12, padding: '10px 16px', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>
                <span>ユーザー</span><span>場所</span><span>IP</span><span>プロトコル</span><span>接続時間</span><span>状態</span>
              </div>
              {[
                { user: '田中 健一', location: '品川現場', ip: '10.0.1.45', protocol: 'WireGuard', duration: '2h 15m', active: true },
                { user: '佐藤 太郎', location: '横浜現場', ip: '10.0.1.88', protocol: 'WireGuard', duration: '1h 42m', active: true },
                { user: '山田 花子', location: '本社', ip: '10.0.2.12', protocol: 'IPsec', duration: '3h 05m', active: true },
                { user: '鈴木 一郎', location: '自宅', ip: '10.0.3.99', protocol: 'WireGuard', duration: '45m', active: false },
              ].map((v,i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 120px 90px 80px 60px', gap: 12, padding: '12px 16px', alignItems: 'center', borderBottom: '1px solid var(--border-light)', fontSize: 12 }}>
                  <span style={{ fontWeight: 500, color: 'var(--text)' }}>{v.user}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{v.location}</span>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'var(--text-muted)' }}>{v.ip}</span>
                  <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'var(--bg-subtle)', color: 'var(--text-secondary)', fontWeight: 500 }}>{v.protocol}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{v.duration}</span>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: v.active?'#16a34a':'#f97316' }}></span>
                </div>
              ))}
            </div>
          </div>

          {/* EDR */}
          <div style={{ padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>EDR — エンドポイント検知と応答</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 16 }}>
              {[{l:'管理端末',v:'842',c:'#1a56db'},{l:'保護済み',v:'829',c:'#16a34a'},{l:'要確認',v:'8',c:'#f97316'},{l:'隔離中',v:'5',c:'#dc2626'}].map((s,i) => (
                <div key={i} style={{ padding: 14, borderRadius: 8, background: 'var(--bg-subtle)', border: '1px solid var(--border)', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: s.c }}>{s.v}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.l}</div>
                </div>
              ))}
            </div>
            {[
              { name: 'PC-FIELD-023', user: '中村 太郎', status: '隔離中', threat: 'Trojan.Gen.2', detected: '06:15' },
              { name: 'PC-OFFICE-045', user: '伊藤 裕子', status: '要確認', threat: 'Suspicious DLL Load', detected: '昨日 18:00' },
              { name: 'PC-FIELD-089', user: '木村 大輔', status: 'スキャン中', threat: 'PUP.Optional', detected: '昨日 15:30' },
            ].map((e,i) => (
              <div key={i} style={{ padding: 12, borderRadius: 8, border: '1px solid var(--border)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                <Icon name="shield" size={18} style={{ color: e.status==='隔離中'?'#dc2626':'#f97316' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{e.name} <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)' }}>({e.user})</span></div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{e.threat}</div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: e.status==='隔離中'?'#fef2f2':'#fff7ed', color: e.status==='隔離中'?'#991b1b':'#92400e' }}>{e.status}</span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{e.detected}</span>
              </div>
            ))}
          </div>

          {/* OT監視 */}
          <div style={{ padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>OTネットワーク監視</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 16 }}>
              {[{l:'OTデバイス',v:'86',c:'#1a56db'},{l:'PLC/SCADA',v:'12',c:'#7c3aed'},{l:'セグメント',v:'4',c:'#16a34a'}].map((s,i) => (
                <div key={i} style={{ padding: 14, borderRadius: 8, background: 'var(--bg-subtle)', border: '1px solid var(--border)', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: s.c }}>{s.v}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.l}</div>
                </div>
              ))}
            </div>
            {[
              { segment: 'IoTセンサーネットワーク', devices: 58, traffic: '正常', anomaly: 0 },
              { segment: '重機制御ネットワーク', devices: 12, traffic: '正常', anomaly: 0 },
              { segment: 'ビル管理システム (BAS)', devices: 8, traffic: '正常', anomaly: 0 },
              { segment: 'SCADA/PLC制御', devices: 8, traffic: '注意', anomaly: 2 },
            ].map((s,i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 8, marginBottom: 6, background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
                <Icon name="signal" size={16} style={{ color: s.anomaly>0?'#f97316':'#16a34a' }} />
                <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{s.segment}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.devices}台</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: s.traffic==='正常'?'#16a34a':'#f97316' }}>{s.traffic}</span>
                {s.anomaly>0 && <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: '#fff7ed', color: '#92400e' }}>異常{s.anomaly}</span>}
              </div>
            ))}
          </div>

          {/* インシデント */}
          <div style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>インシデント管理</span>
              <button style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: '#dc2626', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="plus" size={12} />登録</button>
            </div>
            {[
              { id: 'INC-042', title: 'フィッシングメール検知', sev: 'medium', status: '対応中', assignee: '高橋', date: '2026/05/24' },
              { id: 'INC-041', title: 'マルウェア感染（PC-FIELD-023）', sev: 'high', status: '隔離済', assignee: '高橋', date: '2026/05/24' },
              { id: 'INC-040', title: 'パスワード漏洩疑い', sev: 'high', status: '解決済', assignee: '渡辺', date: '2026/05/23' },
              { id: 'INC-039', title: 'OTネットワーク異常通信', sev: 'medium', status: '解決済', assignee: '渡辺', date: '2026/05/22' },
            ].map((inc,i) => (
              <div key={i} style={{ padding: 14, borderRadius: 8, border: '1px solid var(--border)', marginBottom: 8, cursor: 'pointer' }}
                onMouseEnter={e=>e.currentTarget.style.borderColor='#93c5fd'} onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'var(--text-muted)' }}>{inc.id}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: inc.sev==='high'?'#fef2f2':'#fff7ed', color: inc.sev==='high'?'#dc2626':'#f97316', textTransform: 'uppercase' }}>{inc.sev}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: inc.status==='解決済'?'#dcfce7':inc.status==='隔離済'?'#fef2f2':'#fff7ed', color: inc.status==='解決済'?'#166534':inc.status==='隔離済'?'#991b1b':'#92400e' }}>{inc.status}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-muted)' }}>{inc.date}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{inc.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>担当: {inc.assignee}</div>
              </div>
            ))}
          </div>

          {/* 監査レポート */}
          <div style={{ padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>監査ログ</div>
            <div style={{ borderRadius: 8, border: '1px solid var(--border)', overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr 1fr 1fr 80px', gap: 12, padding: '10px 16px', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>
                <span>時刻</span><span>ユーザー</span><span>操作</span><span>リソース</span><span>結果</span>
              </div>
              {[
                { time: '09:15', user: '田中 健一', action: 'ログイン', resource: 'Web App', result: '成功' },
                { time: '09:12', user: 'unknown', action: 'ログイン試行x5', resource: 'Auth API', result: '失敗' },
                { time: '09:10', user: '佐藤 太郎', action: '文書ダウンロード', resource: '構造図_7F.pdf', result: '成功' },
                { time: '09:05', user: '高橋 美咲', action: '権限変更', resource: 'User: 中村', result: '成功' },
                { time: '08:58', user: '山田 花子', action: 'API Key生成', resource: 'IoT Gateway', result: '成功' },
                { time: '08:50', user: 'システム', action: 'バックアップ完了', resource: 'PostgreSQL', result: '成功' },
              ].map((l,i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '70px 1fr 1fr 1fr 80px', gap: 12, padding: '12px 16px', alignItems: 'center', borderBottom: '1px solid var(--border-light)', fontSize: 12 }}>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: 'var(--text-muted)' }}>{l.time}</span>
                  <span style={{ fontWeight: 500, color: 'var(--text)' }}>{l.user}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{l.action}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{l.resource}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: l.result==='成功'?'#16a34a':'#dc2626' }}>{l.result}</span>
                </div>
              ))}
            </div>
          </div>
        </SlideTabPanel>
      </div>
    </div>
  );
}

window.SecurityPage = SecurityPage;
