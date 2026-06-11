# Globe Visual Enhancement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 지구본 확대 시 텍스처 화질 개선 + 테두리에 딥블루→시안→퍼플 오로라 애니메이션 효과 추가.

**Architecture:** `globe.tsx` 단일 파일 수정. 텍스처 해상도 2배 업스케일 + 비등방 필터링, Atmosphere 셰이더에 uTime 기반 색 순환 추가.

**Tech Stack:** Three.js, React Three Fiber (`useThree`, `useFrame`), GLSL

---

## 변경 파일

- Modify: `frontend/src/components/map/globe/globe.tsx`

셰이더는 unit test 불가(렌더러 의존). 각 태스크는 dev server 시각 검증으로 완료 확인.

---

### Task 1: 텍스처 해상도 업스케일 + 비등방 필터링

**Files:**
- Modify: `frontend/src/components/map/globe/globe.tsx`

- [ ] **Step 1: 상수 및 import 수정**

`globe.tsx` 상단을 아래와 같이 변경:

```tsx
'use client';

import { useThree } from '@react-three/fiber';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import {
  AdditiveBlending,
  BackSide,
  CanvasTexture,
  Color,
  LinearFilter,
  SRGBColorSpace,
  ShaderMaterial,
} from 'three';
import { feature } from 'topojson-client';
import type { GeometryCollection } from 'topojson-specification';
import { GLOBE_RADIUS } from '@/lib/geo';
import { fetchLandTopology } from '@/lib/land';

const SEA_COLOR = '#0d1530';
const LAND_COLOR = '#2c3a5c';
const COAST_COLOR = 'rgba(168, 186, 224, 0.4)';
const ATMOSPHERE_COLOR = '#3f5fb8';
const TEXTURE_WIDTH = 8192;
const TEXTURE_HEIGHT = 4096;
```

변경 포인트:
- `useThree` import 추가 (`@react-three/fiber`에서)
- `TEXTURE_WIDTH`: 4096 → 8192
- `TEXTURE_HEIGHT`: 2048 → 4096

- [ ] **Step 2: Globe 컴포넌트에 useThree + lineWidth + anisotropy 적용**

`Globe` 함수를 아래처럼 수정:

```tsx
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
    canvasTexture.generateMipmaps = false;
    canvasTexture.minFilter = LinearFilter;
    canvasTexture.anisotropy = gl.capabilities.getMaxAnisotropy();
    return canvasTexture;
  }, [topology, gl]);

  return (
    <group>
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
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
```

변경 포인트:
- `const { gl } = useThree()` 추가
- `ctx.lineWidth = 2.5` (1.5 → 2.5)
- `canvasTexture.anisotropy = gl.capabilities.getMaxAnisotropy()` 추가
- `useMemo` deps에 `gl` 추가

- [ ] **Step 3: dev server에서 시각 확인**

```bash
cd frontend && npm run dev
```

브라우저에서 지구본을 최대한 확대해 해안선이 이전보다 선명한지 확인.

- [ ] **Step 4: 커밋**

```bash
git add frontend/src/components/map/globe/globe.tsx
git commit -m "fix:지구본 텍스처 8192×4096 업스케일 + 비등방 필터링"
```

---

### Task 2: Atmosphere 셰이더 오로라 애니메이션

**Files:**
- Modify: `frontend/src/components/map/globe/globe.tsx`

- [ ] **Step 1: Atmosphere 컴포넌트 전체 교체**

`globe.tsx`에서 `Atmosphere` 함수를 아래로 교체:

```tsx
import { useFrame } from '@react-three/fiber';
// (기존 useThree import 줄에 useFrame도 추가)
```

import 줄을 다음과 같이 수정:

```tsx
import { useFrame, useThree } from '@react-three/fiber';
```

그리고 `Atmosphere` 컴포넌트 전체를 교체:

```tsx
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
    material.uniforms.uTime.value = clock.getElapsedTime();
  });

  return (
    <mesh material={material} scale={1.08} raycast={() => null}>
      <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
    </mesh>
  );
}
```

셰이더 색상 값 참고:
- `c1` = 딥블루 #3f5fb8 → `vec3(0.247, 0.373, 0.722)`
- `c2` = 시안 #00d4ff → `vec3(0.0, 0.831, 1.0)`
- `c3` = 퍼플 #8b00ff → `vec3(0.545, 0.0, 1.0)`

또한 `ATMOSPHERE_COLOR` 상수는 더 이상 사용하지 않으므로 상단에서 제거:

```tsx
// 삭제: const ATMOSPHERE_COLOR = '#3f5fb8';
```

- [ ] **Step 2: 불필요한 Color import 제거 확인**

`ATMOSPHERE_COLOR`와 함께 쓰이던 `Color` import가 더 이상 사용되지 않으므로 제거:

```tsx
import {
  AdditiveBlending,
  BackSide,
  CanvasTexture,
  LinearFilter,
  SRGBColorSpace,
  ShaderMaterial,
} from 'three';
```

(`Color` 제거)

- [ ] **Step 3: lint 확인**

```bash
cd frontend && npm run lint
```

Expected: no errors

- [ ] **Step 4: dev server에서 시각 확인**

```bash
cd frontend && npm run dev
```

확인 항목:
- 지구본 테두리에 블루/시안/퍼플 색상이 섞여서 보임
- 천천히 색이 회전하며 바뀜 (약 12초에 한 바퀴)
- 지구본을 회전시켜도 효과가 자연스럽게 따라옴

- [ ] **Step 5: 커밋**

```bash
git add frontend/src/components/map/globe/globe.tsx
git commit -m "fix:지구본 테두리 오로라 애니메이션 (블루→시안→퍼플)"
```

---

### Task 3: origin 푸시

- [ ] **Step 1: 현재 브랜치 확인**

```bash
git branch --show-current
```

Expected: `fix/globe-visual`

- [ ] **Step 2: origin에 푸시 (main 머지 없이)**

```bash
git push origin fix/globe-visual
```
