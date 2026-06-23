"use client";

import {
  AlertTriangle,
  CheckCircle,
  Brain,
  Globe,
  Shield,
  Clock,
  TestTube2,
  Cpu,
  Landmark,
  CalendarClock,
  FlaskConical,
  Activity,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import type { DashboardSummary } from "@/lib/api";

// ---------- StatCard ----------
interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  variant?: "default" | "warning" | "danger" | "success" | "info";
  subtext?: string;
}

function StatCard({ label, value, icon, variant = "default", subtext }: StatCardProps) {
  const variantClasses: Record<string, string> = {
    default: "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700",
    warning: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700",
    danger: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700",
    success: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700",
    info: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700",
  };
  return (
    <div className={`rounded-lg border p-5 flex items-start gap-4 ${variantClasses[variant]}`}>
      <div className="mt-0.5 text-gray-500 dark:text-gray-400 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight">{value}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{label}</p>
        {subtext && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtext}</p>}
      </div>
    </div>
  );
}

// ---------- KPI Section ----------
function KPISection() {
  const { t } = useLanguage();
  const d = t.dashboard;
  return (
    <section className="mb-8">
      <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
        {d.sprintKpis}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label={d.tests} value="384 / 384" icon={<TestTube2 className="w-5 h-5 text-green-500" />} variant="success" subtext={d.testsCumulative} />
        <StatCard label={d.ciStatus} value={d.allGreen} icon={<Cpu className="w-5 h-5 text-blue-500" />} variant="success" subtext={d.ciJobs} />
        <StatCard label={d.governanceGate} value={d.g5InProgress} icon={<Landmark className="w-5 h-5 text-purple-500" />} variant="info" subtext={d.g5Subtitle} />
        <StatCard label={d.releaseTarget} value="2026-12-20" icon={<CalendarClock className="w-5 h-5 text-orange-500" />} subtext={d.pilotRc} />
      </div>
    </section>
  );
}

// ---------- Sprint Progress Table ----------
function SprintProgressSection() {
  const { t } = useLanguage();
  const d = t.dashboard;

  const sprints = [
    { label: "Sprint 1", status: "merged", tests: 180, description: "Auth + Audit foundation" },
    { label: "Sprint 2", status: "merged", tests: 220, description: "CI green + Frontend bootstrap" },
    { label: "Sprint 3", status: "merged", tests: 274, description: "Federation + DLP" },
    { label: "Sprint 4", status: "merged", tests: 328, description: "AI Gateway + Policy Gate" },
    { label: "Sprint 5", status: "merged", tests: 350, description: "G1-c Governance E2E (9 cases)" },
    { label: "Sprint 6 G3", status: "merged", tests: 364, description: "SQLite → PostgreSQL migration" },
    { label: "Sprint 7 G4", status: "openPr", tests: 384, description: "Federation Demo (3-company scenario)" },
    { label: "Sprint 8 G5", status: "inProgress", tests: 0, description: "Frontend Auth + Dashboard Enhancement" },
  ] as const;

  return (
    <section className="mb-8">
      <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
        {d.sprintProgress}
      </h2>
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-700">
              <th className="text-left px-5 py-3 font-medium text-gray-500 dark:text-gray-400">{d.sprintCol}</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500 dark:text-gray-400">{d.statusCol}</th>
              <th className="text-right px-5 py-3 font-medium text-gray-500 dark:text-gray-400">{d.testsCol}</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500 dark:text-gray-400 hidden md:table-cell">{d.descriptionCol}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
            {sprints.map((sprint) => (
              <tr key={sprint.label} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{sprint.label}</td>
                <td className="px-5 py-3">
                  {sprint.status === "merged" ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-400">
                      <CheckCircle className="w-3.5 h-3.5" />{d.merged}
                    </span>
                  ) : sprint.status === "openPr" ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-purple-700 dark:text-purple-400">
                      <Shield className="w-3.5 h-3.5" />{d.openPr}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 dark:text-blue-400">
                      <Activity className="w-3.5 h-3.5" />{d.inProgress}
                    </span>
                  )}
                </td>
                <td className="px-5 py-3 text-right font-mono text-xs text-gray-700 dark:text-gray-300">
                  {sprint.status === "inProgress" ? (
                    <span className="text-blue-600 dark:text-blue-400">WIP</span>
                  ) : sprint.status === "openPr" ? (
                    <span className="text-purple-600 dark:text-purple-400">{sprint.tests}</span>
                  ) : (
                    sprint.tests
                  )}
                </td>
                <td className="px-5 py-3 text-xs text-gray-500 dark:text-gray-400 hidden md:table-cell">
                  {sprint.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ---------- Architecture Diagram ----------
function ArchitectureDiagram() {
  const { t } = useLanguage();
  return (
    <section className="mb-8">
      <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
        {t.dashboard.architectureOverview}
      </h2>
      <div className="bg-gray-900 dark:bg-gray-950 rounded-lg border border-gray-700 p-5 overflow-x-auto">
        <pre className="text-xs text-green-400 dark:text-green-300 font-mono leading-relaxed whitespace-pre">
          {`┌─────────────────────────────────────────────────────────────┐
│                  Synapse-OS Architecture                     │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Frontend (Next.js 14) :3000  +  JWT Auth (Sprint 8) │  │
│  │  /login → httpOnly cookie → middleware → /auth/me    │  │
│  └──────────────┬────────────────────────┬──────────────┘  │
│                 │ REST                   │ /auth/me         │
│  ┌──────────────▼──────────┐  ┌──────────▼──────────────┐  │
│  │  AI Gateway :8006       │  │  Auth Service :8001      │  │
│  │  ← Policy Gate :8010    │  │  JWT / HS256 / 60min     │  │
│  └───────┬─────────────────┘  └─────────────────────────┘  │
│          │                                                  │
│  ┌───────▼──────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Object :8004 │  │ Federation   │  │  Dashboard :8009  │  │
│  └──────────────┘  │   :8007      │  └──────────────────┘  │
│                    └──────────────┘                         │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ Audit :8003 │  │ Workflow:8005 │  │ PostgreSQL :5432 │   │
│  └─────────────┘  └──────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘`}
        </pre>
      </div>
    </section>
  );
}

// ---------- Live Metrics (receives server-fetched data) ----------
function LiveMetricsSection({ data }: { data: DashboardSummary | null }) {
  const { t } = useLanguage();
  const d = t.dashboard;

  const eh = data?.enterprise_health ?? { open_issue_count: 0, pending_approval_count: 0, critical_audit_count: 0 };
  const ai = data?.ai_activity ?? { ai_action_count: 0, high_ai_risk_count: 0, external_ai_block_count: 0 };
  const dlp = data?.dlp_alerts ?? { dlp_violation_count: 0, restricted_document_count: 0 };
  const fed = data?.federation_stats ?? { pending_federation_request_count: 0, trust_warning_count: 0, sprint_ready: false };

  return (
    <>
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{d.liveGovernance}</h2>
          {!data && (
            <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 px-2 py-1 rounded">
              {d.apiOffline}
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label={d.openIssues} value={eh.open_issue_count} icon={<AlertTriangle className="w-5 h-5" />} variant={eh.open_issue_count > 10 ? "warning" : "default"} />
          <StatCard label={d.pendingApprovals} value={eh.pending_approval_count} icon={<Clock className="w-5 h-5" />} variant={eh.pending_approval_count > 0 ? "warning" : "default"} />
          <StatCard label={d.criticalAudit} value={eh.critical_audit_count} icon={<Shield className="w-5 h-5" />} variant={eh.critical_audit_count > 0 ? "danger" : "default"} />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">{d.aiActivity}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label={d.aiActions} value={ai.ai_action_count} icon={<Brain className="w-5 h-5" />} />
          <StatCard label={d.highRisk} value={ai.high_ai_risk_count} icon={<AlertTriangle className="w-5 h-5" />} variant={ai.high_ai_risk_count > 0 ? "danger" : "default"} />
          <StatCard label={d.aiBlocks} value={ai.external_ai_block_count} icon={<Shield className="w-5 h-5" />} variant={ai.external_ai_block_count > 0 ? "warning" : "default"} />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">{d.dlpFederation}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard label={d.dlpViolations} value={dlp.dlp_violation_count} icon={<CheckCircle className="w-5 h-5" />} variant={dlp.dlp_violation_count > 0 ? "danger" : "default"} />
          <StatCard label={d.federationRequests} value={fed.pending_federation_request_count} icon={<Globe className="w-5 h-5" />} />
        </div>
      </section>
    </>
  );
}

// ---------- Main export ----------
export function DashboardContent({ data }: { data: DashboardSummary | null }) {
  const { t } = useLanguage();
  const d = t.dashboard;

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{d.title}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{d.subtitle}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
          <FlaskConical className="w-4 h-4" />
          <span>{d.sprintBadge}</span>
        </div>
      </div>

      <KPISection />
      <SprintProgressSection />
      <ArchitectureDiagram />
      <LiveMetricsSection data={data} />
    </div>
  );
}
