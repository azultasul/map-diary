'use client';

import { Billboard, Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import type { Group, Vector3 } from 'three';
import { usePalette } from '@/components/map/shared/scene-palette';
import { cityKey } from '@/lib/geo';
import { useUIStore } from '@/stores/ui-store';
import type { CityMarker } from '@/types';

const PIN_RADIUS = 0.012;

export function CityPin({
  marker,
  position,
  baseDistance,
}: {
  marker: CityMarker;
  position: Vector3;
  // 해당 모드의 초기 카메라 거리. 줌인 시 핀이 화면에서 너무 커지지 않도록
  // cameraDistance/baseDistance 비율로 핀 크기를 줄인다
  baseDistance: number;
}) {
  const groupRef = useRef<Group>(null);
  const palette = usePalette();
  const [hovered, setHovered] = useState(false);
  const hoveredRef = useRef(false);
  const key = cityKey(marker.city, marker.country);
  const selected = useUIStore((s) => s.selectedCityKey === key);
  const setSelectedCityKey = useUIStore((s) => s.setSelectedCityKey);
  const setHoveredCityKey = useUIStore((s) => s.setHoveredCityKey);

  const isHome = !!marker.isHome;
  // 홈이지만 일기가 없는 도시는 표시 전용(클릭/hover 비활성)
  const displayOnly = isHome && marker.diaryCount === 0;
  const color = isHome ? palette.home : (marker.groupColor ?? palette.defaultPin);

  useEffect(() => {
    return () => {
      if (hoveredRef.current) {
        document.body.style.cursor = 'auto';
        useUIStore.getState().setHoveredCityKey(null);
      }
    };
  }, []);

  useFrame(({ clock }) => {
    const group = groupRef.current;
    if (!group) return;
    const base = hovered ? 1.6 : 1;
    const pulse = selected ? 1 + 0.35 * Math.sin(clock.elapsedTime * 4) : 1;
    // 제곱 곡선: 줌인할수록 더 빠르게 작아져 근거리 도시 핀 겹침을 막는다
    const ratio = useUIStore.getState().cameraDistance / baseDistance;
    const distanceScale = Math.min(Math.max(ratio * ratio, 0.15), 1.2);
    group.scale.setScalar(base * pulse * distanceScale);
  });

  return (
    <group ref={groupRef} position={position}>
      {/* 투명 hit-area — 표시 전용 홈 핀은 생략해 클릭이 통과하게 한다 */}
      {!displayOnly && (
        <mesh
          onClick={(e) => {
            e.stopPropagation();
            setSelectedCityKey(key);
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
            hoveredRef.current = true;
            setHoveredCityKey(key);
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            setHovered(false);
            hoveredRef.current = false;
            setHoveredCityKey(null);
            document.body.style.cursor = 'auto';
          }}
        >
          <sphereGeometry args={[PIN_RADIUS * 1.6, 16, 16]} />
          <meshBasicMaterial transparent opacity={0.001} depthWrite={false} />
        </mesh>
      )}
      {/* 홈 마커 — 카메라를 향한 링으로 일반 핀과 구분 */}
      {isHome && (
        <Billboard raycast={() => null}>
          <mesh>
            <ringGeometry args={[PIN_RADIUS * 1.8, PIN_RADIUS * 2.3, 24]} />
            <meshBasicMaterial
              color={palette.home}
              transparent
              opacity={0.9}
              depthWrite={false}
            />
          </mesh>
        </Billboard>
      )}
      {/* 비주얼 핀 — 레이캐스팅 비활성 */}
      <mesh raycast={() => null}>
        <sphereGeometry args={[PIN_RADIUS, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh raycast={() => null}>
        <sphereGeometry args={[PIN_RADIUS * 1.6, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.25}
          depthWrite={false}
        />
      </mesh>
      {hovered && (
        // 툴팁 DOM이 포인터를 가로채면 캔버스가 pointerout을 받아 hover가
        // 번쩍인다. drei <Html>의 pointerEvents prop은 transform 모드에서만
        // 적용되므로, 래퍼 div는 wrapperClass(.city-pin-tooltip)로, 내부 div는
        // style/className으로 모든 레이어를 pointer-events:none 처리한다.
        <Html
          center
          distanceFactor={2}
          position={[0, PIN_RADIUS * 4, 0]}
          wrapperClass="city-pin-tooltip"
          style={{ pointerEvents: 'none' }}
        >
          <div className="pointer-events-none whitespace-nowrap rounded bg-black/70 px-2 py-1 text-xs text-white">
            {marker.city} · {marker.diaryCount}
          </div>
        </Html>
      )}
    </group>
  );
}
