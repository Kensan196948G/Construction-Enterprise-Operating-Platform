import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient } from '@/api/client';

const Schema = z.object({
  proposal_code: z.string().min(1),
  client_name: z.string().min(1),
  theme: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['lead', 'qualifying', 'proposing', 'in_negotiation', 'won', 'lost']),
  expected_amount: z.coerce.number().optional(),
  primary_category: z.string().optional(),
  proposal_deadline: z.string().optional(),
});

type FormValues = z.infer<typeof Schema>;

interface Catalog {
  id: number;
  catalog_code: string;
  name: string;
  category: string;
  price_min?: string | null;
}

export default function ProposalEditorPage() {
  const { id } = useParams<{ id?: string }>();
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState } = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: { status: 'lead' },
  });

  useEffect(() => {
    apiClient.get<Catalog[]>('/catalog').then((r) => setCatalogs(r.data)).catch(() => {});
    if (id && id !== 'new') {
      apiClient
        .get(`/proposals/${id}`)
        .then((r) => reset(r.data))
        .catch(() => {});
    }
  }, [id, reset]);

  const onSubmit = async (data: FormValues) => {
    try {
      if (id && id !== 'new') {
        await apiClient.post(`/proposals/${id}/status`, { status: data.status });
      } else {
        await apiClient.post('/proposals', data);
      }
      setSaveMsg('保存しました');
    } catch (e) {
      setSaveMsg(`保存失敗: ${String(e)}`);
    }
  };

  const total = Object.entries(selected).reduce((acc, [cid, qty]) => {
    const c = catalogs.find((x) => x.id === Number(cid));
    const unit = c?.price_min ? Number(c.price_min) : 0;
    return acc + unit * qty;
  }, 0);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h2 className="text-xl font-bold">提案編集</h2>
      <div className="grid gap-3 md:grid-cols-2 bg-white rounded border p-4">
        <Field label="提案コード">
          <input className="input" {...register('proposal_code')} />
        </Field>
        <Field label="顧客名">
          <input className="input" {...register('client_name')} />
        </Field>
        <Field label="テーマ">
          <input className="input" {...register('theme')} />
        </Field>
        <Field label="ステータス">
          <select className="input" {...register('status')}>
            <option value="lead">lead</option>
            <option value="qualifying">qualifying</option>
            <option value="proposing">proposing</option>
            <option value="in_negotiation">in_negotiation</option>
            <option value="won">won</option>
            <option value="lost">lost</option>
          </select>
        </Field>
        <Field label="想定金額">
          <input type="number" className="input" {...register('expected_amount')} />
        </Field>
        <Field label="主カテゴリ">
          <input className="input" {...register('primary_category')} />
        </Field>
        <Field label="提案期限">
          <input type="date" className="input" {...register('proposal_deadline')} />
        </Field>
        <div className="md:col-span-2">
          <Field label="概要">
            <textarea className="input min-h-[80px]" {...register('description')} />
          </Field>
        </div>
      </div>

      <div className="rounded border bg-white p-4">
        <h3 className="font-semibold mb-2">採用ソリューション (見積)</h3>
        <div className="grid gap-2 md:grid-cols-2">
          {catalogs.map((c) => (
            <label key={c.id} className="flex items-center gap-3 rounded border p-2">
              <span className="flex-1 text-sm">
                <span className="font-medium">{c.name}</span>
                <span className="text-gray-500 ml-2 text-xs">{c.category}</span>
              </span>
              <input
                type="number"
                min={0}
                className="w-20 rounded border px-1 py-0.5 text-sm"
                value={selected[c.id] ?? 0}
                onChange={(e) =>
                  setSelected({ ...selected, [c.id]: Number(e.target.value) || 0 })
                }
              />
            </label>
          ))}
        </div>
        <div className="mt-3 text-right font-bold">見積合計: ¥{total.toLocaleString()}</div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={formState.isSubmitting}
          className="rounded bg-sol-primary px-4 py-2 text-white hover:bg-sol-accent disabled:opacity-50"
        >
          保存
        </button>
        {id && id !== 'new' && (
          <button
            type="button"
            onClick={async () => {
              try {
                const r = await apiClient.get(`/proposals/${id}/pdf`, {
                  responseType: 'blob',
                });
                const url = URL.createObjectURL(new Blob([r.data], { type: 'application/pdf' }));
                const a = document.createElement('a');
                a.href = url;
                a.download = `proposal_${id}.pdf`;
                a.click();
                URL.revokeObjectURL(url);
              } catch (e) {
                setSaveMsg(`PDF 生成失敗: ${String(e)}`);
              }
            }}
            className="rounded bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
          >
            提案書PDFダウンロード
          </button>
        )}
        {saveMsg && <span className="text-sm text-gray-600">{saveMsg}</span>}
      </div>

      <style>{`.input{border:1px solid #d1d5db;border-radius:.375rem;padding:.25rem .5rem;font-size:.875rem;width:100%;}`}</style>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="block mb-1 text-gray-700">{label}</span>
      {children}
    </label>
  );
}
