import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { api, endpoints } from "../api/client";

const STEPS = ["open", "corrected", "prevented", "verified", "closed"];

export default function NonconformityPage() {
  const { register, handleSubmit, reset } = useForm<any>();
  const [items, setItems] = useState<any[]>([]);

  const load = () => api.get(endpoints.nonconformity).then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);

  const onSubmit = async (v: any) => {
    await api.post(endpoints.nonconformity, { ...v, capa_status: "open" });
    reset(); load();
  };

  const advance = async (id: string) => {
    await api.post(`${endpoints.nonconformity}/${id}/capa/advance`); load();
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-4 rounded-xl shadow space-y-3">
        <h2 className="font-bold text-lg">不適合登録 (CAPA)</h2>
        <input type="datetime-local" {...register("detected_at")} className="border rounded p-2 w-full" required />
        <input placeholder="件名" {...register("title")} className="border rounded p-2 w-full" required />
        <textarea placeholder="説明" {...register("description")} className="border rounded p-2 w-full" rows={2} />
        <textarea placeholder="① 是正処置 (Corrective)" {...register("corrective_action")} className="border rounded p-2 w-full" rows={2} />
        <textarea placeholder="② 予防処置 (Preventive)" {...register("preventive_action")} className="border rounded p-2 w-full" rows={2} />
        <textarea placeholder="③ 効果確認 (Effectiveness)" {...register("effectiveness_verification")} className="border rounded p-2 w-full" rows={2} />
        <button className="w-full bg-cdx-quality text-white py-3 rounded-lg font-bold">登録</button>
      </form>
      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="font-bold text-lg mb-2">CAPA 進捗</h2>
        <ul className="space-y-2 text-sm">
          {items.map((it) => (
            <li key={it.nc_id} className="border rounded p-2">
              <div className="flex justify-between items-center">
                <span className="font-bold">{it.title}</span>
                <button onClick={() => advance(it.nc_id)} className="text-xs bg-cdx-quality text-white px-2 py-1 rounded">次へ</button>
              </div>
              <div className="text-xs">状態: {STEPS.map((s) => (
                <span key={s} className={`mx-1 ${s === it.capa_status ? "font-bold text-cdx-safety" : "text-slate-400"}`}>{s}</span>
              ))}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
