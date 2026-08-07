import { useEffect, useMemo, useState } from 'react';
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
import { FuelGauge } from '@/components/FuelGauge';

interface Record {
  id: number;
  vessel_id: number;
  recorded_at: string;
  fuel_type: string;
  refuel_liters: number;
  remaining_liters: number | null;
}

interface OptimizeResp {
  optimal_speed_knots: number;
  consumption_per_nm: number;
  total_fuel_liters: number;
  travel_hours: number;
  co2_kg: number;
  model_source: string;
}

interface OptimizeRow {
  distance_nm: number;
  actual_speed_knots: number;
  optimal_speed_knots: number;
  fuel_savings_pct: number;
}

export default function FuelPage() {
  const [records, setRecords] = useState<Record[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [optimRows, setOptimRows] = useState<OptimizeRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiClient
      .get<Record[]>('/fuel')
      .then((r) => setRecords(r.data))
      .catch((e) => setErr(e.message));
  }, []);

  // 燃料補給推移
  const chartData = useMemo(
    () =>
      [...records]
        .sort((a, b) => a.recorded_at.localeCompare(b.recorded_at))
        .map((r) => ({
          date: r.recorded_at.substring(0, 10),
          refuel: r.refuel_liters,
          remaining: r.remaining_liters ?? 0,
        })),
    [records],
  );

  const latestByVessel = new Map<number, Record>();
  records.forEach((r) => {
    const prev = latestByVessel.get(r.vessel_id);
    if (!prev || r.recorded_at > prev.recorded_at) latestByVessel.set(r.vessel_id, r);
  });

  async function runOptimizationDemo() {
    setLoading(true);
    try {
      const sampleScenarios = [
        { distance_nm: 50, actual: 14, sea_state: 1.0, cargo_tons: 200 },
        { distance_nm: 100, actual: 16, sea_state: 1.5, cargo_tons: 300 },
        { distance_nm: 150, actual: 15, sea_state: 2.0, cargo_tons: 400 },
        { distance_nm: 80, actual: 13, sea_state: 0.8, cargo_tons: 150 },
      ];
      const results = await Promise.all(
        sampleScenarios.map(async (s) => {
          const r = await apiClient.post<OptimizeResp>('/fuel/optimize', {
            distance_nm: s.distance_nm,
            sea_state: s.sea_state,
            cargo_tons: s.cargo_tons,
          });
          // 実速度ベースの燃料量を粗く推定
          const actualLpnm = 1.0 + 0.002 * s.actual ** 2 + 0.3 * s.sea_state + 0.0005 * s.cargo_tons;
          const actualFuel = actualLpnm * s.distance_nm;
          const optimal = r.data.total_fuel_liters;
          const savings = ((actualFuel - optimal) / actualFuel) * 100;
          return {
            distance_nm: s.distance_nm,
            actual_speed_knots: s.actual,
            optimal_speed_knots: r.data.optimal_speed_knots,
            fuel_savings_pct: Math.round(savings * 10) / 10,
          };
        }),
      );
      setOptimRows(results);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold">燃料管理</h2>
      {err && <p className="text-sm text-red-600">{err}</p>}

      <div className="grid gap-4 md:grid-cols-3">
        {Array.from(latestByVessel.values()).map((r) => (
          <FuelGauge
            key={r.vessel_id}
            remainingLiters={r.remaining_liters}
            capacityLiters={50000}
          />
        ))}
      </div>

      {chartData.length > 0 && (
        <div className="rounded border bg-white p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-bold">燃料補給・残量推移</h3>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="refuel" stroke="#0284c7" name="補給 (L)" />
                <Line type="monotone" dataKey="remaining" stroke="#0c4a6e" name="残量 (L)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="rounded border bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-bold">燃費最適化: 推奨速度 vs 実速度</h3>
          <button
            type="button"
            onClick={runOptimizationDemo}
            disabled={loading}
            className="rounded bg-marine-accent px-3 py-1 text-xs text-white disabled:opacity-50"
          >
            {loading ? '計算中…' : '最適化を実行'}
          </button>
        </div>
        {optimRows.length > 0 ? (
          <>
            <div style={{ width: '100%', height: 250 }}>
              <ResponsiveContainer>
                <BarChart data={optimRows}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="distance_nm" label={{ value: '距離 (NM)', position: 'insideBottom', offset: -2 }} />
                  <YAxis label={{ value: '速度 (kn)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="actual_speed_knots" fill="#94a3b8" name="実速度" />
                  <Bar dataKey="optimal_speed_knots" fill="#0284c7" name="推奨速度" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-2 text-xs text-gray-600">
              {optimRows.map((r, i) => (
                <li key={i}>
                  距離 {r.distance_nm} NM: 実 {r.actual_speed_knots} kn → 推奨{' '}
                  {r.optimal_speed_knots} kn (燃料 {r.fuel_savings_pct}% 削減)
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-xs text-gray-400">「最適化を実行」で推奨速度を計算します。</p>
        )}
      </div>
    </section>
  );
}
