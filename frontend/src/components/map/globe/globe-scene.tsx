'use client';

import { Stars } from '@react-three/drei';
import { CityPins } from '@/components/map/globe/city-pins';
import { Globe } from '@/components/map/globe/globe';
import { GlobeCameraControls } from '@/components/map/globe/globe-camera-controls';
import { RouteArcs } from '@/components/map/globe/route-arcs';

export function GlobeScene() {
  return (
    <>
      <ambientLight intensity={1.4} />
      <directionalLight position={[5, 3, 5]} intensity={0.6} />
      <Stars radius={50} depth={20} count={1500} factor={2} fade speed={0.5} />
      <Globe />
      <RouteArcs />
      <CityPins />
      <GlobeCameraControls />
    </>
  );
}
