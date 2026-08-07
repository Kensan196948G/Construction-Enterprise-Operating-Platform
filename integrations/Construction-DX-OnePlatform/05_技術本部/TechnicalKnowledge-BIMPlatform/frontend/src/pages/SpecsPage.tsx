import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';

type Spec = {
  id: number;
  spec_code: string;
  spec_name: string;
  work_type: string | null;
  related_laws: string[] | null;
  version: number;
  ai_summary: string | null;
};

type SummaryResponse = {
  spec_id: number;
  summary: string;
  line_count: number;
  source: string;
};

export default function SpecsPage() {
  const [items, setItems] = useState<Spec[]>([]);
  const [summarizing, setSummarizing] = useState<number | null>(null);

  const load = async () => {
    try {
      const r = await apiClient.get<Spec[]>('/specs');
      setItems(r.data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    load();
  }, []);

  const summarize = async (id: number) => {
    setSummarizing(id);
    try {
      const r = await apiClient.post<SummaryResponse>(`/specs/${id}/summarize`);
      setItems((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ai_summary: r.data.summary } : s)),
      );
    } finally {
      setSummarizing(null);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">仕様書</h2>
      <ul className="bg-white rounded shadow divide-y">
        {items.map((s) => (
          <li key={s.id} className="px-4 py-3 space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">
                <span className="font-mono text-xs mr-2">{s.spec_code}</span>
                {s.spec_name}
              </span>
              <span className="text-xs text-gray-500">v{s.version}</span>
            </div>
            <div className="text-xs text-gray-500">
              工種: {s.work_type ?? '-'} / 関連法規:{' '}
              {s.related_laws && s.related_laws.length > 0 ? s.related_laws.join(', ') : '-'}
            </div>
            {s.ai_summary ? (
              <div className="text-xs bg-tech-accent/5 border border-tech-accent/30 rounded p-2 whitespace-pre-wrap">
                <span className="font-semibold text-tech-accent">AI 要約:</span>
                {'\n'}
                {s.ai_summary}
              </div>
            ) : (
              <div className="text-xs text-gray-400">AI 要約未生成</div>
            )}
            <button
              type="button"
              onClick={() => summarize(s.id)}
              disabled={summarizing === s.id}
              className="text-xs border border-tech-primary text-tech-primary px-2 py-1 rounded hover:bg-tech-primary hover:text-white disabled:opacity-50"
            >
              {summarizing === s.id ? 'AI 要約生成中…' : 'AI 要約を生成'}
            </button>
          </li>
        ))}
        {items.length === 0 && <li className="px-4 py-2 text-gray-400">仕様書が未登録です</li>}
      </ul>
    </div>
  );
}
