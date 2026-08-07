import { ScrollText, Hash, User, Box } from "lucide-react";
import { getAuditEvents, type AuditEvent } from "@/lib/api";

const resultBadge: Record<string, string> = {
  allow: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  deny: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  audit_required: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
};

async function fetchAuditEvents(): Promise<AuditEvent[]> {
  try {
    return await getAuditEvents();
  } catch {
    return [];
  }
}

export default async function AuditPage() {
  const events = await fetchAuditEvents();

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <ScrollText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          Immutable Audit Timeline
        </h1>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {events.length} records
        </span>
      </div>

      {events.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
          No audit events found. Backend may be offline.
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((ev) => (
            <div
              key={ev.audit_event_id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 px-5 py-4"
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-gray-400 dark:text-gray-500">
                    {ev.audit_event_id}
                  </span>
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {ev.event_type}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${resultBadge[ev.policy_result] ?? "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"}`}>
                    {ev.policy_result}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(ev.occurred_at).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {ev.actor_id}
                </span>
                <span className="flex items-center gap-1">
                  <Box className="w-3 h-3" />
                  {ev.object_id}
                </span>
                <span className="flex items-center gap-1 col-span-2 font-mono truncate">
                  <Hash className="w-3 h-3 shrink-0" />
                  {ev.hash_ref}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
