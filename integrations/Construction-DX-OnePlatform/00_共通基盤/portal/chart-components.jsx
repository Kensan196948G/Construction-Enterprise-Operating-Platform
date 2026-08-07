/* Construction DX One Platform — SVG Chart Components */

/* ── Sparkline ── */
function CDXSparkline({ data, width = 80, height = 24, color = 'var(--cdx-primary)', fill = false }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  });
  const line = `M${pts.join('L')}`;
  const area = `${line}L${width},${height}L0,${height}Z`;
  return React.createElement('svg', { width, height, viewBox: `0 0 ${width} ${height}`, style: { display: 'block' } },
    fill && React.createElement('path', { d: area, fill: color, opacity: 0.1 }),
    React.createElement('path', { d: line, fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }),
    React.createElement('circle', { cx: parseFloat(pts[pts.length-1].split(',')[0]), cy: parseFloat(pts[pts.length-1].split(',')[1]), r: 2.5, fill: color })
  );
}

/* ── Bar Chart ── */
function CDXBarChart({ data, width = 400, height = 200, barColor = 'var(--cdx-secondary)', secondaryColor = 'var(--cdx-primary)', xKey = 'label', yKeys = ['value'], labels = null, showValues = true }) {
  const maxVal = Math.max(...data.flatMap(d => yKeys.map(k => d[k] || 0)));
  const padT = 24, padB = 28, padL = 40, padR = 12;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;
  const groupW = chartW / data.length;
  const barW = Math.min(groupW * 0.35, 32);
  const colors = [barColor, secondaryColor, 'var(--cdx-accent)', 'var(--cdx-success)'];
  const gridLines = 4;

  return React.createElement('svg', { width: '100%', height, viewBox: `0 0 ${width} ${height}`, style: { display: 'block' } },
    // Grid
    ...Array.from({ length: gridLines + 1 }, (_, i) => {
      const y = padT + (chartH / gridLines) * i;
      const val = (maxVal * (1 - i / gridLines)).toFixed(0);
      return React.createElement('g', { key: 'g' + i },
        React.createElement('line', { x1: padL, x2: width - padR, y1: y, y2: y, stroke: 'var(--border-color)', strokeWidth: 1 }),
        React.createElement('text', { x: padL - 6, y: y + 4, textAnchor: 'end', fill: 'var(--text-muted)', fontSize: 10 }, val)
      );
    }),
    // Bars
    ...data.flatMap((d, i) => {
      const gx = padL + groupW * i + groupW / 2;
      return [
        ...yKeys.map((k, ki) => {
          const v = d[k] || 0;
          const bh = (v / maxVal) * chartH;
          const x = gx - (yKeys.length * barW) / 2 + ki * barW + (yKeys.length > 1 ? 2 * ki : 0);
          return React.createElement('rect', { key: `b${i}-${ki}`, x, y: padT + chartH - bh, width: barW - 2, height: bh, rx: 3, fill: colors[ki % colors.length], opacity: 0.85 });
        }),
        React.createElement('text', { key: 'x' + i, x: gx, y: height - 8, textAnchor: 'middle', fill: 'var(--text-muted)', fontSize: 10 }, d[xKey])
      ];
    })
  );
}

/* ── Line/Area Chart ── */
function CDXLineChart({ data, width = 400, height = 200, xKey = 'label', yKeys = ['value'], colors: lineColors = null, area = false, labels = null }) {
  const cArr = lineColors || ['var(--cdx-secondary)', 'var(--cdx-primary)', 'var(--cdx-success)', 'var(--cdx-accent)'];
  const allVals = data.flatMap(d => yKeys.map(k => d[k] || 0));
  const maxVal = Math.max(...allVals) * 1.1 || 1;
  const padT = 20, padB = 28, padL = 44, padR = 12;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;
  const gridLines = 4;

  const getXY = (d, i, k) => {
    const x = padL + (i / (data.length - 1)) * chartW;
    const y = padT + chartH - ((d[k] || 0) / maxVal) * chartH;
    return { x, y };
  };

  return React.createElement('svg', { width: '100%', height, viewBox: `0 0 ${width} ${height}`, style: { display: 'block' } },
    // Grid
    ...Array.from({ length: gridLines + 1 }, (_, i) => {
      const y = padT + (chartH / gridLines) * i;
      const val = (maxVal * (1 - i / gridLines)).toFixed(1);
      return React.createElement('g', { key: 'g' + i },
        React.createElement('line', { x1: padL, x2: width - padR, y1: y, y2: y, stroke: 'var(--border-color)', strokeWidth: 1 }),
        React.createElement('text', { x: padL - 6, y: y + 4, textAnchor: 'end', fill: 'var(--text-muted)', fontSize: 10 }, val)
      );
    }),
    // X labels
    ...data.map((d, i) => {
      const x = padL + (i / (data.length - 1)) * chartW;
      return React.createElement('text', { key: 'xl' + i, x, y: height - 8, textAnchor: 'middle', fill: 'var(--text-muted)', fontSize: 10 }, d[xKey]);
    }),
    // Lines
    ...yKeys.flatMap((k, ki) => {
      const pts = data.map((d, i) => getXY(d, i, k));
      const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join('');
      const els = [];
      if (area) {
        const areaD = `${pathD}L${pts[pts.length-1].x},${padT + chartH}L${pts[0].x},${padT + chartH}Z`;
        els.push(React.createElement('path', { key: 'a' + ki, d: areaD, fill: cArr[ki], opacity: 0.08 }));
      }
      els.push(React.createElement('path', { key: 'l' + ki, d: pathD, fill: 'none', stroke: cArr[ki], strokeWidth: 2.5, strokeLinecap: 'round', strokeLinejoin: 'round' }));
      pts.forEach((p, i) => els.push(React.createElement('circle', { key: `c${ki}-${i}`, cx: p.x, cy: p.y, r: 3, fill: '#fff', stroke: cArr[ki], strokeWidth: 2 })));
      return els;
    }),
    // Legend
    labels && React.createElement('g', { key: 'legend' },
      ...labels.map((l, i) => React.createElement('g', { key: 'lg' + i, transform: `translate(${padL + i * 90}, 10)` },
        React.createElement('rect', { width: 12, height: 3, rx: 1.5, fill: cArr[i] }),
        React.createElement('text', { x: 16, y: 4, fill: 'var(--text-muted)', fontSize: 10 }, l)
      ))
    )
  );
}

/* ── Donut Chart ── */
function CDXDonutChart({ data, size = 160, thickness = 28, showLegend = true }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = (size - thickness) / 2;
  const cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  return React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 16 } },
    React.createElement('svg', { width: size, height: size, viewBox: `0 0 ${size} ${size}` },
      ...data.map((d, i) => {
        const pct = d.value / total;
        const dash = circ * pct;
        const el = React.createElement('circle', {
          key: i, cx, cy, r, fill: 'none', stroke: d.color, strokeWidth: thickness,
          strokeDasharray: `${dash} ${circ - dash}`, strokeDashoffset: -offset,
          transform: `rotate(-90 ${cx} ${cy})`, strokeLinecap: 'butt',
          style: { transition: 'stroke-dasharray .5s, stroke-dashoffset .5s' }
        });
        offset += dash;
        return el;
      }),
      React.createElement('text', { x: cx, y: cy - 4, textAnchor: 'middle', fill: 'var(--text-primary)', fontSize: 20, fontWeight: 700 }, total.toLocaleString()),
      React.createElement('text', { x: cx, y: cy + 14, textAnchor: 'middle', fill: 'var(--text-muted)', fontSize: 10 }, '合計')
    ),
    showLegend && React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 6 } },
      ...data.map((d, i) => React.createElement('div', { key: i, style: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 } },
        React.createElement('span', { style: { width: 10, height: 10, borderRadius: 3, background: d.color, flexShrink: 0 } }),
        React.createElement('span', { style: { color: 'var(--text-secondary)', minWidth: 60 } }, d.name),
        React.createElement('span', { style: { fontWeight: 600, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' } }, `${d.value}%`)
      ))
    )
  );
}

/* ── Gauge ── */
function CDXGauge({ value, max = 100, label, size = 120, color = 'var(--cdx-primary)' }) {
  const pct = Math.min(value / max, 1);
  const r = (size - 16) / 2;
  const cx = size / 2, cy = size / 2 + 8;
  const startAngle = -210, endAngle = 30;
  const totalAngle = endAngle - startAngle;
  const valAngle = startAngle + totalAngle * pct;
  const toRad = a => (a * Math.PI) / 180;
  const arc = (angle) => ({ x: cx + r * Math.cos(toRad(angle)), y: cy + r * Math.sin(toRad(angle)) });
  const s = arc(startAngle), e = arc(endAngle), v = arc(valAngle);
  const trackD = `M${s.x},${s.y} A${r},${r} 0 1 1 ${e.x},${e.y}`;
  const valD = `M${s.x},${s.y} A${r},${r} 0 ${totalAngle * pct > 180 ? 1 : 0} 1 ${v.x},${v.y}`;

  return React.createElement('svg', { width: size, height: size - 8, viewBox: `0 0 ${size} ${size - 8}` },
    React.createElement('path', { d: trackD, fill: 'none', stroke: 'var(--border-color)', strokeWidth: 10, strokeLinecap: 'round' }),
    React.createElement('path', { d: valD, fill: 'none', stroke: color, strokeWidth: 10, strokeLinecap: 'round', style: { transition: 'all .5s' } }),
    React.createElement('text', { x: cx, y: cy - 6, textAnchor: 'middle', fill: 'var(--text-primary)', fontSize: 22, fontWeight: 800, fontFamily: "'M PLUS 1p'" }, value),
    label && React.createElement('text', { x: cx, y: cy + 12, textAnchor: 'middle', fill: 'var(--text-muted)', fontSize: 10 }, label)
  );
}

/* ── Heatmap ── */
function CDXHeatmap({ data, rowLabels, colLabels, maxVal = null, colors = ['#dcfce7', '#fef3c7', '#fed7aa', '#fecaca', '#fca5a5'] }) {
  const actualMax = maxVal || Math.max(...data.flat()) || 1;
  const cellW = 52, cellH = 32, padL = 72, padT = 28;
  const w = padL + data[0].length * cellW + 8;
  const h = padT + data.length * cellH + 8;

  const getColor = (v) => {
    const idx = Math.min(Math.floor((v / actualMax) * (colors.length - 1)), colors.length - 1);
    return v === 0 ? 'var(--bg-card)' : colors[idx];
  };

  return React.createElement('svg', { width: '100%', height: h, viewBox: `0 0 ${w} ${h}`, style: { display: 'block' } },
    colLabels && colLabels.map((l, i) => React.createElement('text', { key: 'c' + i, x: padL + cellW * i + cellW / 2, y: 16, textAnchor: 'middle', fill: 'var(--text-muted)', fontSize: 9 }, l)),
    ...data.flatMap((row, ri) => [
      rowLabels && React.createElement('text', { key: 'r' + ri, x: padL - 8, y: padT + cellH * ri + cellH / 2 + 4, textAnchor: 'end', fill: 'var(--text-muted)', fontSize: 10 }, rowLabels[ri]),
      ...row.map((v, ci) => React.createElement('g', { key: `${ri}-${ci}` },
        React.createElement('rect', { x: padL + cellW * ci + 2, y: padT + cellH * ri + 2, width: cellW - 4, height: cellH - 4, rx: 4, fill: getColor(v), stroke: 'var(--border-color)', strokeWidth: 1 }),
        React.createElement('text', { x: padL + cellW * ci + cellW / 2, y: padT + cellH * ri + cellH / 2 + 4, textAnchor: 'middle', fill: v > 0 ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: 12, fontWeight: v > 0 ? 600 : 400 }, v)
      ))
    ])
  );
}

/* ── Progress Bar ── */
function CDXProgressBar({ value, max = 100, color = 'var(--cdx-primary)', height = 8, showLabel = true }) {
  const pct = Math.min((value / max) * 100, 100);
  return React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 10 } },
    React.createElement('div', { style: { flex: 1, height, borderRadius: height / 2, background: 'var(--border-color)', overflow: 'hidden' } },
      React.createElement('div', { style: { width: `${pct}%`, height: '100%', borderRadius: height / 2, background: color, transition: 'width .5s' } })
    ),
    showLabel && React.createElement('span', { style: { fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', minWidth: 36, textAlign: 'right' } }, `${Math.round(pct)}%`)
  );
}

Object.assign(window, { CDXSparkline, CDXBarChart, CDXLineChart, CDXDonutChart, CDXGauge, CDXHeatmap, CDXProgressBar });
