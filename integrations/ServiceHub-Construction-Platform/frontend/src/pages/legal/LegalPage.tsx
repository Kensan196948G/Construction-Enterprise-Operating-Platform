/**
 * LegalPage — 法的コンプライアンス・証跡タイムライン管理
 * Phase 1: 契約書 AI 解析
 * Phase 2: 証跡タイムライン + コンプライアンスチェック
 */
import { useState } from "react";
import {
  ShieldCheck,
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ListChecks,
} from "lucide-react";
import { Badge, Card } from "@/components/ui";
import type {
  ComplianceStatus,
  ComplianceViolation,
  EvidenceSourceType,
} from "@/api/legal";

// ---------------------------------------------------------------------------
// Types (UI-local)
// ---------------------------------------------------------------------------

type TabKey = "timeline" | "compliance" | "contracts";

interface EvidenceEntry {
  id: string;
  source_type: EvidenceSourceType;
  title: string;
  event_date: string;
  description: string | null;
  integrity_ok: boolean;
}

interface ComplianceEntry {
  id: string;
  check_type: string;
  status: ComplianceStatus;
  score: number | null;
  violations: ComplianceViolation[];
  checked_at: string;
}

// ---------------------------------------------------------------------------
// Dummy data
// ---------------------------------------------------------------------------

const EVIDENCE_ENTRIES: EvidenceEntry[] = [
  {
    id: "ev-001",
    source_type: "contract",
    title: "工事請負契約書 SHG-2026-001",
    event_date: "2026-04-01",
    description: "元請・下請間の工事請負契約書 締結",
    integrity_ok: true,
  },
  {
    id: "ev-002",
    source_type: "daily_report",
    title: "日報 2026-04-10 基礎工事着工",
    event_date: "2026-04-10",
    description: "基礎杭打ち工事 着工確認",
    integrity_ok: true,
  },
  {
    id: "ev-003",
    source_type: "safety",
    title: "安全確認記録 2026-04-15",
    event_date: "2026-04-15",
    description: "統括安全衛生責任者による現場巡視",
    integrity_ok: true,
  },
  {
    id: "ev-004",
    source_type: "photo",
    title: "工事写真 基礎配筋検査",
    event_date: "2026-04-20",
    description: "配筋検査写真 12枚",
    integrity_ok: true,
  },
  {
    id: "ev-005",
    source_type: "daily_report",
    title: "日報 2026-04-25 躯体工事",
    event_date: "2026-04-25",
    description: "1階躯体コンクリート打設完了",
    integrity_ok: true,
  },
  {
    id: "ev-006",
    source_type: "manual",
    title: "工程会議 議事録 2026-05-01",
    event_date: "2026-05-01",
    description: "工期遅延リスクの協議記録",
    integrity_ok: true,
  },
  {
    id: "ev-007",
    source_type: "contract",
    title: "下請代金支払確認書 2026-05-15",
    event_date: "2026-05-15",
    description: "電気工事業者 下請代金 ¥2,100,000 支払確認",
    integrity_ok: true,
  },
];

const COMPLIANCE_HISTORY: ComplianceEntry[] = [
  {
    id: "chk-001",
    check_type: "all",
    status: "PASS",
    score: 92,
    violations: [],
    checked_at: "2026-05-20T09:00:00Z",
  },
  {
    id: "chk-002",
    check_type: "subcontract_law",
    status: "WARNING",
    score: 75,
    violations: [
      {
        law: "subcontract_law",
        article: "下請代金支払遅延等防止法第2条の2",
        description: "支払期限まで残15日（要注意）",
        severity: "HIGH",
        recommendation: "至急支払い手続きを開始してください",
      },
    ],
    checked_at: "2026-05-15T14:30:00Z",
  },
  {
    id: "chk-003",
    check_type: "labor_safety",
    status: "PASS",
    score: 88,
    violations: [],
    checked_at: "2026-05-10T10:00:00Z",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SOURCE_TYPE_LABEL: Record<EvidenceSourceType, string> = {
  daily_report: "日報",
  safety: "安全確認",
  photo: "写真",
  contract: "契約書",
  manual: "手動登録",
};

const SOURCE_TYPE_VARIANT: Record<
  EvidenceSourceType,
  "info" | "success" | "warning" | "danger"
> = {
  daily_report: "info",
  safety: "success",
  photo: "info",
  contract: "warning",
  manual: "info",
};

const COMPLIANCE_STATUS_LABEL: Record<ComplianceStatus, string> = {
  PASS: "適合",
  FAIL: "違反",
  WARNING: "要注意",
  PENDING: "確認中",
  NOT_CHECKED: "未チェック",
};

const COMPLIANCE_STATUS_VARIANT: Record<
  ComplianceStatus,
  "success" | "danger" | "warning" | "info"
> = {
  PASS: "success",
  FAIL: "danger",
  WARNING: "warning",
  PENDING: "info",
  NOT_CHECKED: "info",
};

const SEVERITY_VARIANT: Record<
  ComplianceViolation["severity"],
  "danger" | "warning" | "info" | "success"
> = {
  CRITICAL: "danger",
  HIGH: "warning",
  MEDIUM: "info",
  LOW: "success",
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function EvidenceTimeline({ entries }: { entries: EvidenceEntry[] }) {
  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
      <ul className="space-y-4">
        {entries.map((entry) => (
          <li key={entry.id} className="relative pl-12">
            {/* Circle marker */}
            <span
              className={`absolute left-2 top-1 w-4 h-4 rounded-full border-2 ${
                entry.integrity_ok
                  ? "bg-green-500 border-green-600"
                  : "bg-red-500 border-red-600"
              }`}
            />
            <Card className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                    {entry.title}
                  </p>
                  {entry.description && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {entry.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={SOURCE_TYPE_VARIANT[entry.source_type]}>
                    {SOURCE_TYPE_LABEL[entry.source_type]}
                  </Badge>
                  {entry.integrity_ok ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                <Clock className="inline w-3 h-3 mr-1" />
                {entry.event_date}
              </p>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ComplianceCheckList({ entries }: { entries: ComplianceEntry[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <Card key={entry.id} className="p-4">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() =>
              setExpanded(expanded === entry.id ? null : entry.id)
            }
          >
            <div className="flex items-center gap-3">
              <Badge variant={COMPLIANCE_STATUS_VARIANT[entry.status]}>
                {COMPLIANCE_STATUS_LABEL[entry.status]}
              </Badge>
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {entry.check_type === "all"
                  ? "総合チェック"
                  : entry.check_type === "subcontract_law"
                    ? "下請法チェック"
                    : entry.check_type === "construction_law"
                      ? "建設業法チェック"
                      : "労働安全衛生法チェック"}
              </span>
              {entry.score !== null && (
                <span className="text-xs text-gray-500">
                  スコア: {entry.score}/100
                </span>
              )}
            </div>
            <span className="text-xs text-gray-400">
              {new Date(entry.checked_at).toLocaleDateString("ja-JP")}
            </span>
          </div>

          {expanded === entry.id && entry.violations.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 space-y-2">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                検出された問題
              </p>
              {entry.violations.map((v, i) => (
                <div
                  key={i}
                  className="bg-gray-50 dark:bg-gray-800 rounded p-3 text-sm"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={SEVERITY_VARIANT[v.severity]}>
                      {v.severity}
                    </Badge>
                    <span className="text-xs text-gray-500">{v.article}</span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">
                    {v.description}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    💡 {v.recommendation}
                  </p>
                </div>
              ))}
            </div>
          )}

          {expanded === entry.id && entry.violations.length === 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                違反事項なし — 全項目適合
              </p>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  {
    key: "timeline",
    label: "証跡タイムライン",
    icon: <Clock className="w-4 h-4" />,
  },
  {
    key: "compliance",
    label: "コンプライアンス",
    icon: <ShieldCheck className="w-4 h-4" />,
  },
  {
    key: "contracts",
    label: "契約書解析",
    icon: <FileText className="w-4 h-4" />,
  },
];

export default function LegalPage() {
  const [tab, setTab] = useState<TabKey>("timeline");

  // Overall compliance summary (from latest check)
  const latestCheck = COMPLIANCE_HISTORY[0];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-blue-600" />
            法的コンプライアンス管理
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            建設業法・下請法・労働安全衛生法 対応 — 証跡タイムライン・AI コンプライアンスチェック
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <ListChecks className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">証跡件数</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {EVIDENCE_ENTRIES.length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${
                latestCheck.status === "PASS"
                  ? "bg-green-100 dark:bg-green-900/30"
                  : latestCheck.status === "FAIL"
                    ? "bg-red-100 dark:bg-red-900/30"
                    : "bg-yellow-100 dark:bg-yellow-900/30"
              }`}
            >
              <ShieldCheck
                className={`w-5 h-5 ${
                  latestCheck.status === "PASS"
                    ? "text-green-600"
                    : latestCheck.status === "FAIL"
                      ? "text-red-600"
                      : "text-yellow-600"
                }`}
              />
            </div>
            <div>
              <p className="text-xs text-gray-500">最新コンプライアンス</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {latestCheck.score}/100
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">要対応 違反数</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {COMPLIANCE_HISTORY.reduce(
                  (sum, c) => sum + c.violations.length,
                  0
                )}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex gap-6">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {tab === "timeline" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              法的証跡タイムライン（建設業法 帳簿備付け義務対応）
            </h2>
            <Badge variant="success">整合性 OK</Badge>
          </div>
          <EvidenceTimeline entries={EVIDENCE_ENTRIES} />
        </div>
      )}

      {tab === "compliance" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              コンプライアンスチェック履歴
            </h2>
          </div>
          <ComplianceCheckList entries={COMPLIANCE_HISTORY} />
        </div>
      )}

      {tab === "contracts" && (
        <div className="text-center py-16 text-gray-400 dark:text-gray-600">
          <FileText className="w-16 h-16 mx-auto mb-4 opacity-40" />
          <p className="text-lg font-medium">契約書 AI 解析</p>
          <p className="text-sm mt-2">
            Claude AI による建設業法・下請法リスク解析機能
          </p>
          <p className="text-xs mt-4 text-gray-300 dark:text-gray-700">
            Phase 1 実装済み — このビューは今後の UI 統合で有効化されます
          </p>
        </div>
      )}
    </div>
  );
}
