import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { api, endpoints } from "../api/client";

interface Payable {
  payable_id: string;
  counterparty_name: string;
  amount: number;
  scheduled_date: string;
  status: string;
}

interface PayableForm {
  counterparty_name: string;
  amount: number;
  scheduled_date: string;
}

export default function PayablesPage() {
  const [items, setItems] = useState<Payable[]>([]);
  const [overdue, setOverdue] = useState<Payable[]>([]);
  const { register, handleSubmit, reset } = useForm<PayableForm>({
    defaultValues: { scheduled_date: new Date().toISOString().slice(0, 10) },
  });

  const reload = () => {
    api.get<Payable[]>(endpoints.payables).then((r) => setItems(r.data));
    api
      .get<{ overdue: Payable[] }>(endpoints.payablesSchedule)
      .then((r) => setOverdue(r.data.overdue));
  };
  useEffect(reload, []);

  const onSubmit = (v: PayableForm) => {
    api
      .post(endpoints.payables, { ...v, amount: Number(v.amount) })
      .then(() => {
        reset({ scheduled_date: v.scheduled_date });
        reload();
      });
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">買掛金 / 支払予定</h1>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid gap-2 grid-cols-1 md:grid-cols-4 bg-white p-3 rounded-xl shadow"
      >
        <input
          {...register("counterparty_name", { required: true })}
          placeholder="支払先"
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
        <div className="bg-red-50 border border-red-200 p-3 rounded-xl">
          <p className="font-bold text-cdx-alert">
            期限超過 {overdue.length} 件
          </p>
        </div>
      )}
      <table className="w-full bg-white rounded-xl shadow text-sm">
        <thead className="bg-slate-100">
          <tr>
            <th className="p-2 text-left">支払先</th>
            <th className="p-2 text-right">金額</th>
            <th className="p-2 text-left">予定日</th>
            <th className="p-2 text-left">ステータス</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.payable_id} className="border-t">
              <td className="p-2">{i.counterparty_name}</td>
              <td className="p-2 text-right">
                ¥{Math.round(Number(i.amount)).toLocaleString("ja-JP")}
              </td>
              <td className="p-2">{i.scheduled_date}</td>
              <td className="p-2">{i.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
