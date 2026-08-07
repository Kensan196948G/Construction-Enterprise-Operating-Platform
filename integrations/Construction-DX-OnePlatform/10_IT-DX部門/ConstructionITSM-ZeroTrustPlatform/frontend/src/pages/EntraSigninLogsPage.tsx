import { useEffect, useState } from "react";
import { api } from "@/api/client";
import RiskIndicator from "@/components/RiskIndicator";

interface Signin {
  id: string;
  occurred_at: string;
  user: string;
  app: string;
  ip?: string;
  country?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  risk_state?: string;
  risk_level?: string;
  success: boolean;
}

export default function EntraSigninLogsPage() {
  const [items, setItems] = useState<Signin[]>([]);
  const [riskOnly, setRiskOnly] = useState(false);

  useEffect(() => {
    const params: Record<string, string> = {};
    if (riskOnly) params.risk_state = "atRisk";
    api.get<Signin[]>("/logs/entra/signins", { params }).then((r) => setItems(r.data)).catch(() => setItems([]));
  }, [riskOnly]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Entra ID サインインログ</h2>
        <label className="text-sm flex items-center gap-2">
          <input type="checkbox" checked={riskOnly} onChange={(e) => setRiskOnly(e.target.checked)} />
          リスクのみ
        </label>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-white rounded shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="text-left p-2">時刻</th>
                <th className="text-left p-2">ユーザー</th>
                <th className="text-left p-2">アプリ</th>
                <th className="text-left p-2">IP</th>
                <th className="text-left p-2">国</th>
                <th className="text-left p-2">リスク</th>
              </tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="p-2 text-xs">{s.occurred_at}</td>
                  <td className="p-2">{s.user}</td>
                  <td className="p-2">{s.app}</td>
                  <td className="p-2 text-xs">{s.ip}</td>
                  <td className="p-2">{s.country}</td>
                  <td className="p-2"><RiskIndicator level={s.risk_level ?? s.risk_state} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-white rounded shadow-sm p-3">
          <h3 className="font-semibold mb-2">地理分布</h3>
          <ul className="text-sm space-y-1">
            {items
              .filter((s) => s.latitude && s.longitude)
              .map((s) => (
                <li key={s.id}>
                  <RiskIndicator level={s.risk_level ?? s.risk_state} /> {s.city ?? "?"} ({s.latitude}, {s.longitude})
                </li>
              ))}
          </ul>
          <p className="text-xs text-slate-500 mt-2">
            * 本骨格では地図ライブラリ未統合のためテーブル表示のみ。Leaflet 等を後続で組込予定。
          </p>
        </div>
      </div>
    </div>
  );
}
