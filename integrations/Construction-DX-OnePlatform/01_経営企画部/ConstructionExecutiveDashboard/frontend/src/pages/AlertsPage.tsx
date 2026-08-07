import { useCallback, useEffect, useState } from "react";
import AlertBanner from "../components/AlertBanner";
import { api } from "../api/client";

type Alert = {
  id: number;
  level: "critical" | "warning" | "info";
  title: string;
  message: string;
  triggered_at: string;
  status: string;
  category: string;
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<string>("open");

  const load = useCallback(() => {
    api
      .get<Alert[]>("/alerts", { params: { status: filter } })
      .then((r) => setAlerts(r.data))
      .catch(() => setAlerts([]));
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function trigger() {
    await api.post("/alerts/evaluate");
    load();
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">経営アラート</h2>
      <div className="flex gap-2 items-center">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="open">未解決</option>
          <option value="acknowledged">承認済</option>
          <option value="resolved">解決済</option>
        </select>
        <button
          onClick={trigger}
          className="bg-exec-primary text-white text-sm px-3 py-1 rounded"
        >
          アラート評価実行
        </button>
      </div>
      <AlertBanner alerts={alerts} />
    </div>
  );
}
