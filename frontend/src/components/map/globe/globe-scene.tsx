'use client';

import { Stars } from '@react-three/drei';
import { CityPins } from '@/components/map/globe/city-pins';
import { Globe } from '@/components/map/globe/globe';
import { GlobeCameraControls } from '@/components/map/globe/globe-camera-controls';
import { RouteArcs } from '@/components/map/globe/route-arcs';
import {
  DARK_PALETTE,
  LIGHT_PALETTE,
  PaletteProvider,
} from '@/components/map/shared/scene-palette';

export function GlobeScene({
  isDark,
  onApplied,
}: {
  isDark: boolean;
  onApplied: (isDark: boolean) => void;
}) {
  return (
    <PaletteProvider palette={isDark ? DARK_PALETTE : LIGHT_PALETTE}>
      <ambientLight intensity={1.4} />
      <directionalLight position={[5, 3, 5]} intensity={0.6} />
      <Stars radius={50} depth={20} count={1500} factor={2} fade speed={0.5} />
      <Globe isDark={isDark} onApplied={onApplied} />
      <RouteArcs />
      <CityPins />
      <GlobeCameraControls />
    </PaletteProvider>
  );
}
