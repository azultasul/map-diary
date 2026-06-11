'use client';

import { Stars } from '@react-three/drei';
import { LandMesh } from '@/components/map/map2d/land-mesh';
import { Map2DCameraControls } from '@/components/map/map2d/map2d-camera-controls';
import { Map2DCityPins } from '@/components/map/map2d/map2d-city-pins';
import { Map2DRouteArcs } from '@/components/map/map2d/map2d-route-arcs';

export function Map2DScene() {
  return (
    <>
      <ambientLight intensity={1.2} />
      <directionalLight position={[2, -2, 4]} intensity={0.8} />
      <Stars radius={50} depth={20} count={1500} factor={2} fade speed={0.5} />
      <LandMesh />
      <Map2DRouteArcs />
      <Map2DCityPins />
      <Map2DCameraControls />
    </>
  );
}
