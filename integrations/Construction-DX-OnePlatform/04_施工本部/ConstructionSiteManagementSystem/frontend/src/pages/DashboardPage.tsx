import { useEffect, useState } from 'react';
import { apiClient } from '@/api/client';

interface Project {
  id: number;
  project_code: string;
  project_name: string;
  status: string;
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<Project[]>('/projects')
      .then((r) => setProjects(r.data))
      .catch((e) => setErr(e.message));
  }, []);

  return (
    <section>
      <h2 className="text-xl font-bold mb-4">現場ダッシュボード</h2>
      {err && <p className="text-red-600 text-sm">{err}</p>}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <div key={p.id} className="bg-white border rounded p-4 shadow-sm">
            <div className="text-xs text-gray-500">{p.project_code}</div>
            <div className="font-semibold">{p.project_name}</div>
            <div className="text-xs mt-2 inline-block bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
              {p.status}
            </div>
          </div>
        ))}
        {projects.length === 0 && !err && <p className="text-gray-500">プロジェクトがありません。</p>}
      </div>
    </section>
  );
}
