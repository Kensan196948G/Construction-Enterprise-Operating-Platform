import { useEffect, useState } from "react";
import { ChartWrapper } from "@cdx/shared-ui";
import { api, endpoints } from "../api/client";

interface AccidentStats {
  injuries: number;
  lost_days: number;
  total_work_hours: number;
  frequency_rate: number;
  severity_rate: number;
}

interface MonthlyTrend {
  month: string;
  frequency_rate: number;
  severity_rate: number;
  injuries: number;
  lost_days: number;
}

interface FourMSummary {
  by_4m_count: Record<string, number>;
  by_4m_severity: Record<string, number>;
  total_records: number;
}

interface CapaStatus {
  total: number;
  stale_count: number;
  overdue_count: number;
  by_stage: Record<string, number>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<AccidentStats | null>(null);
  const [trend, setTrend] = useState<MonthlyTrend[]>([]);
  const [fourM, setFourM] = useState<FourMSummary | null>(null);
  const [capa, setCapa] = useState<CapaStatus | null>(null);
  const [co2, setCo2] = useState<Record<string, number>>({});

  useEffect(() => {
    api
      .get<AccidentStats>(`${endpoints.accidentsStats}?total_work_hours=1000000`)
      .then((r) => setStats(r.data))
      .catch(() => {});
    api
      .get<{ series: MonthlyTrend[] }>(`${endpoints.accidentsMonthlyTrend}?months=12`)
      .then((r) => setTrend(r.data.series))
      .catch(() => {});
    api
      .get<FourMSummary>(endpoints.nearMissFourMSummary)
      .then((r) => setFourM(r.data))
      .catch(() => {});
    api
      .get<CapaStatus>(endpoints.nonconformityCapaStatus)
      .then((r) => setCapa(r.data))
      .catch(() => {});
    api
      .get(endpoints.co2)
      .then((r) => setCo2(r.data.by_scope || {}))
      .catch(() => {});
  }, []);

  const fourMData = fourM
    ? Object.entries(fourM.by_4m_count).map(([k, v]) => ({ name: k, value: v }))
    : [];
  const co2Data = Object.entries(co2).map(([scope, v]) => ({
    scope,
    emission: Number(v),
  }));
  const trendData = trend.map((t) => ({
    month: t.month,
    度数率: t.frequency_rate,
    強度率: t.severity_rate,
  }));

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-3" aria-label="ダッシュボード">
      {/* KPI カード */}
      <div
        className="bg-white p-4 rounded-xl shadow"
        role="region"
        aria-label="安全指標"
      >
        <h2 className="font-bold mb-2">安全指標 (労安法/ISO45001)</h2>
        <p className="text-sm">
          度数率: <b>{stats?.frequency_rate?.toFixed(2) ?? "-"}</b>
        </p>
        <p className="text-sm">
          強度率: <b>{stats?.severity_rate?.toFixed(3) ?? "-"}</b>
        </p>
        <p className="text-xs text-slate-500 mt-2">
          延べ労働時間: {stats?.total_work_hours ?? 0}h
        </p>
      </div>

      <div
        className="bg-white p-4 rounded-xl shadow"
        role="region"
        aria-label="CAPA 滞留状況"
      >
        <h2 className="font-bold mb-2">CAPA 滞留</h2>
        <p className="text-sm">
          滞留 (30日以上):{" "}
          <b className={capa && capa.stale_count > 0 ? "text-cdx-safety" : ""}>
            {capa?.stale_count ?? 0}
          </b>{" "}
          / {capa?.total ?? 0}
        </p>
        <p className="text-sm">
          期限超過: <b>{capa?.overdue_count ?? 0}</b>
        </p>
        {capa && (
          <p className="text-xs text-slate-500 mt-2">
            open: {capa.by_stage.open ?? 0} / corrected:{" "}
            {capa.by_stage.corrected ?? 0} / verified:{" "}
            {capa.by_stage.verified ?? 0}
          </p>
        )}
      </div>

      <div
        className="bg-white p-4 rounded-xl shadow"
        role="region"
        aria-label="環境指標"
      >
        <h2 className="font-bold mb-2">環境指標 (CO2)</h2>
        <p className="text-sm">
          CO2 合計:{" "}
          <b>
            {Object.values(co2)
              .reduce((a, b) => a + Number(b), 0)
              .toFixed(2)}
          </b>{" "}
          tCO2e
        </p>
        <p className="text-xs text-slate-500 mt-2">Scope1/2/3 内訳は下グラフ</p>
      </div>

      {/* 月次推移 (Line) */}
      <div className="md:col-span-3" role="region" aria-label="度数率/強度率 月次推移">
        <ChartWrapper
          type="line"
          title="度数率 / 強度率 月次推移"
          data={trendData}
          xKey="month"
          height={260}
          series={[
            { dataKey: "度数率", name: "度数率", color: "#dc2626" },
            { dataKey: "強度率", name: "強度率", color: "#0ea5e9" },
          ]}
        />
      </div>

      {/* 4M 円グラフ */}
      <div className="md:col-span-2" role="region" aria-label="4M 分析">
        <ChartWrapper
          type="pie"
          title={`4M 分析 (合計 ${fourM?.total_records ?? 0} 件)`}
          data={fourMData}
          xKey="name"
          series={[{ dataKey: "value", name: "件数" }]}
          height={260}
        />
      </div>

      {/* CO2 バーチャート */}
      <div role="region" aria-label="CO2 Scope 別">
        <ChartWrapper
          type="bar"
          title="CO2 排出 (Scope1/2/3)"
          data={co2Data}
          xKey="scope"
          series={[{ dataKey: "emission", name: "tCO2e", color: "#16a34a" }]}
          height={260}
        />
      </div>
    </div>
  );
}
