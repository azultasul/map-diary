'use client';

import { useThree } from '@react-three/fiber';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { MAP_HEIGHT, MAP_WIDTH, MAP_WRAP_OFFSETS } from '@/lib/geo';
import { fetchLandTopology } from '@/lib/land';
import { SEA_COLOR, createLandTexture } from '@/lib/land-texture';

// 지구본과 동일하게 16384까지 사용 → 확대 시에도 선명한 해안선
const TEXTURE_WIDTH = 16384;

export function LandMesh() {
  const { gl } = useThree();
  // 지구본과 같은 10m 고해상도 데이터 → 부드럽고 둥글둥글한 디테일 해안선
  const { data: topology } = useQuery({
    queryKey: ['land', '10m'],
    queryFn: () => fetchLandTopology('10m'),
    staleTime: Infinity,
  });

  // 지구본과 동일한 캔버스 텍스처를 평면에 입힌다 → 디자인 일관성 +
  // 날짜변경선/극지방 처리가 텍스처 단계에서 끝나 삼각분할 아티팩트가 없다.
  const texture = useMemo(() => {
    if (!topology) return null;
    return createLandTexture(topology, gl, TEXTURE_WIDTH);
  }, [topology, gl]);

  if (!texture) {
    return (
      <mesh>
        <planeGeometry args={[MAP_WIDTH * 7, MAP_HEIGHT]} />
        <meshBasicMaterial color={SEA_COLOR} />
      </mesh>
    );
  }

  // 텍스처 평면을 MAP_WIDTH 간격으로 타일링 → 끝과 끝이 이어짐.
  // 텍스처가 좌우로 seamless(언랩 처리됨)라 타일이 정확히 맞물린다.
  return (
    <>
      {MAP_WRAP_OFFSETS.map((k) => (
        <mesh key={k} position-x={k * MAP_WIDTH}>
          <planeGeometry args={[MAP_WIDTH, MAP_HEIGHT]} />
          <meshBasicMaterial map={texture} />
        </mesh>
      ))}
    </>
  );
}
