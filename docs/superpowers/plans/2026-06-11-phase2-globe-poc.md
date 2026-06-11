# Phase 2: 3D 지구본 PoC 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

Goal: 메인 화면 안에서 R3F 기반 3D 지구본 PoC를 구현하여 Map_Visual_Spec §9 "3D Globe PoC 성공 기준" 전체를 충족한다.

Architecture: 구체 메쉬 + world-atlas 대륙 윤곽 라인 + 베지어 arc를 R3F로 직접 렌더링한다. 데이터는 Phase 1의 `useCityMarkers`/`useRoutes` 훅(그룹 필터 내장)을 그대로 소비하고, UI 상태는 ui-store(zustand)로 연동한다. 좌표·arc·핀 밀도 계산은 `lib/geo.ts` 순수 함수로 분리해 Vitest로 테스트한다.

Tech Stack: Next.js 16, React Three Fiber, drei (CameraControls, Stars, Html, Line), three, topojson-client, Zustand, TanStack Query, Vitest

스펙: `docs/superpowers/specs/2026-06-11-phase2-globe-poc-design.md`
브랜치: `feat/globe-poc` (main 머지 보류)
작업 디렉토리: `frontend/` (모든 npm 명령은 frontend에서 실행)

---

## 파일 구조

| 파일 | 책임 |
|------|------|
| `frontend/src/lib/geo.ts` | 생성 — 좌표 변환, arc 곡선, 대륙 라인 변환, 핀 밀도 순수 함수 |
| `frontend/tests/lib/geo.test.ts` | 생성 — geo.ts 테스트 |
| `frontend/src/stores/ui-store.ts` | 수정 — hoveredCityKey, cameraDistance 추가 |
| `frontend/src/components/map/map-view.tsx` | 생성 — Canvas + UI 오버레이, mapMode 분기 |
| `frontend/src/components/map/globe/globe-scene.tsx` | 생성 — R3F 씬 구성 (조명, 별, 하위 컴포넌트) |
| `frontend/src/components/map/globe/globe.tsx` | 생성 — 구체 + 대륙 윤곽 라인 |
| `frontend/src/components/map/globe/globe-camera-controls.tsx` | 생성 — 카메라 회전/줌/포커스 이동 |
| `frontend/src/components/map/globe/city-pins.tsx` | 생성 — 도시 핀 (호버/선택/밀도 조절) |
| `frontend/src/components/map/globe/route-arcs.tsx` | 생성 — 경로 arc + 빛 점 애니메이션 |
| `frontend/src/components/diary/city-diary-modal.tsx` | 생성 — 도시 일기 목록 중앙 모달 |
| `frontend/src/components/layout/floating-buttons.tsx` | 생성 — 그룹 필터 심플 버전 |
| `frontend/src/app/page.tsx` | 수정 — MapView 마운트 |
| `frontend/public/land-110m.json` | 생성 — world-atlas 110m land TopoJSON |

---

### Task 1: 의존성 설치 + 대륙 데이터 준비

**Files:**
- Modify: `frontend/package.json` (npm install로 자동 수정)
- Create: `frontend/public/land-110m.json`

- [ ] Step 1: topojson-client 설치

```bash
cd frontend
npm install topojson-client
npm install -D @types/topojson-client
```

- [ ] Step 2: world-atlas land-110m 데이터 다운로드

```bash
curl -fsSL -o public/land-110m.json https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json
```

- [ ] Step 3: 데이터 검증

```bash
node -e "const d=require('./public/land-110m.json'); console.log(d.type, Object.keys(d.objects))"
```

Expected: `Topology [ 'land' ]`

- [ ] Step 4: Commit

```bash
git add package.json package-lock.json public/land-110m.json
git commit -m "chore:topojson-client 설치 및 land-110m 대륙 데이터 추가"
```

---

### Task 2: 좌표 변환 함수 (latLngToVector3, latLngToCameraAngles)

**Files:**
- Create: `frontend/src/lib/geo.ts`
- Test: `frontend/tests/lib/geo.test.ts`

- [ ] Step 1: 실패하는 테스트 작성

`frontend/tests/lib/geo.test.ts` 생성:

```ts
import { describe, expect, it } from 'vitest';
import { latLngToCameraAngles, latLngToVector3 } from '@/lib/geo';

describe('latLngToVector3', () => {
  it('적도/본초자오선 (0, 0)은 +X 축 위의 점으로 변환된다', () => {
    const v = latLngToVector3(0, 0, 1);
    expect(v.x).toBeCloseTo(1);
    expect(v.y).toBeCloseTo(0);
    expect(v.z).toBeCloseTo(0);
  });

  it('북극 (90, 0)은 +Y 축 위의 점으로 변환된다', () => {
    const v = latLngToVector3(90, 0, 1);
    expect(v.x).toBeCloseTo(0);
    expect(v.y).toBeCloseTo(1);
    expect(v.z).toBeCloseTo(0);
  });

  it('적도/동경 90도 (0, 90)은 -Z 축 위의 점으로 변환된다', () => {
    const v = latLngToVector3(0, 90, 1);
    expect(v.x).toBeCloseTo(0);
    expect(v.y).toBeCloseTo(0);
    expect(v.z).toBeCloseTo(-1);
  });

  it('반지름이 보존된다', () => {
    const v = latLngToVector3(37.57, 126.98, 2.5);
    expect(v.length()).toBeCloseTo(2.5);
  });
});

describe('latLngToCameraAngles', () => {
  it('(0, 0)의 카메라 각도는 azimuth=π/2, polar=π/2', () => {
    const { azimuth, polar } = latLngToCameraAngles(0, 0);
    expect(azimuth).toBeCloseTo(Math.PI / 2);
    expect(polar).toBeCloseTo(Math.PI / 2);
  });

  it('북위로 갈수록 polar가 작아진다', () => {
    const equator = latLngToCameraAngles(0, 0);
    const north = latLngToCameraAngles(60, 0);
    expect(north.polar).toBeLessThan(equator.polar);
  });
});
```

- [ ] Step 2: 테스트 실패 확인

```bash
cd frontend
npm test -- tests/lib/geo.test.ts
```

Expected: FAIL — `@/lib/geo` 모듈을 찾을 수 없음

- [ ] Step 3: 최소 구현

`frontend/src/lib/geo.ts` 생성:

```ts
import { Spherical, Vector3 } from 'three';

export const GLOBE_RADIUS = 1;

export function latLngToVector3(
  lat: number,
  lng: number,
  radius: number,
): Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

export function latLngToCameraAngles(
  lat: number,
  lng: number,
): { azimuth: number; polar: number } {
  const spherical = new Spherical().setFromVector3(
    latLngToVector3(lat, lng, 1),
  );
  return { azimuth: spherical.theta, polar: spherical.phi };
}
```

- [ ] Step 4: 테스트 통과 확인

```bash
npm test -- tests/lib/geo.test.ts
```

Expected: PASS (6 tests)

- [ ] Step 5: Commit

```bash
git add src/lib/geo.ts tests/lib/geo.test.ts
git commit -m "feat:위경도-구면 좌표 변환 함수 구현 및 테스트"
```

---

### Task 3: arc 곡선 + 대륙 라인 변환 함수 (buildArcCurve, geoLinesToPositions)

**Files:**
- Modify: `frontend/src/lib/geo.ts`
- Test: `frontend/tests/lib/geo.test.ts`

- [ ] Step 1: 실패하는 테스트 추가

`frontend/tests/lib/geo.test.ts`의 import를 수정하고 describe 블록 추가:

```ts
import {
  buildArcCurve,
  geoLinesToPositions,
  latLngToCameraAngles,
  latLngToVector3,
} from '@/lib/geo';
```

파일 끝에 추가:

```ts
describe('buildArcCurve', () => {
  const tokyo = latLngToVector3(35.68, 139.65, 1);
  const seoul = latLngToVector3(37.57, 126.98, 1);
  const paris = latLngToVector3(48.86, 2.35, 1);

  it('곡선의 시작/끝점이 from/to와 일치한다', () => {
    const curve = buildArcCurve(tokyo, seoul, 1);
    expect(curve.getPoint(0).distanceTo(tokyo)).toBeCloseTo(0);
    expect(curve.getPoint(1).distanceTo(seoul)).toBeCloseTo(0);
  });

  it('제어점이 구 표면보다 바깥에 있다', () => {
    const curve = buildArcCurve(tokyo, seoul, 1);
    expect(curve.v1.length()).toBeGreaterThan(1);
  });

  it('거리가 먼 경로일수록 제어점이 더 높다', () => {
    const short = buildArcCurve(tokyo, seoul, 1);
    const long = buildArcCurve(tokyo, paris, 1);
    expect(long.v1.length()).toBeGreaterThan(short.v1.length());
  });
});

describe('geoLinesToPositions', () => {
  it('n개 점의 라인을 n-1개 세그먼트(쌍 좌표)로 변환한다', () => {
    const lines = [
      [
        [0, 0],
        [90, 0],
        [90, 45],
      ],
    ];
    const positions = geoLinesToPositions(lines, 1);
    expect(positions).toHaveLength(12); // 2 segments * 2 points * 3 floats
  });

  it('각 점은 latLngToVector3 결과와 일치한다 (GeoJSON은 [lng, lat] 순서)', () => {
    const lines = [
      [
        [0, 0],
        [90, 0],
      ],
    ];
    const positions = geoLinesToPositions(lines, 1);
    const start = latLngToVector3(0, 0, 1);
    const end = latLngToVector3(0, 90, 1);
    expect(positions[0]).toBeCloseTo(start.x);
    expect(positions[1]).toBeCloseTo(start.y);
    expect(positions[2]).toBeCloseTo(start.z);
    expect(positions[3]).toBeCloseTo(end.x);
    expect(positions[4]).toBeCloseTo(end.y);
    expect(positions[5]).toBeCloseTo(end.z);
  });

  it('세그먼트는 연속된 점을 잇는다 (이전 세그먼트 끝 = 다음 세그먼트 시작)', () => {
    const lines = [
      [
        [0, 0],
        [90, 0],
        [90, 45],
      ],
    ];
    const positions = geoLinesToPositions(lines, 1);
    expect(positions[6]).toBeCloseTo(positions[3]);
    expect(positions[7]).toBeCloseTo(positions[4]);
    expect(positions[8]).toBeCloseTo(positions[5]);
  });
});
```

- [ ] Step 2: 테스트 실패 확인

```bash
npm test -- tests/lib/geo.test.ts
```

Expected: FAIL — `buildArcCurve` export 없음

- [ ] Step 3: 최소 구현

`frontend/src/lib/geo.ts`에 추가 (import에 `QuadraticBezierCurve3` 추가):

```ts
import { QuadraticBezierCurve3, Spherical, Vector3 } from 'three';
```

```ts
export function buildArcCurve(
  from: Vector3,
  to: Vector3,
  radius: number,
): QuadraticBezierCurve3 {
  const distance = from.distanceTo(to);
  const control = from
    .clone()
    .add(to)
    .multiplyScalar(0.5)
    .normalize()
    .multiplyScalar(radius + distance * 0.5);
  return new QuadraticBezierCurve3(from.clone(), control, to.clone());
}

export function geoLinesToPositions(
  lines: number[][][],
  radius: number,
): Float32Array {
  const positions: number[] = [];
  for (const line of lines) {
    for (let i = 0; i < line.length - 1; i++) {
      const [lng1, lat1] = line[i];
      const [lng2, lat2] = line[i + 1];
      const a = latLngToVector3(lat1, lng1, radius);
      const b = latLngToVector3(lat2, lng2, radius);
      positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
  }
  return new Float32Array(positions);
}
```

- [ ] Step 4: 테스트 통과 확인

```bash
npm test -- tests/lib/geo.test.ts
```

Expected: PASS (12 tests)

- [ ] Step 5: Commit

```bash
git add src/lib/geo.ts tests/lib/geo.test.ts
git commit -m "feat:경로 arc 곡선 및 대륙 라인 변환 함수 구현 및 테스트"
```

---

### Task 4: 핀 밀도 조절 함수 (cityKey, declutterMarkers)

**Files:**
- Modify: `frontend/src/lib/geo.ts`
- Test: `frontend/tests/lib/geo.test.ts`

- [ ] Step 1: 실패하는 테스트 추가

`frontend/tests/lib/geo.test.ts`의 import를 수정:

```ts
import {
  buildArcCurve,
  cityKey,
  declutterMarkers,
  geoLinesToPositions,
  latLngToCameraAngles,
  latLngToVector3,
} from '@/lib/geo';
import type { CityMarker } from '@/types';
```

파일 끝에 추가:

```ts
function makeMarker(
  overrides: Pick<
    CityMarker,
    'city' | 'country' | 'latitude' | 'longitude' | 'diaryCount'
  >,
): CityMarker {
  return {
    continent: 'Asia',
    groupColor: null,
    diaryIds: [],
    ...overrides,
  };
}

// Tokyo-Osaka-Kyoto는 서로 가깝고(각거리 < 0.07rad), Seoul은 떨어져 있다(Tokyo와 약 0.18rad)
const markers: CityMarker[] = [
  makeMarker({ city: 'Tokyo', country: 'Japan', latitude: 35.68, longitude: 139.65, diaryCount: 3 }),
  makeMarker({ city: 'Osaka', country: 'Japan', latitude: 34.69, longitude: 135.5, diaryCount: 1 }),
  makeMarker({ city: 'Kyoto', country: 'Japan', latitude: 35.01, longitude: 135.77, diaryCount: 1 }),
  makeMarker({ city: 'Seoul', country: 'South Korea', latitude: 37.57, longitude: 126.98, diaryCount: 2 }),
];

describe('cityKey', () => {
  it('city-country 형식의 키를 만든다', () => {
    expect(cityKey('Tokyo', 'Japan')).toBe('Tokyo-Japan');
  });
});

describe('declutterMarkers', () => {
  it('줌인 상태(가까운 카메라)에서는 모든 핀을 유지한다', () => {
    const result = declutterMarkers(markers, 1.5, null);
    expect(result).toHaveLength(4);
  });

  it('줌아웃 상태에서는 가까운 핀끼리 diaryCount가 가장 큰 핀만 남긴다', () => {
    const result = declutterMarkers(markers, 4, null);
    const cities = result.map((m) => m.city);
    expect(cities).toContain('Tokyo');
    expect(cities).toContain('Seoul');
    expect(cities).not.toContain('Osaka');
    expect(cities).not.toContain('Kyoto');
  });

  it('선택된 도시의 핀은 클러스터링되어도 항상 유지한다', () => {
    const result = declutterMarkers(markers, 4, 'Osaka-Japan');
    const cities = result.map((m) => m.city);
    expect(cities).toContain('Osaka');
    expect(cities).toContain('Tokyo');
  });
});
```

- [ ] Step 2: 테스트 실패 확인

```bash
npm test -- tests/lib/geo.test.ts
```

Expected: FAIL — `cityKey` export 없음

- [ ] Step 3: 최소 구현

`frontend/src/lib/geo.ts`에 추가 (상단에 타입 import 추가):

```ts
import type { CityMarker } from '@/types';
```

```ts
export function cityKey(city: string, country: string): string {
  return `${city}-${country}`;
}

export function declutterMarkers(
  markers: CityMarker[],
  cameraDistance: number,
  selectedCityKey: string | null,
): CityMarker[] {
  // 카메라가 멀수록(줌아웃) 각도 임계값이 커져 가까운 핀이 합쳐진다
  const threshold = Math.max(0, (cameraDistance - 1.8) * 0.06);
  if (threshold === 0) return markers;

  const sorted = [...markers].sort((a, b) => b.diaryCount - a.diaryCount);
  const kept: CityMarker[] = [];
  const keptVectors: Vector3[] = [];

  for (const marker of sorted) {
    const v = latLngToVector3(marker.latitude, marker.longitude, 1);
    const isSelected =
      selectedCityKey === cityKey(marker.city, marker.country);
    const tooClose = keptVectors.some((k) => k.angleTo(v) < threshold);
    if (isSelected || !tooClose) {
      kept.push(marker);
      keptVectors.push(v);
    }
  }
  return kept;
}
```

- [ ] Step 4: 테스트 통과 확인

```bash
npm test -- tests/lib/geo.test.ts
```

Expected: PASS (16 tests)

- [ ] Step 5: 전체 테스트 확인

```bash
npm test
```

Expected: PASS — geo.test.ts + transforms.test.ts 모두 통과

- [ ] Step 6: Commit

```bash
git add src/lib/geo.ts tests/lib/geo.test.ts
git commit -m "feat:줌 레벨 기반 핀 밀도 조절 함수 구현 및 테스트"
```

---

### Task 5: ui-store 확장 (hoveredCityKey, cameraDistance)

**Files:**
- Modify: `frontend/src/stores/ui-store.ts`

- [ ] Step 1: 상태 추가

`frontend/src/stores/ui-store.ts` 전체를 다음으로 교체:

```ts
import { create } from 'zustand';
import type { MapMode } from '@/types';

interface UIState {
  mapMode: MapMode;
  setMapMode: (mode: MapMode) => void;

  selectedGroupId: string | null;
  setSelectedGroupId: (groupId: string | null) => void;

  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;

  selectedCityKey: string | null;
  setSelectedCityKey: (key: string | null) => void;

  selectedDiaryId: string | null;
  setSelectedDiaryId: (id: string | null) => void;

  hoveredCityKey: string | null;
  setHoveredCityKey: (key: string | null) => void;

  cameraDistance: number;
  setCameraDistance: (distance: number) => void;
}

export const useUIStore = create<UIState>((set) => ({
  mapMode: 'globe',
  setMapMode: (mode) => set({ mapMode: mode }),

  selectedGroupId: null,
  setSelectedGroupId: (groupId) => set({ selectedGroupId: groupId }),

  theme: 'dark',
  setTheme: (theme) => set({ theme }),

  selectedCityKey: null,
  setSelectedCityKey: (key) => set({ selectedCityKey: key }),

  selectedDiaryId: null,
  setSelectedDiaryId: (id) => set({ selectedDiaryId: id }),

  hoveredCityKey: null,
  setHoveredCityKey: (key) => set({ hoveredCityKey: key }),

  cameraDistance: 3,
  setCameraDistance: (distance) => set({ cameraDistance: distance }),
}));
```

- [ ] Step 2: 타입/테스트 확인

```bash
npm test && npx tsc --noEmit
```

Expected: 테스트 PASS, 타입 에러 없음

- [ ] Step 3: Commit

```bash
git add src/stores/ui-store.ts
git commit -m "feat:ui-store에 hoveredCityKey와 cameraDistance 상태 추가"
```

---

### Task 6: 지구본 렌더링 (Globe + GlobeScene + MapView + page)

**Files:**
- Create: `frontend/src/components/map/globe/globe.tsx`
- Create: `frontend/src/components/map/globe/globe-scene.tsx`
- Create: `frontend/src/components/map/map-view.tsx`
- Modify: `frontend/src/app/page.tsx`

- [ ] Step 1: Globe 컴포넌트 생성

`frontend/src/components/map/globe/globe.tsx` 생성:

```tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { mesh } from 'topojson-client';
import type { Topology } from 'topojson-specification';
import { GLOBE_RADIUS, geoLinesToPositions } from '@/lib/geo';

async function fetchLandTopology(): Promise<Topology> {
  const response = await fetch('/land-110m.json');
  if (!response.ok) {
    throw new Error(`Failed to fetch land topology: ${response.status}`);
  }
  return response.json();
}

export function Globe() {
  const { data: topology } = useQuery({
    queryKey: ['land-110m'],
    queryFn: fetchLandTopology,
    staleTime: Infinity,
  });

  const positions = useMemo(() => {
    if (!topology) return null;
    const land = mesh(topology, topology.objects.land);
    const lines =
      land.type === 'MultiLineString'
        ? (land.coordinates as number[][][])
        : ([land.coordinates] as number[][][]);
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
```

- [ ] Step 2: GlobeScene 컴포넌트 생성

`frontend/src/components/map/globe/globe-scene.tsx` 생성:

```tsx
'use client';

import { Stars } from '@react-three/drei';
import { Globe } from '@/components/map/globe/globe';

export function GlobeScene() {
  return (
    <>
      <ambientLight intensity={1.4} />
      <directionalLight position={[5, 3, 5]} intensity={0.6} />
      <Stars radius={50} depth={20} count={1500} factor={2} fade speed={0.5} />
      <Globe />
    </>
  );
}
```

- [ ] Step 3: MapView 컴포넌트 생성

`frontend/src/components/map/map-view.tsx` 생성:

```tsx
'use client';

import { Canvas } from '@react-three/fiber';
import { GlobeScene } from '@/components/map/globe/globe-scene';
import { useUIStore } from '@/stores/ui-store';

export function MapView() {
  const mapMode = useUIStore((s) => s.mapMode);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[radial-gradient(ellipse_at_center,_#0b1026_0%,_#04060f_70%)]">
      {mapMode === 'globe' && (
        <Canvas camera={{ position: [0, 0, 3], fov: 45 }}>
          <GlobeScene />
        </Canvas>
      )}
    </div>
  );
}
```

- [ ] Step 4: page.tsx 수정

`frontend/src/app/page.tsx` 전체를 다음으로 교체:

```tsx
import { MapView } from '@/components/map/map-view';

export default function Home() {
  return <MapView />;
}
```

- [ ] Step 5: 빌드/린트 확인

```bash
npm run build && npm run lint
```

Expected: 빌드 성공, 린트 에러 없음

- [ ] Step 6: 수동 확인

```bash
npm run dev
```

브라우저에서 http://localhost:3000 접속. 확인 사항:
- 다크 네이비 구체가 렌더링된다
- 대륙 윤곽 라인이 보인다
- 별 배경이 은은하게 보인다

- [ ] Step 7: Commit

```bash
git add src/components/map src/app/page.tsx
git commit -m "feat:3D 지구본 렌더링 (구체, 대륙 윤곽, 별 배경)"
```

---

### Task 7: 카메라 컨트롤 (회전/줌/관성/도시 포커스)

**Files:**
- Create: `frontend/src/components/map/globe/globe-camera-controls.tsx`
- Modify: `frontend/src/components/map/globe/globe-scene.tsx`

- [ ] Step 1: GlobeCameraControls 컴포넌트 생성

`frontend/src/components/map/globe/globe-camera-controls.tsx` 생성:

```tsx
'use client';

import { CameraControls } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type CameraControlsImpl from 'camera-controls';
import { useEffect, useRef } from 'react';
import { useCityMarkers } from '@/hooks/use-diary-data';
import { cityKey, latLngToCameraAngles } from '@/lib/geo';
import { useUIStore } from '@/stores/ui-store';

const MIN_DISTANCE = 1.4;
const MAX_DISTANCE = 4;

export function GlobeCameraControls() {
  const controlsRef = useRef<CameraControlsImpl | null>(null);
  const selectedCityKey = useUIStore((s) => s.selectedCityKey);
  const setCameraDistance = useUIStore((s) => s.setCameraDistance);
  const { data: cityMarkers } = useCityMarkers();

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls || !selectedCityKey || !cityMarkers) return;
    const marker = cityMarkers.find(
      (m) => cityKey(m.city, m.country) === selectedCityKey,
    );
    if (!marker) return;
    const { azimuth, polar } = latLngToCameraAngles(
      marker.latitude,
      marker.longitude,
    );
    void controls.rotateTo(azimuth, polar, true);
  }, [selectedCityKey, cityMarkers]);

  useFrame(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const quantized = Math.round(controls.distance * 10) / 10;
    if (useUIStore.getState().cameraDistance !== quantized) {
      setCameraDistance(quantized);
    }
  });

  return (
    <CameraControls
      ref={controlsRef}
      minDistance={MIN_DISTANCE}
      maxDistance={MAX_DISTANCE}
      smoothTime={0.3}
      draggingSmoothTime={0.15}
    />
  );
}
```

- [ ] Step 2: GlobeScene에 추가

`frontend/src/components/map/globe/globe-scene.tsx`를 다음으로 교체:

```tsx
'use client';

import { Stars } from '@react-three/drei';
import { Globe } from '@/components/map/globe/globe';
import { GlobeCameraControls } from '@/components/map/globe/globe-camera-controls';

export function GlobeScene() {
  return (
    <>
      <ambientLight intensity={1.4} />
      <directionalLight position={[5, 3, 5]} intensity={0.6} />
      <Stars radius={50} depth={20} count={1500} factor={2} fade speed={0.5} />
      <Globe />
      <GlobeCameraControls />
    </>
  );
}
```

- [ ] Step 3: 빌드/린트 확인

```bash
npm run build && npm run lint
```

Expected: 빌드 성공, 린트 에러 없음

- [ ] Step 4: 수동 확인

```bash
npm run dev
```

확인 사항:
- 드래그로 지구본이 회전하고 관성으로 부드럽게 감속한다
- 휠로 줌인/줌아웃이 되고 min/max 한계에서 멈춘다

- [ ] Step 5: Commit

```bash
git add src/components/map/globe
git commit -m "feat:지구본 카메라 컨트롤 (회전, 줌, 관성, 도시 포커스)"
```

---

### Task 8: 도시 핀 (렌더링/호버/클릭/밀도 조절)

**Files:**
- Create: `frontend/src/components/map/globe/city-pins.tsx`
- Modify: `frontend/src/components/map/globe/globe-scene.tsx`

- [ ] Step 1: CityPins 컴포넌트 생성

`frontend/src/components/map/globe/city-pins.tsx` 생성:

```tsx
'use client';

import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useState } from 'react';
import type { Group } from 'three';
import { useCityMarkers } from '@/hooks/use-diary-data';
import {
  GLOBE_RADIUS,
  cityKey,
  declutterMarkers,
  latLngToVector3,
} from '@/lib/geo';
import { useUIStore } from '@/stores/ui-store';
import type { CityMarker } from '@/types';

const PIN_RADIUS = 0.012;
const DEFAULT_PIN_COLOR = '#f5f5f5';

function CityPin({ marker }: { marker: CityMarker }) {
  const groupRef = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  const key = cityKey(marker.city, marker.country);
  const selected = useUIStore((s) => s.selectedCityKey === key);
  const setSelectedCityKey = useUIStore((s) => s.setSelectedCityKey);
  const setHoveredCityKey = useUIStore((s) => s.setHoveredCityKey);

  const position = useMemo(
    () =>
      latLngToVector3(marker.latitude, marker.longitude, GLOBE_RADIUS * 1.005),
    [marker.latitude, marker.longitude],
  );
  const color = marker.groupColor ?? DEFAULT_PIN_COLOR;

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
          setHoveredCityKey(key);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          setHoveredCityKey(null);
          document.body.style.cursor = 'auto';
        }}
      >
        <sphereGeometry args={[PIN_RADIUS, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh>
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

export function CityPins() {
  const { data: cityMarkers } = useCityMarkers();
  const cameraDistance = useUIStore((s) => s.cameraDistance);
  const selectedCityKey = useUIStore((s) => s.selectedCityKey);

  const visibleMarkers = useMemo(() => {
    if (!cityMarkers) return [];
    return declutterMarkers(cityMarkers, cameraDistance, selectedCityKey);
  }, [cityMarkers, cameraDistance, selectedCityKey]);

  return (
    <>
      {visibleMarkers.map((marker) => (
        <CityPin key={cityKey(marker.city, marker.country)} marker={marker} />
      ))}
    </>
  );
}
```

- [ ] Step 2: GlobeScene에 추가

`frontend/src/components/map/globe/globe-scene.tsx`를 다음으로 교체:

```tsx
'use client';

import { Stars } from '@react-three/drei';
import { CityPins } from '@/components/map/globe/city-pins';
import { Globe } from '@/components/map/globe/globe';
import { GlobeCameraControls } from '@/components/map/globe/globe-camera-controls';

export function GlobeScene() {
  return (
    <>
      <ambientLight intensity={1.4} />
      <directionalLight position={[5, 3, 5]} intensity={0.6} />
      <Stars radius={50} depth={20} count={1500} factor={2} fade speed={0.5} />
      <Globe />
      <CityPins />
      <GlobeCameraControls />
    </>
  );
}
```

- [ ] Step 3: 빌드/린트 확인

```bash
npm run build && npm run lint
```

Expected: 빌드 성공, 린트 에러 없음

- [ ] Step 4: 수동 확인

```bash
npm run dev
```

확인 사항:
- 16개 도시에 핀이 표시된다 (그룹 색상, 그룹 없음/혼합은 화이트)
- 호버 시 핀이 커지고 도시명·일기 수 툴팁이 보인다
- 핀 클릭 시 해당 도시로 카메라가 회전하고 핀이 pulse 애니메이션된다
- 줌아웃하면 Tokyo/Osaka/Kyoto가 합쳐지고 줌인하면 다시 나타난다

- [ ] Step 5: Commit

```bash
git add src/components/map/globe
git commit -m "feat:도시 핀 렌더링 (호버 툴팁, 클릭 선택, 핀 밀도 조절)"
```

---

### Task 9: 경로 arc + 빛 점 애니메이션

**Files:**
- Create: `frontend/src/components/map/globe/route-arcs.tsx`
- Modify: `frontend/src/components/map/globe/globe-scene.tsx`

- [ ] Step 1: RouteArcs 컴포넌트 생성

`frontend/src/components/map/globe/route-arcs.tsx` 생성:

```tsx
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
```

- [ ] Step 2: GlobeScene에 추가

`frontend/src/components/map/globe/globe-scene.tsx`를 다음으로 교체:

```tsx
'use client';

import { Stars } from '@react-three/drei';
import { CityPins } from '@/components/map/globe/city-pins';
import { Globe } from '@/components/map/globe/globe';
import { GlobeCameraControls } from '@/components/map/globe/globe-camera-controls';
import { RouteArcs } from '@/components/map/globe/route-arcs';

export function GlobeScene() {
  return (
    <>
      <ambientLight intensity={1.4} />
      <directionalLight position={[5, 3, 5]} intensity={0.6} />
      <Stars radius={50} depth={20} count={1500} factor={2} fade speed={0.5} />
      <Globe />
      <RouteArcs />
      <CityPins />
      <GlobeCameraControls />
    </>
  );
}
```

- [ ] Step 3: 빌드/린트 확인

```bash
npm run build && npm run lint
```

Expected: 빌드 성공, 린트 에러 없음

- [ ] Step 4: 수동 확인

```bash
npm run dev
```

확인 사항:
- created_at 순서대로 도시 간 곡선 arc가 표시된다 (그룹 색상, 그룹 없으면 그레이)
- 각 arc를 따라 작은 흰 빛 점이 이동한다 (경로마다 위상이 다름)
- 핀 호버 시 해당 도시와 연결된 경로가 굵고 밝게 강조된다

- [ ] Step 5: Commit

```bash
git add src/components/map/globe
git commit -m "feat:경로 arc 렌더링 및 빛 점 이동 애니메이션"
```

---

### Task 10: 도시 일기 목록 모달

**Files:**
- Create: `frontend/src/components/diary/city-diary-modal.tsx`
- Modify: `frontend/src/components/map/map-view.tsx`

- [ ] Step 1: CityDiaryModal 컴포넌트 생성

`frontend/src/components/diary/city-diary-modal.tsx` 생성:

```tsx
'use client';

import { useDiaries, useGroups } from '@/hooks/use-diary-data';
import { cityKey } from '@/lib/geo';
import { useUIStore } from '@/stores/ui-store';

export function CityDiaryModal() {
  const selectedCityKey = useUIStore((s) => s.selectedCityKey);
  const setSelectedCityKey = useUIStore((s) => s.setSelectedCityKey);
  const { data: diaries } = useDiaries();
  const { data: groups } = useGroups();

  if (!selectedCityKey || !diaries) return null;

  const cityDiaries = diaries
    .filter((d) => cityKey(d.city, d.country) === selectedCityKey)
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

  if (cityDiaries.length === 0) return null;

  const { city, country } = cityDiaries[0];
  const groupNameOf = (groupId: string | null) =>
    groupId ? (groups?.find((g) => g.id === groupId)?.name ?? null) : null;

  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center bg-black/50"
      onClick={() => setSelectedCityKey(null)}
    >
      <div
        className="max-h-[70vh] w-full max-w-md overflow-y-auto rounded-lg border border-white/10 bg-neutral-900 p-6 text-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">{city}</h2>
            <p className="text-sm text-neutral-400">
              {country} · 일기 {cityDiaries.length}개
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSelectedCityKey(null)}
            className="text-neutral-400 hover:text-white"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>
        <ul className="space-y-2">
          {cityDiaries.map((diary) => (
            <li key={diary.id} className="rounded border border-white/10 p-3">
              <p className="font-medium">{diary.title}</p>
              <p className="text-sm text-neutral-400">
                {diary.visitedDate}
                {groupNameOf(diary.groupId)
                  ? ` · ${groupNameOf(diary.groupId)}`
                  : ''}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

- [ ] Step 2: MapView에 추가

`frontend/src/components/map/map-view.tsx`를 다음으로 교체:

```tsx
'use client';

import { Canvas } from '@react-three/fiber';
import { CityDiaryModal } from '@/components/diary/city-diary-modal';
import { GlobeScene } from '@/components/map/globe/globe-scene';
import { useUIStore } from '@/stores/ui-store';

export function MapView() {
  const mapMode = useUIStore((s) => s.mapMode);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[radial-gradient(ellipse_at_center,_#0b1026_0%,_#04060f_70%)]">
      {mapMode === 'globe' && (
        <Canvas camera={{ position: [0, 0, 3], fov: 45 }}>
          <GlobeScene />
        </Canvas>
      )}
      <CityDiaryModal />
    </div>
  );
}
```

- [ ] Step 3: 빌드/린트 확인

```bash
npm run build && npm run lint
```

Expected: 빌드 성공, 린트 에러 없음

- [ ] Step 4: 수동 확인

```bash
npm run dev
```

확인 사항:
- 핀 클릭 시 도시명·국가·일기 개수·일기 리스트(제목, 날짜, 그룹명)가 중앙 모달로 표시된다
- 닫기 버튼 또는 바깥 클릭으로 모달이 닫힌다 (선택 해제)

- [ ] Step 5: Commit

```bash
git add src/components/diary src/components/map/map-view.tsx
git commit -m "feat:도시 일기 목록 모달"
```

---

### Task 11: 플로팅 버튼 그룹 필터

**Files:**
- Create: `frontend/src/components/layout/floating-buttons.tsx`
- Modify: `frontend/src/components/map/map-view.tsx`

- [ ] Step 1: FloatingButtons 컴포넌트 생성

`frontend/src/components/layout/floating-buttons.tsx` 생성:

```tsx
'use client';

import { useState } from 'react';
import { useGroups } from '@/hooks/use-diary-data';
import { useUIStore } from '@/stores/ui-store';

interface FilterOption {
  id: string | null;
  name: string;
  color: string | null;
}

export function FloatingButtons() {
  const [filterOpen, setFilterOpen] = useState(false);
  const { data: groups } = useGroups();
  const selectedGroupId = useUIStore((s) => s.selectedGroupId);
  const setSelectedGroupId = useUIStore((s) => s.setSelectedGroupId);

  if (!groups || groups.length === 0) return null;

  const options: FilterOption[] = [
    { id: null, name: '전체 보기', color: null },
    ...groups.map((g) => ({ id: g.id, name: g.name, color: g.color })),
    { id: 'ungrouped', name: '그룹 없음', color: null },
  ];

  return (
    <div className="absolute bottom-6 right-6 z-10 flex flex-col items-end gap-2">
      {filterOpen && (
        <ul className="rounded-lg border border-white/10 bg-neutral-900/90 p-2 text-sm text-white">
          {options.map((option) => (
            <li key={option.id ?? 'all'}>
              <button
                type="button"
                onClick={() => {
                  setSelectedGroupId(option.id);
                  setFilterOpen(false);
                }}
                className={`flex w-full items-center gap-2 rounded px-3 py-1.5 text-left hover:bg-white/10 ${
                  selectedGroupId === option.id ? 'bg-white/15' : ''
                }`}
              >
                {option.color && (
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: option.color }}
                  />
                )}
                {option.name}
              </button>
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        onClick={() => setFilterOpen((open) => !open)}
        className="rounded-full border border-white/15 bg-neutral-900/80 px-4 py-2 text-sm text-white hover:bg-neutral-800"
      >
        그룹 필터
      </button>
    </div>
  );
}
```

- [ ] Step 2: MapView에 추가

`frontend/src/components/map/map-view.tsx`를 다음으로 교체:

```tsx
'use client';

import { Canvas } from '@react-three/fiber';
import { CityDiaryModal } from '@/components/diary/city-diary-modal';
import { FloatingButtons } from '@/components/layout/floating-buttons';
import { GlobeScene } from '@/components/map/globe/globe-scene';
import { useUIStore } from '@/stores/ui-store';

export function MapView() {
  const mapMode = useUIStore((s) => s.mapMode);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[radial-gradient(ellipse_at_center,_#0b1026_0%,_#04060f_70%)]">
      {mapMode === 'globe' && (
        <Canvas camera={{ position: [0, 0, 3], fov: 45 }}>
          <GlobeScene />
        </Canvas>
      )}
      <FloatingButtons />
      <CityDiaryModal />
    </div>
  );
}
```

- [ ] Step 3: 빌드/린트 확인

```bash
npm run build && npm run lint
```

Expected: 빌드 성공, 린트 에러 없음

- [ ] Step 4: 수동 확인

```bash
npm run dev
```

확인 사항:
- 우측 하단에 그룹 필터 버튼이 보이고 클릭 시 목록(전체 보기 / 4개 그룹 + 색상 점 / 그룹 없음)이 열린다
- 그룹 선택 시 해당 그룹의 핀과 경로만 표시된다
- 그룹 없음 선택 시 groupId가 null인 일기의 도시만 표시된다
- 전체 보기로 복귀하면 모든 핀/경로가 다시 보인다

- [ ] Step 5: Commit

```bash
git add src/components/layout src/components/map/map-view.tsx
git commit -m "feat:그룹 필터 플로팅 버튼"
```

---

### Task 12: 최종 검증 (스펙 §9 체크리스트)

**Files:** 없음 (수정 사항이 나오면 해당 파일)

- [ ] Step 1: 전체 자동 검증

```bash
cd frontend
npm test && npm run lint && npm run build
```

Expected: 모두 통과

- [ ] Step 2: 스펙 §9 "3D Globe PoC 성공 기준" 수동 체크리스트

```bash
npm run dev
```

- [ ] 지구본이 렌더링된다
- [ ] 사용자가 지구본을 회전할 수 있다
- [ ] 사용자가 줌인/줌아웃할 수 있다
- [ ] mock-data.json의 도시가 핀으로 표시된다
- [ ] 도시 핀 클릭 시 도시명이 출력된다 (모달 헤더)
- [ ] 도시 클릭 시 해당 도시로 카메라가 애니메이션 이동한다
- [ ] 도시 클릭 시 해당 도시의 일기 목록을 확인할 수 있다
- [ ] created_at 기준으로 도시 간 경로가 표시된다
- [ ] 경로를 따라 작은 빛 점이 이동하는 애니메이션이 표시된다
- [ ] 줌 레벨에 따라 핀 밀도가 자동 조절된다
- [ ] 그룹 필터 적용 시 해당 그룹 데이터만 표시된다

- [ ] Step 3: 발견된 문제 수정 후 커밋 (있다면)

문제별로 수정 → 관련 검증 재실행 → `fix:` 커밋.

- [ ] Step 4: frontend/CLAUDE.md 디렉토리 구조 갱신

`frontend/CLAUDE.md`의 "디렉토리 구조" 코드 블록을 다음으로 교체:

```
src/
├── app/              # Next.js App Router (라우팅, 레이아웃, 페이지)
├── components/
│   ├── ui/           # shadcn/ui 컴포넌트
│   ├── map/          # MapView + globe/ (지구본 씬, 핀, 경로, 카메라)
│   ├── diary/        # 일기 관련 컴포넌트 (도시 일기 목록 모달)
│   └── layout/       # 레이아웃 컴포넌트 (플로팅 버튼)
├── hooks/            # TanStack Query 커스텀 훅 (use-diary-data.ts)
├── lib/              # 유틸 함수 (transforms.ts, geo.ts, api.ts, utils.ts)
├── providers/        # ThemeProvider, QueryProvider
├── stores/           # Zustand 스토어 (ui-store.ts)
└── types/            # 도메인 타입 정의
tests/
└── lib/              # 변환/지오 함수 테스트
```

- [ ] Step 5: Commit

```bash
git add frontend/CLAUDE.md
git commit -m "docs:frontend CLAUDE.md Phase 2 디렉토리 구조 반영"
```

main 머지는 하지 않는다 (사용자 지시).
