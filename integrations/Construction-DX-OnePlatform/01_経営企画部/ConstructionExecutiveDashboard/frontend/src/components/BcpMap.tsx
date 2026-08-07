type BcpRow = {
  branch_code: string;
  branch_name: string;
  operation_status: string;
  disaster_type?: string | null;
  disaster_severity?: string | null;
};

type Props = { rows: BcpRow[] };

const STATUS_COLOR: Record<string, string> = {
  normal: 'bg-emerald-100 text-emerald-800',
  partial: 'bg-amber-100 text-amber-800',
  stopped: 'bg-rose-100 text-rose-800',
  recovering: 'bg-sky-100 text-sky-800',
};

export default function BcpMap({ rows }: Props) {
  // 簡易表示: Leaflet が利用可能ならマップ表示, ここでは骨格としてカード一覧
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {rows.map((r) => (
        <div key={r.branch_code} className="rounded-lg bg-white shadow-sm p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500">{r.branch_code}</div>
              <div className="font-semibold">{r.branch_name}</div>
            </div>
            <span
              className={`text-xs px-2 py-1 rounded ${STATUS_COLOR[r.operation_status] ?? 'bg-slate-100 text-slate-700'}`}
            >
              {r.operation_status}
            </span>
          </div>
          {r.disaster_type && (
            <div className="mt-2 text-xs">
              災害種別: {r.disaster_type} / 重大度: {r.disaster_severity ?? '-'}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
