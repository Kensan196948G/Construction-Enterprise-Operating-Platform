import { useEffect, useState } from 'react';
import KpiTile from '../components/KpiTile';
import AlertBanner from '../components/AlertBanner';
import ForecastChart, { ForecastPoint } from '../components/ForecastChart';
import { api } from '../api/client';
import { useDashboardStore } from '../store';

type DeptPayload = Record<string, number | null | boolean | string>;

type Summary = {
  period: string;
  kpis: Record<string, number>;
  sources?: Record<string, DeptPayload>;
  departments?: Record<string, DeptPayload>;
  department_errors?: Record<string, string>;
  errors: string[];
};

// 10 部門の表示メタ (dept_code -> [日本語ラベル, 主要 KPI キー, 単位])
const DEPT_META: Record<string, { label: string; key: string; unit: string; fmt?: (v: number) => string }> = {
  dept02: { label: '02 営業本部', key: 'orders_amount', unit: '億', fmt: (v) => (v / 1e8).toFixed(1) },
  dept03: { label: '03 ソリューション営業', key: 'orders_amount', unit: '億', fmt: (v) => (v / 1e8).toFixed(1) },
  dept04: { label: '04 施工本部', key: 'profit_margin', unit: '%', fmt: (v) => (v * 100).toFixed(1) },
  dept05: { label: '05 技術本部', key: 'cost_ratio', unit: '%', fmt: (v) => (v * 100).toFixed(1) },
  dept06: { label: '06 安全品質環境', key: 'accident_count', unit: '件' },
  dept07: { label: '07 管理本部', key: 'labor_overtime_avg', unit: 'h', fmt: (v) => v.toFixed(1) },
  dept08: { label: '08 購買部', key: 'delay_ratio', unit: '%', fmt: (v) => (v * 100).toFixed(1) },
  dept09: { label: '09 船舶事業部', key: 'orders_amount', unit: '億', fmt: (v) => (v / 1e8).toFixed(1) },
  dept10: { label: '10 IT-DX', key: 'incident_count', unit: '件' },
  dept11: { label: '11 統合データ基盤', key: 'incident_count', unit: '件' },
};

async function downloadReport(period: string, fmt: 'markdown' | 'pdf'): Promise<void> {
  const r = await api.post('/reports/generate', null, {
    params: { period, include_pdf: fmt === 'pdf' },
  });
  const filename = `board_report_${period}.${fmt === 'pdf' ? 'pdf' : 'md'}`;
  let blob: Blob;
  if (fmt === 'pdf') {
    const b64 = r.data.pdf_base64 as string;
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    blob = new Blob([arr], { type: 'application/pdf' });
  } else {
    blob = new Blob([r.data.markdown], { type: 'text/markdown' });
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ExecutiveDashboardPage() {
  const period = useDashboardStore((s) => s.filters.period);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [forecast, setForecast] = useState<ForecastPoint[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get<Summary>('/dashboard/summary', { params: { period } })
      .then((r) => !cancelled && setSummary(r.data))
      .catch((e) => !cancelled && setError(e.message));
    // 予測 (12ヶ月) — エンドポイント未提供時は空グラフ
    api
      .get<{ predictions: ForecastPoint[] }>('/forecasts/profit-margin', {
        params: { horizon_months: 12 },
      })
      .then((r) => !cancelled && setForecast(r.data.predictions ?? []))
      .catch(() => {
        /* 失敗時は空のまま */
      });
    return () => {
      cancelled = true;
    };
  }, [period]);

  if (error) return <div className="text-rose-600">{error}</div>;
  if (!summary) return <div>読み込み中...</div>;

  const k = summary.kpis;
  const profitStatus =
    k.average_profit_margin >= 0.08 ? 'ok' : k.average_profit_margin >= 0.05 ? 'warn' : 'danger';
  const safetyStatus = k.accident_count === 0 ? 'ok' : k.accident_count <= 2 ? 'warn' : 'danger';

  // 部門別 KPI: aggregator が departments を返すケースを優先, 無ければ sources から組み立て
  const deptPayloads: Record<string, DeptPayload> = summary.departments ?? {};
  const deptErrors: Record<string, string> = summary.department_errors ?? {};

  const periodStr = period === 'current' ? '2026Q2' : period;

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h2 className="text-xl font-bold">経営ダッシュボード — {summary.period}</h2>
        <div className="space-x-2">
          <button
            type="button"
            className="rounded bg-exec-primary text-white px-3 py-1 text-sm"
            onClick={() => downloadReport(periodStr, 'markdown')}
          >
            報告書 (Markdown)
          </button>
          <button
            type="button"
            className="rounded bg-exec-primary text-white px-3 py-1 text-sm"
            onClick={() => downloadReport(periodStr, 'pdf')}
          >
            報告書 (PDF)
          </button>
        </div>
      </header>

      <section>
        <h3 className="font-semibold mb-2">全社 KPI</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiTile title="受注高 (億円)" value={(k.orders_amount / 1e8).toFixed(1)} unit="億" />
          <KpiTile
            title="平均利益率"
            value={(k.average_profit_margin * 100).toFixed(1)}
            unit="%"
            status={profitStatus}
          />
          <KpiTile title="原価率" value={(k.cost_ratio * 100).toFixed(1)} unit="%" />
          <KpiTile
            title="赤字案件"
            value={k.deficit_project_count}
            unit="件"
            status={k.deficit_project_count > 3 ? 'warn' : 'ok'}
          />
          <KpiTile title="事故件数" value={k.accident_count} unit="件" status={safetyStatus} />
          <KpiTile title="ヒヤリハット" value={k.near_miss_count} unit="件" />
          <KpiTile title="遅延案件" value={k.delayed_project_count} unit="件" />
          <KpiTile title="平均残業" value={k.labor_overtime_avg.toFixed(1)} unit="h" />
        </div>
      </section>

      <section>
        <h3 className="font-semibold mb-2">10部門別 KPI</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Object.entries(DEPT_META).map(([code, meta]) => {
            const payload = deptPayloads[code] ?? {};
            const failed = !!payload._failed || code in deptErrors;
            const raw = payload[meta.key];
            const value =
              typeof raw === 'number'
                ? meta.fmt
                  ? meta.fmt(raw)
                  : String(raw)
                : '—';
            return (
              <div key={code} className={failed ? 'opacity-40 grayscale' : ''}>
                <KpiTile
                  title={meta.label}
                  value={value}
                  unit={typeof raw === 'number' ? meta.unit : ''}
                  status={failed ? 'warn' : 'ok'}
                  hint={failed ? '取得失敗 (None埋め)' : meta.key}
                />
              </div>
            );
          })}
        </div>
      </section>

      {forecast.length > 0 && (
        <section>
          <h3 className="font-semibold mb-2">利益率 12ヶ月予測 (95% CI)</h3>
          <ForecastChart data={forecast} title="profit_margin forecast" />
        </section>
      )}

      {summary.errors.length > 0 && (
        <div className="rounded bg-amber-50 border-l-4 border-amber-400 p-3 text-xs">
          一部の他部門 API への接続が失敗しています ({summary.errors.length} 件)。
          失敗部門は灰色表示, KPI は None で集約されます。
        </div>
      )}

      <section>
        <h3 className="font-semibold mb-2">経営アラート (最新)</h3>
        <AlertBanner alerts={[]} />
      </section>
    </div>
  );
}
