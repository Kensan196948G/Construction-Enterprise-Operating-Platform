import { useEffect, useState } from "react";
import { api } from "@/api/client";
import TicketStatusBadge from "@/components/TicketStatusBadge";

interface Ticket {
  ticket_id: string;
  ticket_number: string;
  title: string;
  ticket_type: string;
  priority: string;
  status:
    | "open"
    | "assigned"
    | "in_progress"
    | "pending"
    | "resolved"
    | "closed"
    | "cancelled";
  assignee_id?: string;
  sla_target?: string;
}

const COLUMNS: Ticket["status"][] = [
  "open",
  "assigned",
  "in_progress",
  "pending",
  "resolved",
  "closed"
];

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [view, setView] = useState<"list" | "kanban">("kanban");
  const [selected, setSelected] = useState<Ticket | null>(null);

  useEffect(() => {
    api
      .get<Ticket[]>("/tickets")
      .then((r) => setTickets(r.data))
      .catch(() => setTickets([]));
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">チケット管理</h2>
        <div className="space-x-2">
          <button
            className={`px-3 py-1 rounded ${view === "kanban" ? "bg-brand text-white" : "bg-white border"}`}
            onClick={() => setView("kanban")}
          >
            Kanban
          </button>
          <button
            className={`px-3 py-1 rounded ${view === "list" ? "bg-brand text-white" : "bg-white border"}`}
            onClick={() => setView("list")}
          >
            一覧
          </button>
        </div>
      </div>

      {view === "kanban" ? (
        <div className="grid grid-cols-6 gap-3">
          {COLUMNS.map((col) => (
            <div key={col} className="bg-white rounded shadow-sm p-2 min-h-[400px]">
              <div className="font-semibold text-sm mb-2 capitalize">
                {col} ({tickets.filter((t) => t.status === col).length})
              </div>
              <div className="space-y-2">
                {tickets
                  .filter((t) => t.status === col)
                  .map((t) => (
                    <div
                      key={t.ticket_id}
                      className="p-2 border rounded cursor-pointer hover:bg-slate-50"
                      onClick={() => setSelected(t)}
                    >
                      <div className="text-xs text-slate-500">{t.ticket_number}</div>
                      <div className="text-sm font-medium">{t.title}</div>
                      <div className="text-xs mt-1">優先度: {t.priority}</div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <table className="w-full bg-white rounded shadow-sm">
          <thead className="bg-slate-100 text-sm">
            <tr>
              <th className="text-left p-2">#</th>
              <th className="text-left p-2">タイトル</th>
              <th className="text-left p-2">タイプ</th>
              <th className="text-left p-2">優先度</th>
              <th className="text-left p-2">状態</th>
              <th className="text-left p-2">SLA</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((t) => (
              <tr key={t.ticket_id} className="border-t hover:bg-slate-50">
                <td className="p-2 text-xs">{t.ticket_number}</td>
                <td className="p-2">{t.title}</td>
                <td className="p-2 text-sm">{t.ticket_type}</td>
                <td className="p-2 text-sm">{t.priority}</td>
                <td className="p-2"><TicketStatusBadge status={t.status} /></td>
                <td className="p-2 text-xs">{t.sla_target ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center" onClick={() => setSelected(null)}>
          <div className="bg-white rounded shadow-lg p-6 w-[480px]" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2">{selected.ticket_number}</h3>
            <div className="text-sm mb-2">{selected.title}</div>
            <div className="text-xs text-slate-500">優先度: {selected.priority} / 状態: {selected.status}</div>
            <div className="mt-4 text-right">
              <button className="px-3 py-1 rounded bg-slate-200" onClick={() => setSelected(null)}>閉じる</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
