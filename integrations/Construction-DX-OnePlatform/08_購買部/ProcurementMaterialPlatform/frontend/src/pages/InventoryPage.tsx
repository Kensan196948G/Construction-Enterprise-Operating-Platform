import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { apiClient } from '@/api/client';
import { StockLevelBar } from '@/components/StockLevelBar';

interface Inv {
  id: number;
  material_code: string;
  material_name: string;
  warehouse: string;
  quantity: number;
  unit: string;
  reorder_point: number | null;
  avg_daily_usage: number | null;
}

interface Alert {
  material_code: string;
  warehouse: string;
  current_qty: number;
  reorder_point: number;
  days_to_stockout: number | null;
  level: 'OK' | 'WARNING' | 'DANGER';
}

interface ForecastPoint {
  horizon_days: number;
  target_date: string;
  predicted_consumption: number;
  predicted_avg_daily: number;
  required_inventory: number;
  confidence: number;
}

interface ForecastResp {
  material_id: number | null;
  material_code: string;
  method: string;
  seasonality_detected: boolean;
  sample_size: number;
  current_qty: number | null;
  points: ForecastPoint[];
  note: string | null;
}

export default function InventoryPage() {
  const [items, setItems] = useState<Inv[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [forecast, setForecast] = useState<ForecastResp | null>(null);

  useEffect(() => {
    apiClient
      .get<Inv[]>('/inventory')
      .then((r) => setItems(r.data))
      .catch((e) => setErr(e.message));
    apiClient
      .get<{ alerts: Alert[] }>('/inventory/alerts')
      .then((r) => setAlerts(r.data.alerts))
      .catch(() => {});
  }, []);

  const loadForecast = async (id: number) => {
    setSelectedId(id);
    try {
      const r = await apiClient.get<ForecastResp>('/inventory/forecast', {
        params: { material_id: id, days: 90 },
      });
      setForecast(r.data);
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  const levelOf = (code: string, wh: string) =>
    alerts.find((a) => a.material_code === code && a.warehouse === wh)?.level ?? 'OK';

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold">在庫照会</h2>
      {err && <p className="text-sm text-red-600">{err}</p>}

      <div className="rounded border bg-white p-3 shadow-sm">
        <h3 className="mb-2 font-bold">アラート概要</h3>
        <div className="flex gap-3 text-sm">
          <span className="rounded bg-proc-ok/20 px-2 py-0.5 text-proc-ok">
            OK: {alerts.filter((a) => a.level === 'OK').length}
          </span>
          <span className="rounded bg-proc-warn/20 px-2 py-0.5 text-proc-warn">
            Warning: {alerts.filter((a) => a.level === 'WARNING').length}
          </span>
          <span className="rounded bg-proc-danger/20 px-2 py-0.5 text-proc-danger">
            Danger: {alerts.filter((a) => a.level === 'DANGER').length}
          </span>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {items.map((i) => (
          <div key={i.id} className="rounded border bg-white p-3 shadow-sm">
            <div className="mb-1 flex items-center justify-between">
              <span className="font-bold">{i.material_name}</span>
              <span className="text-xs text-gray-500">{i.warehouse}</span>
            </div>
            <div className="text-xs text-gray-500">
              {i.material_code} / 平均消費: {i.avg_daily_usage ?? '-'} {i.unit}/日
            </div>
            <div className="mt-2">
              <StockLevelBar
                current={Number(i.quantity)}
                reorderPoint={Number(i.reorder_point ?? 0)}
                level={levelOf(i.material_code, i.warehouse)}
              />
            </div>
            <button
              type="button"
              onClick={() => loadForecast(i.id)}
              className="mt-2 rounded bg-proc-primary px-2 py-1 text-xs text-white hover:bg-proc-accent"
            >
              在庫予測を表示
            </button>
          </div>
        ))}
      </div>

      {forecast && (
        <div className="rounded border bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-baseline justify-between">
            <h3 className="font-bold">
              在庫予測: {forecast.material_code} (ID #{selectedId})
            </h3>
            <span className="text-xs text-gray-500">
              method={forecast.method} / sample={forecast.sample_size}
              {forecast.seasonality_detected ? ' / 季節性あり' : ''}
            </span>
          </div>
          {forecast.note && (
            <p className="mb-2 text-xs text-proc-warn">{forecast.note}</p>
          )}
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <LineChart data={forecast.points}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="horizon_days" tickFormatter={(v) => `${v}日後`} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="predicted_consumption"
                  stroke="#dc2626"
                  name="予測累計消費"
                />
                <Line
                  type="monotone"
                  dataKey="required_inventory"
                  stroke="#0f766e"
                  name="推奨保持在庫"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2" style={{ width: '100%', height: 160 }}>
            <ResponsiveContainer>
              <BarChart data={forecast.points}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="horizon_days" tickFormatter={(v) => `${v}日`} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="predicted_avg_daily" fill="#16a34a" name="日次平均消費" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <table className="mt-3 w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-1">期間</th>
                <th className="border p-1 text-right">予測累計消費</th>
                <th className="border p-1 text-right">日次平均</th>
                <th className="border p-1 text-right">推奨保持</th>
                <th className="border p-1 text-right">信頼度</th>
              </tr>
            </thead>
            <tbody>
              {forecast.points.map((p) => (
                <tr key={p.horizon_days}>
                  <td className="border p-1">{p.horizon_days}日後 ({p.target_date})</td>
                  <td className="border p-1 text-right">{p.predicted_consumption.toLocaleString()}</td>
                  <td className="border p-1 text-right">{p.predicted_avg_daily}</td>
                  <td className="border p-1 text-right">{p.required_inventory.toLocaleString()}</td>
                  <td className="border p-1 text-right">{(p.confidence * 100).toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
