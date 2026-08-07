type Status =
  | "open"
  | "assigned"
  | "in_progress"
  | "pending"
  | "resolved"
  | "closed"
  | "cancelled";

const STYLE: Record<Status, string> = {
  open: "bg-slate-200 text-slate-800",
  assigned: "bg-blue-100 text-blue-800",
  in_progress: "bg-amber-100 text-amber-800",
  pending: "bg-orange-100 text-orange-800",
  resolved: "bg-emerald-100 text-emerald-800",
  closed: "bg-gray-200 text-gray-700",
  cancelled: "bg-rose-100 text-rose-700"
};

export default function TicketStatusBadge({ status }: { status: Status }) {
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${STYLE[status] ?? "bg-slate-200"}`}>
      {status}
    </span>
  );
}
