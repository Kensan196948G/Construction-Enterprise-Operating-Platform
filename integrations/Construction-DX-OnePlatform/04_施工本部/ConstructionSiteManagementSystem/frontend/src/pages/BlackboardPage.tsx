import { useState } from 'react';
import { apiClient } from '@/api/client';

export default function BlackboardPage() {
  const [form, setForm] = useState({
    project_name: '',
    work_type: '',
    measurement_point: '',
    design_value: '',
    actual_value: '',
    contractor: '',
    record_date: new Date().toISOString().slice(0, 10),
  });
  const [hash, setHash] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const save = async () => {
    try {
      const r = await apiClient.post('/electronic-boards', form);
      setHash(r.data.hash_value);
      setMsg('電子黒板を保存しました (SHA-256: ' + r.data.hash_value?.slice(0, 12) + '...)');
    } catch (e) {
      setMsg('保存失敗 (オフライン): ' + (e as Error).message);
    }
  };

  return (
    <section>
      <h2 className="text-xl font-bold mb-4">電子黒板 (SHA-256改ざん検知)</h2>
      <div className="bg-white border rounded p-4 max-w-xl grid grid-cols-2 gap-3">
        {Object.entries(form).map(([k, v]) => (
          <label key={k} className="text-sm col-span-2 md:col-span-1">
            {k}
            <input
              className="block border rounded px-2 py-1 w-full"
              value={v}
              onChange={(e) => setForm({ ...form, [k]: e.target.value })}
            />
          </label>
        ))}
        <button onClick={save} className="bg-site-primary text-white rounded px-4 py-2 col-span-2">
          保存
        </button>
        {msg && <p className="col-span-2 text-sm text-emerald-700">{msg}</p>}
        {hash && (
          <p className="col-span-2 text-xs break-all font-mono bg-gray-100 p-2">SHA-256: {hash}</p>
        )}
      </div>
    </section>
  );
}
