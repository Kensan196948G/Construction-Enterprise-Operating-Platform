import { useEffect, useState } from 'react';
import { apiClient } from '@/api/client';

interface Equipment {
  id: number;
  equipment_name: string;
  equipment_type?: string;
  status: string;
  operating_hours?: number;
}

export default function EquipmentPage() {
  const [list, setList] = useState<Equipment[]>([]);

  useEffect(() => {
    apiClient
      .get<Equipment[]>('/equipment')
      .then((r) => setList(r.data))
      .catch(() => setList([]));
  }, []);

  return (
    <section>
      <h2 className="text-xl font-bold mb-4">重機管理</h2>
      <table className="bg-white border rounded w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="text-left p-2">名称</th>
            <th className="text-left p-2">種別</th>
            <th className="text-left p-2">稼働時間</th>
            <th className="text-left p-2">状態</th>
          </tr>
        </thead>
        <tbody>
          {list.map((e) => (
            <tr key={e.id} className="border-t">
              <td className="p-2">{e.equipment_name}</td>
              <td className="p-2">{e.equipment_type ?? '-'}</td>
              <td className="p-2">{e.operating_hours ?? '-'}</td>
              <td className="p-2">{e.status}</td>
            </tr>
          ))}
          {list.length === 0 && (
            <tr>
              <td colSpan={4} className="p-3 text-gray-500 text-center">
                重機データがありません
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
