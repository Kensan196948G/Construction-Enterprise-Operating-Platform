import { useEffect, useState } from "react";
import { api, endpoints } from "../api/client";

interface Row {
  account_code: string;
  account_name: string;
  category: string;
  debit_total: number;
  credit_total: number;
  balance: number;
}

interface TB {
  rows: Row[];
  total_debit: number;
  total_credit: number;
}

export default function TrialBalancePage() {
  const [tb, setTb] = useState<TB | null>(null);
  const [pdfYear, setPdfYear] = useState<number>(new Date().getFullYear());
  const [compare, setCompare] = useState(true);

  useEffect(() => {
    api
      .get<TB>(endpoints.trialBalance)
      .then((r) => setTb(r.data))
      .catch(() => {});
  }, []);

  const downloadPdf = () => {
    api
      .get(
        `/accounting/statements/pdf?year=${pdfYear}&compare=${compare ? "true" : "false"}`,
        { responseType: "blob" }
      )
      .then((r) => {
        const url = window.URL.createObjectURL(
          new Blob([r.data], { type: "application/pdf" })
        );
        const a = document.createElement("a");
        a.href = url;
        a.download = `statements_${pdfYear}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      });
  };

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold">試算表</h1>
      <div className="bg-white p-3 rounded-xl shadow flex flex-wrap gap-2 items-center text-sm">
        <span>財務諸表 PDF:</span>
        <input
          type="number"
          value={pdfYear}
          onChange={(e) => setPdfYear(Number(e.target.value))}
          className="border rounded px-2 py-1 w-24"
        />
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={compare}
            onChange={(e) => setCompare(e.target.checked)}
          />
          前期比較
        </label>
        <button
          onClick={downloadPdf}
          className="bg-cdx-accounting text-white rounded px-3 py-1 min-h-tap"
        >
          PDFダウンロード
        </button>
      </div>
      {tb && (
        <p className="text-sm">
          借方合計 ¥{Math.round(tb.total_debit).toLocaleString("ja-JP")} ／
          貸方合計 ¥{Math.round(tb.total_credit).toLocaleString("ja-JP")}{" "}
          {tb.total_debit === tb.total_credit ? "(一致)" : "(不一致!)"}
        </p>
      )}
      <table className="w-full bg-white rounded-xl shadow text-sm">
        <thead className="bg-slate-100">
          <tr>
            <th className="p-2 text-left">科目コード</th>
            <th className="p-2 text-left">科目名</th>
            <th className="p-2 text-left">区分</th>
            <th className="p-2 text-right">借方</th>
            <th className="p-2 text-right">貸方</th>
            <th className="p-2 text-right">残高</th>
          </tr>
        </thead>
        <tbody>
          {(tb?.rows ?? []).map((r) => (
            <tr key={r.account_code} className="border-t">
              <td className="p-2">{r.account_code}</td>
              <td className="p-2">{r.account_name}</td>
              <td className="p-2">{r.category}</td>
              <td className="p-2 text-right">
                ¥{Math.round(r.debit_total).toLocaleString("ja-JP")}
              </td>
              <td className="p-2 text-right">
                ¥{Math.round(r.credit_total).toLocaleString("ja-JP")}
              </td>
              <td className="p-2 text-right font-bold">
                ¥{Math.round(r.balance).toLocaleString("ja-JP")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
