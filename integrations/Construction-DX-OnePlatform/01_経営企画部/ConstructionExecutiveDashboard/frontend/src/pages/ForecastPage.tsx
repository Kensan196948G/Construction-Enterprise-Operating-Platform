import { useState } from 'react';
import ForecastChart, { ForecastPoint } from '../components/ForecastChart';
import { api } from '../api/client';

const SAMPLE_HISTORY = Array.from({ length: 12 }, (_, i) => ({
  ds: `2025-${String(i + 1).padStart(2, '0')}-01`,
  y: 0.08 + Math.sin(i / 2) * 0.01,
}));

export default function ForecastPage() {
  const [predictions, setPredictions] = useState<ForecastPoint[]>([]);
  const [model, setModel] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [metric, setMetric] = useState('profit_margin');

  async function run() {
    setLoading(true);
    try {
      const r = await api.post('/forecasts/timeseries', {
        target_metric: metric,
        horizon_days: 60,
        confidence_interval: 0.8,
        history: SAMPLE_HISTORY,
      });
      setPredictions(r.data.predictions);
      setModel(r.data.model_name);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">AI 予測</h2>
      <div className="flex gap-2 items-center">
        <select
          value={metric}
          onChange={(e) => setMetric(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="profit_margin">利益率低下予測</option>
          <option value="orders_amount">受注高予測</option>
          <option value="deficit_project">赤字案件予測</option>
          <option value="schedule_delay">工期遅延予測</option>
          <option value="workforce_shortage">人材不足予測</option>
        </select>
        <button
          onClick={run}
          disabled={loading}
          className="bg-exec-primary text-white text-sm px-3 py-1 rounded disabled:opacity-50"
        >
          {loading ? '計算中...' : '予測実行'}
        </button>
        {model && <span className="text-xs text-slate-500">model: {model}</span>}
      </div>
      {predictions.length > 0 && (
        <ForecastChart data={predictions} title={`${metric} (信頼区間 80%)`} />
      )}
    </div>
  );
}
