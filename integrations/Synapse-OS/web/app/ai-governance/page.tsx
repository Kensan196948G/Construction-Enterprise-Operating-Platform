import {
  Brain,
  AlertTriangle,
  Activity,
  CheckCircle,
  XCircle,
  Eye,
  ShieldCheck,
  Gauge,
} from "lucide-react";
import { getAIActions, type AIAction } from "@/lib/api";

// ---------- Types ----------
type PolicyDecision = {
  id: string;
  rule: string;
  action: string;
  result: "allow" | "deny" | "review_required";
  actor: string;
  ts: string;
  riskScore: number;
};

type GovernanceRule = {
  id: string;
  name: string;
  type: "allow" | "deny" | "review_required";
  description: string;
  active: boolean;
};

// ---------- Mock data ----------
const mockPolicyDecisions: PolicyDecision[] = [
  {
    id: "pd-001",
    rule: "external-ai-block",
    action: "GPT-4 API call from internal agent",
    result: "deny",
    actor: "agent-core",
    ts: "2026-05-23T09:15:33Z",
    riskScore: 0.82,
  },
  {
    id: "pd-002",
    rule: "internal-ai-allow",
    action: "Claude-3 reasoning task",
    result: "allow",
    actor: "workflow-engine",
    ts: "2026-05-23T09:12:11Z",
    riskScore: 0.12,
  },
  {
    id: "pd-003",
    rule: "sensitive-data-review",
    action: "Document summarization (PII detected)",
    result: "review_required",
    actor: "document-processor",
    ts: "2026-05-23T09:08:55Z",
    riskScore: 0.55,
  },
  {
    id: "pd-004",
    rule: "internal-ai-allow",
    action: "Code review suggestion",
    result: "allow",
    actor: "dev-assistant",
    ts: "2026-05-23T09:05:21Z",
    riskScore: 0.08,
  },
  {
    id: "pd-005",
    rule: "external-ai-block",
    action: "OpenAI embeddings for customer data",
    result: "deny",
    actor: "data-pipeline",
    ts: "2026-05-23T09:01:47Z",
    riskScore: 0.91,
  },
];

const governanceRules: GovernanceRule[] = [
  {
    id: "r-001",
    name: "Allow Internal AI",
    type: "allow",
    description: "Allow whitelisted internal AI services (Claude, local models)",
    active: true,
  },
  {
    id: "r-002",
    name: "Block External AI",
    type: "deny",
    description: "Deny calls to external AI APIs (OpenAI, Gemini, Cohere)",
    active: true,
  },
  {
    id: "r-003",
    name: "PII Review Gate",
    type: "review_required",
    description: "Require human review when PII is detected in AI input",
    active: true,
  },
  {
    id: "r-004",
    name: "High-Risk Action Review",
    type: "review_required",
    description: "Require review for AI actions with risk score > 0.7",
    active: true,
  },
  {
    id: "r-005",
    name: "Allow Low-Risk Actions",
    type: "allow",
    description: "Auto-approve AI actions with risk score < 0.2",
    active: true,
  },
  {
    id: "r-006",
    name: "Block Cross-Tenant AI",
    type: "deny",
    description: "Deny AI data processing across tenant boundaries",
    active: false,
  },
];

// ---------- Sub-components ----------
function RiskBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color =
    value > 0.6
      ? "bg-red-500"
      : value > 0.3
      ? "bg-yellow-400"
      : "bg-green-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-600 dark:text-gray-400 w-8 text-right">
        {pct}%
      </span>
    </div>
  );
}

function DecisionBadge({ result }: { result: PolicyDecision["result"] }) {
  if (result === "allow") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
        <CheckCircle className="w-3 h-3" />
        allow
      </span>
    );
  }
  if (result === "deny") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
        <XCircle className="w-3 h-3" />
        deny
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
      <Eye className="w-3 h-3" />
      review required
    </span>
  );
}

function RuleTypeBadge({ type }: { type: GovernanceRule["type"] }) {
  if (type === "allow") {
    return (
      <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
        allow
      </span>
    );
  }
  if (type === "deny") {
    return (
      <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
        deny
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
      review_required
    </span>
  );
}

// ---------- async data fetch ----------
async function fetchAIActions(): Promise<AIAction[]> {
  try {
    return await getAIActions();
  } catch {
    return [];
  }
}

// ---------- Page ----------
export default async function AIGovernancePage() {
  const actions = await fetchAIActions();

  const allowCount = governanceRules.filter((r) => r.type === "allow").length;
  const denyCount = governanceRules.filter((r) => r.type === "deny").length;
  const reviewCount = governanceRules.filter(
    (r) => r.type === "review_required"
  ).length;
  const activeCount = governanceRules.filter((r) => r.active).length;

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-500" />
          AI Governance &amp; Explainability
        </h1>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {actions.length} live records
        </span>
      </div>

      {/* AI Gateway Status */}
      <section className="mb-8">
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
          AI Gateway Status
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-green-500 shrink-0" />
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {activeCount}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Active Rules</p>
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {allowCount}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Allow Rules</p>
            </div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-500 shrink-0" />
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {denyCount}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Deny Rules</p>
            </div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4 flex items-center gap-3">
            <Eye className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {reviewCount}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Review Rules</p>
            </div>
          </div>
        </div>
      </section>

      {/* Governance Rules */}
      <section className="mb-8">
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
          Policy Rules
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
          {governanceRules.map((rule) => (
            <div
              key={rule.id}
              className="flex items-start justify-between px-5 py-4 gap-4"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                    rule.active ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
                  }`}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {rule.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {rule.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <RuleTypeBadge type={rule.type} />
                {!rule.active && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    (inactive)
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Policy Decision Log */}
      <section className="mb-8">
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
          Policy Decision Log
        </h2>
        <div className="space-y-2">
          {mockPolicyDecisions.map((pd) => (
            <div
              key={pd.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 px-5 py-4"
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {pd.action}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 font-mono">
                    rule: {pd.rule} · actor: {pd.actor}
                  </p>
                </div>
                <DecisionBadge result={pd.result} />
              </div>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                    <Gauge className="w-3 h-3" /> Risk Score
                  </p>
                  <RiskBar value={pd.riskScore} />
                </div>
                <div className="text-right text-xs text-gray-400 dark:text-gray-500 self-end">
                  {new Date(pd.ts).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Live AI Actions from API */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Live AI Actions
          </h2>
          {actions.length === 0 && (
            <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 px-2 py-1 rounded">
              API offline
            </span>
          )}
        </div>

        {actions.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
            No live AI actions found. Backend may be offline.
          </div>
        ) : (
          <div className="space-y-3">
            {actions.map((action) => (
              <div
                key={action.object_id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <span className="font-mono text-xs text-gray-400 dark:text-gray-500">
                      {action.object_id}
                    </span>
                    <p className="font-medium text-gray-900 dark:text-gray-100 text-sm mt-0.5">
                      {action.reasoning_summary}
                    </p>
                  </div>
                  {action.risk_score > 0.6 && (
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                      <Activity className="w-3 h-3" /> Risk Score
                    </p>
                    <RiskBar value={action.risk_score} />
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 mb-1">
                      Confidence
                    </p>
                    <RiskBar value={action.confidence_score} />
                  </div>
                </div>

                <div className="flex gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
                  <span>Audit ref: {action.prompt_audit_ref}</span>
                  <span>Actor: {action.actor_id}</span>
                  <span>{new Date(action.created_at).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
