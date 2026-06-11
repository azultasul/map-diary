'use client';

import { Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Mesh } from 'three';
import { useRoutes } from '@/hooks/use-diary-data';
import {
  GLOBE_RADIUS,
  buildArcCurve,
  cityKey,
  latLngToVector3,
} from '@/lib/geo';
import { useUIStore } from '@/stores/ui-store';
import type { Route } from '@/types';

const DEFAULT_ROUTE_COLOR = '#9aa4b8';
const DOT_RADIUS = 0.008;

function RouteArc({ route, phase }: { route: Route; phase: number }) {
  const dotRef = useRef<Mesh>(null);
  const hoveredCityKey = useUIStore((s) => s.hoveredCityKey);

  const curve = useMemo(() => {
    const from = latLngToVector3(
      route.from.latitude,
      route.from.longitude,
      GLOBE_RADIUS * 1.005,
    );
    const to = latLngToVector3(
      route.to.latitude,
      route.to.longitude,
      GLOBE_RADIUS * 1.005,
    );
    return buildArcCurve(from, to, GLOBE_RADIUS);
  }, [route]);

  const points = useMemo(() => curve.getPoints(64), [curve]);

  const highlighted =
    hoveredCityKey !== null &&
    (cityKey(route.from.city, route.from.country) === hoveredCityKey ||
      cityKey(route.to.city, route.to.country) === hoveredCityKey);

  const color = route.groupColor ?? DEFAULT_ROUTE_COLOR;

  useFrame(({ clock }) => {
    const dot = dotRef.current;
    if (!dot) return;
    const t = (clock.elapsedTime * 0.15 + phase) % 1;
    dot.position.copy(curve.getPoint(t));
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
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

export function RouteArcs() {
  const { data: routes } = useRoutes();
  if (!routes) return null;
  return (
    <>
      {routes.map((route, index) => (
        <RouteArc
          key={`${cityKey(route.from.city, route.from.country)}->${cityKey(route.to.city, route.to.country)}-${index}`}
          route={route}
          phase={index * 0.17}
        />
      ))}
    </>
  );
}
