'use client';

import { Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Curve, Mesh, Vector3 } from 'three';
import { usePalette } from '@/components/map/shared/scene-palette';
import { cityKey } from '@/lib/geo';
import { useUIStore } from '@/stores/ui-store';
import type { Route } from '@/types';

const DOT_RADIUS = 0.008;

export function RouteArc({
  route,
  curve,
  phase,
  baseDistance,
}: {
  route: Route;
  curve: Curve<Vector3>;
  phase: number;
  // 해당 모드의 초기 카메라 거리. 줌인 시 빛 점이 화면에서 커지지 않도록 축소 기준
  baseDistance: number;
}) {
  const dotRef = useRef<Mesh>(null);
  const palette = usePalette();
  const hoveredCityKey = useUIStore((s) => s.hoveredCityKey);

  const points = useMemo(() => curve.getPoints(64), [curve]);

  const highlighted =
    hoveredCityKey !== null &&
    (cityKey(route.from.city, route.from.country) === hoveredCityKey ||
      cityKey(route.to.city, route.to.country) === hoveredCityKey);

  const color = route.groupColor ?? palette.defaultRoute;

  useFrame(({ clock }) => {
    const dot = dotRef.current;
    if (!dot) return;
    const t = (clock.elapsedTime * 0.15 + phase) % 1;
    dot.position.copy(curve.getPoint(t));
    const ratio = useUIStore.getState().cameraDistance / baseDistance;
    dot.scale.setScalar(Math.min(Math.max(ratio * ratio, 0.15), 1.2));
  });

  return (
    <group>
      <Line
        points={points}
        color={color}
        lineWidth={highlighted ? 2.5 : 1}
        transparent
        opacity={highlighted ? 1 : 0.6}
      />
      <mesh ref={dotRef}>
        <sphereGeometry args={[DOT_RADIUS, 8, 8]} />
        <meshBasicMaterial color={palette.routeDot} />
      </mesh>
    </group>
  );
}
