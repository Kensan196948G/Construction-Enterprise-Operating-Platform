import { useEffect, useState } from 'react';
import { apiClient } from '@/api/client';

interface CaseItem {
  id: number;
  case_code: string;
  title: string;
  client_name: string;
  category: string;
  completed_at?: string | null;
  contract_amount?: string | null;
  roi_percent?: string | null;
  customer_rating?: string | null;
  summary?: string | null;
  photo_urls?: Record<string, string> | null;
}

interface SimilarHit {
  case_id: number;
  title: string;
  score: number;
  similarity_percent: number;
}

export default function CasesPage() {
  const [items, setItems] = useState<CaseItem[]>([]);
  const [q, setQ] = useState('');
  const [aiMode, setAiMode] = useState(false);
  const [hits, setHits] = useState<SimilarHit[]>([]);
  const [loading, setLoading] = useState(false);

  // 通常検索 (タイトル/サマリ ILIKE)
  useEffect(() => {
    const t = setTimeout(() => {
      apiClient
        .get<CaseItem[]>('/cases', { params: q ? { q } : {} })
        .then((r) => setItems(r.data))
        .catch(() => setItems([]));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const onAiSearch = async () => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const r = await apiClient.get<SimilarHit[]>('/cases/similar', {
        params: { q, k: 5 },
      });
      setHits(r.data);
      setAiMode(true);
    } catch {
      setHits([]);
    } finally {
      setLoading(false);
    }
  };

  const findCase = (id: number) => items.find((c) => c.id === id);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">実績事例ギャラリー</h2>
        <div className="flex items-center gap-2">
          <input
            type="search"
            placeholder="検索 (タイトル / サマリ / AI 類似)"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setAiMode(false);
            }}
            className="rounded border px-2 py-1 text-sm"
          />
          <button
            type="button"
            onClick={onAiSearch}
            disabled={loading || !q.trim()}
            className="rounded bg-sol-primary px-3 py-1 text-white text-sm hover:bg-sol-accent disabled:opacity-50"
          >
            AI類似検索
          </button>
          {aiMode && (
            <button
              type="button"
              onClick={() => {
                setAiMode(false);
                setHits([]);
              }}
              className="text-xs text-gray-500 underline"
            >
              通常検索に戻す
            </button>
          )}
        </div>
      </div>

      {aiMode ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {hits.map((h) => {
            const c = findCase(h.case_id);
            return (
              <article key={h.case_id} className="rounded border bg-white overflow-hidden shadow-sm">
                <div className="px-3 py-1 text-xs text-white" style={{ backgroundColor: '#0ea5e9' }}>
                  類似度 {h.similarity_percent.toFixed(2)}%
                </div>
                <div className="p-3 space-y-1">
                  <h3 className="font-bold">{h.title}</h3>
                  {c && (
                    <p className="text-xs text-gray-600">
                      {c.client_name} / {c.category}
                    </p>
                  )}
                  {c?.summary && (
                    <p className="text-sm text-gray-700 line-clamp-3">{c.summary}</p>
                  )}
                </div>
              </article>
            );
          })}
          {hits.length === 0 && (
            <p className="col-span-full text-gray-500">類似事例が見つかりませんでした。</p>
          )}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => {
            const photos = c.photo_urls ? Object.values(c.photo_urls) : [];
            return (
              <article key={c.id} className="rounded border bg-white overflow-hidden shadow-sm">
                {photos[0] && (
                  <img
                    src={photos[0]}
                    alt={c.title}
                    className="w-full h-40 object-cover bg-gray-100"
                  />
                )}
                <div className="p-3 space-y-1">
                  <h3 className="font-bold">{c.title}</h3>
                  <p className="text-xs text-gray-600">
                    {c.client_name} / {c.category}
                  </p>
                  {c.summary && <p className="text-sm text-gray-700 line-clamp-3">{c.summary}</p>}
                  <div className="text-xs text-gray-500 mt-1 space-x-2">
                    {c.contract_amount && (
                      <span>金額 ¥{Number(c.contract_amount).toLocaleString()}</span>
                    )}
                    {c.roi_percent && <span>ROI {c.roi_percent}%</span>}
                    {c.customer_rating && <span>★ {c.customer_rating}</span>}
                  </div>
                </div>
              </article>
            );
          })}
          {items.length === 0 && (
            <p className="col-span-full text-gray-500">事例がありません。</p>
          )}
        </div>
      )}
    </div>
  );
}
