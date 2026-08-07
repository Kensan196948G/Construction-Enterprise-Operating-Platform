import { useEffect, useState } from 'react';
import { apiClient } from '@/api/client';

interface EAC {
  project_id: number;
  bac: number;
  ac: number;
  ev: number;
  cpi: number;
  eac: number;
  progress_rate: number;
}

export default function CostAnalysisPage() {
  const [projectId, setProjectId] = useState(1);
  const [eac, setEac] = useState<EAC | null>(null);

  useEffect(() => {
    apiClient
      .get<EAC>(`/cost-records/${projectId}/eac`)
      .then((r) => setEac(r.data))
      .catch(() => setEac(null));
  }, [projectId]);

  return (
    <section>
      <h2 className="text-xl font-bold mb-4">原価分析 (EAC)</h2>
      <input
        type="number"
        value={projectId}
        onChange={(e) => setProjectId(Number(e.target.value) || 1)}
        className="border rounded px-2 py-1 mb-4"
      />
      {eac ? (
        <div className="bg-white border rounded p-4 grid gap-2 max-w-md">
          <Row label="契約金額 (BAC)" value={eac.bac} />
          <Row label="累計実コスト (AC)" value={eac.ac} />
          <Row label="出来高 (EV)" value={eac.ev} />
          <Row label="CPI" value={eac.cpi} />
          <Row label="進捗率" value={`${(eac.progress_rate * 100).toFixed(1)}%`} />
          <div className="border-t pt-2 mt-2 font-bold">
            完成時総コスト予測 (EAC): ¥{eac.eac.toLocaleString()}
          </div>
        </div>
      ) : (
        <p className="text-gray-500">EAC を取得できません。</p>
      )}
    </section>
  );
}

function Row({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-600">{label}</span>
      <span className="font-mono">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </span>
    </div>
  );
}
