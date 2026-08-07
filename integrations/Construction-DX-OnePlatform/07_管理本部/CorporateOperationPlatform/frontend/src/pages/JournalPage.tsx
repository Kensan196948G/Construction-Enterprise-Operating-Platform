import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { api, endpoints } from "../api/client";

interface Entry {
  entry_id: string;
  txn_date: string;
  debit_account_code: string;
  credit_account_code: string;
  amount: number;
  description?: string;
  voucher_no?: string;
}

interface FormInput {
  txn_date: string;
  debit_account_code: string;
  credit_account_code: string;
  amount: number;
  description?: string;
  voucher_no?: string;
}

interface RuleEvent {
  event_type: string;
  amount: number;
  voucher_no?: string;
  tax_category?: string;
  invoice_number?: string;
  issuer_name?: string;
  period?: string;
}

export default function JournalPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [rules, setRules] = useState<
    Array<{
      rule_id: string;
      name: string;
      event_type: string;
      debit_account_code: string;
      credit_account_code: string;
    }>
  >([]);
  const [ruleForm, setRuleForm] = useState<RuleEvent>({
    event_type: "invoice_received",
    amount: 0,
    tax_category: "standard",
  });
  const [rulePreview, setRulePreview] = useState<Entry | null>(null);
  const { register, handleSubmit, reset } = useForm<FormInput>({
    defaultValues: { txn_date: new Date().toISOString().slice(0, 10) },
  });

  const reload = () => {
    api
      .get<Entry[]>(endpoints.journalEntries)
      .then((r) => setEntries(r.data))
      .catch(() => {});
    api
      .get<typeof rules>("/accounting/journal-rules")
      .then((r) => setRules(r.data))
      .catch(() => {});
  };

  useEffect(reload, []);

  const triggerRule = (persist: boolean) => {
    setErr(null);
    setRulePreview(null);
    api
      .post("/accounting/journal-rules/apply", {
        ...ruleForm,
        amount: Number(ruleForm.amount),
        txn_date: new Date().toISOString().slice(0, 10),
        persist,
      })
      .then((r) => {
        if (persist) {
          reload();
        } else {
          setRulePreview(r.data.preview);
        }
      })
      .catch((e) => setErr(e.response?.data?.detail || "ルール適用失敗"));
  };

  const onSubmit = (v: FormInput) => {
    setErr(null);
    api
      .post(endpoints.journalEntries, { ...v, amount: Number(v.amount) })
      .then(() => {
        reset({ txn_date: v.txn_date });
        reload();
      })
      .catch((e) => setErr(e.response?.data?.detail || "保存失敗"));
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">仕訳入力</h1>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid gap-2 grid-cols-1 md:grid-cols-6 bg-white p-3 rounded-xl shadow"
      >
        <input
          {...register("txn_date", { required: true })}
          type="date"
          className="border rounded px-2 py-1"
        />
        <input
          {...register("debit_account_code", { required: true })}
          placeholder="借方コード"
          className="border rounded px-2 py-1"
        />
        <input
          {...register("credit_account_code", { required: true })}
          placeholder="貸方コード"
          className="border rounded px-2 py-1"
        />
        <input
          {...register("amount", { required: true })}
          type="number"
          placeholder="金額"
          className="border rounded px-2 py-1"
        />
        <input
          {...register("voucher_no")}
          placeholder="伝票番号"
          className="border rounded px-2 py-1"
        />
        <button
          type="submit"
          className="bg-cdx-corp text-white rounded px-3 py-1 min-h-tap"
        >
          登録
        </button>
        <input
          {...register("description")}
          placeholder="摘要"
          className="border rounded px-2 py-1 md:col-span-6"
        />
      </form>
      {err && <p className="text-cdx-alert text-sm">{err}</p>}

      <div className="bg-white p-3 rounded-xl shadow space-y-2">
        <h2 className="font-bold text-sm">自動仕訳ルール</h2>
        <p className="text-xs text-slate-600">
          登録済ルール: {rules.length}件 (
          {rules.map((r) => r.name).join(" / ")})
        </p>
        <div className="grid gap-2 grid-cols-1 md:grid-cols-5">
          <select
            value={ruleForm.event_type}
            onChange={(e) =>
              setRuleForm({ ...ruleForm, event_type: e.target.value })
            }
            className="border rounded px-2 py-1"
          >
            <option value="invoice_received">請求書受領</option>
            <option value="payroll_payment">給与振込</option>
            <option value="sales_cash">現金売上</option>
          </select>
          <select
            value={ruleForm.tax_category}
            onChange={(e) =>
              setRuleForm({ ...ruleForm, tax_category: e.target.value })
            }
            className="border rounded px-2 py-1"
          >
            <option value="standard">標準10%</option>
            <option value="reduced">軽減8%</option>
          </select>
          <input
            type="number"
            placeholder="金額"
            value={ruleForm.amount}
            onChange={(e) =>
              setRuleForm({ ...ruleForm, amount: Number(e.target.value) })
            }
            className="border rounded px-2 py-1"
          />
          <button
            onClick={() => triggerRule(false)}
            className="bg-slate-500 text-white rounded px-3 py-1 min-h-tap"
          >
            プレビュー
          </button>
          <button
            onClick={() => triggerRule(true)}
            className="bg-cdx-corp text-white rounded px-3 py-1 min-h-tap"
          >
            自動仕訳実行
          </button>
        </div>
        {rulePreview && (
          <p className="text-xs bg-slate-50 p-2 rounded">
            借方 {rulePreview.debit_account_code} / 貸方{" "}
            {rulePreview.credit_account_code} / ¥
            {Number(rulePreview.amount).toLocaleString("ja-JP")}
          </p>
        )}
      </div>

      <table className="w-full bg-white rounded-xl shadow text-sm">
        <thead className="bg-slate-100">
          <tr>
            <th className="p-2 text-left">日付</th>
            <th className="p-2 text-left">借方</th>
            <th className="p-2 text-left">貸方</th>
            <th className="p-2 text-right">金額</th>
            <th className="p-2 text-left">摘要</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.entry_id} className="border-t">
              <td className="p-2">{e.txn_date}</td>
              <td className="p-2">{e.debit_account_code}</td>
              <td className="p-2">{e.credit_account_code}</td>
              <td className="p-2 text-right">
                ¥{Number(e.amount).toLocaleString("ja-JP")}
              </td>
              <td className="p-2">{e.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
