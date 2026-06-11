'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { AdditiveBlending, BackSide, ShaderMaterial } from 'three';
import { GLOBE_RADIUS } from '@/lib/geo';
import { fetchLandTopology } from '@/lib/land';
import { SEA_COLOR, createLandTexture } from '@/lib/land-texture';

// 확대 시 선명도를 위해 16384까지 사용(텍셀 크기 절반). GPU 한계를 넘으면
// maxTextureSize로 캡한다.
const TEXTURE_WIDTH = 16384;

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

            vec3 c1 = vec3(0.13, 0.34, 1.0);
            vec3 c2 = vec3(0.0,  0.90, 1.0);
            vec3 c3 = vec3(0.62, 0.0,  1.0);

            vec3 auroraColor;
            if (t < 0.333) {
              auroraColor = mix(c1, c2, t / 0.333);
            } else if (t < 0.667) {
              auroraColor = mix(c2, c3, (t - 0.333) / 0.334);
            } else {
              auroraColor = mix(c3, c1, (t - 0.667) / 0.333);
            }

            gl_FragColor = vec4(auroraColor, 1.0) * intensity * 1.3;
          }
        `,
        blending: AdditiveBlending,
        side: BackSide,
        transparent: true,
        depthWrite: false,
      }),
    [],
  );

  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

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
    return createLandTexture(topology, gl, TEXTURE_WIDTH);
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
