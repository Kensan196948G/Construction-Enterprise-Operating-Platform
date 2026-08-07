import { useForm } from "react-hook-form";
import { api, endpoints } from "../api/client";

export default function QualityPage() {
  const { register, handleSubmit, reset } = useForm<any>();

  const onSubmit = async (v: any) => {
    v.measurement_value = v.measurement_value !== "" ? Number(v.measurement_value) : null;
    v.spec_upper = v.spec_upper !== "" ? Number(v.spec_upper) : null;
    v.spec_lower = v.spec_lower !== "" ? Number(v.spec_lower) : null;
    await api.post(endpoints.quality, v);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-4 rounded-xl shadow space-y-3 max-w-xl">
      <h2 className="font-bold text-lg">品質記録 (ISO9001)</h2>
      <select {...register("record_type")} className="border rounded p-2 w-full">
        <option value="inspection">検査</option>
        <option value="test">試験</option>
        <option value="ncr">不適合</option>
        <option value="capa">CAPA</option>
      </select>
      <input placeholder="件名" {...register("title")} className="border rounded p-2 w-full" />
      <textarea placeholder="内容" {...register("description")} className="border rounded p-2 w-full" rows={2} />
      <div className="grid grid-cols-3 gap-2">
        <input type="number" step="any" placeholder="測定値" {...register("measurement_value")} className="border rounded p-2" />
        <input type="number" step="any" placeholder="規格上限" {...register("spec_upper")} className="border rounded p-2" />
        <input type="number" step="any" placeholder="規格下限" {...register("spec_lower")} className="border rounded p-2" />
      </div>
      <p className="text-xs text-slate-500">※ 規格上下限が指定されると合否を自動判定</p>
      <button className="w-full bg-cdx-quality text-white py-3 rounded-lg font-bold">登録</button>
    </form>
  );
}
