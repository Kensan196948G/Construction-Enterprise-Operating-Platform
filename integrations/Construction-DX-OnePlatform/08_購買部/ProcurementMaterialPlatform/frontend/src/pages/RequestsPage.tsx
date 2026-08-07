import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient } from '@/api/client';
import { ApprovalStepIndicator } from '@/components/ApprovalStepIndicator';

const schema = z.object({
  request_no: z.string().min(1),
  project_code: z.string().optional(),
  requester_name: z.string().optional(),
  estimated_total: z.coerce.number().min(0),
  desired_delivery_date: z.string().optional(),
  note: z.string().optional(),
});

type FormVals = z.infer<typeof schema>;

interface PR {
  id: number;
  request_no: string;
  project_code: string | null;
  estimated_total: number;
  status: string;
  current_approval_step: number;
  total_approval_steps: number;
}

export default function RequestsPage() {
  const [items, setItems] = useState<PR[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const { register, handleSubmit, reset } = useForm<FormVals>({ resolver: zodResolver(schema) });

  const reload = () =>
    apiClient
      .get<PR[]>('/requests')
      .then((r) => setItems(r.data))
      .catch((e) => setErr(e.message));

  useEffect(() => {
    reload();
  }, []);

  const onSubmit = async (values: FormVals) => {
    try {
      await apiClient.post('/requests', { ...values, items: [] });
      reset();
      await reload();
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-bold">購買依頼</h2>
      {err && <p className="text-sm text-red-600">{err}</p>}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid gap-3 rounded border bg-white p-4 shadow-sm md:grid-cols-3"
      >
        <Input label="依頼番号" {...register('request_no')} />
        <Input label="工事番号" {...register('project_code')} />
        <Input label="申請者" {...register('requester_name')} />
        <Input label="見積総額 (円)" type="number" {...register('estimated_total')} />
        <Input label="希望納期" type="date" {...register('desired_delivery_date')} />
        <Input label="備考" {...register('note')} />
        <div className="md:col-span-3">
          <button
            type="submit"
            className="rounded bg-proc-primary px-4 py-1.5 text-sm text-white hover:bg-proc-accent"
          >
            依頼を提出
          </button>
        </div>
      </form>

      <table className="w-full border-collapse bg-white text-sm shadow-sm">
        <thead className="bg-proc-primary/10">
          <tr>
            <th className="border p-2 text-left">依頼番号</th>
            <th className="border p-2 text-left">工事</th>
            <th className="border p-2 text-right">見積総額</th>
            <th className="border p-2 text-left">承認状況</th>
          </tr>
        </thead>
        <tbody>
          {items.map((r) => (
            <tr key={r.id}>
              <td className="border p-2">{r.request_no}</td>
              <td className="border p-2">{r.project_code ?? '-'}</td>
              <td className="border p-2 text-right">¥{Number(r.estimated_total).toLocaleString()}</td>
              <td className="border p-2">
                <ApprovalStepIndicator
                  currentStep={r.current_approval_step}
                  totalSteps={r.total_approval_steps}
                  status={r.status}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

const Input = ({
  label,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) => (
  <label className="flex flex-col text-xs">
    <span className="mb-1 text-gray-600">{label}</span>
    <input
      {...rest}
      className="rounded border border-gray-300 px-2 py-1 text-sm focus:border-proc-primary focus:outline-none"
    />
  </label>
);
