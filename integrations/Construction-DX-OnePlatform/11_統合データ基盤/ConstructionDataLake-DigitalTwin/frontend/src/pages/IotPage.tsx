import { useEffect, useMemo, useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "@/api/client";
import DeviceCard from "@/components/DeviceCard";

interface Device {
  device_id: string;
  name: string;
  kind: string;
  status: string;
  location_name: string | null;
  last_seen_at: string | null;
}
interface TelemetryRow {
  time: string;
  device_id: string;
  metric_kind: string;
  payload: { value?: number; [k: string]: unknown };
}

export default function IotPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [active, setActive] = useState<Device | null>(null);
  const [telemetry, setTelemetry] = useState<TelemetryRow[]>([]);

  useEffect(() => {
    api.get<Device[]>("/iot/devices").then((r) => setDevices(r.data)).catch(() => setDevices([]));
  }, []);

  useEffect(() => {
    if (!active) return;
    api
      .get<{ items: TelemetryRow[] }>("/iot/telemetry", { params: { device_id: active.device_id, limit: 200 } })
      .then((r) => setTelemetry(r.data.items))
      .catch(() => setTelemetry([]));
  }, [active]);

  const chart = useMemo(
    () =>
      telemetry
        .slice()
        .reverse()
        .map((t) => ({ time: t.time, value: typeof t.payload.value === "number" ? t.payload.value : null })),
    [telemetry]
  );

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">IoT</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {devices.length === 0 ? (
          <p className="col-span-4 text-slate-400 text-sm">デバイス未登録</p>
        ) : (
          devices.map((d) => (
            <button key={d.device_id} onClick={() => setActive(d)} className="text-left">
              <DeviceCard device={d} />
            </button>
          ))
        )}
      </div>

      {active && (
        <div className="bg-white rounded shadow-sm p-3">
          <h3 className="font-semibold mb-2">{active.name} - テレメトリ ({telemetry.length} 件)</h3>
          {chart.length === 0 ? (
            <p className="text-slate-400 text-xs">テレメトリなし</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chart}>
                <XAxis dataKey="time" tick={{ fontSize: 10 }} hide />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#0EA5E9" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      )}
    </div>
  );
}
