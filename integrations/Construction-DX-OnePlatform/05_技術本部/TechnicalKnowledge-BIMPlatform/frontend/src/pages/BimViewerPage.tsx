import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import BimViewer3D from '../components/BimViewer3D';
import IfcTreeNavigator from '../components/IfcTreeNavigator';
import LodSelector from '../components/LodSelector';
import { apiClient } from '../api/client';

type BimModel = {
  id: number;
  model_name: string;
  project_id: number | null;
  ifc_schema: string | null;
  storage_url: string;
  lod: string;
  crs: string | null;
  attributes: Record<string, unknown> | null;
};

export default function BimViewerPage() {
  const { modelId } = useParams();
  const [models, setModels] = useState<BimModel[]>([]);
  const [current, setCurrent] = useState<BimModel | null>(null);
  const [lod, setLod] = useState('LOD200');
  const [layers, setLayers] = useState({ structure: true, mep: true, site: true });

  useEffect(() => {
    apiClient.get<BimModel[]>('/bim').then((r) => setModels(r.data)).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!modelId) return;
    apiClient
      .get<BimModel>(`/bim/${modelId}`)
      .then((r) => {
        setCurrent(r.data);
        setLod(r.data.lod);
      })
      .catch(() => undefined);
  }, [modelId]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <h2 className="text-xl font-semibold">BIM ビューア</h2>
        <LodSelector value={lod} onChange={setLod} />
        <label className="text-sm flex items-center gap-1">
          <input
            type="checkbox"
            checked={layers.structure}
            onChange={(e) => setLayers((p) => ({ ...p, structure: e.target.checked }))}
          />
          躯体
        </label>
        <label className="text-sm flex items-center gap-1">
          <input
            type="checkbox"
            checked={layers.mep}
            onChange={(e) => setLayers((p) => ({ ...p, mep: e.target.checked }))}
          />
          設備
        </label>
        <label className="text-sm flex items-center gap-1">
          <input
            type="checkbox"
            checked={layers.site}
            onChange={(e) => setLayers((p) => ({ ...p, site: e.target.checked }))}
          />
          サイト
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3">
          <BimViewer3D ifcUrl={current?.storage_url ?? null} lod={lod} showLayers={layers} />
          {current && (
            <div className="mt-2 text-sm text-gray-600">
              {current.model_name} ({current.ifc_schema ?? 'unknown schema'}) / CRS:{' '}
              {current.crs ?? '-'}
            </div>
          )}
        </div>
        <div className="space-y-4">
          <IfcTreeNavigator />
          <section className="bg-white rounded shadow p-3 text-sm">
            <h3 className="font-semibold mb-2">モデル一覧</h3>
            <ul className="space-y-1">
              {models.length === 0 && <li className="text-gray-400">モデル未登録</li>}
              {models.map((m) => (
                <li key={m.id} className="hover:text-tech-primary">
                  {m.model_name} ({m.lod})
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
