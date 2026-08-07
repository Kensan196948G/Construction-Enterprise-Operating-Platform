import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Box } from '@react-three/drei';
import { Suspense } from 'react';

type Props = {
  /** 実 IFC ジオメトリのロードは将来 web-ifc-three で実装。骨格では placeholder メッシュを表示。 */
  ifcUrl?: string | null;
  lod?: string;
  showLayers?: { structure: boolean; mep: boolean; site: boolean };
};

export default function BimViewer3D({ ifcUrl, lod = 'LOD200', showLayers }: Props) {
  const layers = showLayers ?? { structure: true, mep: true, site: true };
  return (
    <div className="w-full h-[60vh] bg-gray-900 rounded">
      <Canvas camera={{ position: [10, 10, 10], fov: 50 }} shadows>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 15, 5]} intensity={1.0} castShadow />
        <Suspense fallback={null}>
          <Grid args={[40, 40]} cellColor="#666" sectionColor="#999" infiniteGrid />
          {/* placeholder structure */}
          {layers.structure && (
            <Box args={[4, 6, 4]} position={[0, 3, 0]} castShadow receiveShadow>
              <meshStandardMaterial color="#0f766e" />
            </Box>
          )}
          {layers.mep && (
            <Box args={[1, 2, 1]} position={[3, 1, 0]} castShadow>
              <meshStandardMaterial color="#7c3aed" />
            </Box>
          )}
          {layers.site && (
            <Box args={[12, 0.1, 12]} position={[0, -0.05, 0]} receiveShadow>
              <meshStandardMaterial color="#374151" />
            </Box>
          )}
        </Suspense>
        <OrbitControls />
      </Canvas>
      <div className="text-xs text-gray-300 px-2 py-1">
        {ifcUrl ? `IFC: ${ifcUrl}` : 'placeholder (実 IFC ロードは web-ifc-three で実装予定)'} ・ LOD:{' '}
        {lod}
      </div>
    </div>
  );
}
