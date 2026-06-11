'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { CanvasTexture, SRGBColorSpace } from 'three';
import { feature, mesh } from 'topojson-client';
import type { GeometryCollection } from 'topojson-specification';
import { GLOBE_RADIUS, geoLinesToPositions } from '@/lib/geo';
import { fetchLandTopology } from '@/lib/land';

// 밝기 단계: 배경 < 바다 < 대륙 < 윤곽 라인
const SEA_COLOR = '#0e1c42';
const LAND_COLOR = '#31497f';
const OUTLINE_COLOR = '#6b84c4';
const TEXTURE_WIDTH = 2048;
const TEXTURE_HEIGHT = 1024;

export function Globe() {
  const { data: topology } = useQuery({
    queryKey: ['land-110m'],
    queryFn: fetchLandTopology,
    staleTime: Infinity,
  });

  const texture = useMemo(() => {
    if (!topology) return null;
    const canvas = document.createElement('canvas');
    canvas.width = TEXTURE_WIDTH;
    canvas.height = TEXTURE_HEIGHT;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = SEA_COLOR;
    ctx.fillRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);

    const land = feature(
      topology,
      topology.objects.land as GeometryCollection,
    );
    ctx.fillStyle = LAND_COLOR;
    for (const f of land.features) {
      const geom = f.geometry;
      const polygons =
        geom.type === 'Polygon'
          ? [geom.coordinates as unknown as number[][][]]
          : geom.type === 'MultiPolygon'
            ? (geom.coordinates as unknown as number[][][][])
            : [];
      for (const rings of polygons) {
        ctx.beginPath();
        for (const ring of rings) {
          ring.forEach(([lng, lat], i) => {
            const x = ((lng + 180) / 360) * TEXTURE_WIDTH;
            const y = ((90 - lat) / 180) * TEXTURE_HEIGHT;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          });
          ctx.closePath();
        }
        ctx.fill('evenodd');
      }
    }

    const canvasTexture = new CanvasTexture(canvas);
    canvasTexture.colorSpace = SRGBColorSpace;
    return canvasTexture;
  }, [topology]);

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
        {texture ? (
          <meshStandardMaterial
            key="textured"
            map={texture}
            roughness={0.9}
            metalness={0}
          />
        ) : (
          <meshStandardMaterial
            key="plain"
            color={SEA_COLOR}
            roughness={0.9}
            metalness={0}
          />
        )}
      </mesh>
      {positions && (
        <lineSegments key={positions.length}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[positions, 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial color={OUTLINE_COLOR} transparent opacity={0.8} />
        </lineSegments>
      )}
    </group>
  );
}
