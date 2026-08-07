import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';

type Stats = {
  article_count: number;
  bim_count: number;
  cim_count: number;
  drawing_count: number;
  open_inquiry_count: number;
};

type Popular = { id: number; title: string; view_count: number; like_count: number };

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [popular, setPopular] = useState<Popular[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<Stats>('/dashboard/stats')
      .then((r) => setStats(r.data))
      .catch((e) => setError(e.message));
    apiClient
      .get<Popular[]>('/dashboard/popular-articles')
      .then((r) => setPopular(r.data))
      .catch(() => undefined);
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">ダッシュボード</h2>
      {error && <p className="text-tech-danger">読み込みエラー: {error}</p>}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="技術ナレッジ" value={stats?.article_count} />
        <StatCard label="BIM モデル" value={stats?.bim_count} />
        <StatCard label="CIM データ" value={stats?.cim_count} />
        <StatCard label="標準図" value={stats?.drawing_count} />
        <StatCard label="未解決問合せ" value={stats?.open_inquiry_count} />
      </div>
      <section>
        <h3 className="text-lg font-semibold mb-2">人気記事</h3>
        <ul className="bg-white rounded shadow divide-y">
          {popular.map((p) => (
            <li key={p.id} className="px-4 py-2 flex justify-between">
              <span>{p.title}</span>
              <span className="text-gray-500 text-sm">
                {p.view_count} views / {p.like_count} likes
              </span>
            </li>
          ))}
          {popular.length === 0 && <li className="px-4 py-2 text-gray-400">記事がありません</li>}
        </ul>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value?: number }) {
  return (
    <div className="bg-white rounded shadow p-4">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-bold text-tech-primary">{value ?? '—'}</div>
    </div>
  );
}
