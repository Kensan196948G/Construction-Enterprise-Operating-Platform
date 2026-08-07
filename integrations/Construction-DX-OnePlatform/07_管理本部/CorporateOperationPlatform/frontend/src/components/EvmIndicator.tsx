interface Props {
  label: string;
  value: number;
  good?: "high" | "low"; // 高い方が良いか低い方が良いか
  threshold?: number;
  format?: (v: number) => string;
}

/**
 * EVM 指標表示: CPI/SPI なら 1.0 を境界に色付け、CV/SV なら 0 を境界に色付け。
 */
export function EvmIndicator({
  label,
  value,
  good = "high",
  threshold = 1.0,
  format,
}: Props) {
  const ok =
    good === "high" ? value >= threshold : value <= threshold;
  const color = ok ? "text-cdx-success" : "text-cdx-alert";
  const shown = format ? format(value) : value.toFixed(2);
  return (
    <div className="flex flex-col items-start bg-white rounded-lg px-3 py-2 shadow-sm">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={`text-xl font-bold ${color}`}>{shown}</span>
    </div>
  );
}

export default EvmIndicator;
