import { useForm } from "react-hook-form";
import { z } from "zod";
import { api, endpoints } from "../api/client";
import PhotoAttach from "../components/PhotoAttach";
import StepForm, { StepDef } from "../components/StepForm";
import { db } from "../db/dexie";

const schema = z.object({
  occurred_at: z.string(),
  location: z.string().optional(),
  description: z.string().min(1),
  risk_level: z.enum(["high", "medium", "low"]),
  man: z.boolean().optional(),
  machine: z.boolean().optional(),
  material: z.boolean().optional(),
  method: z.boolean().optional(),
  corrective_action: z.string().optional(),
});
type Form = z.infer<typeof schema>;

export default function NearMissPage() {
  const { register, handleSubmit, reset, watch, getValues } = useForm<Form>({
    defaultValues: { risk_level: "medium" },
  });

  const submitPayload = async () => {
    const v = getValues();
    const payload = {
      occurred_at: v.occurred_at,
      location: v.location,
      description: v.description,
      risk_level: v.risk_level,
      cause_analysis: {
        man: !!v.man,
        machine: !!v.machine,
        material: !!v.material,
        method: !!v.method,
      },
      corrective_action: v.corrective_action,
    };
    try {
      await api.post(endpoints.nearMiss, payload);
      alert("送信しました");
    } catch {
      await db.near_miss.add({ ...payload, synced: 0 } as any);
      alert("オフライン保存しました (Dexie)");
    }
    reset();
  };

  const onSubmit = async (v: Form) => {
    await submitPayload();
  };

  // モバイル用ステップ定義
  const steps: StepDef[] = [
    {
      id: "when",
      title: "いつ発生しましたか?",
      description: "発生日時を入力してください。",
      render: () => (
        <input
          type="datetime-local"
          {...register("occurred_at")}
          className="w-full border rounded p-3 min-h-tap text-base"
          aria-label="発生日時"
          required
        />
      ),
      isValid: () => !!watch("occurred_at"),
    },
    {
      id: "where",
      title: "どこで?",
      description: "発生場所 (現場/通路など)",
      render: () => (
        <input
          {...register("location")}
          placeholder="例: A棟3階通路"
          className="w-full border rounded p-3 min-h-tap text-base"
          aria-label="発生場所"
        />
      ),
    },
    {
      id: "what",
      title: "何が起きた?",
      description: "ヒヤリとした内容を具体的に",
      render: () => (
        <textarea
          {...register("description")}
          rows={4}
          className="w-full border rounded p-3 text-base"
          aria-label="ヒヤリ内容"
          required
        />
      ),
      isValid: () => (watch("description") || "").length > 0,
    },
    {
      id: "4m",
      title: "原因 (4M分析)",
      description: "該当する分類にチェック",
      render: () => (
        <div className="grid grid-cols-2 gap-2">
          {(["man", "machine", "material", "method"] as const).map((k) => (
            <label
              key={k}
              className="flex items-center gap-2 border rounded-lg p-3 min-h-tap touch-manipulation"
            >
              <input type="checkbox" {...register(k)} className="h-5 w-5" />
              <span>{k}</span>
            </label>
          ))}
        </div>
      ),
    },
    {
      id: "risk",
      title: "リスクレベル",
      render: () => (
        <select
          {...register("risk_level")}
          className="w-full border rounded p-3 min-h-tap text-base"
          aria-label="リスクレベル"
        >
          <option value="high">高</option>
          <option value="medium">中</option>
          <option value="low">低</option>
        </select>
      ),
    },
    {
      id: "photo",
      title: "写真",
      description: "現場写真があれば添付",
      render: () => <PhotoAttach onPhotos={() => {}} />,
    },
  ];

  return (
    <>
      {/* モバイル: ステップフォーム */}
      <div className="md:hidden">
        <StepForm steps={steps} onComplete={submitPayload} submitLabel="報告する" />
      </div>

      {/* デスクトップ: 1 画面フォーム */}
      <div className="hidden md:block bg-white p-4 rounded-xl shadow max-w-xl">
        <h2 className="font-bold text-lg mb-3">ヒヤリハット報告 (4M分析)</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <label className="block">
            <span className="text-sm">発生日時</span>
            <input type="datetime-local" {...register("occurred_at")} className="w-full border rounded p-2" required />
          </label>
          <label className="block">
            <span className="text-sm">場所</span>
            <input {...register("location")} className="w-full border rounded p-2" />
          </label>
          <label className="block">
            <span className="text-sm">内容</span>
            <textarea {...register("description")} className="w-full border rounded p-2" rows={3} required />
          </label>
          <fieldset className="border rounded p-2">
            <legend className="text-sm font-bold">4M 分析</legend>
            {(["man", "machine", "material", "method"] as const).map((k) => (
              <label key={k} className="inline-flex items-center mr-3 gap-1">
                <input type="checkbox" {...register(k)} /> {k}
              </label>
            ))}
          </fieldset>
          <label className="block">
            <span className="text-sm">リスクレベル</span>
            <select {...register("risk_level")} className="w-full border rounded p-2">
              <option value="high">高</option>
              <option value="medium">中</option>
              <option value="low">低</option>
            </select>
          </label>
          <label className="block">
            <span className="text-sm">是正措置</span>
            <textarea {...register("corrective_action")} className="w-full border rounded p-2" rows={2} />
          </label>
          <PhotoAttach onPhotos={() => {}} />
          <button className="w-full bg-cdx-safety text-white py-3 rounded-lg font-bold min-h-tap">報告する</button>
        </form>
      </div>
    </>
  );
}
