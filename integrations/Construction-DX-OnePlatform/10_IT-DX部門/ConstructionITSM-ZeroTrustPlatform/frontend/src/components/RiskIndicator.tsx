const COLOR: Record<string, string> = {
  none: "bg-emerald-500",
  low: "bg-yellow-400",
  medium: "bg-orange-500",
  high: "bg-rose-600",
  atRisk: "bg-rose-500",
  confirmedCompromised: "bg-rose-700"
};

export default function RiskIndicator({ level }: { level?: string | null }) {
  const cls = COLOR[level ?? "none"] ?? "bg-slate-400";
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`inline-block w-2 h-2 rounded-full ${cls}`} />
      <span className="text-xs">{level ?? "none"}</span>
    </span>
  );
}
