# Phase 3: 2D 지도 PoC 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

Goal: 메인 화면 내 모드 전환으로 Three.js 기반 입체형 2D 지도를 구현하여 Map_Visual_Spec §9 "2D Map PoC 성공 기준" 전체 + 모드 전환/저장을 충족한다.

Architecture: equirectangular 평면(4×2, XY 평면, +Z 높이)에 land 폴리곤을 ExtrudeGeometry로 낮게 돌출시킨다. 핀/경로의 호버·클릭·애니메이션 로직은 globe와 동일하므로 공통 컴포넌트(`map/shared/`)로 추출하고, globe/map2d는 위치·곡선 계산만 공급한다. 모드는 zustand persist로 localStorage에 저장한다.

Tech Stack: Next.js 16, React Three Fiber, drei (CameraControls, Stars, Html, Line), three (ExtrudeGeometry, Shape), topojson-client, Zustand (persist), TanStack Query, Vitest

스펙: `docs/superpowers/specs/2026-06-11-phase3-map2d-poc-design.md`
브랜치: `feat/map2d-poc` (커밋·푸시만, main 머지 보류)
작업 디렉토리: `frontend/` (모든 npm 명령은 frontend에서 실행)

---

## 파일 구조

| 파일 | 책임 |
|------|------|
| `frontend/src/lib/geo.ts` | 수정 — 평면 좌표/arc/Shape 변환, declutter 일반화 |
| `frontend/tests/lib/geo.test.ts` | 수정 — 신규 함수 테스트 추가 |
| `frontend/src/lib/land.ts` | 생성 — land-110m fetch 함수 (globe/map2d 공유) |
| `frontend/src/stores/ui-store.ts` | 수정 — persist 미들웨어 (mapMode만) |
| `frontend/src/components/map/shared/city-pin.tsx` | 생성 — 공통 핀 (position prop) |
| `frontend/src/components/map/shared/route-arc.tsx` | 생성 — 공통 경로 (curve prop) |
| `frontend/src/components/map/globe/city-pins.tsx` | 수정 — shared CityPin 사용 |
| `frontend/src/components/map/globe/route-arcs.tsx` | 수정 — shared RouteArc 사용 |
| `frontend/src/components/map/globe/globe.tsx` | 수정 — fetchLandTopology를 lib/land.ts에서 import |
| `frontend/src/components/map/map2d/land-mesh.tsx` | 생성 — 바다 평면 + extrude 대륙 |
| `frontend/src/components/map/map2d/map2d-scene.tsx` | 생성 — 2D 씬 구성 |
| `frontend/src/components/map/map2d/map2d-camera-controls.tsx` | 생성 — truck/줌/도시 포커스 |
| `frontend/src/components/map/map2d/map2d-city-pins.tsx` | 생성 — 평면 핀 배치 |
| `frontend/src/components/map/map2d/map2d-route-arcs.tsx` | 생성 — 평면 경로 배치 |
| `frontend/src/components/map/map-view.tsx` | 수정 — map2d 분기 + persist rehydrate |
| `frontend/src/components/layout/floating-buttons.tsx` | 수정 — 모드 전환 버튼 |

---

### Task 1: 평면 좌표 변환 (latLngToPlaneVector3 + 평면 상수)

**Files:**
- Modify: `frontend/src/lib/geo.ts`
- Test: `frontend/tests/lib/geo.test.ts`

- [ ] Step 1: 실패하는 테스트 추가

`frontend/tests/lib/geo.test.ts`의 geo import에 `latLngToPlaneVector3` 추가 (알파벳 순서 유지):

```ts
import {
  buildArcCurve,
  cityKey,
  declutterMarkers,
  geoLinesToPositions,
  latLngToCameraAngles,
  latLngToPlaneVector3,
  latLngToVector3,
} from '@/lib/geo';
```

파일 끝에 추가:

```ts
describe('latLngToPlaneVector3', () => {
  it('(0, 0)은 평면 원점으로 변환된다', () => {
    const v = latLngToPlaneVector3(0, 0);
    expect(v.x).toBeCloseTo(0);
    expect(v.y).toBeCloseTo(0);
    expect(v.z).toBeCloseTo(0);
  });

  it('(90, 180)은 평면 우상단 모서리 (2, 1)로 변환된다', () => {
    const v = latLngToPlaneVector3(90, 180);
    expect(v.x).toBeCloseTo(2);
    expect(v.y).toBeCloseTo(1);
  });

  it('(-45, -90)은 (-1, -0.5)로 변환된다', () => {
    const v = latLngToPlaneVector3(-45, -90);
    expect(v.x).toBeCloseTo(-1);
    expect(v.y).toBeCloseTo(-0.5);
  });

  it('z 값이 보존된다', () => {
    expect(latLngToPlaneVector3(10, 20, 0.5).z).toBeCloseTo(0.5);
  });
});
```

- [ ] Step 2: 테스트 실패 확인

```bash
cd /Users/onomaai/Documents/workspace/tutorial/map-diary/frontend
npm test -- tests/lib/geo.test.ts
```

Expected: FAIL — `latLngToPlaneVector3` export 없음

- [ ] Step 3: 최소 구현

`frontend/src/lib/geo.ts`의 `GLOBE_RADIUS` 선언 아래에 추가:

```ts
export const MAP_WIDTH = 4;
export const MAP_HEIGHT = 2;
export const LAND_DEPTH = 0.02;
```

파일 끝에 추가:

```ts
export function latLngToPlaneVector3(lat: number, lng: number, z = 0): Vector3 {
  return new Vector3(
    (lng / 180) * (MAP_WIDTH / 2),
    (lat / 90) * (MAP_HEIGHT / 2),
    z,
  );
}
```

- [ ] Step 4: 테스트 통과 확인

```bash
npm test -- tests/lib/geo.test.ts
```

Expected: PASS

- [ ] Step 5: Commit

```bash
git add src/lib/geo.ts tests/lib/geo.test.ts
git commit -m "feat:위경도-평면 좌표 변환 함수 구현 및 테스트"
```

---

### Task 2: 평면 경로 곡선 (buildPlaneArcCurve)

**Files:**
- Modify: `frontend/src/lib/geo.ts`
- Test: `frontend/tests/lib/geo.test.ts`

- [ ] Step 1: 실패하는 테스트 추가

`frontend/tests/lib/geo.test.ts`의 geo import에 `buildPlaneArcCurve` 추가 (알파벳 순서: `buildArcCurve` 다음). 파일 끝에 추가:

```ts
describe('buildPlaneArcCurve', () => {
  const seoul = latLngToPlaneVector3(37.57, 126.98, 0.025);
  const tokyo = latLngToPlaneVector3(35.68, 139.65, 0.025);
  const paris = latLngToPlaneVector3(48.86, 2.35, 0.025);

  it('곡선의 시작/끝점이 from/to와 일치한다', () => {
    const curve = buildPlaneArcCurve(seoul, tokyo);
    expect(curve.getPoint(0).distanceTo(seoul)).toBeCloseTo(0);
    expect(curve.getPoint(1).distanceTo(tokyo)).toBeCloseTo(0);
  });

  it('제어점이 끝점보다 높다 (+Z)', () => {
    const curve = buildPlaneArcCurve(seoul, tokyo);
    expect(curve.v1.z).toBeGreaterThan(seoul.z);
    expect(curve.v1.z).toBeGreaterThan(tokyo.z);
  });

  it('거리가 먼 경로일수록 제어점이 더 높다', () => {
    const short = buildPlaneArcCurve(seoul, tokyo);
    const long = buildPlaneArcCurve(seoul, paris);
    expect(long.v1.z).toBeGreaterThan(short.v1.z);
  });

  it('곡선 전체가 평면(z=0) 위에 있다', () => {
    const curve = buildPlaneArcCurve(seoul, paris);
    for (let i = 0; i <= 20; i++) {
      expect(curve.getPoint(i / 20).z).toBeGreaterThan(0);
    }
  });
});
```

- [ ] Step 2: 테스트 실패 확인

```bash
npm test -- tests/lib/geo.test.ts
```

Expected: FAIL — `buildPlaneArcCurve` export 없음

- [ ] Step 3: 최소 구현

`frontend/src/lib/geo.ts`의 three import에 `QuadraticBezierCurve3` 추가:

```ts
import {
  CatmullRomCurve3,
  QuadraticBezierCurve3,
  Spherical,
  Vector3,
} from 'three';
```

파일 끝에 추가:

```ts
export function buildPlaneArcCurve(
  from: Vector3,
  to: Vector3,
): QuadraticBezierCurve3 {
  const distance = from.distanceTo(to);
  const control = from.clone().add(to).multiplyScalar(0.5);
  // 베지어 곡선은 제어점들의 볼록 껍질 안에 있으므로 평면 아래로 내려가지 않는다
  control.z = Math.max(from.z, to.z) + 0.05 + distance * 0.15;
  return new QuadraticBezierCurve3(from.clone(), control, to.clone());
}
```

- [ ] Step 4: 테스트 통과 확인

```bash
npm test -- tests/lib/geo.test.ts
```

Expected: PASS

- [ ] Step 5: Commit

```bash
git add src/lib/geo.ts tests/lib/geo.test.ts
git commit -m "feat:평면 경로 arc 곡선 함수 구현 및 테스트"
```

---

### Task 3: 폴리곤→Shape 변환 (geoPolygonsToShapes)

**Files:**
- Modify: `frontend/src/lib/geo.ts`
- Test: `frontend/tests/lib/geo.test.ts`

- [ ] Step 1: 실패하는 테스트 추가

`frontend/tests/lib/geo.test.ts`의 geo import에 `geoPolygonsToShapes` 추가 (알파벳 순서: `geoLinesToPositions` 다음). 파일 끝에 추가:

```ts
describe('geoPolygonsToShapes', () => {
  const square: number[][] = [
    [0, 0],
    [10, 0],
    [10, 10],
    [0, 10],
    [0, 0],
  ];
  const innerRing: number[][] = [
    [2, 2],
    [4, 2],
    [4, 4],
    [2, 4],
    [2, 2],
  ];

  it('구멍 없는 폴리곤 1개를 Shape 1개로 변환한다', () => {
    const shapes = geoPolygonsToShapes([[square]]);
    expect(shapes).toHaveLength(1);
    expect(shapes[0].holes).toHaveLength(0);
  });

  it('외곽 링 좌표가 평면 투영과 일치한다 (GeoJSON [lng, lat] 순서)', () => {
    const shapes = geoPolygonsToShapes([[square]]);
    const points = shapes[0].getPoints();
    const expected = latLngToPlaneVector3(0, 10); // [lng=10, lat=0]
    expect(points[1].x).toBeCloseTo(expected.x);
    expect(points[1].y).toBeCloseTo(expected.y);
  });

  it('내부 링은 hole로 변환된다', () => {
    const shapes = geoPolygonsToShapes([[square, innerRing]]);
    expect(shapes[0].holes).toHaveLength(1);
  });

  it('MultiPolygon은 폴리곤 수만큼 Shape를 만든다', () => {
    const shapes = geoPolygonsToShapes([[square], [innerRing]]);
    expect(shapes).toHaveLength(2);
  });
});
```

- [ ] Step 2: 테스트 실패 확인

```bash
npm test -- tests/lib/geo.test.ts
```

Expected: FAIL — `geoPolygonsToShapes` export 없음

- [ ] Step 3: 최소 구현

`frontend/src/lib/geo.ts`의 three import에 `Path`, `Shape`, `Vector2` 추가:

```ts
import {
  CatmullRomCurve3,
  Path,
  QuadraticBezierCurve3,
  Shape,
  Spherical,
  Vector2,
  Vector3,
} from 'three';
```

파일 끝에 추가:

```ts
function ringToPoints(ring: number[][]): Vector2[] {
  return ring.map(([lng, lat]) => {
    const v = latLngToPlaneVector3(lat, lng);
    return new Vector2(v.x, v.y);
  });
}

export function geoPolygonsToShapes(polygons: number[][][][]): Shape[] {
  return polygons.map((rings) => {
    const [outer, ...holes] = rings;
    const shape = new Shape(ringToPoints(outer));
    for (const hole of holes) {
      shape.holes.push(new Path(ringToPoints(hole)));
    }
    return shape;
  });
}
```

- [ ] Step 4: 테스트 통과 확인

```bash
npm test -- tests/lib/geo.test.ts
```

Expected: PASS

- [ ] Step 5: Commit

```bash
git add src/lib/geo.ts tests/lib/geo.test.ts
git commit -m "feat:GeoJSON 폴리곤을 Three.js Shape로 변환하는 함수 구현 및 테스트"
```

---

### Task 4: declutter 일반화 + 평면 핀 밀도 (declutterMarkersPlane)

**Files:**
- Modify: `frontend/src/lib/geo.ts`
- Test: `frontend/tests/lib/geo.test.ts`

- [ ] Step 1: 실패하는 테스트 추가

`frontend/tests/lib/geo.test.ts`의 geo import에 `declutterMarkersPlane` 추가 (알파벳 순서: `declutterMarkers` 다음). 파일 끝에 추가 (기존 `markers` 픽스처를 재사용한다):

```ts
describe('declutterMarkersPlane', () => {
  it('줌인 상태에서는 모든 핀을 유지한다', () => {
    const result = declutterMarkersPlane(markers, 0.8, null);
    expect(result).toHaveLength(4);
  });

  it('줌아웃 상태에서는 가까운 핀끼리 diaryCount가 가장 큰 핀만 남긴다', () => {
    const result = declutterMarkersPlane(markers, 2.5, null);
    const cities = result.map((m) => m.city);
    expect(cities).toContain('Tokyo');
    expect(cities).toContain('Seoul');
    expect(cities).not.toContain('Osaka');
    expect(cities).not.toContain('Kyoto');
  });

  it('선택된 도시의 핀은 항상 유지한다', () => {
    const result = declutterMarkersPlane(markers, 2.5, 'Osaka-Japan');
    expect(result.map((m) => m.city)).toContain('Osaka');
  });
});
```

- [ ] Step 2: 테스트 실패 확인

```bash
npm test -- tests/lib/geo.test.ts
```

Expected: FAIL — `declutterMarkersPlane` export 없음

- [ ] Step 3: 구현 — 코어 분리 + 평면 래퍼

`frontend/src/lib/geo.ts`의 기존 `declutterMarkers` 함수 전체를 다음 세 함수로 교체 (기존 시그니처·동작 유지):

```ts
function declutterByDistance(
  markers: CityMarker[],
  threshold: number,
  selectedCityKey: string | null,
  toVector3: (marker: CityMarker) => Vector3,
  distanceBetween: (a: Vector3, b: Vector3) => number,
): CityMarker[] {
  if (threshold === 0) return markers;

  const sorted = [...markers].sort((a, b) => b.diaryCount - a.diaryCount);
  const kept: CityMarker[] = [];
  const keptVectors: Vector3[] = [];

  for (const marker of sorted) {
    const v = toVector3(marker);
    const isSelected =
      selectedCityKey === cityKey(marker.city, marker.country);
    const tooClose = keptVectors.some((k) => distanceBetween(k, v) < threshold);
    if (isSelected || !tooClose) {
      kept.push(marker);
      keptVectors.push(v);
    }
  }
  return kept;
}

export function declutterMarkers(
  markers: CityMarker[],
  cameraDistance: number,
  selectedCityKey: string | null,
): CityMarker[] {
  // 카메라가 멀수록(줌아웃) 각도 임계값이 커져 가까운 핀이 합쳐진다
  const threshold = Math.max(0, (cameraDistance - 1.8) * 0.06);
  return declutterByDistance(
    markers,
    threshold,
    selectedCityKey,
    (m) => latLngToVector3(m.latitude, m.longitude, 1),
    (a, b) => a.angleTo(b),
  );
}

export function declutterMarkersPlane(
  markers: CityMarker[],
  cameraDistance: number,
  selectedCityKey: string | null,
): CityMarker[] {
  // 평면 유클리드 거리 기준 임계값 (2D 카메라 거리 범위 0.5~2.5에 맞춤)
  const threshold = Math.max(0, (cameraDistance - 0.8) * 0.04);
  return declutterByDistance(
    markers,
    threshold,
    selectedCityKey,
    (m) => latLngToPlaneVector3(m.latitude, m.longitude),
    (a, b) => a.distanceTo(b),
  );
}
```

- [ ] Step 4: 전체 테스트 통과 확인 (기존 globe declutter 테스트 회귀 포함)

```bash
npm test
```

Expected: PASS — 기존 `declutterMarkers` 3개 테스트 포함 전체 통과

- [ ] Step 5: Commit

```bash
git add src/lib/geo.ts tests/lib/geo.test.ts
git commit -m "refactor:핀 밀도 조절 코어를 거리 함수 주입으로 일반화하고 평면 래퍼 추가"
```

---

### Task 5: ui-store persist (mapMode localStorage 저장)

**Files:**
- Modify: `frontend/src/stores/ui-store.ts`
- Modify: `frontend/src/components/map/map-view.tsx`

- [ ] Step 1: ui-store에 persist 적용

`frontend/src/stores/ui-store.ts` 전체를 다음으로 교체:

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      mapMode: 'globe',
      setMapMode: (mode) => set({ mapMode: mode }),

      selectedGroupId: null,
      // 필터 변경 시 선택된 도시(모달/카메라 포커스)도 함께 해제한다
      setSelectedGroupId: (groupId) =>
        set({ selectedGroupId: groupId, selectedCityKey: null }),

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
    }),
    {
      name: 'map-diary-ui',
      partialize: (state) => ({ mapMode: state.mapMode }),
      // SSR hydration mismatch 방지: 마운트 후 수동 rehydrate (map-view.tsx)
      skipHydration: true,
    },
  ),
);
```

- [ ] Step 2: MapView에서 마운트 후 rehydrate

`frontend/src/components/map/map-view.tsx`에 useEffect 추가 — import에 `useEffect` 추가:

```tsx
import { useEffect } from 'react';
```

`MapView` 함수 본문 첫 줄(기존 `const mapMode = ...` 위)에 추가:

```tsx
useEffect(() => {
  void useUIStore.persist.rehydrate();
}, []);
```

- [ ] Step 3: 검증

```bash
cd /Users/onomaai/Documents/workspace/tutorial/map-diary/frontend
npm test && npm run lint && npm run build
```

Expected: 모두 통과

- [ ] Step 4: Commit

```bash
git add src/stores/ui-store.ts src/components/map/map-view.tsx
git commit -m "feat:mapMode를 localStorage에 저장 (zustand persist)"
```

---

### Task 6: 핀/경로 공통 컴포넌트 추출 (globe 리팩토링)

**Files:**
- Create: `frontend/src/components/map/shared/city-pin.tsx`
- Create: `frontend/src/components/map/shared/route-arc.tsx`
- Modify: `frontend/src/components/map/globe/city-pins.tsx`
- Modify: `frontend/src/components/map/globe/route-arcs.tsx`

- [ ] Step 1: 공통 CityPin 생성 — `frontend/src/components/map/shared/city-pin.tsx`:

(기존 globe `city-pins.tsx`의 CityPin과 동일한 동작 — position만 prop으로 받는다)

```tsx
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
```

- [ ] Step 2: 공통 RouteArc 생성 — `frontend/src/components/map/shared/route-arc.tsx`:

```tsx
'use client';

import { Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Curve, Mesh, Vector3 } from 'three';
import { cityKey } from '@/lib/geo';
import { useUIStore } from '@/stores/ui-store';
import type { Route } from '@/types';

const DEFAULT_ROUTE_COLOR = '#9aa4b8';
const DOT_RADIUS = 0.008;

export function RouteArc({
  route,
  curve,
  phase,
}: {
  route: Route;
  curve: Curve<Vector3>;
  phase: number;
}) {
  const dotRef = useRef<Mesh>(null);
  const hoveredCityKey = useUIStore((s) => s.hoveredCityKey);

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
```

- [ ] Step 3: globe city-pins를 shared 사용으로 교체 — `frontend/src/components/map/globe/city-pins.tsx` 전체를 다음으로 교체:

```tsx
'use client';

import { useMemo } from 'react';
import { CityPin } from '@/components/map/shared/city-pin';
import { useCityMarkers } from '@/hooks/use-diary-data';
import {
  GLOBE_RADIUS,
  cityKey,
  declutterMarkers,
  latLngToVector3,
} from '@/lib/geo';
import { useUIStore } from '@/stores/ui-store';

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
        <CityPin
          key={cityKey(marker.city, marker.country)}
          marker={marker}
          position={latLngToVector3(
            marker.latitude,
            marker.longitude,
            GLOBE_RADIUS * 1.005,
          )}
        />
      ))}
    </>
  );
}
```

- [ ] Step 4: globe route-arcs를 shared 사용으로 교체 — `frontend/src/components/map/globe/route-arcs.tsx` 전체를 다음으로 교체:

```tsx
'use client';

import { useMemo } from 'react';
import { RouteArc } from '@/components/map/shared/route-arc';
import { useRoutes } from '@/hooks/use-diary-data';
import {
  GLOBE_RADIUS,
  buildArcCurve,
  cityKey,
  latLngToVector3,
} from '@/lib/geo';
import type { Route } from '@/types';

function GlobeRouteArc({ route, phase }: { route: Route; phase: number }) {
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

  return <RouteArc route={route} curve={curve} phase={phase} />;
}

export function RouteArcs() {
  const { data: routes } = useRoutes();
  if (!routes) return null;
  return (
    <>
      {routes.map((route, index) => (
        <GlobeRouteArc
          key={`${cityKey(route.from.city, route.from.country)}->${cityKey(route.to.city, route.to.country)}-${index}`}
          route={route}
          phase={index * 0.17}
        />
      ))}
    </>
  );
}
```

- [ ] Step 5: 검증 (리팩토링 회귀 확인)

```bash
npm test && npm run lint && npm run build
```

Expected: 모두 통과 (동작 변화 없는 순수 리팩토링)

- [ ] Step 6: Commit

```bash
git add src/components/map/shared src/components/map/globe/city-pins.tsx src/components/map/globe/route-arcs.tsx
git commit -m "refactor:핀과 경로를 공통 컴포넌트로 추출 (globe/map2d 공유)"
```

---

### Task 7: land fetch 공유 + LandMesh + Map2DScene + MapView 분기

**Files:**
- Create: `frontend/src/lib/land.ts`
- Modify: `frontend/src/components/map/globe/globe.tsx`
- Create: `frontend/src/components/map/map2d/land-mesh.tsx`
- Create: `frontend/src/components/map/map2d/map2d-scene.tsx`
- Modify: `frontend/src/components/map/map-view.tsx`

- [ ] Step 1: land fetch 함수 추출 — `frontend/src/lib/land.ts` 생성:

```ts
import type { Topology } from 'topojson-specification';

export async function fetchLandTopology(): Promise<Topology> {
  const response = await fetch('/land-110m.json');
  if (!response.ok) {
    throw new Error(`Failed to fetch land topology: ${response.status}`);
  }
  return response.json();
}
```

- [ ] Step 2: globe.tsx가 lib/land를 사용하도록 수정

`frontend/src/components/map/globe/globe.tsx`에서 로컬 `fetchLandTopology` 함수 정의(async function ~ 블록 전체)를 삭제하고 import로 교체:

```tsx
import { fetchLandTopology } from '@/lib/land';
```

(기존 `import type { GeometryCollection, Topology } from 'topojson-specification';`에서 `Topology`는 더 이상 직접 사용하지 않으면 `GeometryCollection`만 남긴다. 나머지 코드는 변경 없음.)

- [ ] Step 3: LandMesh 생성 — `frontend/src/components/map/map2d/land-mesh.tsx`:

```tsx
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
```

- [ ] Step 4: Map2DScene 생성 — `frontend/src/components/map/map2d/map2d-scene.tsx`:

```tsx
'use client';

import { Stars } from '@react-three/drei';
import { LandMesh } from '@/components/map/map2d/land-mesh';

export function Map2DScene() {
  return (
    <>
      <ambientLight intensity={1.2} />
      <directionalLight position={[2, -2, 4]} intensity={0.8} />
      <Stars radius={50} depth={20} count={1500} factor={2} fade speed={0.5} />
      <LandMesh />
    </>
  );
}
```

- [ ] Step 5: MapView에 map2d 분기 추가 — `frontend/src/components/map/map-view.tsx` 전체를 다음으로 교체:

```tsx
'use client';

import { Canvas } from '@react-three/fiber';
import { useEffect } from 'react';
import { CityDiaryModal } from '@/components/diary/city-diary-modal';
import { FloatingButtons } from '@/components/layout/floating-buttons';
import { GlobeScene } from '@/components/map/globe/globe-scene';
import { Map2DScene } from '@/components/map/map2d/map2d-scene';
import { useUIStore } from '@/stores/ui-store';

export function MapView() {
  const mapMode = useUIStore((s) => s.mapMode);

  useEffect(() => {
    void useUIStore.persist.rehydrate();
  }, []);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[radial-gradient(ellipse_at_center,_#0b1026_0%,_#04060f_70%)]">
      {mapMode === 'globe' && (
        <Canvas camera={{ position: [0, 0, 3], fov: 45 }}>
          <GlobeScene />
        </Canvas>
      )}
      {mapMode === 'map2d' && (
        <Canvas camera={{ position: [0, -0.8, 1.6], fov: 45 }}>
          <Map2DScene />
        </Canvas>
      )}
      <FloatingButtons />
      <CityDiaryModal />
    </div>
  );
}
```

- [ ] Step 6: 검증

```bash
npm test && npm run lint && npm run build
```

Expected: 모두 통과

- [ ] Step 7: Commit

```bash
git add src/lib/land.ts src/components/map/globe/globe.tsx src/components/map/map2d src/components/map/map-view.tsx
git commit -m "feat:2D 지도 대륙 extrude 렌더링 (바다 평면 + 돌출 대륙)"
```

---

### Task 8: 2D 지도 카메라 컨트롤

**Files:**
- Create: `frontend/src/components/map/map2d/map2d-camera-controls.tsx`
- Modify: `frontend/src/components/map/map2d/map2d-scene.tsx`

- [ ] Step 1: Map2DCameraControls 생성 — `frontend/src/components/map/map2d/map2d-camera-controls.tsx`:

```tsx
'use client';

import { CameraControls } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import CameraControlsImpl from 'camera-controls';
import { useEffect, useRef } from 'react';
import { Box3, Vector3 } from 'three';
import { useCityMarkers } from '@/hooks/use-diary-data';
import {
  MAP_HEIGHT,
  MAP_WIDTH,
  cityKey,
  latLngToPlaneVector3,
} from '@/lib/geo';
import { useUIStore } from '@/stores/ui-store';

const MIN_DISTANCE = 0.5;
const MAX_DISTANCE = 2.5;
// 카메라가 약간 기울어진 채로 회전이 고정되도록 polar/azimuth를 잠근다
const POLAR_ANGLE = Math.PI * 0.65;
const BOUNDARY = new Box3(
  new Vector3(-MAP_WIDTH / 2, -MAP_HEIGHT / 2, 0),
  new Vector3(MAP_WIDTH / 2, MAP_HEIGHT / 2, 0),
);

export function Map2DCameraControls() {
  const controlsRef = useRef<CameraControlsImpl | null>(null);
  const selectedCityKey = useUIStore((s) => s.selectedCityKey);
  const setCameraDistance = useUIStore((s) => s.setCameraDistance);
  const { data: cityMarkers } = useCityMarkers();

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    controls.mouseButtons.left = CameraControlsImpl.ACTION.TRUCK;
    controls.touches.one = CameraControlsImpl.ACTION.TOUCH_TRUCK;
    controls.setBoundary(BOUNDARY);
  }, []);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls || !selectedCityKey || !cityMarkers) return;
    const marker = cityMarkers.find(
      (m) => cityKey(m.city, m.country) === selectedCityKey,
    );
    if (!marker) return;
    const target = latLngToPlaneVector3(marker.latitude, marker.longitude);
    void controls.moveTo(target.x, target.y, 0, true);
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
      minPolarAngle={POLAR_ANGLE}
      maxPolarAngle={POLAR_ANGLE}
      minAzimuthAngle={0}
      maxAzimuthAngle={0}
    />
  );
}
```

- [ ] Step 2: Map2DScene에 추가 — `frontend/src/components/map/map2d/map2d-scene.tsx` 전체를 다음으로 교체:

```tsx
'use client';

import { Stars } from '@react-three/drei';
import { LandMesh } from '@/components/map/map2d/land-mesh';
import { Map2DCameraControls } from '@/components/map/map2d/map2d-camera-controls';

export function Map2DScene() {
  return (
    <>
      <ambientLight intensity={1.2} />
      <directionalLight position={[2, -2, 4]} intensity={0.8} />
      <Stars radius={50} depth={20} count={1500} factor={2} fade speed={0.5} />
      <LandMesh />
      <Map2DCameraControls />
    </>
  );
}
```

- [ ] Step 3: 검증

```bash
npm test && npm run lint && npm run build
```

Expected: 모두 통과

- [ ] Step 4: Commit

```bash
git add src/components/map/map2d
git commit -m "feat:2D 지도 카메라 컨트롤 (드래그 이동, 줌, 도시 포커스)"
```

---

### Task 9: 2D 지도 핀 + 경로

**Files:**
- Create: `frontend/src/components/map/map2d/map2d-city-pins.tsx`
- Create: `frontend/src/components/map/map2d/map2d-route-arcs.tsx`
- Modify: `frontend/src/components/map/map2d/map2d-scene.tsx`

- [ ] Step 1: Map2DCityPins 생성 — `frontend/src/components/map/map2d/map2d-city-pins.tsx`:

```tsx
'use client';

import { useMemo } from 'react';
import { CityPin } from '@/components/map/shared/city-pin';
import { useCityMarkers } from '@/hooks/use-diary-data';
import {
  LAND_DEPTH,
  cityKey,
  declutterMarkersPlane,
  latLngToPlaneVector3,
} from '@/lib/geo';
import { useUIStore } from '@/stores/ui-store';

const PIN_HEIGHT = LAND_DEPTH + 0.01;

export function Map2DCityPins() {
  const { data: cityMarkers } = useCityMarkers();
  const cameraDistance = useUIStore((s) => s.cameraDistance);
  const selectedCityKey = useUIStore((s) => s.selectedCityKey);

  const visibleMarkers = useMemo(() => {
    if (!cityMarkers) return [];
    return declutterMarkersPlane(cityMarkers, cameraDistance, selectedCityKey);
  }, [cityMarkers, cameraDistance, selectedCityKey]);

  return (
    <>
      {visibleMarkers.map((marker) => (
        <CityPin
          key={cityKey(marker.city, marker.country)}
          marker={marker}
          position={latLngToPlaneVector3(
            marker.latitude,
            marker.longitude,
            PIN_HEIGHT,
          )}
        />
      ))}
    </>
  );
}
```

- [ ] Step 2: Map2DRouteArcs 생성 — `frontend/src/components/map/map2d/map2d-route-arcs.tsx`:

```tsx
'use client';

import { useMemo } from 'react';
import { RouteArc } from '@/components/map/shared/route-arc';
import { useRoutes } from '@/hooks/use-diary-data';
import {
  LAND_DEPTH,
  buildPlaneArcCurve,
  cityKey,
  latLngToPlaneVector3,
} from '@/lib/geo';
import type { Route } from '@/types';

const ARC_BASE_HEIGHT = LAND_DEPTH + 0.005;

function PlaneRouteArc({ route, phase }: { route: Route; phase: number }) {
  const curve = useMemo(() => {
    const from = latLngToPlaneVector3(
      route.from.latitude,
      route.from.longitude,
      ARC_BASE_HEIGHT,
    );
    const to = latLngToPlaneVector3(
      route.to.latitude,
      route.to.longitude,
      ARC_BASE_HEIGHT,
    );
    return buildPlaneArcCurve(from, to);
  }, [route]);

  return <RouteArc route={route} curve={curve} phase={phase} />;
}

export function Map2DRouteArcs() {
  const { data: routes } = useRoutes();
  if (!routes) return null;
  return (
    <>
      {routes.map((route, index) => (
        <PlaneRouteArc
          key={`${cityKey(route.from.city, route.from.country)}->${cityKey(route.to.city, route.to.country)}-${index}`}
          route={route}
          phase={index * 0.17}
        />
      ))}
    </>
  );
}
```

- [ ] Step 3: Map2DScene에 추가 — `frontend/src/components/map/map2d/map2d-scene.tsx` 전체를 다음으로 교체:

```tsx
'use client';

import { Stars } from '@react-three/drei';
import { LandMesh } from '@/components/map/map2d/land-mesh';
import { Map2DCameraControls } from '@/components/map/map2d/map2d-camera-controls';
import { Map2DCityPins } from '@/components/map/map2d/map2d-city-pins';
import { Map2DRouteArcs } from '@/components/map/map2d/map2d-route-arcs';

export function Map2DScene() {
  return (
    <>
      <ambientLight intensity={1.2} />
      <directionalLight position={[2, -2, 4]} intensity={0.8} />
      <Stars radius={50} depth={20} count={1500} factor={2} fade speed={0.5} />
      <LandMesh />
      <Map2DRouteArcs />
      <Map2DCityPins />
      <Map2DCameraControls />
    </>
  );
}
```

- [ ] Step 4: 검증

```bash
npm test && npm run lint && npm run build
```

Expected: 모두 통과

- [ ] Step 5: Commit

```bash
git add src/components/map/map2d
git commit -m "feat:2D 지도 도시 핀과 경로 arc (공통 컴포넌트 사용)"
```

---

### Task 10: 모드 전환 버튼

**Files:**
- Modify: `frontend/src/components/layout/floating-buttons.tsx`

- [ ] Step 1: FloatingButtons에 모드 전환 추가 — `frontend/src/components/layout/floating-buttons.tsx` 전체를 다음으로 교체:

(주의: 기존에는 groups가 없으면 컴포넌트 전체가 null이었다 — 모드 전환 버튼은 그룹 유무와 무관하게 항상 보여야 하므로 그룹 필터 부분만 조건부로 바꾼다)

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
  const mapMode = useUIStore((s) => s.mapMode);
  const setMapMode = useUIStore((s) => s.setMapMode);

  const hasGroups = !!groups && groups.length > 0;

  const options: FilterOption[] = hasGroups
    ? [
        { id: null, name: '전체 보기', color: null },
        ...groups.map((g) => ({ id: g.id, name: g.name, color: g.color })),
        { id: 'ungrouped', name: '그룹 없음', color: null },
      ]
    : [];

  return (
    <div className="absolute bottom-6 right-6 z-10 flex flex-col items-end gap-2">
      {hasGroups && filterOpen && (
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
      {hasGroups && (
        <button
          type="button"
          onClick={() => setFilterOpen((open) => !open)}
          className="rounded-full border border-white/15 bg-neutral-900/80 px-4 py-2 text-sm text-white hover:bg-neutral-800"
        >
          그룹 필터
        </button>
      )}
      <button
        type="button"
        onClick={() => setMapMode(mapMode === 'globe' ? 'map2d' : 'globe')}
        className="rounded-full border border-white/15 bg-neutral-900/80 px-4 py-2 text-sm text-white hover:bg-neutral-800"
      >
        {mapMode === 'globe' ? '2D 지도' : '지구본'}
      </button>
    </div>
  );
}
```

- [ ] Step 2: 검증

```bash
npm test && npm run lint && npm run build
```

Expected: 모두 통과

- [ ] Step 3: Commit

```bash
git add src/components/layout/floating-buttons.tsx
git commit -m "feat:지구본-2D 지도 모드 전환 버튼"
```

---

### Task 11: 최종 검증 + 문서 갱신 + 푸시

**Files:**
- Modify: `frontend/CLAUDE.md`
- 수정 사항이 나오면 해당 파일

- [ ] Step 1: 전체 자동 검증

```bash
cd /Users/onomaai/Documents/workspace/tutorial/map-diary/frontend
npm test && npm run lint && npm run build
```

Expected: 모두 통과

- [ ] Step 2: 스펙 §9 "2D Map PoC 성공 기준" + 모드 전환 구동 검증 (컨트롤러가 Playwright로 수행)

- [ ] 평면 세계 지도가 렌더링된다 (extrude 대륙 + 바다 평면)
- [ ] 사용자가 지도를 이동(드래그)할 수 있다
- [ ] 사용자가 줌인/줌아웃할 수 있다
- [ ] 동일한 mock-data.json 사용 — 도시 핀과 이동 경로 표시
- [ ] 도시 클릭 시 해당 위치로 카메라 애니메이션 이동 + 일기 목록 모달
- [ ] 경로를 따라 작은 빛 점이 이동한다
- [ ] 줌 레벨에 따라 핀 밀도가 자동 조절된다
- [ ] 그룹 필터가 동일하게 동작한다
- [ ] 모드 전환 버튼으로 지구본 ↔ 2D 지도 전환된다
- [ ] 새로고침 후 마지막 모드가 유지된다 (localStorage `map-diary-ui`)
- [ ] globe 모드 회귀 없음 (지구본/핀/경로/모달 정상)

- [ ] Step 3: 발견된 문제 수정 후 커밋 (있다면) — 문제별 `fix:` 커밋

- [ ] Step 4: frontend/CLAUDE.md 디렉토리 구조 갱신

`frontend/CLAUDE.md`의 "디렉토리 구조" 코드 블록에서 `components/` 부분을 다음으로 교체:

```
├── components/
│   ├── ui/           # shadcn/ui 컴포넌트
│   ├── map/          # MapView + shared/(공통 핀·경로) + globe/ + map2d/
│   ├── diary/        # 일기 관련 컴포넌트 (도시 일기 목록 모달)
│   └── layout/       # 레이아웃 컴포넌트 (플로팅 버튼)
```

- [ ] Step 5: Commit + Push

```bash
git add frontend/CLAUDE.md
git commit -m "docs:frontend CLAUDE.md Phase 3 디렉토리 구조 반영"
git push origin feat/map2d-poc
```

main 머지는 하지 않는다 (사용자 지시).
