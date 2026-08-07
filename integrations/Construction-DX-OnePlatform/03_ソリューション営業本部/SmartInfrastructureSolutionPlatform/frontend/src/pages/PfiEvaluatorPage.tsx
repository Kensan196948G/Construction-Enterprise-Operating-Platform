import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { apiClient } from '@/api/client';

interface EvalResult {
  npv: number;
  irr: number | null;
  vfm: number | null;
  payback_period_years: number | null;
  is_viable: boolean;
}

interface HistogramBin {
  bin_min: number;
  bin_max: number;
  count: number;
}

interface MonteCarloResult {
  iterations: number;
  mean_npv: number;
  median_npv: number;
  std_npv: number;
  p5_npv: number;
  p95_npv: number;
  prob_positive_npv: number;
  histogram: HistogramBin[];
}

interface SensitivityRow {
  variable: string;
  delta_low: number;
  delta_high: number;
  impact: number;
}

interface SensitivityResult {
  base_npv: number;
  rows: SensitivityRow[];
}

export default function PfiEvaluatorPage() {
  const [initial, setInitial] = useState(1000);
  const [cashflows, setCashflows] = useState('300,300,300,300,300');
  const [rate, setRate] = useState(0.04);
  const [psc, setPsc] = useState<string>('');
  const [pfi, setPfi] = useState<string>('');
  const [result, setResult] = useState<EvalResult | null>(null);
  const [mc, setMc] = useState<MonteCarloResult | null>(null);
  const [sens, setSens] = useState<SensitivityResult | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const buildBody = () => {
    const cf = cashflows
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => !Number.isNaN(n));
    return {
      initial_investment: initial,
      annual_cashflows: cf,
      discount_rate: rate,
      psc_cost: psc ? Number(psc) : undefined,
      pfi_cost: pfi ? Number(pfi) : undefined,
    };
  };

  const onEvaluate = async () => {
    try {
      setBusy(true);
      const r = await apiClient.post<EvalResult>('/pfi/evaluate', buildBody());
      setResult(r.data);
      setErr(null);
    } catch (e) {
      setErr(String(e));
    } finally {
      setBusy(false);
    }
  };

  const onMonteCarlo = async () => {
    try {
      setBusy(true);
      const r = await apiClient.post<MonteCarloResult>('/pfi/monte-carlo', {
        ...buildBody(),
        iterations: 10000,
        cf_sigma: 0.1,
        rate_sigma: 0.02,
        seed: 42,
        bins: 25,
      });
      setMc(r.data);
      setErr(null);
    } catch (e) {
      setErr(String(e));
    } finally {
      setBusy(false);
    }
  };

  const onSensitivity = async () => {
    try {
      setBusy(true);
      const r = await apiClient.post<SensitivityResult>('/pfi/sensitivity', buildBody());
      setSens(r.data);
      setErr(null);
    } catch (e) {
      setErr(String(e));
    } finally {
      setBusy(false);
    }
  };

  const histData = (mc?.histogram ?? []).map((b) => ({
    label: `${b.bin_min.toFixed(0)}`,
    count: b.count,
    mid: (b.bin_min + b.bin_max) / 2,
  }));

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">PFI / PPP 事業性評価</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded border bg-white p-4 space-y-3">
          <Field label="初期投資 (百万円)">
            <input
              type="number"
              className="input"
              value={initial}
              onChange={(e) => setInitial(Number(e.target.value))}
            />
          </Field>
          <Field label="年次キャッシュフロー (カンマ区切り)">
            <input
              className="input"
              value={cashflows}
              onChange={(e) => setCashflows(e.target.value)}
              placeholder="300,300,300,..."
            />
          </Field>
          <Field label="割引率 (例 0.04)">
            <input
              type="number"
              step="0.01"
              className="input"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
            />
          </Field>
          <Field label="PSC コスト (任意)">
            <input
              type="number"
              className="input"
              value={psc}
              onChange={(e) => setPsc(e.target.value)}
            />
          </Field>
          <Field label="PFI コスト (任意)">
            <input
              type="number"
              className="input"
              value={pfi}
              onChange={(e) => setPfi(e.target.value)}
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onEvaluate}
              disabled={busy}
              className="rounded bg-sol-primary px-4 py-2 text-white hover:bg-sol-accent disabled:opacity-50"
            >
              評価実行
            </button>
            <button
              type="button"
              onClick={onMonteCarlo}
              disabled={busy}
              className="rounded bg-sol-accent px-4 py-2 text-white hover:opacity-90 disabled:opacity-50"
            >
              Monte Carlo (1万回)
            </button>
            <button
              type="button"
              onClick={onSensitivity}
              disabled={busy}
              className="rounded bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              感度分析
            </button>
          </div>
          {err && <p className="text-rose-600 text-sm">{err}</p>}
        </div>
        <div className="rounded border bg-white p-4">
          <h3 className="font-semibold mb-3">評価結果</h3>
          {result ? (
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <dt className="text-gray-500">NPV</dt>
              <dd className="font-bold">{result.npv.toLocaleString()}</dd>
              <dt className="text-gray-500">IRR</dt>
              <dd className="font-bold">
                {result.irr != null ? `${(result.irr * 100).toFixed(2)}%` : '—'}
              </dd>
              <dt className="text-gray-500">VFM</dt>
              <dd className="font-bold">
                {result.vfm != null ? `${(result.vfm * 100).toFixed(2)}%` : '—'}
              </dd>
              <dt className="text-gray-500">回収期間</dt>
              <dd className="font-bold">{result.payback_period_years ?? '—'} 年</dd>
              <dt className="text-gray-500">判定</dt>
              <dd
                className={`font-bold ${
                  result.is_viable ? 'text-sol-success' : 'text-sol-danger'
                }`}
              >
                {result.is_viable ? '事業化可' : '要再検討'}
              </dd>
            </dl>
          ) : (
            <p className="text-gray-500 text-sm">パラメータを入力して評価を実行してください。</p>
          )}
        </div>
      </div>

      {mc && (
        <div className="rounded border bg-white p-4">
          <h3 className="font-semibold mb-2">Monte Carlo NPV 分布 ({mc.iterations.toLocaleString()} 回)</h3>
          <dl className="grid grid-cols-3 gap-2 text-sm mb-3">
            <Kv label="平均 NPV" value={mc.mean_npv.toLocaleString()} />
            <Kv label="中央値" value={mc.median_npv.toLocaleString()} />
            <Kv label="標準偏差" value={mc.std_npv.toLocaleString()} />
            <Kv label="P5" value={mc.p5_npv.toLocaleString()} />
            <Kv label="P95" value={mc.p95_npv.toLocaleString()} />
            <Kv label="NPV>0 確率" value={`${(mc.prob_positive_npv * 100).toFixed(1)}%`} />
          </dl>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={histData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" interval={Math.max(0, Math.floor(histData.length / 8))} />
                <YAxis />
                <Tooltip formatter={(v: number) => v.toLocaleString()} />
                <Legend />
                <Bar dataKey="count" name="頻度">
                  {histData.map((d, i) => (
                    <Cell key={i} fill={d.mid >= 0 ? '#16a34a' : '#dc2626'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {sens && (
        <div className="rounded border bg-white p-4">
          <h3 className="font-semibold mb-2">感度分析 (基準 NPV = {sens.base_npv.toLocaleString()})</h3>
          <table className="w-full text-sm">
            <thead className="text-gray-500">
              <tr>
                <th className="text-left p-2">変数</th>
                <th className="text-right p-2">-Δ → NPV変化</th>
                <th className="text-right p-2">+Δ → NPV変化</th>
                <th className="text-right p-2">|影響度|</th>
              </tr>
            </thead>
            <tbody>
              {sens.rows.map((r) => (
                <tr key={r.variable} className="border-t">
                  <td className="p-2 font-medium">{r.variable}</td>
                  <td className="p-2 text-right text-rose-700">{r.delta_low.toLocaleString()}</td>
                  <td className="p-2 text-right text-emerald-700">
                    {r.delta_high.toLocaleString()}
                  </td>
                  <td className="p-2 text-right font-bold">{r.impact.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style>{`.input{border:1px solid #d1d5db;border-radius:.375rem;padding:.25rem .5rem;font-size:.875rem;width:100%;}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="block mb-1 text-gray-700">{label}</span>
      {children}
    </label>
  );
}

function Kv({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border p-2">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="font-bold">{value}</div>
    </div>
  );
}
