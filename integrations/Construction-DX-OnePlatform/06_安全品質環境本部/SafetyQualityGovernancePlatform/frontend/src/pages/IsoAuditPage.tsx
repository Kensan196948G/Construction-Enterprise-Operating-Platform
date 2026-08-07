import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { api, endpoints } from "../api/client";

export default function IsoAuditPage() {
  const { register, handleSubmit, reset } = useForm<any>();
  const [standard, setStandard] = useState("ISO9001");
  const [template, setTemplate] = useState<any[]>([]);

  useEffect(() => {
    api.get(`${endpoints.isoTemplate}?standard=${standard}`).then((r) => setTemplate(r.data.items));
  }, [standard]);

  const onSubmit = async (v: any) => {
    await api.post(endpoints.iso, { ...v, iso_standard: standard, status: "planned" });
    reset();
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-4 rounded-xl shadow space-y-3">
        <h2 className="font-bold text-lg">ISO 監査計画</h2>
        <select value={standard} onChange={(e) => setStandard(e.target.value)} className="border rounded p-2 w-full">
          <option>ISO9001</option><option>ISO14001</option><option>ISO45001</option>
        </select>
        <select {...register("audit_type")} className="border rounded p-2 w-full">
          <option value="internal">内部監査</option>
          <option value="external">外部監査</option>
          <option value="surveillance">サーベイランス</option>
        </select>
        <label className="text-sm">計画日</label>
        <input type="date" {...register("plan_date")} className="border rounded p-2 w-full" />
        <label className="text-sm">実施日</label>
        <input type="date" {...register("audit_date")} className="border rounded p-2 w-full" />
        <label className="text-sm">フォロー日</label>
        <input type="date" {...register("follow_up_date")} className="border rounded p-2 w-full" />
        <textarea placeholder="範囲" {...register("scope")} className="border rounded p-2 w-full" rows={2} />
        <input placeholder="主任監査員" {...register("lead_auditor")} className="border rounded p-2 w-full" />
        <button className="w-full bg-cdx-quality text-white py-3 rounded-lg font-bold">登録</button>
      </form>
      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="font-bold text-lg mb-2">{standard} チェックリスト雛形</h2>
        <ul className="space-y-1 text-sm">
          {template.map((t) => (
            <li key={t.clause} className="border-b py-1">
              <b className="text-cdx-quality">{t.clause}</b> — {t.item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
