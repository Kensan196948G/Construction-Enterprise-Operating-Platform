/* ========================================
   Construction Enterprise OS — IoT Sub-views
   Weather, Wave, Water, Gateway, Edge AI, Alerts, Realtime
   ======================================== */

function IoTMonitorPage({ subPath }) {
  const cs = { background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' };
  const header = (title, desc) => (
    <div style={{ marginBottom: 20 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0 }}>{title}</h1>
      <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{desc}</p>
    </div>
  );

  /* ---- 気象情報 ---- */
  if (subPath === '/iot/weather') {
    return (
      <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
        {header('気象情報', '全現場の気象データ・予報・警報')}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
          {[
            { label: '気温', value: '32°C', sub: '最高34°C予想', icon: 'thermometer', color: '#dc2626', bg: '#fef2f2' },
            { label: '風速', value: '8.5m/s', sub: '15時 12m/s予報', icon: 'wind', color: '#f97316', bg: '#fff7ed' },
            { label: '降水確率', value: '10%', sub: '午後から曇り', icon: 'cloud', color: '#1a56db', bg: '#eff6ff' },
            { label: 'WBGT', value: '28°C', sub: '厳重警戒', icon: 'alert-triangle', color: '#dc2626', bg: '#fef2f2' },
          ].map((s,i) => (
            <div key={i} style={{ ...cs, padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                <Icon name={s.icon} size={24} style={{ color: s.color }} />
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#0f172a' }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{s.label}</div>
              <div style={{ fontSize: 10, color: s.color, marginTop: 4, fontWeight: 500 }}>{s.sub}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={cs}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>時間帯別予報</div>
            <div style={{ padding: 16 }}>
              {['06:00','09:00','12:00','15:00','18:00','21:00'].map((t,i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '8px 0', borderBottom: i<5?'1px solid #f1f5f9':'none' }}>
                  <span style={{ fontSize: 12, color: '#64748b', width: 50, fontFamily: "'JetBrains Mono',monospace" }}>{t}</span>
                  <Icon name={i<3?'sun':'cloud'} size={18} style={{ color: i<3?'#eab308':'#94a3b8' }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', width: 50 }}>{[24,28,32,30,26,22][i]}°C</span>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Icon name="wind" size={12} style={{ color: '#94a3b8' }} />
                    <span style={{ fontSize: 11, color: '#64748b' }}>{[3,5,7,12,8,4][i]}m/s</span>
                  </div>
                  <span style={{ fontSize: 11, color: '#64748b' }}>{[0,0,0,20,10,0][i]}%</span>
                </div>
              ))}
            </div>
          </div>
          <div style={cs}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>現場別気象</div>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { site: '品川タワー', temp: '32°C', wind: '8.5m/s', alert: true },
                { site: '横浜マンション', temp: '30°C', wind: '5.2m/s', alert: false },
                { site: '大田区土木', temp: '31°C', wind: '4.8m/s', alert: false },
                { site: '川崎物流', temp: '32°C', wind: '7.1m/s', alert: true },
                { site: '千葉港湾', temp: '29°C', wind: '9.2m/s', alert: true },
              ].map((s,i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, background: s.alert?'#fff7ed':'#f8fafc' }}>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{s.site}</span>
                  <span style={{ fontSize: 12, color: '#374151' }}>{s.temp}</span>
                  <span style={{ fontSize: 12, color: s.alert?'#f97316':'#64748b', fontWeight: s.alert?600:400 }}>{s.wind}</span>
                  {s.alert && <Icon name="alert-triangle" size={14} style={{ color: '#f97316' }} />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---- 波浪監視 ---- */
  if (subPath === '/iot/wave') {
    return (
      <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
        {header('波浪監視', '港湾・海域の波浪リアルタイムデータ')}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
          {[
            { label: '有義波高', value: '1.2m', sub: '千葉港湾A地点', icon: 'activity', color: '#1a56db', bg: '#eff6ff' },
            { label: '周期', value: '6.5s', sub: '安定', icon: 'clock', color: '#16a34a', bg: '#f0fdf4' },
            { label: '作業可否', value: '可', sub: '基準2.0m以下', icon: 'check-circle', color: '#16a34a', bg: '#f0fdf4' },
          ].map((s,i) => (
            <div key={i} style={{ ...cs, padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={s.icon} size={20} style={{ color: s.color }} />
              </div>
              <div><div style={{ fontSize: 22, fontWeight: 700, color: '#0f172a' }}>{s.value}</div><div style={{ fontSize: 11, color: '#94a3b8' }}>{s.label} · {s.sub}</div></div>
            </div>
          ))}
        </div>
        <div style={cs}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>波高推移 (24時間)</div>
          <div style={{ padding: 20 }}>
            <svg width="100%" height="180" viewBox="0 0 600 180" preserveAspectRatio="none">
              {[0,1,2,3].map(i => <line key={i} x1="0" y1={i*50+15} x2="600" y2={i*50+15} stroke="#f1f5f9" strokeWidth="1" />)}
              <path d="M0,120 Q30,110 60,125 Q90,140 120,115 Q150,90 180,105 Q210,120 240,100 Q270,80 300,95 Q330,110 360,90 Q390,70 420,85 Q450,100 480,80 Q510,60 540,75 Q570,90 600,70" fill="none" stroke="#1a56db" strokeWidth="2" />
              <line x1="0" y1="35" x2="600" y2="35" stroke="#dc2626" strokeWidth="1" strokeDasharray="4,4" />
              <text x="605" y="38" fontSize="9" fill="#dc2626">基準値 2.0m</text>
            </svg>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8', marginTop: 4 }}>
              <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---- 水位監視 ---- */
  if (subPath === '/iot/water') {
    return (
      <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
        {header('水位監視', '排水・河川・地下水のリアルタイム監視')}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
          {[
            { name: '横浜現場 排水ピット', value: '0.45m', limit: '1.0m', pct: 45, status: '正常' },
            { name: '品川タワー 地下水位', value: '2.8m', limit: '3.5m', pct: 80, status: '注意' },
            { name: '大田区 調整池', value: '0.62m', limit: '2.0m', pct: 31, status: '正常' },
            { name: '川崎物流 雨水排水', value: '0.15m', limit: '0.8m', pct: 19, status: '正常' },
          ].map((w,i) => (
            <div key={i} style={{ ...cs, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{w.name}</span>
                <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: w.status==='正常'?'#dcfce7':'#fff7ed', color: w.status==='正常'?'#166534':'#92400e' }}>{w.status}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, marginBottom: 8 }}>
                <span style={{ fontSize: 28, fontWeight: 700, color: '#0f172a' }}>{w.value}</span>
                <span style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>/ {w.limit}</span>
              </div>
              <div style={{ height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${w.pct}%`, borderRadius: 4, background: w.pct>70?'#f97316':w.pct>50?'#eab308':'#16a34a' }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ---- IoT Gateway ---- */
  if (subPath === '/iot/gateway') {
    const gateways = [
      { id: 'GW-001', location: '品川タワー', devices: 24, status: 'online', uptime: '45d', signal: '強', protocol: 'MQTT/LoRa' },
      { id: 'GW-002', location: '横浜マンション', devices: 12, status: 'online', uptime: '30d', signal: '強', protocol: 'MQTT/Wi-Fi' },
      { id: 'GW-003', location: '千葉港湾', devices: 18, status: 'online', uptime: '60d', signal: '中', protocol: 'MQTT/LTE' },
      { id: 'GW-004', location: '大田区土木', devices: 8, status: 'online', uptime: '15d', signal: '強', protocol: 'MQTT/LoRa' },
      { id: 'GW-005', location: '川崎物流', devices: 15, status: 'degraded', uptime: '7d', signal: '弱', protocol: 'MQTT/Wi-Fi' },
    ];
    return (
      <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
        {header('IoT Gateway', 'ゲートウェイ稼働状況・デバイス接続管理')}
        <div style={cs}>
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 80px 70px 60px 50px 100px', gap: 12, padding: '10px 16px', borderBottom: '1px solid #e2e8f0', fontSize: 11, fontWeight: 600, color: '#94a3b8' }}>
            <span>ID</span><span>設置場所</span><span>接続デバイス</span><span>稼働時間</span><span>状態</span><span>信号</span><span>プロトコル</span>
          </div>
          {gateways.map((g,i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 80px 70px 60px 50px 100px', gap: 12, padding: '12px 16px', alignItems: 'center', borderBottom: i<gateways.length-1?'1px solid #f1f5f9':'none', fontSize: 12 }}>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: '#64748b' }}>{g.id}</span>
              <span style={{ fontWeight: 500, color: '#0f172a' }}>{g.location}</span>
              <span style={{ fontWeight: 600, color: '#1a56db' }}>{g.devices}台</span>
              <span style={{ color: '#64748b' }}>{g.uptime}</span>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: g.status==='online'?'#16a34a':'#f97316' }}></span>
              <span style={{ fontSize: 11, color: g.signal==='弱'?'#f97316':'#16a34a' }}>{g.signal}</span>
              <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: '#f1f5f9', color: '#475569' }}>{g.protocol}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ---- Edge AI ---- */
  if (subPath === '/iot/edge') {
    return (
      <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
        {header('Edge AI', 'エッジデバイスでのAI推論・リアルタイム分析')}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: 14 }}>
          {[
            { name: '安全装備検知 AI', device: 'NVIDIA Jetson AGX', site: '品川タワー', fps: 15, detections: '1,842', model: 'YOLOv8', status: 'running' },
            { name: 'ひび割れ検知 AI', device: 'NVIDIA Jetson Nano', site: '横浜マンション', fps: 5, detections: '234', model: 'ResNet50', status: 'running' },
            { name: '重機接近検知 AI', device: 'NVIDIA Jetson AGX', site: '大田区土木', fps: 30, detections: '567', model: 'YOLOv8', status: 'running' },
            { name: '水中異常検知 AI', device: 'NVIDIA Jetson Xavier', site: '千葉港湾', fps: 10, detections: '89', model: 'Custom CNN', status: 'idle' },
          ].map((e,i) => (
            <div key={i} style={{ ...cs, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{e.name}</div>
                <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: e.status==='running'?'#dcfce7':'#f1f5f9', color: e.status==='running'?'#166534':'#64748b' }}>{e.status==='running'?'稼働中':'待機'}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                {[['デバイス', e.device],['現場', e.site],['FPS', `${e.fps}fps`],['モデル', e.model]].map(([k,v]) => (
                  <div key={k}><div style={{ fontSize: 9, color: '#94a3b8' }}>{k}</div><div style={{ fontSize: 12, fontWeight: 500, color: '#0f172a' }}>{v}</div></div>
                ))}
              </div>
              <div style={{ padding: '8px 10px', borderRadius: 6, background: '#f5f3ff', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="brain" size={12} style={{ color: '#7c3aed' }} />
                <span style={{ fontSize: 11, color: '#7c3aed', fontWeight: 500 }}>本日検知: {e.detections}件</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ---- アラート管理 ---- */
  if (subPath === '/iot/alerts') {
    const alerts = [
      { time: '09:12', sensor: '風速計 #3', message: '風速8.5m/s — 10m/s超過でクレーン作業中止', severity: 'warning', site: '品川タワー', ack: false },
      { time: '09:00', sensor: '温度計 #5', message: 'WBGT 28°C超過 — 熱中症警戒レベル', severity: 'warning', site: '新宿再開発', ack: false },
      { time: '08:42', sensor: '波高計 #1', message: '15時以降 波高2.0m予測 — 海上作業注意', severity: 'info', site: '千葉港湾', ack: true },
      { time: '08:15', sensor: '振動計 #2', message: '振動値0.15gal — 基準値接近', severity: 'warning', site: '川崎物流', ack: true },
      { time: '昨日 18:30', sensor: '水位計 #1', message: '水位0.8m到達 — 排水ポンプ自動起動', severity: 'info', site: '横浜マンション', ack: true },
      { time: '昨日 15:00', sensor: '騒音計 #2', message: '騒音85dB超過 — 規制値接近', severity: 'warning', site: '大田区土木', ack: true },
    ];
    const sevColor = { warning: '#f97316', info: '#1a56db', danger: '#dc2626' };
    const sevBg = { warning: '#fff7ed', info: '#eff6ff', danger: '#fef2f2' };
    return (
      <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
        {header('アラート管理', 'IoTセンサアラートの一覧・確認・対応管理')}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {alerts.map((a,i) => (
            <div key={i} style={{ ...cs, padding: '12px 16px', borderLeft: `3px solid ${sevColor[a.severity]}`, display: 'flex', alignItems: 'center', gap: 12, background: a.ack?'#fff':sevBg[a.severity] }}>
              <Icon name="alert-triangle" size={16} style={{ color: sevColor[a.severity], flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{a.sensor}</span>
                  <span style={{ fontSize: 10, color: '#94a3b8' }}>{a.site}</span>
                </div>
                <div style={{ fontSize: 12, color: '#475569' }}>{a.message}</div>
              </div>
              <span style={{ fontSize: 10, color: '#94a3b8', flexShrink: 0 }}>{a.time}</span>
              {!a.ack && <button style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid #e2e8f0', background: '#fff', fontSize: 10, cursor: 'pointer', color: '#1a56db', fontWeight: 600, fontFamily: 'inherit' }}>確認</button>}
              {a.ack && <Icon name="check-circle" size={14} style={{ color: '#16a34a', flexShrink: 0 }} />}
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ---- リアルタイム監視 (default for /iot/realtime and /iot/sensors) ---- */
  return <IoTSensorsView />;
}

window.IoTMonitorPage = IoTMonitorPage;
