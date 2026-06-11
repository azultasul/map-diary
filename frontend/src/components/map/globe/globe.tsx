'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import {
  AdditiveBlending,
  BackSide,
  CanvasTexture,
  LinearFilter,
  SRGBColorSpace,
  ShaderMaterial,
} from 'three';
import { feature } from 'topojson-client';
import type { GeometryCollection } from 'topojson-specification';
import { GLOBE_RADIUS } from '@/lib/geo';
import { fetchLandTopology } from '@/lib/land';

// 밝기 단계: 배경 < 바다 < 대륙 (채도 낮춘 슬레이트 톤)
const SEA_COLOR = '#0d1530';
const LAND_COLOR = '#2c3a5c';
const COAST_COLOR = 'rgba(168, 186, 224, 0.4)';
const TEXTURE_WIDTH = 8192;
const TEXTURE_HEIGHT = 4096;

function lngToX(lng: number): number {
  return ((lng + 180) / 360) * TEXTURE_WIDTH;
}

function latToY(lat: number): number {
  return ((90 - lat) / 180) * TEXTURE_HEIGHT;
}

function Atmosphere() {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vPosition;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float uTime;
          varying vec3 vNormal;
          varying vec3 vPosition;
          void main() {
            float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 4.0);

            float angle = atan(vPosition.z, vPosition.x);
            float t = fract(angle / (2.0 * 3.14159265) + uTime * 0.08);

            vec3 c1 = vec3(0.247, 0.373, 0.722);
            vec3 c2 = vec3(0.0,   0.831, 1.0);
            vec3 c3 = vec3(0.545, 0.0,   1.0);

            vec3 auroraColor;
            if (t < 0.333) {
              auroraColor = mix(c1, c2, t / 0.333);
            } else if (t < 0.667) {
              auroraColor = mix(c2, c3, (t - 0.333) / 0.334);
            } else {
              auroraColor = mix(c3, c1, (t - 0.667) / 0.333);
            }

            gl_FragColor = vec4(auroraColor, 1.0) * intensity * 0.8;
          }
        `,
        blending: AdditiveBlending,
        side: BackSide,
        transparent: true,
        depthWrite: false,
      }),
    [],
  );

  useFrame(({ clock }) => {
    // eslint-disable-next-line react-hooks/immutability
    material.uniforms.uTime.value = clock.getElapsedTime();
  });

  return (
    <mesh material={material} scale={1.08} raycast={() => null}>
      <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
    </mesh>
  );
}

export function Globe() {
  const { gl } = useThree();
  const { data: topology } = useQuery({
    queryKey: ['land', '10m'],
    queryFn: () => fetchLandTopology('10m'),
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
    const polygons: number[][][][] = [];
    for (const f of land.features) {
      const geom = f.geometry;
      if (geom.type === 'Polygon') {
        polygons.push(geom.coordinates as unknown as number[][][]);
      } else if (geom.type === 'MultiPolygon') {
        polygons.push(...(geom.coordinates as unknown as number[][][][]));
      }
    }

    ctx.fillStyle = LAND_COLOR;
    ctx.strokeStyle = COAST_COLOR;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    // 날짜변경선(±180°)을 가로지르는 링은 경도가 180→-180으로 점프해
    // 캔버스 전체를 가로지르는 선(구에서는 위도 원 아티팩트)을 만든다.
    // 경도를 연속 값으로 언랩한 뒤, 캔버스 폭만큼 좌우로 한 번씩 더 그려
    // 래핑된 부분이 올바른 쪽에 나타나게 한다.
    for (const rings of polygons) {
      const unwrapped = rings.map((ring) => {
        let offset = 0;
        let prev = ring[0][0];
        return ring.map(([lng, lat]) => {
          let adjusted = lng + offset;
          if (adjusted - prev > 180) {
            offset -= 360;
            adjusted -= 360;
          } else if (adjusted - prev < -180) {
            offset += 360;
            adjusted += 360;
          }
          prev = adjusted;
          return [adjusted, lat] as [number, number];
        });
      });
      for (const shiftX of [-TEXTURE_WIDTH, 0, TEXTURE_WIDTH]) {
        ctx.beginPath();
        for (const ring of unwrapped) {
          ring.forEach(([lng, lat], i) => {
            const x = lngToX(lng) + shiftX;
            if (i === 0) ctx.moveTo(x, latToY(lat));
            else ctx.lineTo(x, latToY(lat));
          });
          // 극을 한 바퀴 감싸는 링(남극)은 언랩 후 시작/끝 경도가 360° 차이 난다.
          // 그대로 닫으면 시작 위도를 따라 캔버스를 가로지르는 현이 생겨
          // 구에서 위도 원 아티팩트가 되므로, 캔버스 모서리(극점) 바깥을 경유해 닫는다.
          const dLng = ring[ring.length - 1][0] - ring[0][0];
          if (Math.abs(dLng) > 180) {
            const edgeY = ring[0][1] < 0 ? TEXTURE_HEIGHT + 4 : -4;
            ctx.lineTo(lngToX(ring[ring.length - 1][0]) + shiftX, edgeY);
            ctx.lineTo(lngToX(ring[0][0]) + shiftX, edgeY);
          }
          ctx.closePath();
        }
        ctx.fill('evenodd');
        ctx.stroke();
      }
    }

    const canvasTexture = new CanvasTexture(canvas);
    canvasTexture.colorSpace = SRGBColorSpace;
    // 밉맵은 극점에서 UV가 극압축되며 LOD 링 아티팩트(극 주변 원)를 만들므로 끈다
    canvasTexture.generateMipmaps = false;
    canvasTexture.minFilter = LinearFilter;
    canvasTexture.anisotropy = gl.capabilities.getMaxAnisotropy();
    return canvasTexture;
  }, [topology, gl]);

  return (
    <group>
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
        {/* 색은 텍스처에 구워져 있으므로 조명 비의존(basic) — 극지방 셰이딩 아티팩트도 방지 */}
        {texture ? (
          <meshBasicMaterial key="textured" map={texture} />
        ) : (
          <meshBasicMaterial key="plain" color={SEA_COLOR} />
        )}
      </mesh>
      <Atmosphere />
    </group>
  );
}
