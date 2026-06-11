'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  ExtrudeGeometry,
} from 'three';
import { feature } from 'topojson-client';
import type { GeometryCollection } from 'topojson-specification';
import {
  LAND_DEPTH,
  MAP_HEIGHT,
  MAP_WIDTH,
  MAP_WRAP_OFFSETS,
  geoPolygonsToPlaneLinePositions,
  geoPolygonsToShapes,
} from '@/lib/geo';
import { fetchLandTopology } from '@/lib/land';

// 지구본과 동일한 팔레트로 통일 (globe.tsx 참조)
const SEA_COLOR = '#060b17';
const LAND_COLOR = '#1b2d47';
const COAST_COLOR = '#64b4ff';
// 래핑 복제본이 시야를 항상 덮도록 바다 평면을 넉넉히 넓게 깐다
const SEA_PLANE_WIDTH = MAP_WIDTH * 7;

export function LandMesh() {
  const { data: topology } = useQuery({
    queryKey: ['land', '110m'],
    queryFn: () => fetchLandTopology('110m'),
    staleTime: Infinity,
  });

  const { landGeometry, coastGeometry } = useMemo(() => {
    if (!topology) return { landGeometry: null, coastGeometry: null };
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
    const landGeometry = new ExtrudeGeometry(shapes, {
      depth: LAND_DEPTH,
      bevelEnabled: false,
    });

    // 해안선 글로우 — 지구본 텍스처의 발광 해안선과 같은 톤
    const coastGeometry = new BufferGeometry();
    coastGeometry.setAttribute(
      'position',
      new BufferAttribute(
        geoPolygonsToPlaneLinePositions(polygons, LAND_DEPTH + 0.001),
        3,
      ),
    );

    return { landGeometry, coastGeometry };
  }, [topology]);

  return (
    <group>
      {/* 바다 — 좌우로 넓게 깔아 래핑 시 빈 공간이 보이지 않게 한다 */}
      <mesh>
        <planeGeometry args={[SEA_PLANE_WIDTH, MAP_HEIGHT]} />
        <meshBasicMaterial color={SEA_COLOR} />
      </mesh>
      {/* 땅 + 해안선을 MAP_WIDTH 간격으로 타일링 → 끝과 끝이 이어짐 */}
      {landGeometry &&
        coastGeometry &&
        MAP_WRAP_OFFSETS.map((k) => (
          <group key={k} position-x={k * MAP_WIDTH}>
            <mesh geometry={landGeometry}>
              <meshBasicMaterial color={LAND_COLOR} />
            </mesh>
            <lineSegments geometry={coastGeometry}>
              <lineBasicMaterial
                color={COAST_COLOR}
                transparent
                opacity={0.55}
                blending={AdditiveBlending}
                depthWrite={false}
              />
            </lineSegments>
          </group>
        ))}
    </group>
  );
}
