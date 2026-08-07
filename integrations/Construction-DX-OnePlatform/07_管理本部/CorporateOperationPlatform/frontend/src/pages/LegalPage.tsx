import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { api, endpoints } from "../api/client";

interface Matter {
  matter_id: string;
  title: string;
  matter_type: string;
  counterparty_name?: string;
  assigned_lawyer?: string;
  status: string;
}

interface MForm {
  title: string;
  matter_type: string;
  counterparty_name?: string;
  assigned_lawyer?: string;
  description?: string;
}

export default function LegalPage() {
  const [items, setItems] = useState<Matter[]>([]);
  const { register, handleSubmit, reset } = useForm<MForm>({
    defaultValues: { matter_type: "compliance" },
  });

  const reload = () =>
    api.get<Matter[]>(endpoints.legal).then((r) => setItems(r.data));
  useEffect(() => {
    void reload();
  }, []);

  const onSubmit = (v: MForm) =>
    api.post(endpoints.legal, v).then(() => {
      reset({ matter_type: v.matter_type });
      reload();
    });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">法務案件</h1>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid gap-2 grid-cols-1 md:grid-cols-3 bg-white p-3 rounded-xl shadow"
      >
        <input
          {...register("title", { required: true })}
          placeholder="案件タイトル"
          className="border rounded px-2 py-1"
        />
        <select
          {...register("matter_type")}
          className="border rounded px-2 py-1"
        >
          <option value="dispute">紛争</option>
          <option value="claim">請求</option>
          <option value="compliance">コンプラ</option>
          <option value="ip">知財</option>
          <option value="labor">労務</option>
          <option value="other">その他</option>
        </select>
        <input
          {...register("counterparty_name")}
          placeholder="相手方"
          className="border rounded px-2 py-1"
        />
        <input
          {...register("assigned_lawyer")}
          placeholder="関与弁護士"
          className="border rounded px-2 py-1"
        />
        <input
          {...register("description")}
          placeholder="概要"
          className="border rounded px-2 py-1 md:col-span-2"
        />
        <button className="bg-cdx-corp text-white rounded px-3 py-1 min-h-tap md:col-span-3">
          登録
        </button>
      </form>
      <table className="w-full bg-white rounded-xl shadow text-sm">
        <thead className="bg-slate-100">
          <tr>
            <th className="p-2 text-left">案件</th>
            <th className="p-2 text-left">種類</th>
            <th className="p-2 text-left">相手方</th>
            <th className="p-2 text-left">弁護士</th>
            <th className="p-2 text-left">ステータス</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.matter_id} className="border-t">
              <td className="p-2">{i.title}</td>
              <td className="p-2">{i.matter_type}</td>
              <td className="p-2">{i.counterparty_name}</td>
              <td className="p-2">{i.assigned_lawyer}</td>
              <td className="p-2">{i.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
