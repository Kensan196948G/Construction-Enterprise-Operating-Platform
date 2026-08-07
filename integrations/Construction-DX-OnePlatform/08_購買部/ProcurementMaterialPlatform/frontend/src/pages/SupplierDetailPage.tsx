import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '@/api/client';
import { SupplierRankBadge } from '@/components/SupplierRankBadge';

interface Supplier {
  id: number;
  supplier_code: string;
  company_name: string;
  category: string;
  construction_license_no: string | null;
  qualified_invoice_no: string | null;
  credit_limit: number | null;
  evaluation_rank: string | null;
  evaluation_score: number | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
}

interface EvalResult {
  rank: string;
  total_score: number;
  breakdown: Record<string, number>;
}

interface AiEvalResult {
  supplier_id: number;
  supplier_name: string;
  base_rank: string;
  base_score: number;
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high';
  trend: 'improving' | 'stable' | 'declining';
  summary: string;
  factors: Record<string, number>;
  powered_by: string;
}

const RISK_COLOR: Record<string, string> = {
  low: 'bg-proc-ok/20 text-proc-ok',
  medium: 'bg-proc-warn/20 text-proc-warn',
  high: 'bg-proc-danger/20 text-proc-danger',
};

const TREND_LABEL: Record<string, string> = {
  improving: '改善傾向 ↑',
  stable: '横ばい →',
  declining: '悪化傾向 ↓',
};

export default function SupplierDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState<Supplier | null>(null);
  const [evalResult, setEvalResult] = useState<EvalResult | null>(null);
  const [aiEval, setAiEval] = useState<AiEvalResult | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<Supplier>(`/suppliers/${id}`)
      .then((r) => setData(r.data))
      .catch((e) => setErr(e.message));
  }, [id]);

  const runAiEvaluation = async () => {
    try {
      const r = await apiClient.get<AiEvalResult>(`/suppliers/${id}/ai-evaluation`);
      setAiEval(r.data);
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  const runEvaluation = async () => {
    try {
      const res = await apiClient.post<EvalResult>(`/suppliers/${id}/evaluate`, {
        on_time_delivery_rate: 0.95,
        defect_rate: 0.02,
        average_price_ratio: 1.05,
        accidents_last_year: 0,
        orders_last_year: 25,
      });
      setEvalResult(res.data);
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  if (err) return <p className="text-sm text-red-600">{err}</p>;
  if (!data) return <p>読み込み中...</p>;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold">{data.company_name}</h2>
        <SupplierRankBadge rank={data.evaluation_rank} score={data.evaluation_score} />
      </div>
      <dl className="grid gap-2 rounded border bg-white p-4 text-sm shadow-sm md:grid-cols-2">
        <Row k="コード" v={data.supplier_code} />
        <Row k="カテゴリ" v={data.category} />
        <Row k="建設業許可番号" v={data.construction_license_no ?? '-'} />
        <Row k="適格請求書事業者番号" v={data.qualified_invoice_no ?? '-'} />
        <Row k="与信限度額" v={data.credit_limit ? `¥${data.credit_limit.toLocaleString()}` : '-'} />
        <Row k="連絡先" v={data.contact_email ?? data.contact_phone ?? '-'} />
        <Row k="住所" v={data.address ?? '-'} />
      </dl>
      <div className="rounded border bg-white p-4 shadow-sm">
        <h3 className="mb-2 font-bold">評価実行 (サンプル指標)</h3>
        <button
          type="button"
          onClick={runEvaluation}
          className="rounded bg-proc-primary px-3 py-1 text-sm text-white hover:bg-proc-accent"
        >
          評価を再計算
        </button>
        {evalResult && (
          <div className="mt-3 space-y-1 text-sm">
            <div>
              総合: <strong>{evalResult.total_score}</strong> → ランク{' '}
              <SupplierRankBadge rank={evalResult.rank} />
            </div>
            <ul className="ml-4 list-disc text-xs">
              {Object.entries(evalResult.breakdown).map(([k, v]) => (
                <li key={k}>
                  {k}: {v}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="rounded border bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-bold">AI 評価レポート</h3>
          <button
            type="button"
            onClick={runAiEvaluation}
            className="rounded bg-proc-primary px-3 py-1 text-sm text-white hover:bg-proc-accent"
          >
            AI 評価を実行
          </button>
        </div>
        {aiEval && (
          <div className="space-y-2 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <SupplierRankBadge rank={aiEval.base_rank} score={aiEval.base_score} />
              <span className={`rounded px-2 py-0.5 text-xs ${RISK_COLOR[aiEval.risk_level]}`}>
                リスク: {aiEval.risk_level} ({aiEval.risk_score.toFixed(0)})
              </span>
              <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                {TREND_LABEL[aiEval.trend]}
              </span>
              <span className="ml-auto text-xs text-gray-400">powered by {aiEval.powered_by}</span>
            </div>
            <p className="rounded bg-gray-50 p-3 text-sm leading-relaxed">{aiEval.summary}</p>
            <details className="text-xs text-gray-600">
              <summary className="cursor-pointer">寄与因子</summary>
              <ul className="ml-4 list-disc">
                {Object.entries(aiEval.factors).map(([k, v]) => (
                  <li key={k}>
                    {k}: {v}
                  </li>
                ))}
              </ul>
            </details>
          </div>
        )}
      </div>
    </section>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-40 text-gray-500">{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}
