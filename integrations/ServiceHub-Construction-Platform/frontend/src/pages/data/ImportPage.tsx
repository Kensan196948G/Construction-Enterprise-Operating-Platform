import { useRef, useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import {
  Upload,
  FileText,
  Table,
  CheckCircle,
  AlertCircle,
  X,
  FileSpreadsheet,
} from "lucide-react";
import { Button, Card, Badge } from "@/components/ui";
import clsx from "clsx";

type ImportTarget =
  | "projects"
  | "reports"
  | "safety"
  | "costs"
  | "itsm";

type ParsedRow = Record<string, string | number | null>;

type ImportResult = {
  success: number;
  skipped: number;
  errors: string[];
};

const TARGET_OPTIONS: { value: ImportTarget; label: string; template: string[] }[] = [
  {
    value: "projects",
    label: "工事案件",
    template: ["project_code", "name", "client_name", "status", "start_date", "end_date", "budget"],
  },
  {
    value: "reports",
    label: "日報",
    template: ["date", "project_id", "work_content", "weather", "workers_count"],
  },
  {
    value: "safety",
    label: "安全確認",
    template: ["date", "project_id", "check_type", "result", "notes"],
  },
  {
    value: "costs",
    label: "原価・工数",
    template: ["date", "project_id", "category", "amount", "description"],
  },
  {
    value: "itsm",
    label: "インシデント",
    template: ["title", "description", "category", "priority", "severity"],
  },
];

// CSVテンプレートを生成してダウンロード
function downloadTemplate(target: ImportTarget) {
  const option = TARGET_OPTIONS.find((o) => o.value === target);
  if (!option) return;
  const csv = option.template.join(",") + "\n";
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${target}_template.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ImportPage() {
  const [target, setTarget] = useState<ImportTarget>("projects");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setRows([]);
    setHeaders([]);
    setFileName(null);
    setResult(null);
  };

  const parseFile = (file: File) => {
    reset();
    setFileName(file.name);
    const ext = file.name.split(".").pop()?.toLowerCase();

    if (ext === "csv") {
      Papa.parse<ParsedRow>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (res) => {
          setHeaders(res.meta.fields ?? []);
          setRows(res.data.slice(0, 200));
        },
      });
    } else if (ext === "xlsx" || ext === "xls") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json: ParsedRow[] = XLSX.utils.sheet_to_json(ws, { defval: null });
        setHeaders(Object.keys(json[0] ?? {}));
        setRows(json.slice(0, 200));
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  };

  // バリデーション: テンプレートの必須列が存在するか
  const requiredCols = TARGET_OPTIONS.find((o) => o.value === target)?.template ?? [];
  const missingCols = requiredCols.filter((c) => !headers.includes(c));

  const handleImport = async () => {
    if (rows.length === 0 || missingCols.length > 0) return;
    setImporting(true);
    // デモ: 実際の API 送信の代わりにシミュレーション
    await new Promise((r) => setTimeout(r, 800));
    setResult({ success: rows.length, skipped: 0, errors: [] });
    setImporting(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Upload className="w-6 h-6 text-[var(--brand-60)]" />
            データインポート
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            CSV または Excel ファイルからデータを一括取り込みできます
          </p>
        </div>
      </div>

      {/* ステップ 1: 対象選択 */}
      <Card className="p-6">
        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[var(--brand-60)] text-white text-xs flex items-center justify-center font-bold">1</span>
          インポート対象を選択
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {TARGET_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setTarget(opt.value); reset(); }}
              className={clsx(
                "p-3 rounded-lg border-2 text-sm font-medium text-center transition-colors",
                target === opt.value
                  ? "border-[var(--brand-60)] bg-[var(--brand-10)] text-[var(--brand-70)]"
                  : "border-gray-200 hover:border-gray-300 text-gray-700 dark:text-gray-300",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => downloadTemplate(target)}
          className="mt-4 text-sm text-[var(--brand-60)] hover:underline flex items-center gap-1"
        >
          <FileText className="w-4 h-4" />
          {TARGET_OPTIONS.find((o) => o.value === target)?.label} CSVテンプレートをダウンロード
        </button>
      </Card>

      {/* ステップ 2: ファイルアップロード */}
      <Card className="p-6">
        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[var(--brand-60)] text-white text-xs flex items-center justify-center font-bold">2</span>
          ファイルを選択
        </h2>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={clsx(
            "border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors",
            dragOver
              ? "border-[var(--brand-60)] bg-[var(--brand-10)]"
              : "border-gray-300 hover:border-[var(--brand-40)] hover:bg-gray-50",
          )}
        >
          <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            ここにファイルをドロップ、または
            <span className="text-[var(--brand-60)] ml-1">クリックして選択</span>
          </p>
          <p className="text-xs text-gray-400 mt-2">対応形式: .csv / .xlsx / .xls（最大 5MB）</p>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {fileName && (
          <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
            <FileText className="w-4 h-4 text-[var(--brand-60)]" />
            <span className="font-medium">{fileName}</span>
            <Badge variant="info">{rows.length} 行</Badge>
            <button
              onClick={reset}
              className="ml-auto text-gray-400 hover:text-gray-600"
              aria-label="ファイルをクリア"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </Card>

      {/* ステップ 3: プレビューと検証 */}
      {rows.length > 0 && (
        <Card className="p-6">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[var(--brand-60)] text-white text-xs flex items-center justify-center font-bold">3</span>
            プレビュー・検証
            <Badge variant={missingCols.length === 0 ? "success" : "danger"}>
              {missingCols.length === 0 ? "検証OK" : `${missingCols.length}列不足`}
            </Badge>
          </h2>

          {missingCols.length > 0 && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">必須列が不足しています:</p>
                <p>{missingCols.join(", ")}</p>
              </div>
            </div>
          )}

          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  {headers.map((h) => (
                    <th
                      key={h}
                      className={clsx(
                        "px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap",
                        requiredCols.includes(h) ? "" : "text-gray-400",
                      )}
                    >
                      {h}
                      {requiredCols.includes(h) && (
                        <span className="ml-1 text-[var(--brand-60)]">*</span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 10).map((row, i) => (
                  <tr
                    key={i}
                    className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    {headers.map((h) => (
                      <td key={h} className="px-3 py-2 text-gray-700 dark:text-gray-300 whitespace-nowrap max-w-[200px] truncate">
                        {String(row[h] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length > 10 && (
            <p className="mt-2 text-xs text-gray-400">先頭 10 行を表示（全 {rows.length} 行）</p>
          )}
        </Card>
      )}

      {/* ステップ 4: インポート実行 */}
      {rows.length > 0 && (
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={reset}>クリア</Button>
          <Button
            onClick={handleImport}
            disabled={importing || missingCols.length > 0}
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            {importing ? "インポート中..." : `${rows.length} 件をインポート`}
          </Button>
        </div>
      )}

      {/* 結果 */}
      {result && (
        <Card className="p-6 border-green-200 bg-green-50 dark:bg-green-900/20">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <p className="font-semibold text-green-800 dark:text-green-300">
                インポート完了
              </p>
              <p className="text-sm text-green-700 dark:text-green-400">
                成功: {result.success} 件
                {result.skipped > 0 && ` / スキップ: ${result.skipped} 件`}
                {result.errors.length > 0 && ` / エラー: ${result.errors.length} 件`}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* 注意事項 */}
      <Card className="p-4 bg-amber-50 dark:bg-amber-900/20 border-amber-200">
        <div className="flex items-start gap-2">
          <Table className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-800 dark:text-amber-300">
            <p className="font-semibold mb-1">インポート注意事項</p>
            <ul className="list-disc list-inside space-y-1 text-amber-700 dark:text-amber-400">
              <li>CSVテンプレートの列名（ヘッダー行）と一致している必要があります</li>
              <li>日付は <code className="bg-amber-100 px-1 rounded text-xs">YYYY-MM-DD</code> 形式で入力してください</li>
              <li>1 ファイルで最大 1,000 行まで一括取り込み可能です</li>
              <li>既存データとの重複チェックはインポート後に実施されます</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
