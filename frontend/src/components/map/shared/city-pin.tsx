'use client';

import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import type { Group, Vector3 } from 'three';
import { cityKey } from '@/lib/geo';
import { useUIStore } from '@/stores/ui-store';
import type { CityMarker } from '@/types';

const PIN_RADIUS = 0.012;
const DEFAULT_PIN_COLOR = '#f5f5f5';

export function CityPin({
  marker,
  position,
}: {
  marker: CityMarker;
  position: Vector3;
}) {
  const groupRef = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  const hoveredRef = useRef(false);
  const key = cityKey(marker.city, marker.country);
  const selected = useUIStore((s) => s.selectedCityKey === key);
  const setSelectedCityKey = useUIStore((s) => s.setSelectedCityKey);
  const setHoveredCityKey = useUIStore((s) => s.setHoveredCityKey);

  const color = marker.groupColor ?? DEFAULT_PIN_COLOR;

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
    group.scale.setScalar(base * pulse);
  });

  return (
    <group ref={groupRef} position={position}>
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
        <sphereGeometry args={[PIN_RADIUS, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh raycast={() => null}>
        <sphereGeometry args={[PIN_RADIUS * 2, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.25}
          depthWrite={false}
        />
      </mesh>
      {hovered && (
        <Html center distanceFactor={2} position={[0, PIN_RADIUS * 4, 0]}>
          <div className="pointer-events-none whitespace-nowrap rounded bg-black/70 px-2 py-1 text-xs text-white">
            {marker.city} · {marker.diaryCount}
          </div>
        </Html>
      )}
    </group>
  );
}
