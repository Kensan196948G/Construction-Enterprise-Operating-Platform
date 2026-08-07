import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/api/client';
import { ApprovalStepIndicator } from '@/components/ApprovalStepIndicator';

interface PR {
  id: number;
  request_no: string;
  project_code: string | null;
  estimated_total: number;
  status: string;
  current_approval_step: number;
  total_approval_steps: number;
  requester_name?: string;
}

export default function ApprovalsPage() {
  const [items, setItems] = useState<PR[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const reload = useCallback(
    () =>
      apiClient
        .get<PR[]>('/requests')
        .then((r) => setItems(r.data.filter((x) => ['submitted', 'approving'].includes(x.status))))
        .catch((e) => setErr(e.message)),
    [],
  );

  useEffect(() => {
    reload();
  }, [reload]);

  const decide = async (id: number, decision: 'approve' | 'reject') => {
    try {
      await apiClient.post(`/requests/${id}/approve`, { decision });
      await reload();
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  return (
    <section>
      <h2 className="mb-4 text-xl font-bold">承認待ち</h2>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <div className="space-y-3">
        {items.map((r) => (
          <div key={r.id} className="rounded border bg-white p-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <span className="font-bold">{r.request_no}</span>
                <span className="ml-2 text-sm text-gray-500">
                  {r.project_code ?? '-'} / ¥{Number(r.estimated_total).toLocaleString()}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => decide(r.id, 'approve')}
                  className="rounded bg-proc-ok px-3 py-1 text-xs text-white hover:opacity-90"
                >
                  承認
                </button>
                <button
                  onClick={() => decide(r.id, 'reject')}
                  className="rounded bg-proc-danger px-3 py-1 text-xs text-white hover:opacity-90"
                >
                  却下
                </button>
              </div>
            </div>
            <ApprovalStepIndicator
              currentStep={r.current_approval_step}
              totalSteps={r.total_approval_steps}
              status={r.status}
            />
          </div>
        ))}
        {items.length === 0 && <p className="text-gray-500">承認待ちの依頼はありません。</p>}
      </div>
    </section>
  );
}
