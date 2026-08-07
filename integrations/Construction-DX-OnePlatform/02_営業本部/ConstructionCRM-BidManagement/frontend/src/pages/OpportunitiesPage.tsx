import { useEffect, useState } from 'react';
import { apiClient } from '@/api/client';
import { PipelineKanban, type KanbanOpportunity } from '@/components/PipelineKanban';

interface ForecastBucket {
  period: string;
  opportunity_count: number;
  gross_amount: number;
  weighted_amount: number;
  lower_bound?: number | null;
  upper_bound?: number | null;
}

interface Forecast {
  total_count: number;
  total_gross_amount: number;
  total_weighted_amount: number;
  buckets: ForecastBucket[];
  model_used?: string;
  average_risk_score?: number;
}

export default function OpportunitiesPage() {
  const [items, setItems] = useState<KanbanOpportunity[]>([]);
  const [forecast, setForecast] = useState<Forecast | null>(null);

  useEffect(() => {
    apiClient.get<KanbanOpportunity[]>('/opportunities').then((r) => setItems(r.data));
    apiClient.get<Forecast>('/opportunities/forecast/summary').then((r) => setForecast(r.data));
  }, []);

  const handleStageChange = async (id: number, nextStage: string): Promise<void> => {
    // PATCH /opportunities/{id} を呼び、楽観的更新は Kanban 側で完了済み。
    // 失敗時は throw して Kanban 側でロールバック。
    await apiClient.patch(`/opportunities/${id}`, { stage: nextStage });
    setItems((prev) =>
      prev.map((o) => (o.id === id ? { ...o, stage: nextStage } : o)),
    );
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">案件パイプライン</h2>
      {forecast && (
        <div className="rounded border bg-white p-3 text-sm flex flex-wrap gap-6">
          <span>案件数: {forecast.total_count}</span>
          <span>パイプライン合計: {forecast.total_gross_amount.toLocaleString()}円</span>
          <span>加重期待値: {forecast.total_weighted_amount.toLocaleString()}円</span>
          {forecast.model_used && (
            <span className="text-gray-500">モデル: {forecast.model_used}</span>
          )}
          {typeof forecast.average_risk_score === 'number' && (
            <span className="text-rose-600">
              平均失注リスク: {(forecast.average_risk_score * 100).toFixed(1)}%
            </span>
          )}
        </div>
      )}
      <PipelineKanban opportunities={items} onStageChange={handleStageChange} />
    </div>
  );
}
