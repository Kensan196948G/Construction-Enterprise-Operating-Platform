import { useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import {
  Download,
  FileText,
  FileCode,
  FileSpreadsheet,
  Building2,
  HardHat,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { Button, Card, Badge } from "@/components/ui";
import clsx from "clsx";

type ExportTarget = "projects" | "safety" | "costs" | "itsm";
type ExportFormat = "pdf" | "html" | "excel" | "csv";

type ExportOption = {
  value: ExportTarget;
  label: string;
  icon: typeof Building2;
  description: string;
};

const EXPORT_OPTIONS: ExportOption[] = [
  {
    value: "projects",
    label: "工事案件",
    icon: Building2,
    description: "案件一覧・進捗・ステータス",
  },
  {
    value: "safety",
    label: "安全品質",
    icon: HardHat,
    description: "安全確認・品質検査記録",
  },
  {
    value: "costs",
    label: "原価・工数",
    icon: DollarSign,
    description: "コスト記録・工数集計",
  },
  {
    value: "itsm",
    label: "インシデント",
    icon: AlertCircle,
    description: "インシデント・変更要求一覧",
  },
];

type FormatOption = {
  value: ExportFormat;
  label: string;
  icon: typeof FileText;
  description: string;
  badge?: string;
};

const FORMAT_OPTIONS: FormatOption[] = [
  {
    value: "pdf",
    label: "PDF",
    icon: FileText,
    description: "印刷・共有向け PDF 形式",
    badge: "推奨",
  },
  {
    value: "html",
    label: "HTML",
    icon: FileCode,
    description: "ブラウザで表示可能な HTML 形式",
  },
  {
    value: "excel",
    label: "Excel",
    icon: FileSpreadsheet,
    description: "Excel (.xlsx) スプレッドシート",
  },
  {
    value: "csv",
    label: "CSV",
    icon: FileText,
    description: "汎用 CSV テキスト形式",
  },
];

// サンプルデータ（実運用では API 取得）
const SAMPLE_DATA: Record<ExportTarget, { columns: string[]; rows: (string | number)[][] }> = {
  projects: {
    columns: ["案件コード", "案件名", "発注者", "ステータス", "開始日", "完了予定日", "予算(円)"],
    rows: [
      ["PRJ-001", "○○ビル新築工事", "株式会社ABC", "進行中", "2026-01-10", "2026-08-31", 85000000],
      ["PRJ-002", "△△道路補修工事", "国土交通省", "計画中", "2026-03-01", "2026-06-30", 12000000],
      ["PRJ-003", "××マンション改修", "○○建設", "完了", "2025-11-01", "2026-02-28", 32000000],
    ],
  },
  safety: {
    columns: ["日付", "案件", "確認区分", "結果", "担当者", "備考"],
    rows: [
      ["2026-05-19", "PRJ-001", "安全朝礼", "合格", "山田太郎", ""],
      ["2026-05-19", "PRJ-001", "保護具着用確認", "合格", "山田太郎", "全員着用確認済"],
      ["2026-05-18", "PRJ-002", "足場点検", "要改善", "鈴木次郎", "補強部材追加予定"],
    ],
  },
  costs: {
    columns: ["日付", "案件", "カテゴリ", "金額(円)", "説明"],
    rows: [
      ["2026-05-15", "PRJ-001", "材料費", 1250000, "鉄筋コンクリート材料"],
      ["2026-05-16", "PRJ-001", "労務費", 480000, "職人 8 名 × 2 日"],
      ["2026-05-17", "PRJ-002", "外注費", 320000, "電気工事下請"],
    ],
  },
  itsm: {
    columns: ["インシデント番号", "タイトル", "カテゴリ", "優先度", "ステータス", "登録日"],
    rows: [
      ["INC-000001", "建設ポータル接続不可", "SYSTEM", "HIGH", "RESOLVED", "2026-05-10"],
      ["INC-000002", "安全管理システム障害", "APPLICATION", "CRITICAL", "IN_PROGRESS", "2026-05-18"],
    ],
  },
};

function exportToPDF(target: ExportTarget) {
  const { columns, rows } = SAMPLE_DATA[target];
  const label = EXPORT_OPTIONS.find((o) => o.value === target)?.label ?? target;
  const doc = new jsPDF({ orientation: "landscape" });

  // ヘッダー
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(`ServiceHub — ${label}一覧`, 14, 20);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  doc.text(`出力日時: ${new Date().toLocaleString("ja-JP")}`, 14, 28);

  autoTable(doc, {
    startY: 34,
    head: [columns],
    body: rows,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  });

  doc.save(`${target}_export_${new Date().toISOString().slice(0, 10)}.pdf`);
}

function exportToHTML(target: ExportTarget) {
  const { columns, rows } = SAMPLE_DATA[target];
  const label = EXPORT_OPTIONS.find((o) => o.value === target)?.label ?? target;
  const date = new Date().toLocaleString("ja-JP");

  const tableRows = rows
    .map(
      (row) =>
        `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`,
    )
    .join("\n");

  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<title>ServiceHub — ${label}一覧</title>
<style>
  body { font-family: 'Hiragino Sans', 'Meiryo', sans-serif; margin: 24px; color: #1f2937; }
  h1 { font-size: 20px; margin-bottom: 4px; color: #1e3a5f; }
  .meta { color: #6b7280; font-size: 13px; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { background: #3b82f6; color: #fff; padding: 8px 12px; text-align: left; }
  td { padding: 7px 12px; border-bottom: 1px solid #e5e7eb; }
  tr:nth-child(even) { background: #f8fafc; }
  .footer { margin-top: 20px; color: #9ca3af; font-size: 12px; }
</style>
</head>
<body>
<h1>ServiceHub — ${label}一覧</h1>
<p class="meta">出力日時: ${date}</p>
<table>
  <thead><tr>${columns.map((c) => `<th>${c}</th>`).join("")}</tr></thead>
  <tbody>${tableRows}</tbody>
</table>
<p class="footer">ServiceHub Construction Platform — 建設業向け統合業務管理</p>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${target}_export_${new Date().toISOString().slice(0, 10)}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportToExcel(target: ExportTarget) {
  const { columns, rows } = SAMPLE_DATA[target];
  const ws = XLSX.utils.aoa_to_sheet([columns, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "データ");
  XLSX.writeFile(wb, `${target}_export_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

function exportToCSV(target: ExportTarget) {
  const { columns, rows } = SAMPLE_DATA[target];
  const csvRows = [columns, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\r\n");
  const blob = new Blob(["﻿" + csvRows], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${target}_export_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ExportPage() {
  const [target, setTarget] = useState<ExportTarget>("projects");
  const [format, setFormat] = useState<ExportFormat>("pdf");
  const [exporting, setExporting] = useState(false);
  const [done, setDone] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    setDone(false);
    await new Promise((r) => setTimeout(r, 400));
    switch (format) {
      case "pdf":   exportToPDF(target);   break;
      case "html":  exportToHTML(target);  break;
      case "excel": exportToExcel(target); break;
      case "csv":   exportToCSV(target);   break;
    }
    setExporting(false);
    setDone(true);
    setTimeout(() => setDone(false), 3000);
  };

  const preview = SAMPLE_DATA[target];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* ヘッダー */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Download className="w-6 h-6 text-[var(--brand-60)]" />
          データエクスポート
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          PDF・HTML・Excel・CSV 形式でデータを出力できます
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 左カラム: 設定 */}
        <div className="space-y-5">
          {/* ステップ 1: 対象 */}
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[var(--brand-60)] text-white text-xs flex items-center justify-center font-bold">1</span>
              出力対象
            </h2>
            <div className="space-y-2">
              {EXPORT_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setTarget(opt.value)}
                    className={clsx(
                      "w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left",
                      target === opt.value
                        ? "border-[var(--brand-60)] bg-[var(--brand-10)]"
                        : "border-gray-200 hover:border-gray-300",
                    )}
                  >
                    <Icon
                      className={clsx(
                        "w-5 h-5 flex-shrink-0",
                        target === opt.value ? "text-[var(--brand-60)]" : "text-gray-400",
                      )}
                    />
                    <div>
                      <p className={clsx("text-sm font-medium", target === opt.value ? "text-[var(--brand-70)]" : "text-gray-800 dark:text-gray-200")}>
                        {opt.label}
                      </p>
                      <p className="text-xs text-gray-500">{opt.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* ステップ 2: 形式 */}
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[var(--brand-60)] text-white text-xs flex items-center justify-center font-bold">2</span>
              出力形式
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {FORMAT_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setFormat(opt.value)}
                    className={clsx(
                      "p-3 rounded-lg border-2 flex flex-col items-center gap-1.5 transition-colors",
                      format === opt.value
                        ? "border-[var(--brand-60)] bg-[var(--brand-10)]"
                        : "border-gray-200 hover:border-gray-300",
                    )}
                  >
                    <Icon
                      className={clsx(
                        "w-6 h-6",
                        format === opt.value ? "text-[var(--brand-60)]" : "text-gray-400",
                      )}
                    />
                    <span className={clsx("text-sm font-semibold", format === opt.value ? "text-[var(--brand-70)]" : "text-gray-700 dark:text-gray-300")}>
                      {opt.label}
                    </span>
                    {opt.badge && <Badge variant="success" className="text-xs">{opt.badge}</Badge>}
                    <span className="text-xs text-gray-400 text-center">{opt.description}</span>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* エクスポートボタン */}
          <Button
            onClick={handleExport}
            disabled={exporting}
            className="w-full flex items-center justify-center gap-2 py-3 text-base"
          >
            {exporting ? (
              <><Loader2 className="w-5 h-5 animate-spin" />エクスポート中...</>
            ) : done ? (
              <><CheckCircle className="w-5 h-5" />ダウンロード完了!</>
            ) : (
              <><Download className="w-5 h-5" />{FORMAT_OPTIONS.find((o) => o.value === format)?.label} でエクスポート</>
            )}
          </Button>
        </div>

        {/* 右カラム: プレビュー */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[var(--brand-60)] text-white text-xs flex items-center justify-center font-bold">3</span>
            データプレビュー
            <Badge variant="info">{preview.rows.length} 件</Badge>
          </h2>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-xs">
              <thead className="bg-[var(--brand-60)]">
                <tr>
                  {preview.columns.map((col) => (
                    <th key={col} className="px-2 py-2 text-left text-white font-semibold whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row, i) => (
                  <tr key={i} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/40">
                    {row.map((cell, j) => (
                      <td key={j} className="px-2 py-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        {String(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-gray-400">
            ※ プレビューはサンプルデータです。エクスポート時は実際のDBデータが使用されます。
          </p>
        </Card>
      </div>
    </div>
  );
}
