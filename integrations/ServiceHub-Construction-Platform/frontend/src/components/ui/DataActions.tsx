import { useRef, useState, useEffect } from "react";
import {
  Download,
  Upload,
  ChevronDown,
  FileText,
  FileCode,
  FileSpreadsheet,
  CheckCircle,
} from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import clsx from "clsx";

export type CellValue = string | number | boolean | null;
export type ParsedRow = Record<string, string | number | null>;

export interface ExportData {
  columns: string[];
  rows: CellValue[][];
}

export interface DataActionsProps {
  /** ページ名（エクスポートファイル名・PDF タイトルに使用） */
  target: string;
  exportData: ExportData;
  onImport?: (rows: ParsedRow[]) => void;
}

type ExportFormat = "pdf" | "html" | "excel" | "csv";

const FORMAT_ITEMS: { value: ExportFormat; label: string; Icon: typeof FileText }[] = [
  { value: "pdf",   label: "PDF",   Icon: FileText },
  { value: "html",  label: "HTML",  Icon: FileCode },
  { value: "excel", label: "Excel", Icon: FileSpreadsheet },
  { value: "csv",   label: "CSV",   Icon: FileText },
];

function slugify(target: string): string {
  return target.replace(/[・/\s]/g, "_");
}

function doExportPDF(target: string, data: ExportData): void {
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(`ServiceHub — ${target}`, 14, 20);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  doc.text(`出力日時: ${new Date().toLocaleString("ja-JP")}`, 14, 28);
  autoTable(doc, {
    startY: 34,
    head: [data.columns],
    body: data.rows as (string | number)[][],
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  });
  doc.save(`${slugify(target)}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

function doExportHTML(target: string, data: ExportData): void {
  const date = new Date().toLocaleString("ja-JP");
  const thead = data.columns.map((c) => `<th>${c}</th>`).join("");
  const tbody = data.rows
    .map(
      (row) =>
        `<tr>${row
          .map((cell) => `<td>${cell ?? ""}</td>`)
          .join("")}</tr>`,
    )
    .join("\n");
  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<title>ServiceHub — ${target}</title>
<style>
body{font-family:'Hiragino Sans','Meiryo',sans-serif;margin:24px;color:#1f2937}
h1{font-size:20px;margin-bottom:4px;color:#1e3a5f}
.meta{color:#6b7280;font-size:13px;margin-bottom:16px}
table{width:100%;border-collapse:collapse;font-size:13px}
th{background:#3b82f6;color:#fff;padding:8px 12px;text-align:left}
td{padding:7px 12px;border-bottom:1px solid #e5e7eb}
tr:nth-child(even){background:#f8fafc}
.footer{margin-top:20px;color:#9ca3af;font-size:12px}
</style>
</head>
<body>
<h1>ServiceHub — ${target}</h1>
<p class="meta">出力日時: ${date}</p>
<table>
<thead><tr>${thead}</tr></thead>
<tbody>${tbody}</tbody>
</table>
<p class="footer">ServiceHub Construction Platform — 建設業向け統合業務管理</p>
</body>
</html>`;
  const blob = new Blob([html], { type: "text/html;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slugify(target)}_${new Date().toISOString().slice(0, 10)}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

function doExportExcel(target: string, data: ExportData): void {
  const ws = XLSX.utils.aoa_to_sheet([data.columns, ...data.rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "データ");
  XLSX.writeFile(wb, `${slugify(target)}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

function doExportCSV(target: string, data: ExportData): void {
  const csv = [data.columns, ...data.rows]
    .map((row) =>
      row
        .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slugify(target)}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * DataActions — インポート/エクスポートボタンを各ページヘッダーに追加する共有コンポーネント。
 * エクスポートはドロップダウンで PDF / HTML / Excel / CSV を選択可能。
 * インポートは CSV / xlsx ファイルを読み込んで onImport コールバックに行データを渡す。
 */
export function DataActions({ target, exportData, onImport }: DataActionsProps) {
  const [exportOpen, setExportOpen] = useState(false);
  const [done, setDone] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // ドロップダウン外クリックで閉じる
  useEffect(() => {
    if (!exportOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [exportOpen]);

  function handleExport(format: ExportFormat): void {
    setExportOpen(false);
    switch (format) {
      case "pdf":
        doExportPDF(target, exportData);
        break;
      case "html":
        doExportHTML(target, exportData);
        break;
      case "excel":
        doExportExcel(target, exportData);
        break;
      case "csv":
        doExportCSV(target, exportData);
        break;
    }
    setDone(true);
    setTimeout(() => setDone(false), 2500);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const file = e.target.files?.[0];
    if (!file || !onImport) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "csv") {
      Papa.parse<ParsedRow>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (res) => {
          onImport(res.data.slice(0, 1000));
        },
      });
    } else if (ext === "xlsx" || ext === "xls") {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const buf = new Uint8Array(ev.target?.result as ArrayBuffer);
        const wb = XLSX.read(buf, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<ParsedRow>(ws, { defval: null });
        onImport(json.slice(0, 1000));
      };
      reader.readAsArrayBuffer(file);
    }
    e.target.value = "";
  }

  const btnBase =
    "inline-flex items-center gap-1.5 h-9 px-3 text-sm font-medium rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-60)]";
  const btnNeutral =
    "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700";

  return (
    <div className="flex items-center gap-2">
      {/* インポートボタン */}
      {onImport && (
        <>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className={clsx(btnBase, btnNeutral)}
            aria-label={`${target}データをインポート`}
          >
            <Upload className="w-4 h-4" aria-hidden="true" />
            インポート
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={handleFileChange}
            aria-hidden="true"
          />
        </>
      )}

      {/* エクスポートドロップダウン */}
      <div ref={dropRef} className="relative">
        <button
          type="button"
          onClick={() => setExportOpen((v) => !v)}
          className={clsx(
            btnBase,
            done
              ? "border-green-400 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 dark:border-green-600"
              : btnNeutral,
          )}
          aria-haspopup="true"
          aria-expanded={exportOpen}
          aria-label={`${target}データをエクスポート`}
        >
          {done ? (
            <>
              <CheckCircle className="w-4 h-4" aria-hidden="true" />
              完了
            </>
          ) : (
            <>
              <Download className="w-4 h-4" aria-hidden="true" />
              エクスポート
              <ChevronDown
                className={clsx(
                  "w-3.5 h-3.5 transition-transform",
                  exportOpen && "rotate-180",
                )}
                aria-hidden="true"
              />
            </>
          )}
        </button>

        {exportOpen && (
          <div
            role="menu"
            className="absolute right-0 mt-1 w-36 rounded-md shadow-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 z-50 py-1"
          >
            {FORMAT_ITEMS.map(({ value, label, Icon }) => (
              <button
                key={value}
                role="menuitem"
                type="button"
                onClick={() => handleExport(value)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Icon className="w-4 h-4 text-gray-400" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
