import { useEffect, useState } from 'react';
import { apiClient } from '@/api/client';
import { CrewRosterCard } from '@/components/CrewRosterCard';

interface Crew {
  id: number;
  crew_code: string;
  full_name: string;
  rank: string;
  license_grade?: string | null;
  current_consecutive_days: number;
  sea_service_days_total: number;
}

interface ShiftAssignment {
  voyage_id: number;
  voyage_no: string;
  crew_id: number;
  crew_code: string;
  rank: string;
  start_date: string;
  end_date: string;
}

interface UnfilledRow {
  voyage_id: number;
  rank: string;
  missing: number;
}

interface ScheduleResp {
  assignments: ShiftAssignment[];
  violations: string[];
  warnings: string[];
  unfilled: UnfilledRow[];
}

export default function CrewPage() {
  const [crew, setCrew] = useState<Crew[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [scheduleResp, setScheduleResp] = useState<ScheduleResp | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiClient
      .get<Crew[]>('/crew')
      .then((r) => setCrew(r.data))
      .catch((e) => setErr(e.message));
  }, []);

  const overLimit = crew.filter((c) => c.current_consecutive_days >= 30).length;

  async function runScheduleOptimize() {
    setLoading(true);
    setErr(null);
    try {
      const r = await apiClient.post<ScheduleResp>('/crew/schedule-optimize', {});
      setScheduleResp(r.data);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-bold">乗組員</h2>
        <div className="flex items-center gap-3">
          {overLimit > 0 && (
            <div className="rounded bg-marine-danger px-3 py-1 text-sm text-white">
              ⚠ 連続乗船 30 日超: {overLimit} 名
            </div>
          )}
          <button
            type="button"
            onClick={runScheduleOptimize}
            disabled={loading}
            className="rounded bg-marine-accent px-3 py-1 text-sm text-white disabled:opacity-50"
          >
            {loading ? '最適化中…' : 'シフト最適化'}
          </button>
        </div>
      </div>
      {err && <p className="text-sm text-red-600">{err}</p>}

      <div className="grid gap-3 md:grid-cols-3">
        {crew.map((c) => (
          <CrewRosterCard key={c.id} crew={c} maxConsecutive={30} />
        ))}
        {!crew.length && (
          <p className="text-sm text-gray-400">乗組員が登録されていません</p>
        )}
      </div>

      {scheduleResp && (
        <div className="space-y-3">
          {scheduleResp.violations.length > 0 && (
            <div className="rounded border border-red-400 bg-red-50 p-3">
              <h4 className="mb-1 text-sm font-bold text-red-700">違反 ({scheduleResp.violations.length} 件)</h4>
              <ul className="list-disc pl-5 text-xs text-red-700">
                {scheduleResp.violations.map((v, i) => (
                  <li key={i}>{v}</li>
                ))}
              </ul>
            </div>
          )}
          {scheduleResp.warnings.length > 0 && (
            <div className="rounded border border-yellow-400 bg-yellow-50 p-3">
              <h4 className="mb-1 text-sm font-bold text-yellow-700">警告 ({scheduleResp.warnings.length} 件)</h4>
              <ul className="list-disc pl-5 text-xs text-yellow-700">
                {scheduleResp.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="rounded border bg-white p-3 shadow-sm">
            <h4 className="mb-2 text-sm font-bold">割当結果 ({scheduleResp.assignments.length} 件)</h4>
            {scheduleResp.assignments.length === 0 ? (
              <p className="text-xs text-gray-400">割当はありません</p>
            ) : (
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="p-2">航海</th>
                    <th className="p-2">乗組員</th>
                    <th className="p-2">役職</th>
                    <th className="p-2">期間</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduleResp.assignments.map((a, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2 font-mono">{a.voyage_no}</td>
                      <td className="p-2 font-mono">{a.crew_code}</td>
                      <td className="p-2">{a.rank}</td>
                      <td className="p-2">{a.start_date} → {a.end_date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
