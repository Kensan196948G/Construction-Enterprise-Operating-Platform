import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { api, endpoints } from "../api/client";

interface Receivable {
  receivable_id: string;
  counterparty_name: string;
  amount: number;
  scheduled_date: string;
  status: string;
  dunning_count?: number;
  last_dunning_date?: string;
}

interface RForm {
  counterparty_name: string;
  amount: number;
  scheduled_date: string;
}

export default function ReceivablesPage() {
  const [items, setItems] = useState<Receivable[]>([]);
  const [overdue, setOverdue] = useState<Receivable[]>([]);
  const { register, handleSubmit, reset } = useForm<RForm>({
    defaultValues: { scheduled_date: new Date().toISOString().slice(0, 10) },
  });

  const reload = () => {
    api.get<Receivable[]>(endpoints.receivables).then((r) => setItems(r.data));
    api
      .get<{ overdue: Receivable[] }>(endpoints.dunningList)
      .then((r) => setOverdue(r.data.overdue));
  };
  useEffect(reload, []);

  const onSubmit = (v: RForm) => {
    api
      .post(endpoints.receivables, { ...v, amount: Number(v.amount) })
      .then(() => {
        reset({ scheduled_date: v.scheduled_date });
        reload();
      });
  };

  const sendDunning = (id: string) => {
    api
      .post(`${endpoints.receivables}/${id}/dunning`, { note: "督促状送付" })
      .then(reload);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">売掛金 / 督促</h1>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid gap-2 grid-cols-1 md:grid-cols-4 bg-white p-3 rounded-xl shadow"
      >
        <input
          {...register("counterparty_name", { required: true })}
          placeholder="取引先"
          className="border rounded px-2 py-1"
        />
        <input
          {...register("amount", { required: true })}
          type="number"
          placeholder="金額"
          className="border rounded px-2 py-1"
        />
        <input
          {...register("scheduled_date", { required: true })}
          type="date"
          className="border rounded px-2 py-1"
        />
        <button className="bg-cdx-corp text-white rounded px-3 py-1 min-h-tap">
          登録
        </button>
      </form>

      {overdue.length > 0 && (
        <section className="bg-red-50 border border-red-200 p-3 rounded-xl">
          <h2 className="font-bold text-cdx-alert mb-2">
            督促対象 ({overdue.length} 件)
          </h2>
          <ul className="space-y-1 text-sm">
            {overdue.map((i) => (
              <li
                key={i.receivable_id}
                className="flex items-center justify-between gap-2"
              >
                <span>
                  {i.counterparty_name} / 予定日 {i.scheduled_date} / ¥
                  {Math.round(Number(i.amount)).toLocaleString("ja-JP")}
                </span>
                <button
                  onClick={() => sendDunning(i.receivable_id)}
                  className="bg-cdx-alert text-white rounded px-2 py-1 text-xs min-h-tap"
                >
                  督促記録
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <table className="w-full bg-white rounded-xl shadow text-sm">
        <thead className="bg-slate-100">
          <tr>
            <th className="p-2 text-left">取引先</th>
            <th className="p-2 text-right">金額</th>
            <th className="p-2 text-left">予定日</th>
            <th className="p-2 text-left">督促回数</th>
            <th className="p-2 text-left">ステータス</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.receivable_id} className="border-t">
              <td className="p-2">{i.counterparty_name}</td>
              <td className="p-2 text-right">
                ¥{Math.round(Number(i.amount)).toLocaleString("ja-JP")}
              </td>
              <td className="p-2">{i.scheduled_date}</td>
              <td className="p-2">{i.dunning_count ?? 0}</td>
              <td className="p-2">{i.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
