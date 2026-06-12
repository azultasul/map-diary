'use client';

import { Canvas } from '@react-three/fiber';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { AllDiariesModal } from '@/components/diary/all-diaries-modal';
import { CityDiaryModal } from '@/components/diary/city-diary-modal';
import { DiaryFormModal } from '@/components/diary/diary-form-modal';
import { GroupManageModal } from '@/components/diary/group-manage-modal';
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
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    void useUIStore.persist.rehydrate();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // 테마 미확정(마운트 전)에는 다크 기본 — 씬 팔레트는 Canvas 안으로 prop 전달
  const isDark = !mounted || resolvedTheme !== 'light';

  // 배경은 isDark(목표)가 아니라 씬이 "새 팔레트 텍스처를 실제로 렌더한 시점"에
  // 맞춰 전환한다. 텍스처(16384) 재생성/GPU 업로드로 globe가 수백 ms 늦게 반영되는데
  // 배경 DOM은 즉시 칠해져 어긋나기 때문 — 씬이 onApplied로 신호를 주면 그때 바꾼다.
  const [appliedDark, setAppliedDark] = useState(true);
  const background = appliedDark
    ? 'bg-[radial-gradient(ellipse_at_center,_#0b1026_0%,_#04060f_70%)]'
    : 'bg-[radial-gradient(ellipse_at_center,_#eef2ff_0%,_#cdd9ec_75%)]';

  return (
    <div
      className={`relative h-dvh w-full overflow-hidden ${background}`}
    >
      {mapMode === 'globe' && (
        <Canvas camera={{ position: GLOBE_INITIAL_CAMERA, fov: 45 }}>
          <GlobeScene isDark={isDark} onApplied={setAppliedDark} />
        </Canvas>
      )}
      {mapMode === 'map2d' && (
        <Canvas camera={{ position: MAP2D_INITIAL_CAMERA, fov: 45 }}>
          <Map2DScene isDark={isDark} onApplied={setAppliedDark} />
        </Canvas>
      )}
      <FloatingButtons />
      <CityDiaryModal />
      <AllDiariesModal />
      <DiaryFormModal />
      <GroupManageModal />
    </div>
  );
}
