interface Device {
  device_id: string;
  name: string;
  kind: string;
  status: string;
  location_name?: string | null;
  last_seen_at?: string | null;
}

const KIND_ICON: Record<string, string> = {
  sensor: "🌡",
  camera: "📷",
  ict_machine: "🚜",
  gps: "📍",
  ais: "🚢"
};

const STATUS_COLOR: Record<string, string> = {
  online: "text-emerald-600",
  offline: "text-slate-400",
  maintenance: "text-amber-600",
  decommissioned: "text-rose-500"
};

export default function DeviceCard({ device }: { device: Device }) {
  return (
    <div className="bg-white rounded shadow-sm p-3 flex items-start gap-3">
      <div className="text-2xl">{KIND_ICON[device.kind] ?? "📦"}</div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate">{device.name}</div>
        <div className="text-xs text-slate-500">{device.kind}</div>
        {device.location_name && (
          <div className="text-xs text-slate-500 truncate">{device.location_name}</div>
        )}
      </div>
      <div className={`text-xs font-medium ${STATUS_COLOR[device.status] ?? "text-slate-500"}`}>
        {device.status}
      </div>
    </div>
  );
}
