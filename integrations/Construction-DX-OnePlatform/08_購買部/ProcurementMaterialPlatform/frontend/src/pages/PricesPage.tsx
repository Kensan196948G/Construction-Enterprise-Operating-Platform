import { useState } from 'react';
import {
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

interface TrendPoint {
  period: string;
  avg_price: number;
  min_price: number;
  max_price: number;
}

interface Resp {
  history: { effective_date: string; unit_price: number; source: string }[];
  trend: TrendPoint[];
}

interface ScoredQuote {
  supplier_id: number;
  supplier_name: string;
  unit_price: number;
  delivery_lead_days: number;
  total_score: number;
  price_score: number;
  rating_score: number;
  delivery_score: number;
  safety_score: number;
  total_cost: number;
}

interface RecommendResp {
  count: number;
  recommendations: {
    strategy: string;
    weights: Record<string, number>;
    top: ScoredQuote;
    ranking: ScoredQuote[];
  }[];
}

const STRATEGY_LABEL: Record<string, string> = {
  cheapest: '最安重視',
  quality: '品質重視',
  delivery: '納期重視',
  balanced: 'バランス型',
};

interface RecommendQuoteRow {
  supplier_id: number;
  supplier_name: string;
  unit_price: number;
  delivery_lead_days: number;
  supplier_rating: number;
  safety_score: number;
  quantity: number;
}

export default function PricesPage() {
  const [code, setCode] = useState('M-001');
  const [data, setData] = useState<Resp | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [quotes, setQuotes] = useState<RecommendQuoteRow[]>([
    { supplier_id: 1, supplier_name: '格安商事', unit_price: 800, delivery_lead_days: 14, supplier_rating: 55, safety_score: 60, quantity: 100 },
    { supplier_id: 2, supplier_name: '標準資材', unit_price: 1000, delivery_lead_days: 7, supplier_rating: 80, safety_score: 85, quantity: 100 },
    { supplier_id: 3, supplier_name: '高品質工業', unit_price: 1300, delivery_lead_days: 3, supplier_rating: 95, safety_score: 95, quantity: 100 },
  ]);
  const [recommend, setRecommend] = useState<RecommendResp | null>(null);

  const load = async () => {
    try {
      const r = await apiClient.get<Resp>('/prices/history', { params: { material_code: code } });
      setData(r.data);
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  const runRecommend = async () => {
    try {
      const r = await apiClient.post<RecommendResp>('/prices/recommend', {
        quotes,
        strategies: ['cheapest', 'quality', 'delivery'],
      });
      setRecommend(r.data);
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  const updateQuote = (idx: number, key: keyof RecommendQuoteRow, value: number | string) => {
    setQuotes((prev) =>
      prev.map((q, i) =>
        i === idx ? { ...q, [key]: typeof q[key] === 'number' ? Number(value) : value } : q,
      ),
    );
  };

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold">価格推移</h2>
      <div className="flex items-center gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="rounded border px-2 py-1 text-sm"
        />
        <button
          onClick={load}
          className="rounded bg-proc-primary px-3 py-1 text-sm text-white hover:bg-proc-accent"
        >
          表示
        </button>
      </div>
      {err && <p className="text-sm text-red-600">{err}</p>}
      {data && (
        <div className="rounded border bg-white p-4 shadow-sm">
          <h3 className="mb-2 font-bold">月次トレンド</h3>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <LineChart data={data.trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="avg_price" stroke="#0f766e" name="平均" />
                <Line type="monotone" dataKey="min_price" stroke="#16a34a" name="最小" />
                <Line type="monotone" dataKey="max_price" stroke="#dc2626" name="最大" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <h3 className="mb-2 mt-4 font-bold">明細</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-1 text-left">適用日</th>
                <th className="border p-1 text-right">単価</th>
                <th className="border p-1 text-left">ソース</th>
              </tr>
            </thead>
            <tbody>
              {data.history.map((h, idx) => (
                <tr key={idx}>
                  <td className="border p-1">{h.effective_date}</td>
                  <td className="border p-1 text-right">¥{h.unit_price.toLocaleString()}</td>
                  <td className="border p-1">{h.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="rounded border bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-bold">相見積 最適提案 (AI)</h3>
          <button
            type="button"
            onClick={runRecommend}
            className="rounded bg-proc-primary px-3 py-1 text-sm text-white hover:bg-proc-accent"
          >
            戦略別推薦を計算
          </button>
        </div>
        <table className="w-full text-xs">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-1 text-left">業者</th>
              <th className="border p-1 text-right">単価</th>
              <th className="border p-1 text-right">納期(日)</th>
              <th className="border p-1 text-right">評価</th>
              <th className="border p-1 text-right">安全</th>
              <th className="border p-1 text-right">数量</th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((q, i) => (
              <tr key={i}>
                <td className="border p-1">
                  <input
                    className="w-full"
                    value={q.supplier_name}
                    onChange={(e) => updateQuote(i, 'supplier_name', e.target.value)}
                  />
                </td>
                <td className="border p-1 text-right">
                  <input className="w-20 text-right" type="number" value={q.unit_price}
                    onChange={(e) => updateQuote(i, 'unit_price', e.target.value)} />
                </td>
                <td className="border p-1 text-right">
                  <input className="w-16 text-right" type="number" value={q.delivery_lead_days}
                    onChange={(e) => updateQuote(i, 'delivery_lead_days', e.target.value)} />
                </td>
                <td className="border p-1 text-right">
                  <input className="w-16 text-right" type="number" value={q.supplier_rating}
                    onChange={(e) => updateQuote(i, 'supplier_rating', e.target.value)} />
                </td>
                <td className="border p-1 text-right">
                  <input className="w-16 text-right" type="number" value={q.safety_score}
                    onChange={(e) => updateQuote(i, 'safety_score', e.target.value)} />
                </td>
                <td className="border p-1 text-right">
                  <input className="w-20 text-right" type="number" value={q.quantity}
                    onChange={(e) => updateQuote(i, 'quantity', e.target.value)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {recommend && (
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {recommend.recommendations.map((r) => (
              <div key={r.strategy} className="rounded border-l-4 border-proc-primary bg-gray-50 p-3">
                <div className="mb-1 text-xs uppercase text-gray-500">
                  {STRATEGY_LABEL[r.strategy] ?? r.strategy}
                </div>
                <div className="font-bold">{r.top.supplier_name}</div>
                <div className="text-xs text-gray-600">
                  単価 ¥{r.top.unit_price.toLocaleString()} / 納期 {r.top.delivery_lead_days}日
                </div>
                <div className="mt-1 text-sm">
                  総合スコア: <strong className="text-proc-primary">{r.top.total_score.toFixed(1)}</strong>
                </div>
                <div className="text-xs text-gray-500">
                  価格 {r.top.price_score.toFixed(0)} / 評価 {r.top.rating_score.toFixed(0)} /
                  納期 {r.top.delivery_score.toFixed(0)} / 安全 {r.top.safety_score.toFixed(0)}
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  概算合計: ¥{r.top.total_cost.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
