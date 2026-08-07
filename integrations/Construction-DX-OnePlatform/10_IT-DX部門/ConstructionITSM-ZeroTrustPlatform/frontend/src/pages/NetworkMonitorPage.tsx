import { useEffect, useState } from "react";
import { api } from "@/api/client";

interface CiscoEvent {
  time: string;
  device_name?: string;
  device_ip?: string;
  trap_oid?: string;
  severity?: string;
  message?: string;
}

export default function NetworkMonitorPage() {
  const [events, setEvents] = useState<CiscoEvent[]>([]);
  const [summary, setSummary] = useState<Record<string, number>>({});

  useEffect(() => {
    api.get<CiscoEvent[]>("/logs/cisco").then((r) => setEvents(r.data)).catch(() => setEvents([]));
    api
      .get<{ by_severity: Record<string, number> }>("/logs/cisco/summary")
      .then((r) => setSummary(r.data.by_severity))
      .catch(() => null);
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">ネットワーク監視 (Cisco SNMP)</h2>

      <div className="grid grid-cols-4 gap-3">
        {["high", "medium", "low", "info"].map((s) => (
          <div key={s} className="bg-white rounded shadow-sm p-3">
            <div className="text-xs text-slate-500 capitalize">{s}</div>
            <div className="text-xl font-bold">{summary[s] ?? 0}</div>
          </div>
        ))}
      </div>

      <table className="w-full bg-white rounded shadow-sm text-sm">
        <thead className="bg-slate-100">
          <tr>
            <th className="text-left p-2">時刻</th>
            <th className="text-left p-2">機器</th>
            <th className="text-left p-2">OID</th>
            <th className="text-left p-2">重要度</th>
            <th className="text-left p-2">メッセージ</th>
          </tr>
        </thead>
        <tbody>
          {events.map((e, i) => (
            <tr key={i} className="border-t">
              <td className="p-2 text-xs">{e.time}</td>
              <td className="p-2">{e.device_name ?? e.device_ip}</td>
              <td className="p-2 text-xs">{e.trap_oid}</td>
              <td className="p-2">{e.severity}</td>
              <td className="p-2">{e.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
