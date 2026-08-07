import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { api, endpoints } from "../api/client";
import { InvoiceNumberBadge } from "../components/InvoiceNumberBadge";

interface Invoice {
  invoice_id: string;
  invoice_number: string;
  issuer_name: string;
  issuer_registration_no: string;
  invoice_date: string;
  amount_incl_tax: number;
  tax_rate: number;
}

interface InvoiceForm {
  invoice_number: string;
  issuer_name: string;
  issuer_registration_no: string;
  invoice_date: string;
  amount_excl_tax: number;
  tax_rate: number;
}

interface TaxBreakdown {
  total_excl_tax: number;
  total_tax: number;
  total_incl_tax: number;
  standard_tax: number;
  reduced_tax: number;
  deductible_tax: number;
  issuer_qualified: boolean;
  lines: Array<{
    item_name: string;
    amount_excl_tax: number;
    category: string;
    rate: number;
    tax_amount: number;
  }>;
}

export default function InvoicesPage() {
  const [items, setItems] = useState<Invoice[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [taxItems, setTaxItems] = useState<
    Array<{ item_name: string; amount_excl_tax: number }>
  >([{ item_name: "", amount_excl_tax: 0 }]);
  const [qualified, setQualified] = useState(true);
  const [breakdown, setBreakdown] = useState<TaxBreakdown | null>(null);

  const calcTax = () => {
    api
      .post<TaxBreakdown>("/invoices/calculate-tax", {
        items: taxItems,
        issuer_qualified: qualified,
      })
      .then((r) => setBreakdown(r.data))
      .catch(() => {});
  };

  const { register, handleSubmit, reset } = useForm<InvoiceForm>({
    defaultValues: {
      tax_rate: 0.1,
      invoice_date: new Date().toISOString().slice(0, 10),
    },
  });

  const reload = () =>
    api
      .get<Invoice[]>(endpoints.invoices)
      .then((r) => setItems(r.data))
      .catch(() => {});

  useEffect(() => {
    void reload();
  }, []);

  const onSubmit = (v: InvoiceForm) => {
    setErr(null);
    const excl = Number(v.amount_excl_tax);
    const rate = Number(v.tax_rate);
    const tax = Math.floor(excl * rate);
    api
      .post(endpoints.invoices, {
        ...v,
        amount_excl_tax: excl,
        tax_rate: rate,
        tax_amount: tax,
        amount_incl_tax: excl + tax,
      })
      .then(() => {
        reset({ tax_rate: rate, invoice_date: v.invoice_date });
        reload();
      })
      .catch((e) => setErr(e.response?.data?.detail || "登録失敗"));
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">請求書 / インボイス管理</h1>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid gap-2 grid-cols-1 md:grid-cols-3 bg-white p-3 rounded-xl shadow"
      >
        <input
          {...register("invoice_number", { required: true })}
          placeholder="請求書番号"
          className="border rounded px-2 py-1"
        />
        <input
          {...register("issuer_name", { required: true })}
          placeholder="発行者名"
          className="border rounded px-2 py-1"
        />
        <input
          {...register("issuer_registration_no", { required: true })}
          placeholder="登録番号 (T + 13桁)"
          className="border rounded px-2 py-1"
        />
        <input
          {...register("invoice_date", { required: true })}
          type="date"
          className="border rounded px-2 py-1"
        />
        <input
          {...register("amount_excl_tax", { required: true })}
          type="number"
          placeholder="税抜金額"
          className="border rounded px-2 py-1"
        />
        <select
          {...register("tax_rate", { required: true })}
          className="border rounded px-2 py-1"
        >
          <option value={0.1}>標準 10%</option>
          <option value={0.08}>軽減 8%</option>
        </select>
        <button
          type="submit"
          className="bg-cdx-corp text-white rounded px-3 py-1 min-h-tap md:col-span-3"
        >
          登録
        </button>
      </form>
      {err && <p className="text-cdx-alert text-sm">{err}</p>}

      <div className="bg-white p-3 rounded-xl shadow space-y-2">
        <h2 className="font-bold text-sm">消費税自動計算 (軽減/標準/インボイス)</h2>
        {taxItems.map((it, idx) => (
          <div key={idx} className="grid gap-2 grid-cols-1 md:grid-cols-3">
            <input
              placeholder="品目名 (例: 鉄骨 / 弁当 / 新聞)"
              value={it.item_name}
              onChange={(e) => {
                const next = [...taxItems];
                next[idx] = { ...next[idx], item_name: e.target.value };
                setTaxItems(next);
              }}
              className="border rounded px-2 py-1"
            />
            <input
              type="number"
              placeholder="税抜金額"
              value={it.amount_excl_tax}
              onChange={(e) => {
                const next = [...taxItems];
                next[idx] = {
                  ...next[idx],
                  amount_excl_tax: Number(e.target.value),
                };
                setTaxItems(next);
              }}
              className="border rounded px-2 py-1"
            />
            <div className="flex items-center text-xs text-slate-600">
              品名から軽減税率を自動判定 (食/弁当/茶/新聞)
            </div>
          </div>
        ))}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() =>
              setTaxItems([...taxItems, { item_name: "", amount_excl_tax: 0 }])
            }
            className="bg-slate-500 text-white rounded px-3 py-1 text-sm"
          >
            行追加
          </button>
          <label className="text-sm flex items-center gap-1">
            <input
              type="checkbox"
              checked={qualified}
              onChange={(e) => setQualified(e.target.checked)}
            />
            適格事業者 (インボイス登録済)
          </label>
          <button
            onClick={calcTax}
            className="bg-cdx-corp text-white rounded px-3 py-1 text-sm min-h-tap"
          >
            税額を自動計算
          </button>
        </div>
        {breakdown && (
          <div className="text-xs bg-slate-50 p-2 rounded space-y-1">
            <div>
              標準10%: ¥{breakdown.standard_tax.toLocaleString("ja-JP")} ／ 軽減8%: ¥
              {breakdown.reduced_tax.toLocaleString("ja-JP")} ／ 合計税: ¥
              {breakdown.total_tax.toLocaleString("ja-JP")}
            </div>
            <div>
              税込合計: ¥{breakdown.total_incl_tax.toLocaleString("ja-JP")} ／ 控除可能税額: ¥
              {breakdown.deductible_tax.toLocaleString("ja-JP")}{" "}
              {!breakdown.issuer_qualified && "(経過措置 80%)"}
            </div>
            <ul>
              {breakdown.lines.map((l, i) => (
                <li key={i}>
                  {l.item_name || "(無名)"}: {l.category} {(l.rate * 100).toFixed(0)}% → ¥
                  {l.tax_amount.toLocaleString("ja-JP")}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <table className="w-full bg-white rounded-xl shadow text-sm">
        <thead className="bg-slate-100">
          <tr>
            <th className="p-2 text-left">請求書番号</th>
            <th className="p-2 text-left">発行者</th>
            <th className="p-2 text-left">登録番号</th>
            <th className="p-2 text-left">日付</th>
            <th className="p-2 text-right">税込金額</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.invoice_id} className="border-t">
              <td className="p-2">{i.invoice_number}</td>
              <td className="p-2">{i.issuer_name}</td>
              <td className="p-2">
                <div className="flex flex-col gap-1">
                  <code className="text-xs">{i.issuer_registration_no}</code>
                  <InvoiceNumberBadge
                    registrationNo={i.issuer_registration_no}
                  />
                </div>
              </td>
              <td className="p-2">{i.invoice_date}</td>
              <td className="p-2 text-right">
                ¥
                {Math.round(Number(i.amount_incl_tax)).toLocaleString("ja-JP")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
