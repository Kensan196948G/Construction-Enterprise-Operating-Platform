import { useEffect, useState } from 'react';
import { api } from '../api/client';

type Report = {
  id: number;
  report_code: string;
  fiscal_year: number;
  fiscal_period: string;
  title: string;
  ai_summary?: string | null;
  status: string;
};

export default function BoardReportPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [markdown, setMarkdown] = useState<string>('');

  useEffect(() => {
    api.get<Report[]>('/reports').then((r) => setReports(r.data)).catch(() => setReports([]));
  }, []);

  async function generate() {
    const today = new Date().toISOString().slice(0, 10);
    const r = await api.post<Report>('/reports/generate', {
      fiscal_year: new Date().getFullYear(),
      fiscal_period: `${new Date().getFullYear()}Q${Math.ceil((new Date().getMonth() + 1) / 3)}`,
      report_date: today,
      forecasts: [],
      alerts: [],
      esg: {},
    });
    setReports((prev) => [r.data, ...prev]);
  }

  async function preview(id: number) {
    const r = await api.get<string>(`/reports/${id}/markdown`);
    setMarkdown(r.data);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">取締役会報告書</h2>
      <button onClick={generate} className="bg-exec-primary text-white text-sm px-3 py-1 rounded">
        新規生成
      </button>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ul className="space-y-2 md:col-span-1">
          {reports.map((r) => (
            <li key={r.id} className="bg-white rounded shadow-sm p-3">
              <div className="text-xs text-slate-500">{r.report_code}</div>
              <div className="font-semibold">{r.title}</div>
              <div className="text-xs text-slate-500">{r.fiscal_period} ({r.status})</div>
              <button
                onClick={() => preview(r.id)}
                className="mt-2 text-xs text-exec-accent underline"
              >
                プレビュー
              </button>
              <a
                href={`/api/v1/reports/${r.id}/pdf`}
                className="ml-3 text-xs text-exec-accent underline"
              >
                PDF (stub)
              </a>
            </li>
          ))}
        </ul>
        <pre className="md:col-span-2 bg-white rounded shadow-sm p-3 text-xs whitespace-pre-wrap font-mono">
          {markdown || '（プレビューをクリックすると Markdown が表示されます）'}
        </pre>
      </div>
    </div>
  );
}
