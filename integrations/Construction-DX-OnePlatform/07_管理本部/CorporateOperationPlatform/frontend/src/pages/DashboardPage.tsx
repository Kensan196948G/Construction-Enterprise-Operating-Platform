import { useEffect, useState } from "react";
import { api, endpoints } from "../api/client";
import { BalanceChip } from "../components/BalanceChip";

interface Kpi {
  revenue: number;
  expense: number;
  net_income: number;
  profit_margin_pct: number;
  cost_total: number;
  accounts_receivable: number;
  accounts_payable: number;
  cash_flow_projection: number;
  bs_balanced: boolean;
}

function Card({
  title,
  value,
  sub,
}: {
  title: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="bg-white p-4 rounded-xl shadow">
      <h2 className="font-bold mb-1 text-sm text-slate-600">{title}</h2>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

function yen(n: number): string {
  return `¥${Math.round(n).toLocaleString("ja-JP")}`;
}

export default function DashboardPage() {
  const [kpi, setKpi] = useState<Kpi | null>(null);

  useEffect(() => {
    api
      .get<Kpi>(endpoints.kpi)
      .then((r) => setKpi(r.data))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-4">
      <header className="flex items-center gap-3">
        <h1 className="text-xl font-bold">経営ダッシュボード</h1>
        {kpi && <BalanceChip balanced={kpi.bs_balanced} />}
      </header>
      <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
        <Card title="売上高" value={yen(kpi?.revenue ?? 0)} />
        <Card
          title="営業利益"
          value={yen(kpi?.net_income ?? 0)}
          sub={`利益率 ${kpi?.profit_margin_pct?.toFixed(1) ?? "0"}%`}
        />
        <Card title="工事原価" value={yen(kpi?.cost_total ?? 0)} />
        <Card title="売掛金" value={yen(kpi?.accounts_receivable ?? 0)} />
        <Card title="買掛金" value={yen(kpi?.accounts_payable ?? 0)} />
        <Card
          title="キャッシュフロー予測"
          value={yen(kpi?.cash_flow_projection ?? 0)}
          sub="売掛 - 買掛"
        />
      </div>
    </div>
  );
}
