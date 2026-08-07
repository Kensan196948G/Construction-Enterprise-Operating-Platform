import { useState } from 'react';
import FeasibilityRadar from '@/components/FeasibilityRadar';
import GoNoGoBadge from '@/components/GoNoGoBadge';
import { apiClient } from '@/api/client';

export default function FeasibilityPage() {
  const [tech, setTech] = useState(70);
  const [legal, setLegal] = useState(70);
  const [env, setEnv] = useState(70);
  const [biz, setBiz] = useState(70);
  const [result, setResult] = useState<{ total_score: number; decision: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const handleScore = async () => {
    try {
      const r = await apiClient.post<{ total_score: number; decision: string }>(
        '/feasibility/score',
        {
          technical_score: tech,
          legal_score: legal,
          environment_score: env,
          business_score: biz,
        },
      );
      setResult(r.data);
      setErr(null);
    } catch (e) {
      setErr(String(e));
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">実現可能性スタディ (F/S)</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded border bg-white p-4 space-y-3">
          <Slider label="技術 (0.30)" value={tech} onChange={setTech} />
          <Slider label="法務 (0.20)" value={legal} onChange={setLegal} />
          <Slider label="環境 (0.20)" value={env} onChange={setEnv} />
          <Slider label="事業性 (0.30)" value={biz} onChange={setBiz} />
          <button
            type="button"
            onClick={handleScore}
            className="rounded bg-sol-primary px-4 py-2 text-white hover:bg-sol-accent"
          >
            スコア計算
          </button>
          {err && <p className="text-rose-600 text-sm">{err}</p>}
          {result && (
            <div className="flex items-center gap-4 mt-3">
              <div>
                <div className="text-xs text-gray-500">総合スコア</div>
                <div className="text-3xl font-bold">{result.total_score}</div>
              </div>
              <GoNoGoBadge decision={result.decision as 'GO' | 'HOLD' | 'NO_GO'} />
            </div>
          )}
        </div>
        <div className="rounded border bg-white p-4">
          <FeasibilityRadar
            technical={tech}
            legal={legal}
            environment={env}
            business={biz}
          />
        </div>
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-bold">{value}</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </label>
  );
}
