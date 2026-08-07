import { useState } from "react";
import { useForm } from "react-hook-form";
import { api, endpoints } from "../api/client";

export default function AiRiskPage() {
  const { register, handleSubmit } = useForm<any>();
  const [result, setResult] = useState<any>(null);

  const onSubmit = async (v: any) => {
    v.workers = Number(v.workers || 1);
    v.historical_near_miss_count = Number(v.historical_near_miss_count || 0);
    v.hazards = (v.hazards || "").split(",").map((s: string) => s.trim()).filter(Boolean);
    const r = await api.post(endpoints.aiPredict, v);
    setResult(r.data);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-4 rounded-xl shadow space-y-3">
        <h2 className="font-bold text-lg">AI 危険予測 (Azure OpenAI 連携)</h2>
        <input placeholder="作業内容" {...register("work_content")} className="border rounded p-2 w-full" required />
        <input placeholder="場所" {...register("location")} className="border rounded p-2 w-full" />
        <input placeholder="天候" {...register("weather")} className="border rounded p-2 w-full" />
        <input type="number" placeholder="作業員数" {...register("workers")} className="border rounded p-2 w-full" />
        <input type="number" placeholder="過去ヒヤリ件数" {...register("historical_near_miss_count")} className="border rounded p-2 w-full" />
        <input placeholder="想定ハザード (カンマ区切り)" {...register("hazards")} className="border rounded p-2 w-full" />
        <button className="w-full bg-cdx-safety text-white py-3 rounded-lg font-bold">予測</button>
      </form>
      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="font-bold text-lg mb-2">予測結果</h2>
        {result ? (
          <>
            <p>リスクスコア: <b className="text-3xl text-cdx-safety">{result.risk_score}</b></p>
            <p>リスクレベル: <b>{result.risk_level}</b></p>
            <p className="text-xs text-slate-500 mt-2">{result.rationale}</p>
            <ul className="text-sm list-disc ml-6 mt-2">
              {(result.recommendations || []).map((r: string, i: number) => <li key={i}>{r}</li>)}
            </ul>
          </>
        ) : <p className="text-slate-500">未予測</p>}
      </div>
    </div>
  );
}
