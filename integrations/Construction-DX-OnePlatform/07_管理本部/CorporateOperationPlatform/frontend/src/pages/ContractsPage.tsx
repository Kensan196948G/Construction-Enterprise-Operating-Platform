import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { api, endpoints } from "../api/client";

interface Contract {
  contract_id: string;
  contract_no: string;
  title: string;
  contract_type: string;
  counterparty_name: string;
  start_date: string;
  end_date?: string;
  amount: number;
  auto_renewal: boolean;
  status: string;
}

interface CForm {
  contract_no: string;
  title: string;
  contract_type: string;
  counterparty_name: string;
  start_date: string;
  end_date?: string;
  amount: number;
  auto_renewal: boolean;
}

export default function ContractsPage() {
  const [items, setItems] = useState<Contract[]>([]);
  const [expiring, setExpiring] = useState<Contract[]>([]);
  const { register, handleSubmit, reset } = useForm<CForm>({
    defaultValues: {
      contract_type: "construction",
      start_date: new Date().toISOString().slice(0, 10),
    },
  });

  const reload = () => {
    api.get<Contract[]>(endpoints.contracts).then((r) => setItems(r.data));
    api
      .get<{ items: Contract[] }>(`${endpoints.contractsExpiring}?days=60`)
      .then((r) => setExpiring(r.data.items));
  };
  useEffect(reload, []);

  const onSubmit = (v: CForm) => {
    api
      .post(endpoints.contracts, {
        ...v,
        amount: Number(v.amount),
        auto_renewal: Boolean(v.auto_renewal),
      })
      .then(() => {
        reset();
        reload();
      });
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">契約管理</h1>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid gap-2 grid-cols-1 md:grid-cols-4 bg-white p-3 rounded-xl shadow"
      >
        <input
          {...register("contract_no", { required: true })}
          placeholder="契約番号"
          className="border rounded px-2 py-1"
        />
        <input
          {...register("title", { required: true })}
          placeholder="件名"
          className="border rounded px-2 py-1"
        />
        <select
          {...register("contract_type")}
          className="border rounded px-2 py-1"
        >
          <option value="construction">工事請負</option>
          <option value="subcontract">下請</option>
          <option value="lease">賃貸借</option>
          <option value="service">業務委託</option>
          <option value="nda">NDA</option>
          <option value="other">その他</option>
        </select>
        <input
          {...register("counterparty_name", { required: true })}
          placeholder="相手方"
          className="border rounded px-2 py-1"
        />
        <input
          {...register("start_date", { required: true })}
          type="date"
          className="border rounded px-2 py-1"
        />
        <input
          {...register("end_date")}
          type="date"
          className="border rounded px-2 py-1"
        />
        <input
          {...register("amount")}
          type="number"
          placeholder="金額"
          className="border rounded px-2 py-1"
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register("auto_renewal")} />
          自動更新
        </label>
        <button className="bg-cdx-corp text-white rounded px-3 py-1 min-h-tap md:col-span-4">
          登録
        </button>
      </form>
      {expiring.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-xl">
          <p className="font-bold">60日以内に終了する契約: {expiring.length} 件</p>
        </div>
      )}
      <table className="w-full bg-white rounded-xl shadow text-sm">
        <thead className="bg-slate-100">
          <tr>
            <th className="p-2 text-left">番号</th>
            <th className="p-2 text-left">件名</th>
            <th className="p-2 text-left">種類</th>
            <th className="p-2 text-left">相手方</th>
            <th className="p-2 text-left">期間</th>
            <th className="p-2 text-right">金額</th>
            <th className="p-2">自動更新</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.contract_id} className="border-t">
              <td className="p-2">{i.contract_no}</td>
              <td className="p-2">{i.title}</td>
              <td className="p-2">{i.contract_type}</td>
              <td className="p-2">{i.counterparty_name}</td>
              <td className="p-2">
                {i.start_date} 〜 {i.end_date ?? "—"}
              </td>
              <td className="p-2 text-right">
                ¥{Math.round(Number(i.amount)).toLocaleString("ja-JP")}
              </td>
              <td className="p-2 text-center">{i.auto_renewal ? "✓" : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
