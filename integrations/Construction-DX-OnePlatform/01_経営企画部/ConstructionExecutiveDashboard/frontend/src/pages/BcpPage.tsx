import { useEffect, useState } from 'react';
import BcpMap from '../components/BcpMap';
import { api } from '../api/client';

type BcpRow = {
  id: number;
  branch_code: string;
  branch_name: string;
  operation_status: string;
  disaster_type?: string | null;
  disaster_severity?: string | null;
  impact_summary?: string | null;
  recovery_target_date?: string | null;
};

export default function BcpPage() {
  const [rows, setRows] = useState<BcpRow[]>([]);

  useEffect(() => {
    api
      .get<BcpRow[]>('/bcp/status')
      .then((r) => setRows(r.data))
      .catch(() => setRows([]));
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">BCP — 拠点稼働状況</h2>
      <BcpMap rows={rows} />
    </div>
  );
}
