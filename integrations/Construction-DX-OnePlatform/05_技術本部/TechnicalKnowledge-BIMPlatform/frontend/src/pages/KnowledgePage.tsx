import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';

type Article = {
  id: number;
  title: string;
  doc_type: string | null;
  work_type: string | null;
  tags: string[] | null;
  status: string;
  author_name: string | null;
};

type SearchResult = {
  article: Article;
  score: number;
  score_percent: number;
};

export default function KnowledgePage() {
  const [q, setQ] = useState('');
  const [items, setItems] = useState<Article[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async (search?: string) => {
    setLoading(true);
    try {
      if (search) {
        const r = await apiClient.get<SearchResult[]>('/knowledge/search', {
          params: { q: search, k: 10 },
        });
        setResults(r.data);
        setItems([]);
      } else {
        const r = await apiClient.get<Article[]>('/knowledge');
        setItems(r.data);
        setResults([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">技術ナレッジ</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          load(q);
        }}
        className="flex gap-2"
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="例: 地盤改良 港湾"
          className="border rounded px-3 py-2 flex-1"
        />
        <button type="submit" className="bg-tech-primary text-white px-4 rounded">
          AI 検索
        </button>
      </form>
      {loading && <p>読み込み中…</p>}

      {results.length > 0 ? (
        <ul className="bg-white rounded shadow divide-y">
          {results.map((r) => (
            <li key={r.article.id} className="px-4 py-2 flex items-center justify-between gap-3">
              <div className="flex-1">
                <Link
                  to={`/knowledge/${r.article.id}`}
                  className="text-tech-primary hover:underline"
                >
                  {r.article.title}
                </Link>
                <div className="text-xs text-gray-500">
                  {r.article.doc_type ?? '-'} / {r.article.work_type ?? '-'} /{' '}
                  {r.article.author_name ?? '-'}
                </div>
              </div>
              <span
                className="text-xs font-mono bg-tech-accent/10 text-tech-accent rounded px-2 py-1"
                title={`cosine ${r.score.toFixed(3)}`}
              >
                類似度 {r.score_percent.toFixed(1)}%
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="bg-white rounded shadow divide-y">
          {items.map((a) => (
            <li key={a.id} className="px-4 py-2">
              <Link to={`/knowledge/${a.id}`} className="text-tech-primary hover:underline">
                {a.title}
              </Link>
              <div className="text-xs text-gray-500">
                {a.doc_type ?? '-'} / {a.work_type ?? '-'} / {a.author_name ?? '-'}
              </div>
            </li>
          ))}
          {!loading && items.length === 0 && (
            <li className="px-4 py-2 text-gray-400">記事がありません</li>
          )}
        </ul>
      )}
    </div>
  );
}
