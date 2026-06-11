'use client';

import { Canvas } from '@react-three/fiber';
import { useEffect } from 'react';
import { CityDiaryModal } from '@/components/diary/city-diary-modal';
import { FloatingButtons } from '@/components/layout/floating-buttons';
import { GlobeScene } from '@/components/map/globe/globe-scene';
import { Map2DScene } from '@/components/map/map2d/map2d-scene';
import { useUIStore } from '@/stores/ui-store';

export function MapView() {
  const mapMode = useUIStore((s) => s.mapMode);

  useEffect(() => {
    void useUIStore.persist.rehydrate();
  }, []);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[radial-gradient(ellipse_at_center,_#0b1026_0%,_#04060f_70%)]">
      {mapMode === 'globe' && (
        <Canvas camera={{ position: [0, 0, 3], fov: 45 }}>
          <GlobeScene />
        </Canvas>
      )}
      {mapMode === 'map2d' && (
        <Canvas camera={{ position: [0, -0.8, 1.6], fov: 45 }}>
          <Map2DScene />
        </Canvas>
      )}
      <FloatingButtons />
      <CityDiaryModal />
    </div>
  );
}
