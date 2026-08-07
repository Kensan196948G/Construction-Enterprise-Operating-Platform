import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { api, endpoints } from "../api/client";

export default function AccidentPage() {
  const { register, handleSubmit, reset } = useForm<any>();
  const [stats, setStats] = useState<any>(null);

  const loadStats = () =>
    api.get(`${endpoints.accidentsStats}?total_work_hours=1000000`).then((r) => setStats(r.data));
  useEffect(() => { loadStats(); }, []);

  const onSubmit = async (v: any) => {
    v.injuries = Number(v.injuries || 1);
    v.lost_days = Number(v.lost_days || 0);
    v.total_work_hours = Number(v.total_work_hours || 0);
    await api.post(endpoints.accidents, v);
    reset(); loadStats();
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-4 rounded-xl shadow space-y-3">
        <h2 className="font-bold text-lg">労災事故記録</h2>
        <input type="datetime-local" {...register("occurred_at")} className="border rounded p-2 w-full" required />
        <select {...register("severity")} className="border rounded p-2 w-full">
          <option value="first_aid">応急処置</option>
          <option value="minor">軽傷</option>
          <option value="serious">重症</option>
          <option value="fatal">死亡</option>
        </select>
        <input placeholder="負傷種別 (転倒/挟まれ等)" {...register("injury_type")} className="border rounded p-2 w-full" />
        <textarea placeholder="状況" {...register("description")} className="border rounded p-2 w-full" rows={2} />
        <textarea placeholder="根本原因" {...register("root_cause")} className="border rounded p-2 w-full" rows={2} />
        <div className="grid grid-cols-3 gap-2">
          <input type="number" placeholder="死傷者数" {...register("injuries")} className="border rounded p-2" />
          <input type="number" placeholder="休業日数" {...register("lost_days")} className="border rounded p-2" />
          <input type="number" placeholder="延べ労働時間" {...register("total_work_hours")} className="border rounded p-2" />
        </div>
        <input placeholder="報告先 (労基署等)" {...register("reported_to")} className="border rounded p-2 w-full" />
        <button className="w-full bg-cdx-safety text-white py-3 rounded-lg font-bold">登録</button>
      </form>
      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="font-bold text-lg mb-2">災害統計 (労安法準拠)</h2>
        <p>度数率: <b className="text-2xl text-cdx-safety">{stats?.frequency_rate?.toFixed(2) ?? "-"}</b></p>
        <p>強度率: <b className="text-2xl text-cdx-safety">{stats?.severity_rate?.toFixed(3) ?? "-"}</b></p>
        <p className="text-xs text-slate-500 mt-2">
          度数率 = (死傷者数 / 延べ労働時間) × 1,000,000<br />
          強度率 = (労働損失日数 / 延べ労働時間) × 1,000
        </p>
      </div>
    </div>
  );
}
