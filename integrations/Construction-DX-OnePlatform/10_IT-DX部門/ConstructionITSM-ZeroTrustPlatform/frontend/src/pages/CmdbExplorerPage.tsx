import { useEffect, useState } from "react";
import { api } from "@/api/client";
import TopologyGraph, { TopologyEdge, TopologyNode } from "@/components/TopologyGraph";

interface Ci {
  ci_id: string;
  name: string;
  ci_type: string;
  ip_address?: string;
  lifecycle_status: string;
}

export default function CmdbExplorerPage() {
  const [cis, setCis] = useState<Ci[]>([]);
  const [topology, setTopology] = useState<{ nodes: TopologyNode[]; edges: TopologyEdge[] }>({
    nodes: [],
    edges: []
  });

  useEffect(() => {
    api.get<Ci[]>("/cmdb").then((r) => setCis(r.data)).catch(() => setCis([]));
    api.get("/cmdb/topology").then((r) => setTopology(r.data)).catch(() => null);
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">CMDB エクスプローラ</h2>
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-1 bg-white rounded shadow-sm p-3 max-h-[480px] overflow-auto">
          <h3 className="font-semibold mb-2">構成アイテム ({cis.length})</h3>
          <ul className="text-sm space-y-1">
            {cis.map((c) => (
              <li key={c.ci_id} className="border-b py-1">
                <div className="font-medium">{c.name}</div>
                <div className="text-xs text-slate-500">
                  {c.ci_type} / {c.ip_address ?? "-"} / {c.lifecycle_status}
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="col-span-2">
          <h3 className="font-semibold mb-2">ネットワークトポロジー</h3>
          <TopologyGraph nodes={topology.nodes} edges={topology.edges} />
        </div>
      </div>
    </div>
  );
}
