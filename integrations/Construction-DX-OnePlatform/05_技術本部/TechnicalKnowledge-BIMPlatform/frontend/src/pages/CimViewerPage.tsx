import { Canvas } from '@react-three/fiber';
import { OrbitControls, Points, PointMaterial } from '@react-three/drei';
import { useEffect, useMemo, useState } from 'react';
import { apiClient } from '../api/client';

type Dataset = {
  id: number;
  dataset_name: string;
  data_type: string;
  file_format: string;
  point_count: number | null;
  crs: string | null;
};

export default function CimViewerPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);

  useEffect(() => {
    apiClient.get<Dataset[]>('/cim').then((r) => setDatasets(r.data)).catch(() => undefined);
  }, []);

  // 骨格: 実点群の代わりにダミー点群を描画。本番は Potree / 3D Tiles 等。
  const positions = useMemo(() => {
    const N = 5000;
    const arr = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 20;
      arr[i * 3 + 1] = Math.random() * 4;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return arr;
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">CIM / 点群ビューア</h2>
      <div className="w-full h-[55vh] bg-gray-900 rounded">
        <Canvas camera={{ position: [15, 15, 15], fov: 50 }}>
          <ambientLight intensity={0.8} />
          <Points positions={positions} stride={3}>
            <PointMaterial color="#0f766e" size={0.05} sizeAttenuation />
          </Points>
          <OrbitControls />
        </Canvas>
      </div>
      <section>
        <h3 className="text-lg font-semibold mb-2">登録データセット</h3>
        <ul className="bg-white rounded shadow divide-y">
          {datasets.map((d) => (
            <li key={d.id} className="px-4 py-2 flex justify-between">
              <span>
                {d.dataset_name}{' '}
                <span className="text-xs text-gray-500">
                  ({d.data_type}/{d.file_format})
                </span>
              </span>
              <span className="text-sm text-gray-500">
                {d.point_count ?? '-'} pts / {d.crs ?? '-'}
              </span>
            </li>
          ))}
          {datasets.length === 0 && (
            <li className="px-4 py-2 text-gray-400">データセット未登録</li>
          )}
        </ul>
      </section>
    </div>
  );
}
