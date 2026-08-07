import { useState } from "react";
import { useForm } from "react-hook-form";
import { api, endpoints } from "../api/client";

interface Hazard {
  hazard: string;
  risk_rank: string;
  measure: string;
}

export default function KyActivityPage() {
  const { register, handleSubmit, reset } = useForm<{
    activity_date: string;
    work_content: string;
  }>();
  const [hazards, setHazards] = useState<Hazard[]>([
    { hazard: "", risk_rank: "B", measure: "" },
  ]);

  const add = () => setHazards([...hazards, { hazard: "", risk_rank: "B", measure: "" }]);
  const remove = (i: number) => setHazards(hazards.filter((_, j) => j !== i));
  const update = (i: number, k: keyof Hazard, v: string) => {
    const next = [...hazards];
    (next[i] as any)[k] = v;
    setHazards(next);
  };

  const onSubmit = async (v: { activity_date: string; work_content: string }) => {
    await api.post(endpoints.ky, { ...v, hazards });
    reset();
    setHazards([{ hazard: "", risk_rank: "B", measure: "" }]);
    alert("登録しました");
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white p-4 rounded-xl shadow space-y-3 max-w-2xl mx-auto pb-footer-nav md:pb-4"
      aria-label="KY 活動入力フォーム"
    >
      <h2 className="font-bold text-lg">KY 活動記録</h2>

      <label className="block">
        <span className="text-sm">活動日</span>
        <input
          type="date"
          {...register("activity_date")}
          className="border rounded p-3 w-full min-h-tap text-base"
          required
        />
      </label>
      <label className="block">
        <span className="text-sm">作業内容</span>
        <input
          placeholder="作業内容"
          {...register("work_content")}
          className="border rounded p-3 w-full min-h-tap text-base"
        />
      </label>

      <div className="space-y-3">
        {hazards.map((h, i) => (
          <div
            key={i}
            className="border rounded-lg p-3 space-y-2 md:grid md:grid-cols-12 md:gap-2 md:space-y-0"
          >
            <input
              value={h.hazard}
              onChange={(e) => update(i, "hazard", e.target.value)}
              placeholder="危険ポイント"
              aria-label={`危険ポイント ${i + 1}`}
              className="md:col-span-5 border rounded p-3 min-h-tap w-full text-base"
            />
            <select
              value={h.risk_rank}
              onChange={(e) => update(i, "risk_rank", e.target.value)}
              aria-label={`リスクランク ${i + 1}`}
              className="md:col-span-2 border rounded p-3 min-h-tap w-full text-base"
            >
              <option>A</option>
              <option>B</option>
              <option>C</option>
            </select>
            <input
              value={h.measure}
              onChange={(e) => update(i, "measure", e.target.value)}
              placeholder="対策"
              aria-label={`対策 ${i + 1}`}
              className="md:col-span-4 border rounded p-3 min-h-tap w-full text-base"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label={`危険ポイント ${i + 1} を削除`}
              disabled={hazards.length === 1}
              className="md:col-span-1 min-h-tap min-w-tap text-red-600 disabled:opacity-30"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={add}
          className="text-sm text-cdx-quality min-h-tap touch-manipulation"
        >
          + 危険ポイント追加
        </button>
      </div>
      <button className="w-full bg-cdx-safety text-white py-3 rounded-lg font-bold min-h-tap">
        登録
      </button>
    </form>
  );
}
