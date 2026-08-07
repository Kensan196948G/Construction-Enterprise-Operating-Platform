import { useState } from "react";
import { ShieldCheck, Activity, Key, GitCommit, AlertTriangle, CheckCircle2, Users, Clock } from "lucide-react";
import { Badge, Card, DataActions } from "@/components/ui";
import type { CellValue } from "@/components/ui";

type EventLevel = "info" | "warning" | "critical" | "success";
type Tab = "operations" | "access" | "changes";

type OperationLog = {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  resource: string;
  detail: string;
  level: EventLevel;
  ip: string;
};

type AccessLog = {
  id: string;
  timestamp: string;
  user: string;
  event: "login" | "logout" | "failed" | "session_expired";
  ip: string;
  ua: string;
  result: "success" | "failure";
};

type ChangeRecord = {
  id: string;
  timestamp: string;
  user: string;
  target: string;
  field: string;
  before: string;
  after: string;
  category: string;
};

const OPERATION_LOGS: OperationLog[] = [
  { id: "OL-001", timestamp: "2026-05-20 09:12:44", user: "admin@example.com",       action: "DELETE",  resource: "原価記録",    detail: "CostRecord ID=c8a2 削除",                 level: "warning",  ip: "192.168.0.10" },
  { id: "OL-002", timestamp: "2026-05-20 09:05:11", user: "pm@example.com",          action: "CREATE",  resource: "工事案件",    detail: "SHG-2026-005 横浜倉庫新築工事 作成",       level: "info",     ip: "192.168.0.22" },
  { id: "OL-003", timestamp: "2026-05-20 08:58:37", user: "supervisor@example.com",  action: "UPDATE",  resource: "日報",        detail: "進捗率 72% → 80% に更新",                 level: "info",     ip: "192.168.0.31" },
  { id: "OL-004", timestamp: "2026-05-20 08:44:02", user: "admin@example.com",       action: "EXPORT",  resource: "原価管理",    detail: "CSV エクスポート 245件",                   level: "info",     ip: "192.168.0.10" },
  { id: "OL-005", timestamp: "2026-05-20 08:30:19", user: "cost@example.com",        action: "CREATE",  resource: "原価記録",    detail: "材料費 ¥880,000 登録",                     level: "info",     ip: "192.168.0.45" },
  { id: "OL-006", timestamp: "2026-05-19 17:55:00", user: "itop@example.com",        action: "APPROVE", resource: "変更要求",    detail: "CRQ-2026-011 承認（リスク:高）",           level: "warning",  ip: "192.168.0.18" },
  { id: "OL-007", timestamp: "2026-05-19 17:20:33", user: "admin@example.com",       action: "DELETE",  resource: "ユーザー",    detail: "退職者アカウント test@example.com 無効化", level: "critical", ip: "192.168.0.10" },
  { id: "OL-008", timestamp: "2026-05-19 16:00:00", user: "supervisor@example.com",  action: "CREATE",  resource: "安全確認",    detail: "2026-05-19 定期安全確認 15項目 登録",      level: "success",  ip: "192.168.0.31" },
];

const ACCESS_LOGS: AccessLog[] = [
  { id: "AL-001", timestamp: "2026-05-20 09:10:00", user: "admin@example.com",      event: "login",          ip: "192.168.0.10", ua: "Chrome 125 / Windows",  result: "success" },
  { id: "AL-002", timestamp: "2026-05-20 09:05:00", user: "pm@example.com",         event: "login",          ip: "192.168.0.22", ua: "Safari 17 / macOS",     result: "success" },
  { id: "AL-003", timestamp: "2026-05-20 08:58:00", user: "supervisor@example.com", event: "login",          ip: "192.168.0.31", ua: "Chrome 125 / Android",  result: "success" },
  { id: "AL-004", timestamp: "2026-05-20 08:44:12", user: "unknown@hacker.test",    event: "failed",         ip: "203.0.113.99", ua: "curl/8.0.1",            result: "failure" },
  { id: "AL-005", timestamp: "2026-05-20 08:44:15", user: "unknown@hacker.test",    event: "failed",         ip: "203.0.113.99", ua: "curl/8.0.1",            result: "failure" },
  { id: "AL-006", timestamp: "2026-05-20 08:44:17", user: "unknown@hacker.test",    event: "failed",         ip: "203.0.113.99", ua: "curl/8.0.1",            result: "failure" },
  { id: "AL-007", timestamp: "2026-05-19 18:30:00", user: "cost@example.com",       event: "logout",         ip: "192.168.0.45", ua: "Firefox 126 / Windows", result: "success" },
  { id: "AL-008", timestamp: "2026-05-19 17:00:00", user: "itop@example.com",       event: "session_expired",ip: "192.168.0.18", ua: "Edge 124 / Windows",    result: "failure" },
];

const CHANGE_RECORDS: ChangeRecord[] = [
  { id: "CR-001", timestamp: "2026-05-20 09:05:11", user: "pm@example.com",         target: "工事案件 SHG-2026-005", field: "status",          before: "PLANNING",   after: "IN_PROGRESS", category: "工事案件" },
  { id: "CR-002", timestamp: "2026-05-20 08:58:37", user: "supervisor@example.com", target: "日報 2026-05-20",       field: "progress_rate",   before: "72",         after: "80",          category: "日報" },
  { id: "CR-003", timestamp: "2026-05-19 17:55:00", user: "itop@example.com",       target: "変更要求 CRQ-2026-011", field: "status",          before: "pending",    after: "approved",    category: "ITSM" },
  { id: "CR-004", timestamp: "2026-05-19 16:30:00", user: "cost@example.com",       target: "原価記録 CostID=c8a1",  field: "actual_amount",   before: "750000",     after: "880000",      category: "原価" },
  { id: "CR-005", timestamp: "2026-05-19 15:00:00", user: "admin@example.com",      target: "ユーザー test@example.com", field: "is_active",   before: "true",       after: "false",       category: "ユーザー" },
  { id: "CR-006", timestamp: "2026-05-19 14:20:00", user: "supervisor@example.com", target: "工事案件 SHB-2026-001", field: "end_date",        before: "2026-09-30", after: "2026-10-15",  category: "工事案件" },
];

const LEVEL_BADGE: Record<EventLevel, { variant: "info" | "warning" | "danger" | "success"; label: string }> = {
  info:     { variant: "info",    label: "情報" },
  warning:  { variant: "warning", label: "注意" },
  critical: { variant: "danger",  label: "重大" },
  success:  { variant: "success", label: "正常" },
};

const ACCESS_EVENT_LABEL: Record<AccessLog["event"], string> = {
  login:          "ログイン",
  logout:         "ログアウト",
  failed:         "認証失敗",
  session_expired: "セッション切れ",
};

const ACTION_BADGE: Record<string, "info" | "warning" | "danger" | "success"> = {
  CREATE:  "success",
  UPDATE:  "info",
  DELETE:  "danger",
  EXPORT:  "info",
  APPROVE: "warning",
};

export default function AuditPage() {
  const [tab, setTab] = useState<Tab>("operations");

  const criticalCount = OPERATION_LOGS.filter((l) => l.level === "critical").length;
  const warningCount  = OPERATION_LOGS.filter((l) => l.level === "warning").length;
  const failedLogins  = ACCESS_LOGS.filter((l) => l.result === "failure").length;

  const exportData = tab === "operations"
    ? {
        columns: ["ID", "日時", "ユーザー", "操作", "対象", "詳細", "レベル", "IPアドレス"],
        rows: OPERATION_LOGS.map((l): CellValue[] => [
          l.id, l.timestamp, l.user, l.action, l.resource, l.detail,
          LEVEL_BADGE[l.level].label, l.ip,
        ]),
      }
    : tab === "access"
    ? {
        columns: ["ID", "日時", "ユーザー", "イベント", "IPアドレス", "ブラウザ/OS", "結果"],
        rows: ACCESS_LOGS.map((l): CellValue[] => [
          l.id, l.timestamp, l.user,
          ACCESS_EVENT_LABEL[l.event],
          l.ip, l.ua, l.result === "success" ? "成功" : "失敗",
        ]),
      }
    : {
        columns: ["ID", "日時", "ユーザー", "対象", "フィールド", "変更前", "変更後", "カテゴリ"],
        rows: CHANGE_RECORDS.map((r): CellValue[] => [
          r.id, r.timestamp, r.user, r.target, r.field, r.before, r.after, r.category,
        ]),
      };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <ShieldCheck className="w-7 h-7 text-primary-600" />
          監査ログ
        </h2>
        <DataActions
          target={tab === "operations" ? "操作ログ" : tab === "access" ? "アクセスログ" : "変更履歴"}
          exportData={exportData}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex items-center gap-3 p-4">
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
            <Activity className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">本日のイベント</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{OPERATION_LOGS.length}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-4">
          <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">重大イベント</p>
            <p className="text-xl font-bold text-red-600">{criticalCount}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-4">
          <div className="w-10 h-10 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center flex-shrink-0">
            <Key className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">認証失敗</p>
            <p className="text-xl font-bold text-yellow-600">{failedLogins}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-4">
          <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">コンプライアンス</p>
            <p className="text-xl font-bold text-green-600">{warningCount === 0 ? "適合" : "要確認"}</p>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {(
          [
            { key: "operations", icon: Activity, label: "操作ログ" },
            { key: "access",     icon: Key,      label: "アクセスログ" },
            { key: "changes",    icon: GitCommit, label: "変更履歴" },
          ] as { key: Tab; icon: typeof Activity; label: string }[]
        ).map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium flex items-center gap-1.5 border-b-2 transition-colors ${
              tab === key
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Operations tab */}
      {tab === "operations" && (
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  {["日時", "ユーザー", "操作", "対象", "詳細", "レベル", "IPアドレス"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {OPERATION_LOGS.map((log) => (
                  <tr
                    key={log.id}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                      log.level === "critical" ? "bg-red-50/40 dark:bg-red-900/10" : ""
                    }`}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{log.timestamp}</td>
                    <td className="px-4 py-3 text-gray-800 dark:text-gray-200 flex items-center gap-1.5 whitespace-nowrap">
                      <Users className="w-3.5 h-3.5 text-gray-400" />
                      {log.user}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={ACTION_BADGE[log.action] ?? "info"} size="sm">
                        {log.action}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">{log.resource}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 max-w-xs truncate">{log.detail}</td>
                    <td className="px-4 py-3">
                      <Badge variant={LEVEL_BADGE[log.level].variant} size="sm">
                        {LEVEL_BADGE[log.level].label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">{log.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Access log tab */}
      {tab === "access" && (
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  {["日時", "ユーザー", "イベント", "IPアドレス", "ブラウザ/OS", "結果"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {ACCESS_LOGS.map((log) => (
                  <tr
                    key={log.id}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                      log.result === "failure" ? "bg-red-50/40 dark:bg-red-900/10" : ""
                    }`}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{log.timestamp}</td>
                    <td className="px-4 py-3 text-gray-800 dark:text-gray-200 whitespace-nowrap">{log.user}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          log.event === "login" ? "success"
                          : log.event === "logout" ? "info"
                          : log.event === "failed" ? "danger"
                          : "warning"
                        }
                        size="sm"
                      >
                        {ACCESS_EVENT_LABEL[log.event]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">{log.ip}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{log.ua}</td>
                    <td className="px-4 py-3">
                      <div className={`flex items-center gap-1 text-xs font-medium ${
                        log.result === "success" ? "text-green-600" : "text-red-600"
                      }`}>
                        {log.result === "success"
                          ? <CheckCircle2 className="w-3.5 h-3.5" />
                          : <AlertTriangle className="w-3.5 h-3.5" />}
                        {log.result === "success" ? "成功" : "失敗"}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Suspicious access alert */}
          {ACCESS_LOGS.filter((l) => l.result === "failure").length >= 3 && (
            <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800 flex items-center gap-2 text-sm text-red-700 dark:text-red-400">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              同一 IP（203.0.113.99）から複数回の認証失敗を検出しました。ブルートフォース攻撃の可能性があります。
            </div>
          )}
        </Card>
      )}

      {/* Changes tab */}
      {tab === "changes" && (
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  {["日時", "ユーザー", "対象", "フィールド", "変更前", "変更後", "カテゴリ"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {CHANGE_RECORDS.map((rec) => (
                  <tr key={rec.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{rec.timestamp}</td>
                    <td className="px-4 py-3 text-gray-800 dark:text-gray-200 whitespace-nowrap">{rec.user}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300 max-w-[180px] truncate">{rec.target}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">{rec.field}</td>
                    <td className="px-4 py-3 text-xs text-red-600 dark:text-red-400 line-through">{rec.before}</td>
                    <td className="px-4 py-3 text-xs text-green-600 dark:text-green-400 font-semibold">{rec.after}</td>
                    <td className="px-4 py-3">
                      <Badge variant="info" size="sm">{rec.category}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Footer note */}
      <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5" />
        監査ログは改ざん防止のため読み取り専用です。エクスポートのみ可能です。
      </p>
    </div>
  );
}
