interface Props {
  status?: string;
}

const COLOR: Record<string, string> = {
  success: "bg-emerald-100 text-emerald-800",
  running: "bg-blue-100 text-blue-800",
  failed: "bg-rose-100 text-rose-800",
  idle: "bg-slate-100 text-slate-700",
  disabled: "bg-zinc-200 text-zinc-600",
  canceled: "bg-amber-100 text-amber-800"
};

export default function EtlStatusChip({ status }: Props) {
  const key = (status ?? "idle").toLowerCase();
  const cls = COLOR[key] ?? "bg-slate-100 text-slate-700";
  return <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${cls}`}>{key}</span>;
}
