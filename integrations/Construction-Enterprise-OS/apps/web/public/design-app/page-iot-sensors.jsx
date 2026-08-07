/* ========================================
   IoT Sensors View — the default sensor dashboard
   ======================================== */

function IoTSensorsView() {
  const [selectedSensor, setSelectedSensor] = React.useState(0);
  const [timeRange, setTimeRange] = React.useState('24h');
  const cs = { background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' };

  const sensors = [
    { name: '波高計 #1', location: '品川港湾A地点', value: '1.2', unit: 'm', status: 'normal', type: 'wave' },
    { name: '風速計 #3', location: '品川タワー屋上', value: '8.5', unit: 'm/s', status: 'warning', type: 'wind' },
    { name: '水位計 #2', location: '横浜現場排水', value: '0.45', unit: 'm', status: 'normal', type: 'water' },
    { name: '温度計 #5', location: '新宿再開発', value: '32.1', unit: '°C', status: 'warning', type: 'temp' },
    { name: '振動計 #1', location: '川崎物流基礎', value: '0.08', unit: 'gal', status: 'normal', type: 'vibration' },
    { name: '騒音計 #2', location: '大田区土木', value: '72', unit: 'dB', status: 'normal', type: 'noise' },
  ];

  const statusColors = { normal: '#16a34a', warning: '#f97316', danger: '#dc2626' };
  const sensorIcon = { wave: 'activity', wind: 'wind', water: 'droplet', temp: 'thermometer', vibration: 'zap', noise: 'signal' };

  const chartData = React.useMemo(() => {
    const base = parseFloat(sensors[selectedSensor].value);
    const data = []; let val = base;
    for (let i = 0; i < 24; i++) { val += (Math.random()-0.48)*base*0.15; val = Math.max(base*0.5,Math.min(base*1.8,val)); data.push(val); }
    return data;
  }, [selectedSensor]);
  const maxVal = Math.max(...chartData), minVal = Math.min(...chartData), range = maxVal-minVal||1;

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div><h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0 }}>IoT・リアルタイム監視</h1>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>センサ監視・気象情報・アラート管理</p></div>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#16a34a', fontWeight: 500 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#16a34a', animation: 'iotPulse 2s infinite' }}></span>リアルタイム接続中
        </span>
      </div>
      {/* Sensor cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: 12, marginBottom: 20 }}>
        {sensors.map((s,i) => (
          <div key={i} onClick={() => setSelectedSensor(i)} style={{ ...cs, padding: 14, cursor: 'pointer', borderColor: selectedSensor===i?'#1a56db':'#e2e8f0', borderWidth: selectedSensor===i?2:1, transition: 'all 0.15s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ width: 32, height: 32, borderRadius: 6, background: s.status==='warning'?'#fff7ed':'#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={sensorIcon[s.type]||'activity'} size={16} style={{ color: statusColors[s.status] }} />
              </div>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColors[s.status] }}></span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', marginTop: 10 }}>{s.value}<span style={{ fontSize: 12, fontWeight: 400, color: '#94a3b8', marginLeft: 2 }}>{s.unit}</span></div>
            <div style={{ fontSize: 12, fontWeight: 500, color: '#374151', marginTop: 2 }}>{s.name}</div>
            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{s.location}</div>
          </div>
        ))}
      </div>
      {/* Chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        <div style={cs}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div><span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{sensors[selectedSensor].name}</span>
              <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 8 }}>{sensors[selectedSensor].location}</span></div>
            <div style={{ display: 'flex', gap: 4 }}>
              {['1h','6h','24h','7d'].map(t => (
                <button key={t} onClick={() => setTimeRange(t)} style={{ padding: '3px 10px', borderRadius: 4, border: 'none', background: timeRange===t?'#1a56db':'#f1f5f9', color: timeRange===t?'#fff':'#64748b', fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>{t}</button>
              ))}
            </div>
          </div>
          <div style={{ padding: '20px 20px 10px' }}>
            <svg width="100%" height="200" viewBox="0 0 600 200" preserveAspectRatio="none">
              <defs><linearGradient id="cg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1a56db" stopOpacity="0.15" /><stop offset="100%" stopColor="#1a56db" stopOpacity="0" /></linearGradient></defs>
              {[0,1,2,3,4].map(i => <line key={i} x1="0" y1={i*50} x2="600" y2={i*50} stroke="#f1f5f9" strokeWidth="1" />)}
              <path d={`M0,${200-((chartData[0]-minVal)/range)*170} `+chartData.map((v,i) => `L${(i/(chartData.length-1))*600},${200-((v-minVal)/range)*170}`).join(' ')+` L600,200 L0,200 Z`} fill="url(#cg2)" />
              <path d={`M0,${200-((chartData[0]-minVal)/range)*170} `+chartData.map((v,i) => `L${(i/(chartData.length-1))*600},${200-((v-minVal)/range)*170}`).join(' ')} fill="none" stroke="#1a56db" strokeWidth="2" />
              <circle cx={600} cy={200-((chartData[chartData.length-1]-minVal)/range)*170} r="4" fill="#1a56db" stroke="#fff" strokeWidth="2" />
            </svg>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8', marginTop: 4, fontFamily: "'JetBrains Mono',monospace" }}>
              <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', borderTop: '1px solid #e2e8f0', padding: '12px 20px' }}>
            {[['現在値', sensors[selectedSensor].value+sensors[selectedSensor].unit],['最大', maxVal.toFixed(1)+sensors[selectedSensor].unit],['最小', minVal.toFixed(1)+sensors[selectedSensor].unit],['平均', (chartData.reduce((a,b)=>a+b,0)/chartData.length).toFixed(1)+sensors[selectedSensor].unit]].map((s,i) => (
              <div key={i} style={{ textAlign: 'center' }}><div style={{ fontSize: 10, color: '#94a3b8' }}>{s[0]}</div><div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginTop: 2 }}>{s[1]}</div></div>
            ))}
          </div>
        </div>
        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={cs}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}><span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>閾値設定</span></div>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[['上限（危険）','15.0','#dc2626'],['上限（警告）','10.0','#f97316'],['下限（警告）','0.5','#f97316'],['下限（危険）','0.1','#dc2626']].map(([l,v,c],i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', borderRadius: 6, background: '#f8fafc' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 3, borderRadius: 2, background: c }}></span><span style={{ fontSize: 12, color: '#475569' }}>{l}</span></div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', fontFamily: "'JetBrains Mono',monospace" }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ ...cs, background: '#f5f3ff', borderColor: '#ede9fe' }}>
            <div style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}><Icon name="brain" size={14} style={{ color: '#7c3aed' }} /><span style={{ fontSize: 12, fontWeight: 600, color: '#7c3aed' }}>AI異常検知</span></div>
              <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.6 }}>過去72時間のデータパターンは正常範囲内です。15時以降の風速上昇傾向を検知。</div>
              <div style={{ marginTop: 10, fontSize: 11, color: '#16a34a', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="check-circle" size={12} />異常スコア: 0.12 (正常)</div>
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes iotPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}

window.IoTSensorsView = IoTSensorsView;
