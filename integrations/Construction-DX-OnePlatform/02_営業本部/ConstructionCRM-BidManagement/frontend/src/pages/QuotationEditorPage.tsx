import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient } from '@/api/client';

const ItemSchema = z.object({
  item_name: z.string().min(1, '品目は必須'),
  unit: z.string().optional(),
  quantity: z.coerce.number().nonnegative(),
  unit_price: z.coerce.number().nonnegative(),
  amount: z.coerce.number().nonnegative(),
});

const QuotationSchema = z.object({
  quotation_number: z.string().min(1),
  client_id: z.coerce.number().int().positive(),
  title: z.string().min(1),
  work_description: z.string().optional(),
  subtotal_amount: z.coerce.number().nonnegative(),
  tax_amount: z.coerce.number().nonnegative(),
  total_amount: z.coerce.number().nonnegative(),
  issue_date: z.string().optional(),
  valid_until: z.string().optional(),
  status: z.string(),
  items: z.array(ItemSchema),
});

type FormData = z.infer<typeof QuotationSchema>;

export default function QuotationEditorPage() {
  const { id } = useParams();
  const [message, setMessage] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(QuotationSchema),
    defaultValues: {
      quotation_number: '',
      client_id: 0,
      title: '',
      subtotal_amount: 0,
      tax_amount: 0,
      total_amount: 0,
      status: 'draft',
      items: [{ item_name: '', quantity: 1, unit_price: 0, amount: 0 }],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  useEffect(() => {
    if (!id || id === 'new') return;
    apiClient.get(`/quotations/${id}`).then((r) => reset(r.data));
  }, [id, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      const res = await apiClient.post('/quotations', data);
      setMessage(`保存しました (v${res.data.version})`);
    } catch (e) {
      setMessage(`保存失敗: ${String(e)}`);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h2 className="text-xl font-bold">見積編集</h2>
      {message && <p className="rounded bg-amber-100 p-2 text-sm">{message}</p>}
      <section className="rounded border bg-white p-4 grid grid-cols-2 gap-3 text-sm">
        <Field label="見積番号" error={errors.quotation_number?.message}>
          <input className="border rounded px-2 py-1 w-full" {...register('quotation_number')} />
        </Field>
        <Field label="顧客ID" error={errors.client_id?.message}>
          <input
            type="number"
            className="border rounded px-2 py-1 w-full"
            {...register('client_id')}
          />
        </Field>
        <Field label="件名" error={errors.title?.message}>
          <input className="border rounded px-2 py-1 w-full" {...register('title')} />
        </Field>
        <Field label="発行日">
          <input type="date" className="border rounded px-2 py-1 w-full" {...register('issue_date')} />
        </Field>
        <Field label="有効期限">
          <input
            type="date"
            className="border rounded px-2 py-1 w-full"
            {...register('valid_until')}
          />
        </Field>
        <Field label="ステータス">
          <select className="border rounded px-2 py-1 w-full" {...register('status')}>
            <option value="draft">draft</option>
            <option value="issued">issued</option>
            <option value="accepted">accepted</option>
            <option value="rejected">rejected</option>
          </select>
        </Field>
      </section>
      <section className="rounded border bg-white p-4 space-y-2">
        <h3 className="font-semibold">明細</h3>
        {fields.map((f, idx) => (
          <div key={f.id} className="grid grid-cols-12 gap-2 text-sm">
            <input
              className="col-span-4 border rounded px-2 py-1"
              placeholder="品目"
              {...register(`items.${idx}.item_name` as const)}
            />
            <input
              className="col-span-1 border rounded px-2 py-1"
              placeholder="単位"
              {...register(`items.${idx}.unit` as const)}
            />
            <input
              type="number"
              step="0.001"
              className="col-span-2 border rounded px-2 py-1"
              placeholder="数量"
              {...register(`items.${idx}.quantity` as const)}
            />
            <input
              type="number"
              className="col-span-2 border rounded px-2 py-1"
              placeholder="単価"
              {...register(`items.${idx}.unit_price` as const)}
            />
            <input
              type="number"
              className="col-span-2 border rounded px-2 py-1"
              placeholder="金額"
              {...register(`items.${idx}.amount` as const)}
            />
            <button
              type="button"
              className="col-span-1 text-rose-600"
              onClick={() => remove(idx)}
            >
              削除
            </button>
          </div>
        ))}
        <button
          type="button"
          className="rounded border px-3 py-1 text-sm"
          onClick={() =>
            append({ item_name: '', quantity: 1, unit_price: 0, amount: 0 })
          }
        >
          + 明細追加
        </button>
      </section>
      <section className="rounded border bg-white p-4 grid grid-cols-3 gap-3 text-sm">
        <Field label="小計">
          <input
            type="number"
            className="border rounded px-2 py-1 w-full"
            {...register('subtotal_amount')}
          />
        </Field>
        <Field label="消費税">
          <input
            type="number"
            className="border rounded px-2 py-1 w-full"
            {...register('tax_amount')}
          />
        </Field>
        <Field label="合計">
          <input
            type="number"
            className="border rounded px-2 py-1 w-full"
            {...register('total_amount')}
          />
        </Field>
      </section>
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded bg-crm-primary px-4 py-2 text-white"
      >
        {isSubmitting ? '保存中...' : '保存 (新バージョン作成)'}
      </button>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-gray-500">{label}</span>
      {children}
      {error && <span className="text-xs text-rose-600">{error}</span>}
    </label>
  );
}
