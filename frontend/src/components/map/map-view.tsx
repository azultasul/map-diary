'use client';

import { Canvas } from '@react-three/fiber';
import { useEffect } from 'react';
import { CityDiaryModal } from '@/components/diary/city-diary-modal';
import { FloatingButtons } from '@/components/layout/floating-buttons';
import { GlobeScene } from '@/components/map/globe/globe-scene';
import { Map2DScene } from '@/components/map/map2d/map2d-scene';
import { latLngToPlaneVector3, latLngToVector3 } from '@/lib/geo';
import { useUIStore } from '@/stores/ui-store';

// 초기 화면 중심: 대한민국 상공 (카메라 거리 3)
const GLOBE_INITIAL_CAMERA = latLngToVector3(36.5, 127.8, 3);
// 2D 초기 카메라도 대한민국 중앙(정면 부감, 거리 1.8과 일치)
const KOREA_PLANE = latLngToPlaneVector3(36.5, 127.8);
const MAP2D_INITIAL_CAMERA: [number, number, number] = [
  KOREA_PLANE.x,
  KOREA_PLANE.y,
  1.8,
];

export function MapView() {
  const mapMode = useUIStore((s) => s.mapMode);

  useEffect(() => {
    void useUIStore.persist.rehydrate();
  }, []);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[radial-gradient(ellipse_at_center,_#0b1026_0%,_#04060f_70%)]">
      {mapMode === 'globe' && (
        <Canvas camera={{ position: GLOBE_INITIAL_CAMERA, fov: 45 }}>
          <GlobeScene />
        </Canvas>
      )}
      {mapMode === 'map2d' && (
        <Canvas camera={{ position: MAP2D_INITIAL_CAMERA, fov: 45 }}>
          <Map2DScene />
        </Canvas>
      )}
      <FloatingButtons />
      <CityDiaryModal />
    </div>
  );
}
