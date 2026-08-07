/* ========================================
   Construction Enterprise OS — 現場DX Sub-views
   Photos, Safety, KY, Equipment, Workers, Live, Measure, Schedule, Daily
   Split from page-field-dx.jsx for sub-path routing
   ======================================== */

function FieldSubPage({ subPath }) {
  const cs = { background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' };
  const header = (title, desc) => (
    <div style={{ marginBottom: 20 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0 }}>{title}</h1>
      <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{desc}</p>
    </div>
  );

  /* ---- 工程管理 ---- */
  if (subPath === '/field/schedule') {
    const ganttItems = [
      { name: '基礎工事', start: 0, end: 20, progress: 100, color: '#16a34a' },
      { name: '躯体工事（1-3F）', start: 15, end: 35, progress: 100, color: '#16a34a' },
      { name: '躯体工事（4-7F）', start: 30, end: 55, progress: 75, color: '#1a56db' },
      { name: '躯体工事（8-12F）', start: 50, end: 75, progress: 10, color: '#f97316' },
      { name: '外装工事', start: 45, end: 80, progress: 5, color: '#f97316' },
      { name: '設備工事（電気）', start: 40, end: 85, progress: 15, color: '#7c3aed' },
      { name: '設備工事（機械）', start: 45, end: 85, progress: 10, color: '#7c3aed' },
      { name: '内装工事', start: 60, end: 90, progress: 0, color: '#94a3b8' },
      { name: '外構工事', start: 80, end: 95, progress: 0, color: '#94a3b8' },
      { name: '検査・引渡し', start: 90, end: 100, progress: 0, color: '#94a3b8' },
    ];
    return (
      <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
        {header('工程管理', 'ガントチャート・マイルストーン管理')}
        <div style={cs}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>品川タワー新築工事 — 全体工程表</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {['日','週','月'].map(u => <button key={u} style={{ padding: '3px 10px', borderRadius: 4, border: 'none', background: u==='月'?'#1a56db':'#f1f5f9', color: u==='月'?'#fff':'#64748b', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>{u}</button>)}
            </div>
          </div>
          <div style={{ padding: 16, overflowX: 'auto' }}>
            {/* Month headers */}
            <div style={{ display: 'flex', marginLeft: 160, marginBottom: 8 }}>
              {['4月','5月','6月','7月','8月','9月','10月','11月','12月','1月','2月','3月'].map((m,i) => (
                <div key={i} style={{ width: 60, fontSize: 10, color: '#94a3b8', textAlign: 'center', borderLeft: '1px solid #f1f5f9' }}>{m}</div>
              ))}
            </div>
            {ganttItems.map((g,i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ width: 160, fontSize: 12, color: '#374151', fontWeight: 500, flexShrink: 0, paddingRight: 12 }}>{g.name}</div>
                <div style={{ flex: 1, height: 20, position: 'relative', background: '#f8fafc', borderRadius: 4 }}>
                  <div style={{
                    position: 'absolute', left: `${g.start}%`, width: `${g.end - g.start}%`,
                    height: '100%', borderRadius: 4, background: g.color + '25', border: `1px solid ${g.color}40`,
                  }}>
                    <div style={{ height: '100%', width: `${g.progress}%`, background: g.color, borderRadius: 3, transition: 'width 0.5s' }}></div>
                  </div>
                  {/* Today marker */}
                  {i === 0 && <div style={{ position: 'absolute', left: '58%', top: -4, bottom: -4, width: 2, background: '#dc2626', zIndex: 2 }}><div style={{ position: 'absolute', top: -6, left: -8, fontSize: 8, color: '#dc2626', fontWeight: 700 }}>今日</div></div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ---- 現場写真 ---- */
  if (subPath === '/field/photos') {
    const photos = [
      { name: '7F鉄骨建方_正面', date: '2026/05/24 09:15', tags: ['躯体','鉄骨','7F'], author: '田中' },
      { name: 'コンクリート打設_5F', date: '2026/05/24 10:30', tags: ['躯体','コンクリ','5F'], author: '佐藤' },
      { name: '配筋検査_6F_全景', date: '2026/05/23 14:00', tags: ['検査','配筋','6F'], author: '山田' },
      { name: '足場設置状況_西面', date: '2026/05/23 11:20', tags: ['安全','足場'], author: '鈴木' },
      { name: '資材搬入_鉄骨', date: '2026/05/22 08:45', tags: ['資材','鉄骨'], author: '田中' },
      { name: 'クレーン作業_全景', date: '2026/05/22 09:30', tags: ['重機','クレーン'], author: '渡辺' },
      { name: '安全パトロール_指摘箇所', date: '2026/05/21 15:00', tags: ['安全','パトロール'], author: '佐藤' },
      { name: '出来形測定_柱', date: '2026/05/21 13:30', tags: ['出来形','柱','6F'], author: '山田' },
    ];
    return (
      <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
        {header('現場写真', '工事写真の撮影・管理・AI分類')}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#1a56db', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="camera" size={14} />写真アップロード
          </button>
          <button style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, color: '#374151' }}>
            <Icon name="filter" size={14} />フィルタ
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
          {photos.map((p,i) => (
            <div key={i} style={{ ...cs, padding: 0, overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow='none'}>
              <div style={{ height: 140, background: `hsl(${(i*47)%360}, 15%, ${85+i%3}%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="camera" size={32} style={{ color: '#94a3b8' }} />
              </div>
              <div style={{ padding: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{p.name}</div>
                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>{p.date} · {p.author}</div>
                <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                  {p.tags.map(t => <span key={t} style={{ fontSize: 9, padding: '1px 6px', borderRadius: 4, background: '#eff6ff', color: '#1a56db', fontWeight: 500 }}>{t}</span>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ---- 出来形管理 ---- */
  if (subPath === '/field/measure') {
    const measurements = [
      { item: '柱 C1（6F）', design: '600×600', actual: '601×599', diff: '+1/-1', result: '合格' },
      { item: '梁 G1（6F）', design: '400×800', actual: '399×801', diff: '-1/+1', result: '合格' },
      { item: 'スラブ厚（5F）', design: '200mm', actual: '202mm', diff: '+2', result: '合格' },
      { item: '壁厚（5F）', design: '180mm', actual: '179mm', diff: '-1', result: '合格' },
      { item: '鉄骨柱傾き', design: '1/1000以下', actual: '1/1500', diff: '—', result: '合格' },
      { item: 'アンカーボルト位置', design: '±5mm', actual: '+3mm', diff: '+3', result: '合格' },
    ];
    return (
      <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
        {header('出来形管理', '設計値と実測値の照合・品質管理')}
        <div style={cs}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>出来形測定結果 — 品川タワー</span>
            <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 10, background: '#dcfce7', color: '#166534', fontWeight: 600 }}>全項目合格</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 100px 100px 80px 70px', gap: 12, padding: '10px 16px', borderBottom: '1px solid #e2e8f0', fontSize: 11, fontWeight: 600, color: '#94a3b8' }}>
            <span>測定項目</span><span>設計値</span><span>実測値</span><span>差分</span><span>判定</span>
          </div>
          {measurements.map((m,i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.5fr 100px 100px 80px 70px', gap: 12, padding: '12px 16px', alignItems: 'center', borderBottom: i<measurements.length-1?'1px solid #f1f5f9':'none', fontSize: 12 }}>
              <span style={{ fontWeight: 500, color: '#0f172a' }}>{m.item}</span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: '#64748b' }}>{m.design}</span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: '#0f172a', fontWeight: 500 }}>{m.actual}</span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: '#64748b' }}>{m.diff}</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: '#16a34a', background: '#dcfce7', padding: '2px 8px', borderRadius: 10, textAlign: 'center' }}>{m.result}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ---- 安全管理 ---- */
  if (subPath === '/field/safety') {
    const patrols = [
      { date: '2026/05/24', inspector: '佐藤 太郎', site: '品川タワー', findings: 2, critical: 0, status: '完了' },
      { date: '2026/05/23', inspector: '佐藤 太郎', site: '横浜マンション', findings: 3, critical: 1, status: '是正中' },
      { date: '2026/05/22', inspector: '鈴木 一郎', site: '川崎物流', findings: 1, critical: 0, status: '完了' },
      { date: '2026/05/21', inspector: '佐藤 太郎', site: '新宿再開発', findings: 0, critical: 0, status: '完了' },
    ];
    return (
      <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
        {header('安全管理', '安全パトロール・ヒヤリハット・是正管理')}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
          {[
            { label: '本月パトロール', value: '18', icon: 'shield', color: '#1a56db', bg: '#eff6ff' },
            { label: '指摘件数', value: '12', icon: 'alert-triangle', color: '#f97316', bg: '#fff7ed' },
            { label: '是正完了', value: '10', icon: 'check-circle', color: '#16a34a', bg: '#f0fdf4' },
            { label: '重大指摘', value: '1', icon: 'x', color: '#dc2626', bg: '#fef2f2' },
          ].map((s,i) => (
            <div key={i} style={{ ...cs, padding: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={s.icon} size={16} style={{ color: s.color }} />
              </div>
              <div><div style={{ fontSize: 10, color: '#94a3b8' }}>{s.label}</div><div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{s.value}</div></div>
            </div>
          ))}
        </div>
        <div style={cs}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>安全パトロール記録</div>
          <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 1fr 80px 70px 70px', gap: 12, padding: '10px 16px', borderBottom: '1px solid #e2e8f0', fontSize: 11, fontWeight: 600, color: '#94a3b8' }}>
            <span>日付</span><span>点検者</span><span>現場</span><span>指摘</span><span>重大</span><span>状態</span>
          </div>
          {patrols.map((p,i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 1fr 80px 70px 70px', gap: 12, padding: '12px 16px', alignItems: 'center', borderBottom: i<patrols.length-1?'1px solid #f1f5f9':'none', fontSize: 12 }}>
              <span style={{ color: '#64748b', fontSize: 11 }}>{p.date}</span>
              <span style={{ fontWeight: 500, color: '#0f172a' }}>{p.inspector}</span>
              <span style={{ color: '#64748b' }}>{p.site}</span>
              <span style={{ fontWeight: 600, color: p.findings>0?'#f97316':'#16a34a' }}>{p.findings}件</span>
              <span style={{ fontWeight: 600, color: p.critical>0?'#dc2626':'#16a34a' }}>{p.critical}件</span>
              <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: p.status==='完了'?'#dcfce7':'#fff7ed', color: p.status==='完了'?'#166534':'#92400e' }}>{p.status}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ---- KY活動 ---- */
  if (subPath === '/field/ky') {
    const kyRecords = [
      { date: '2026/05/24', team: '鉄骨建方班', hazard: '高所作業・クレーン吊り荷', measures: '安全帯装着確認・合図者配置', participants: 8 },
      { date: '2026/05/24', team: 'コンクリ班', hazard: 'コンクリート打設・ポンプ車', measures: '打設範囲立入禁止・保護具着用', participants: 12 },
      { date: '2026/05/24', team: '配筋班', hazard: '重量物運搬・鉄筋切断', measures: '保護手袋着用・2人作業', participants: 6 },
      { date: '2026/05/24', team: '足場班', hazard: '足場組立・落下防止', measures: '親綱設置・安全帯使用', participants: 5 },
    ];
    return (
      <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
        {header('KY活動', '危険予知活動の記録・管理')}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {kyRecords.map((k,i) => (
            <div key={i} style={{ ...cs, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="shield" size={16} style={{ color: '#f97316' }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{k.team}</span>
                </div>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>{k.date} · {k.participants}名参加</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ padding: 12, borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca' }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#dc2626', marginBottom: 4 }}>危険要因</div>
                  <div style={{ fontSize: 12, color: '#374151' }}>{k.hazard}</div>
                </div>
                <div style={{ padding: 12, borderRadius: 8, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#16a34a', marginBottom: 4 }}>対策</div>
                  <div style={{ fontSize: 12, color: '#374151' }}>{k.measures}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ---- 重機管理 ---- */
  if (subPath === '/field/equipment') {
    const equipment = [
      { name: 'タワークレーン TC-1200', site: '品川タワー', status: '稼働中', hours: '1,842h', nextInsp: '2026/06/15', operator: '吉田' },
      { name: 'ラフタークレーン 25t', site: '品川タワー', status: '稼働中', hours: '956h', nextInsp: '2026/07/01', operator: '木村' },
      { name: 'コンクリートポンプ車', site: '品川タワー', status: '稼働中', hours: '678h', nextInsp: '2026/06/20', operator: '松田' },
      { name: 'バックホウ 0.7m³', site: '大田区土木', status: '待機', hours: '2,340h', nextInsp: '2026/06/01', operator: '—' },
      { name: 'ブルドーザ D61', site: '大田区土木', status: 'AI自動運転', hours: '1,120h', nextInsp: '2026/06/10', operator: 'AI制御' },
      { name: '振動ローラ BW213', site: '大田区土木', status: '待機', hours: '890h', nextInsp: '2026/07/15', operator: '—' },
      { name: 'ラフタークレーン 50t', site: '川崎物流', status: '稼働中', hours: '1,560h', nextInsp: '2026/06/05', operator: '高橋' },
      { name: 'フォークリフト 3t', site: '川崎物流', status: '稼働中', hours: '420h', nextInsp: '2026/08/01', operator: '中村' },
    ];
    const stColor = { '稼働中': '#16a34a', '待機': '#94a3b8', 'AI自動運転': '#7c3aed' };
    return (
      <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
        {header('重機管理', '重機稼働状況・点検スケジュール・GPS位置')}
        <div style={cs}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 90px 80px 100px 70px', gap: 12, padding: '10px 16px', borderBottom: '1px solid #e2e8f0', fontSize: 11, fontWeight: 600, color: '#94a3b8' }}>
            <span>重機名</span><span>現場</span><span>状態</span><span>稼働時間</span><span>次回点検</span><span>操縦者</span>
          </div>
          {equipment.map((e,i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 90px 80px 100px 70px', gap: 12, padding: '12px 16px', alignItems: 'center', borderBottom: i<equipment.length-1?'1px solid #f1f5f9':'none', fontSize: 12 }}>
              <span style={{ fontWeight: 500, color: '#0f172a' }}>{e.name}</span>
              <span style={{ color: '#64748b' }}>{e.site}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: stColor[e.status]||'#64748b', fontWeight: 500 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: stColor[e.status]||'#64748b' }}></span>{e.status}
              </span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: '#374151' }}>{e.hours}</span>
              <span style={{ fontSize: 11, color: '#64748b' }}>{e.nextInsp}</span>
              <span style={{ color: '#64748b' }}>{e.operator}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ---- 作業員管理 ---- */
  if (subPath === '/field/workers') {
    const workers = [
      { name: '中村 太郎', company: '(株)中村建設', trade: '鉄骨工', site: '品川タワー', entry: '07:45', status: '作業中', cert: ['玉掛け','鉄骨組立'] },
      { name: '佐々木 健', company: '(株)佐々木電気', trade: '電気工', site: '品川タワー', entry: '07:50', status: '作業中', cert: ['電気工事士'] },
      { name: '山本 一郎', company: '山本配管工業', trade: '配管工', site: '横浜マンション', entry: '07:55', status: '作業中', cert: ['配管技能'] },
      { name: '木村 大輔', company: '関東足場(株)', trade: '足場工', site: '品川タワー', entry: '08:10', status: '作業中', cert: ['足場組立','高所作業'] },
      { name: '松田 誠', company: '(株)中村建設', trade: '型枠工', site: '横浜マンション', entry: '08:00', status: '休憩中', cert: ['型枠施工'] },
      { name: '高橋 隆', company: '(株)東京クレーン', trade: 'オペレーター', site: '川崎物流', entry: '07:30', status: '作業中', cert: ['移動式クレーン'] },
    ];
    return (
      <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
        {header('作業員管理', '入退場・資格・配置の統合管理')}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
          {[
            { label: '本日入場者', value: '186', icon: 'users', color: '#1a56db', bg: '#eff6ff' },
            { label: '作業中', value: '158', icon: 'activity', color: '#16a34a', bg: '#f0fdf4' },
            { label: '資格切れ注意', value: '3', icon: 'alert-triangle', color: '#f97316', bg: '#fff7ed' },
          ].map((s,i) => (
            <div key={i} style={{ ...cs, padding: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={s.icon} size={16} style={{ color: s.color }} />
              </div>
              <div><div style={{ fontSize: 10, color: '#94a3b8' }}>{s.label}</div><div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{s.value}</div></div>
            </div>
          ))}
        </div>
        <div style={cs}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 1fr 60px 70px 1.2fr', gap: 8, padding: '10px 16px', borderBottom: '1px solid #e2e8f0', fontSize: 11, fontWeight: 600, color: '#94a3b8' }}>
            <span>氏名</span><span>会社</span><span>職種</span><span>現場</span><span>入場</span><span>状態</span><span>保有資格</span>
          </div>
          {workers.map((w,i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 1fr 60px 70px 1.2fr', gap: 8, padding: '10px 16px', alignItems: 'center', borderBottom: i<workers.length-1?'1px solid #f1f5f9':'none', fontSize: 12 }}>
              <span style={{ fontWeight: 500, color: '#0f172a' }}>{w.name}</span>
              <span style={{ color: '#64748b', fontSize: 11 }}>{w.company}</span>
              <span style={{ color: '#64748b' }}>{w.trade}</span>
              <span style={{ color: '#64748b', fontSize: 11 }}>{w.site}</span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: '#64748b' }}>{w.entry}</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: w.status==='作業中'?'#16a34a':'#f97316' }}>{w.status}</span>
              <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                {w.cert.map(c => <span key={c} style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, background: '#eff6ff', color: '#1a56db' }}>{c}</span>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ---- 作業日報 ---- */
  if (subPath === '/field/daily') {
    const reports = [
      { date: '2026/05/24', site: '品川タワー', author: '田中 健一', workers: 45, weather: '晴れ', status: '作成中', tasks: '7F鉄骨建方、5Fコンクリート打設、6F配筋検査' },
      { date: '2026/05/23', site: '品川タワー', author: '田中 健一', workers: 42, weather: '曇り', status: '承認済', tasks: '6F鉄骨建方完了、5F型枠、安全パトロール' },
      { date: '2026/05/22', site: '品川タワー', author: '田中 健一', workers: 44, weather: '晴れ', status: '承認済', tasks: '6F鉄骨建方、4F内装準備、資材搬入' },
      { date: '2026/05/24', site: '横浜マンション', author: '渡辺 誠', workers: 32, weather: '曇り', status: '承認待ち', tasks: '3F型枠組立、2F配筋、足場点検' },
    ];
    return (
      <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
        {header('作業日報', '日報の作成・確認・承認')}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#1a56db', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="plus" size={14} />本日の日報を作成
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {reports.map((r,i) => (
            <div key={i} style={{ ...cs, padding: 16, cursor: 'pointer', transition: 'border-color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor='#93c5fd'}
              onMouseLeave={e => e.currentTarget.style.borderColor='#e2e8f0'}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{r.site}</span>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>{r.date}</span>
                </div>
                <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: r.status==='承認済'?'#dcfce7':r.status==='承認待ち'?'#fff7ed':'#dbeafe', color: r.status==='承認済'?'#166534':r.status==='承認待ち'?'#92400e':'#1e40af' }}>{r.status}</span>
              </div>
              <div style={{ fontSize: 12, color: '#475569', marginBottom: 6 }}>{r.tasks}</div>
              <div style={{ display: 'flex', gap: 12, fontSize: 10, color: '#94a3b8' }}>
                <span>記入者: {r.author}</span><span>作業員: {r.workers}名</span><span>天候: {r.weather}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ---- 現場ライブビュー ---- */
  if (subPath === '/field/live') {
    const cameras = [
      { name: '品川タワー 全景カメラ', location: '北東角 40m', status: 'live', fps: 30 },
      { name: '品川タワー 7F作業エリア', location: '7F南面', status: 'live', fps: 15 },
      { name: '横浜マンション 全景', location: '南側 30m', status: 'live', fps: 30 },
      { name: '川崎物流 ヤード', location: '管理棟屋上', status: 'offline', fps: 0 },
    ];
    return (
      <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
        {header('現場ライブビュー', 'リアルタイム映像・タイムラプス')}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
          {cameras.map((c,i) => (
            <div key={i} style={{ ...cs, padding: 0, overflow: 'hidden' }}>
              <div style={{ height: 220, background: c.status==='live'?'#0f172a':'#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                {c.status==='live' ? (
                  <React.Fragment>
                    <Icon name="eye" size={40} style={{ color: '#334155' }} />
                    <span style={{ position: 'absolute', top: 10, left: 10, fontSize: 10, padding: '2px 8px', borderRadius: 4, background: '#dc2626', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', animation: 'pulse 2s infinite' }}></span>LIVE
                    </span>
                    <span style={{ position: 'absolute', bottom: 10, right: 10, fontSize: 9, color: '#64748b' }}>{c.fps}fps</span>
                  </React.Fragment>
                ) : (
                  <span style={{ fontSize: 12, color: '#64748b' }}>オフライン</span>
                )}
              </div>
              <div style={{ padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{c.name}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{c.location}</div>
                </div>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.status==='live'?'#16a34a':'#94a3b8' }}></span>
              </div>
            </div>
          ))}
        </div>
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
      </div>
    );
  }

  /* ---- 現場進捗 (default for /field/progress) ---- */
  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      {header('現場進捗', '全工事の進捗状況一覧')}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[
          { name: '品川タワー新築工事', client: '品川都市開発(株)', progress: 68, status: '施工中', workers: 45, phase: '躯体工事' },
          { name: '横浜分譲マンション', client: '横浜住宅(株)', progress: 42, status: '施工中', workers: 32, phase: '躯体工事' },
          { name: '大田区土木工事', client: '大田区', progress: 85, status: '仕上げ', workers: 18, phase: '舗装工事' },
          { name: '新宿再開発ビル', client: '新宿都市開発(株)', progress: 23, status: '基礎', workers: 28, phase: '基礎工事' },
          { name: '川崎物流センター', client: '川崎ロジ(株)', progress: 55, status: '躯体', workers: 38, phase: '鉄骨建方' },
          { name: '千葉港湾整備', client: '千葉県', progress: 35, status: '施工中', workers: 22, phase: 'ケーソン据付' },
          { name: '埼玉道路改修', client: '埼玉県', progress: 60, status: '施工中', workers: 15, phase: '切削オーバーレイ' },
        ].map((p,i) => (
          <div key={i} style={{ ...cs, padding: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{p.name}</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{p.client} · {p.phase} · {p.workers}名</div>
            </div>
            <div style={{ width: 200 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                <span style={{ color: '#94a3b8' }}>{p.status}</span>
                <span style={{ fontWeight: 600, color: '#1a56db' }}>{p.progress}%</span>
              </div>
              <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${p.progress}%`, borderRadius: 3, background: p.progress>70?'#16a34a':'#1a56db' }}></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

window.FieldSubPage = FieldSubPage;
