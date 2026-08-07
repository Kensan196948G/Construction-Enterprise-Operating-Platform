import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { apiClient } from '@/api/client';

const itemSchema = z.object({
  material_name: z.string().min(1),
  quantity: z.coerce.number().min(0),
  unit: z.string().default('個'),
  unit_price: z.coerce.number().min(0),
});

const schema = z.object({
  po_number: z.string().min(1),
  supplier_id: z.coerce.number().int().min(1),
  project_code: z.string().optional(),
  delivery_date: z.string().optional(),
  items: z.array(itemSchema).min(1, '明細を 1 行以上入力してください'),
  tax_rate: z.coerce.number().default(0.1),
});

type FormVals = z.infer<typeof schema>;

export default function OrderEditorPage() {
  const { register, handleSubmit, control, watch, formState } = useForm<FormVals>({
    resolver: zodResolver(schema),
    defaultValues: { items: [{ material_name: '', quantity: 1, unit: '個', unit_price: 0 }], tax_rate: 0.1 },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const items = watch('items');
  const subtotal = items.reduce((s, it) => s + Number(it.quantity || 0) * Number(it.unit_price || 0), 0);
  const taxRate = Number(watch('tax_rate') || 0);
  const tax = Math.round(subtotal * taxRate);
  const total = subtotal + tax;

  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const onSubmit = async (values: FormVals) => {
    try {
      const res = await apiClient.post('/orders', values);
      setOrderId(res.data.id);
      setMsg(`発注作成: ID=${res.data.id} 合計 ¥${res.data.total_amount.toLocaleString()}`);
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  const loadPdf = async () => {
    if (orderId == null) return;
    try {
      const res = await apiClient.get(`/orders/${orderId}/pdf`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      setPdfUrl(url);
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  const downloadPdf = () => {
    if (!pdfUrl || orderId == null) return;
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = `order-${orderId}.pdf`;
    a.click();
  };

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold">発注書編集</h2>
      {msg && <p className="text-sm text-proc-ok">{msg}</p>}
      {err && <p className="text-sm text-red-600">{err}</p>}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded border bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="発注番号">
            <input className="input" {...register('po_number')} />
          </Field>
          <Field label="協力会社ID">
            <input className="input" type="number" {...register('supplier_id')} />
          </Field>
          <Field label="工事番号">
            <input className="input" {...register('project_code')} />
          </Field>
          <Field label="納期">
            <input className="input" type="date" {...register('delivery_date')} />
          </Field>
          <Field label="消費税率">
            <input className="input" type="number" step="0.01" {...register('tax_rate')} />
          </Field>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-bold">明細</h3>
            <button
              type="button"
              onClick={() => append({ material_name: '', quantity: 1, unit: '個', unit_price: 0 })}
              className="rounded bg-proc-accent px-2 py-1 text-xs text-white"
            >
              + 行追加
            </button>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-1 text-left">資材名</th>
                <th className="border p-1 text-right">数量</th>
                <th className="border p-1 text-left">単位</th>
                <th className="border p-1 text-right">単価</th>
                <th className="border p-1 text-right">金額</th>
                <th className="border p-1"></th>
              </tr>
            </thead>
            <tbody>
              {fields.map((f, idx) => {
                const amt =
                  Number(items[idx]?.quantity || 0) * Number(items[idx]?.unit_price || 0);
                return (
                  <tr key={f.id}>
                    <td className="border p-1">
                      <input className="input" {...register(`items.${idx}.material_name`)} />
                    </td>
                    <td className="border p-1">
                      <input
                        className="input text-right"
                        type="number"
                        step="0.01"
                        {...register(`items.${idx}.quantity`)}
                      />
                    </td>
                    <td className="border p-1">
                      <input className="input" {...register(`items.${idx}.unit`)} />
                    </td>
                    <td className="border p-1">
                      <input
                        className="input text-right"
                        type="number"
                        step="0.01"
                        {...register(`items.${idx}.unit_price`)}
                      />
                    </td>
                    <td className="border p-1 text-right">¥{amt.toLocaleString()}</td>
                    <td className="border p-1">
                      <button
                        type="button"
                        onClick={() => remove(idx)}
                        className="text-xs text-proc-danger"
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {formState.errors.items && (
            <p className="mt-1 text-xs text-red-600">{formState.errors.items.message}</p>
          )}
        </div>

        <div className="flex justify-end gap-4 text-sm">
          <div>
            <div>小計: ¥{subtotal.toLocaleString()}</div>
            <div>消費税: ¥{tax.toLocaleString()}</div>
            <div className="font-bold">合計: ¥{total.toLocaleString()}</div>
          </div>
        </div>

        <button
          type="submit"
          className="rounded bg-proc-primary px-4 py-2 text-sm text-white hover:bg-proc-accent"
        >
          発注を保存
        </button>
      </form>

      {orderId != null && (
        <div className="rounded border bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-bold">発注書 PDF (Order #{orderId})</h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={loadPdf}
                className="rounded bg-proc-primary px-3 py-1 text-sm text-white hover:bg-proc-accent"
              >
                プレビュー
              </button>
              <button
                type="button"
                onClick={downloadPdf}
                disabled={!pdfUrl}
                className="rounded bg-proc-accent px-3 py-1 text-sm text-white disabled:opacity-50"
              >
                ダウンロード
              </button>
            </div>
          </div>
          {pdfUrl ? (
            <iframe
              title="po-pdf-preview"
              src={pdfUrl}
              className="h-[600px] w-full rounded border"
            />
          ) : (
            <p className="text-xs text-gray-500">「プレビュー」を押すと PDF を表示します。</p>
          )}
        </div>
      )}

      <style>{`.input { width: 100%; border: 1px solid #d1d5db; border-radius: 4px; padding: 4px 8px; font-size: 13px; }`}</style>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col text-xs">
      <span className="mb-1 text-gray-600">{label}</span>
      {children}
    </label>
  );
}
