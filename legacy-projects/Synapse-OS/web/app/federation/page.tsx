import { Globe, Shield, ArrowRight, CheckCircle, XCircle, Clock } from "lucide-react";
import { getFederationEvents, getFederationDemoScenario, type FederationEvent } from "@/lib/api";

const statusBadge: Record<string, { cls: string; label: string; icon: React.ElementType }> = {
  approved:        { cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",  label: "APPROVED",        icon: CheckCircle },
  review_required: { cls: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", label: "REVIEW_REQUIRED", icon: Clock },
  blocked:         { cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",      label: "BLOCKED",         icon: XCircle },
};

const trustBadge: Record<string, string> = {
  l1_internal: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
  l2_partner:  "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  l3_regulated:"bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  l4_public:   "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  l5_open:     "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  full:    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  partial: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  minimal: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  none:    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const auditBoundaryLabel: Record<string, string> = {
  shared:      "🔗 Shared",
  source_only: "🏠 Source only",
};

async function fetchEvents(): Promise<{
  live: FederationEvent[];
  demo: FederationEvent[];
  liveFetchFailed: boolean;
}> {
  const [liveResult, demoResult] = await Promise.allSettled([
    getFederationEvents(),
    getFederationDemoScenario(),
  ]);
  return {
    live: liveResult.status === "fulfilled" ? liveResult.value : [],
    demo: demoResult.status === "fulfilled" ? demoResult.value : [],
    liveFetchFailed: liveResult.status === "rejected",
  };
}

function StatusBadge({ status }: { status: string }) {
  const badge = statusBadge[status] ?? { cls: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400", label: status, icon: Clock };
  const Icon = badge.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${badge.cls}`}>
      <Icon className="w-3 h-3" />
      {badge.label}
    </span>
  );
}

function EventTable({ events }: { events: FederationEvent[] }) {
  if (events.length === 0) return null;
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">ID</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Flow</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Trust</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Status</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Audit</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Time</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {events.map((ev) => (
            <tr key={ev.object_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">
                {ev.object_id.slice(0, 12)}…
              </td>
              <td className="px-4 py-3">
                <span className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                  <Shield className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                  <span className="font-medium">{ev.source_tenant}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                  <span className="font-medium">{ev.target_tenant}</span>
                </span>
                {ev.reasoning_summary && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate max-w-xs" title={ev.reasoning_summary}>
                    {ev.reasoning_summary}
                  </p>
                )}
              </td>
              <td className="px-4 py-3">
                <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${trustBadge[ev.trust_level] ?? "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"}`}>
                  {ev.trust_level}
                </span>
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={ev.status} />
              </td>
              <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                {auditBoundaryLabel[ev.audit_boundary] ?? ev.audit_boundary}
              </td>
              <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                {new Date(ev.created_at).toLocaleTimeString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SummaryStats({ events }: { events: FederationEvent[] }) {
  const approved = events.filter((e) => e.status === "approved").length;
  const blocked  = events.filter((e) => e.status === "blocked").length;
  const review   = events.filter((e) => e.status === "review_required").length;
  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
        <p className="text-2xl font-bold text-green-700 dark:text-green-400">{approved}</p>
        <p className="text-xs text-green-600 dark:text-green-500 mt-1">APPROVED</p>
      </div>
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-center">
        <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{review}</p>
        <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">REVIEW_REQUIRED</p>
      </div>
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
        <p className="text-2xl font-bold text-red-700 dark:text-red-400">{blocked}</p>
        <p className="text-xs text-red-600 dark:text-red-500 mt-1">BLOCKED</p>
      </div>
    </div>
  );
}

export default async function FederationPage() {
  const { live, demo, liveFetchFailed } = await fetchEvents();
  const allEvents = liveFetchFailed ? demo : live;
  const isDemo = liveFetchFailed && demo.length > 0;

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-500" />
          Cross-Tenant Federation Events
          {isDemo && (
            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded font-normal">Demo</span>
          )}
        </h1>
        <span className="text-xs text-gray-500 dark:text-gray-400">{allEvents.length} records</span>
      </div>

      {allEvents.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
          No federation events found. Backend may be offline.
        </div>
      ) : (
        <>
          <SummaryStats events={allEvents} />
          <EventTable events={allEvents} />
          {isDemo && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 text-center">
              ※ Live backend offline — showing 3-company demo scenario (A→B allow, A→C deny, B→C review)
            </p>
          )}
        </>
      )}
    </div>
  );
}
