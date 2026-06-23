import { CheckCircle, XCircle, Clock, User } from "lucide-react";
import { getApprovals, type Approval } from "@/lib/api";

const statusBadge: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  approved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

async function fetchApprovals(): Promise<Approval[]> {
  try {
    return await getApprovals();
  } catch {
    return [];
  }
}

export default async function ApprovalsPage() {
  const approvals = await fetchApprovals();

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Approvals
        </h1>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {approvals.length} records
        </span>
      </div>

      {approvals.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
          No approvals found. Backend may be offline.
        </div>
      ) : (
        <div className="space-y-3">
          {approvals.map((apr) => (
            <div
              key={apr.object_id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                    {apr.title}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {apr.actor_id}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(apr.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
                <span className={`shrink-0 inline-flex px-2 py-0.5 rounded text-xs font-medium ${statusBadge[apr.status] ?? "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"}`}>
                  {apr.status}
                </span>
              </div>

              {apr.status === "pending" && (
                <div className="flex gap-2 mt-4">
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-green-600 hover:bg-green-700 text-white text-xs font-medium transition-colors">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Approve
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors">
                    <XCircle className="w-3.5 h-3.5" />
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
