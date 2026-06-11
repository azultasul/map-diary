'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { mesh } from 'topojson-client';
import type { GeometryCollection } from 'topojson-specification';
import { GLOBE_RADIUS, geoLinesToPositions } from '@/lib/geo';
import { fetchLandTopology } from '@/lib/land';

export function Globe() {
  const { data: topology } = useQuery({
    queryKey: ['land-110m'],
    queryFn: fetchLandTopology,
    staleTime: Infinity,
  });

  const positions = useMemo(() => {
    if (!topology) return null;
    const land = mesh(topology, topology.objects.land as GeometryCollection);
    const lines =
      land.type === 'MultiLineString'
        ? (land.coordinates as unknown as number[][][])
        : ([land.coordinates] as unknown as number[][][]);
    return geoLinesToPositions(lines, GLOBE_RADIUS * 1.001);
  }, [topology]);

  return (
    <group>
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
        <meshStandardMaterial color="#0b1530" roughness={0.9} metalness={0} />
      </mesh>
      {positions && (
        <lineSegments key={positions.length}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[positions, 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#3a4a7a" transparent opacity={0.8} />
        </lineSegments>
      )}
    </group>
  );
}
