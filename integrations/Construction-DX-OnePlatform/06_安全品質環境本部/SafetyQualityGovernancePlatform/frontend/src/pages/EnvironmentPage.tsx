import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { api, endpoints } from "../api/client";

export default function EnvironmentPage() {
  const { register, handleSubmit, reset } = useForm<any>();
  const [co2, setCo2] = useState<any>({});

  const load = () => api.get(endpoints.co2).then((r) => setCo2(r.data));
  useEffect(() => { load(); }, []);

  const onSubmit = async (v: any) => {
    v.quantity = Number(v.quantity || 0);
    await api.post(endpoints.environment, v);
    reset(); load();
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-4 rounded-xl shadow space-y-3">
        <h2 className="font-bold text-lg">環境記録 (ISO14001)</h2>
        <select {...register("record_type")} className="border rounded p-2 w-full">
          <option value="co2">CO2 排出</option>
          <option value="waste">産業廃棄物</option>
          <option value="noise">騒音</option>
          <option value="water">水使用</option>
        </select>
        <select {...register("scope")} className="border rounded p-2 w-full">
          <option value="">-</option>
          <option value="scope1">Scope 1 (直接)</option>
          <option value="scope2">Scope 2 (電力)</option>
          <option value="scope3">Scope 3 (バリューチェーン)</option>
        </select>
        <input type="date" {...register("record_date")} className="border rounded p-2 w-full" required />
        <input type="number" step="any" placeholder="数量" {...register("quantity")} className="border rounded p-2 w-full" />
        <input placeholder="単位 (tCO2e / kg等)" {...register("unit")} className="border rounded p-2 w-full" />
        <input placeholder="マニフェスト番号 (産廃)" {...register("manifest_number")} className="border rounded p-2 w-full" />
        <button className="w-full bg-cdx-env text-white py-3 rounded-lg font-bold">登録</button>
      </form>
      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="font-bold text-lg mb-2">CO2 集計</h2>
        <p>合計: <b>{co2.total?.toFixed?.(2) ?? 0}</b> {co2.unit}</p>
        <ul className="text-sm">
          {Object.entries(co2.by_scope || {}).map(([k, v]) => (
            <li key={k}>{k}: {Number(v).toFixed(2)}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
