import { useState } from "react";
import { useForm } from "react-hook-form";
import { api, endpoints } from "../api/client";
import { EvmIndicator } from "../components/EvmIndicator";

interface EvmInput {
  pv: number;
  ev: number;
  ac: number;
  bac: number;
}

interface EvmResult {
  pv: number;
  ev: number;
  ac: number;
  bac: number;
  cv: number;
  sv: number;
  cpi: number;
  spi: number;
  eac: number;
  etc: number;
  vac: number;
  cost_status: string;
  schedule_status: string;
}

export default function CostAnalysisPage() {
  const [res, setRes] = useState<EvmResult | null>(null);
  const { register, handleSubmit } = useForm<EvmInput>({
    defaultValues: { pv: 100, ev: 85, ac: 90, bac: 200 },
  });

  const onSubmit = (v: EvmInput) => {
    api
      .post<EvmResult>(endpoints.costEvm, {
        pv: Number(v.pv),
        ev: Number(v.ev),
        ac: Number(v.ac),
        bac: Number(v.bac),
      })
      .then((r) => setRes(r.data));
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">工事原価 / EVM 分析</h1>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid gap-2 grid-cols-2 md:grid-cols-5 bg-white p-3 rounded-xl shadow"
      >
        <label className="text-sm">
          PV (計画値)
          <input
            {...register("pv")}
            type="number"
            className="border rounded px-2 py-1 w-full"
          />
        </label>
        <label className="text-sm">
          EV (出来高)
          <input
            {...register("ev")}
            type="number"
            className="border rounded px-2 py-1 w-full"
          />
        </label>
        <label className="text-sm">
          AC (実コスト)
          <input
            {...register("ac")}
            type="number"
            className="border rounded px-2 py-1 w-full"
          />
        </label>
        <label className="text-sm">
          BAC (完成時総予算)
          <input
            {...register("bac")}
            type="number"
            className="border rounded px-2 py-1 w-full"
          />
        </label>
        <button
          type="submit"
          className="bg-cdx-corp text-white rounded px-3 py-1 min-h-tap"
        >
          計算
        </button>
      </form>
      {res && (
        <div className="grid gap-2 grid-cols-2 md:grid-cols-4">
          <EvmIndicator label="CPI" value={res.cpi} good="high" threshold={1} />
          <EvmIndicator label="SPI" value={res.spi} good="high" threshold={1} />
          <EvmIndicator
            label="CV"
            value={res.cv}
            good="high"
            threshold={0}
            format={(v) => `¥${Math.round(v).toLocaleString("ja-JP")}`}
          />
          <EvmIndicator
            label="SV"
            value={res.sv}
            good="high"
            threshold={0}
            format={(v) => `¥${Math.round(v).toLocaleString("ja-JP")}`}
          />
          <EvmIndicator
            label="EAC"
            value={res.eac}
            good="low"
            threshold={res.bac}
            format={(v) =>
              isFinite(v) ? `¥${Math.round(v).toLocaleString("ja-JP")}` : "—"
            }
          />
          <div className="bg-white rounded-lg px-3 py-2 shadow-sm col-span-2">
            <span className="text-xs text-slate-500">ステータス</span>
            <p className="text-sm">
              コスト: <b>{res.cost_status}</b> / スケジュール:{" "}
              <b>{res.schedule_status}</b>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
