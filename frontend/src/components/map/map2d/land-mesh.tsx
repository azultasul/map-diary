'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { ExtrudeGeometry } from 'three';
import { feature } from 'topojson-client';
import type { GeometryCollection } from 'topojson-specification';
import {
  LAND_DEPTH,
  MAP_HEIGHT,
  MAP_WIDTH,
  geoPolygonsToShapes,
} from '@/lib/geo';
import { fetchLandTopology } from '@/lib/land';

export function LandMesh() {
  const { data: topology } = useQuery({
    queryKey: ['land-110m'],
    queryFn: fetchLandTopology,
    staleTime: Infinity,
  });

  const geometry = useMemo(() => {
    if (!topology) return null;
    const land = feature(
      topology,
      topology.objects.land as GeometryCollection,
    );
    const polygons: number[][][][] = [];
    for (const f of land.features) {
      const geom = f.geometry;
      if (geom.type === 'Polygon') {
        polygons.push(geom.coordinates as unknown as number[][][]);
      } else if (geom.type === 'MultiPolygon') {
        polygons.push(...(geom.coordinates as unknown as number[][][][]));
      }
    }
    const shapes = geoPolygonsToShapes(polygons);
    return new ExtrudeGeometry(shapes, {
      depth: LAND_DEPTH,
      bevelEnabled: false,
    });
  }, [topology]);

  return (
    <group>
      <mesh>
        <planeGeometry args={[MAP_WIDTH, MAP_HEIGHT]} />
        <meshStandardMaterial color="#070c1d" roughness={1} metalness={0} />
      </mesh>
      {geometry && (
        <mesh geometry={geometry}>
          <meshStandardMaterial color="#16223f" roughness={0.85} metalness={0} />
        </mesh>
      )}
    </group>
  );
}
