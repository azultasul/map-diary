# Phase 3: 2D 지도 PoC 설계

## 목표

메인 화면 내 모드 전환으로 Three.js 기반 입체형 2D 지도를 구현한다. Map_Visual_Spec §9의 "2D Map PoC 성공 기준" 전체를 충족한다.

- 평면 세계 지도 렌더링 (드래그 이동, 줌인/줌아웃)
- 동일한 mock-data.json 사용, 도시 핀과 이동 경로 표시
- 도시 클릭 시 해당 위치로 카메라 애니메이션 이동 + 일기 목록 모달
- 경로를 따라 작은 빛 점 이동 애니메이션
- 줌 레벨에 따른 핀 밀도 자동 조절
- 그룹 필터 동일 동작

추가로 PRD Phase 3의 "메인 화면 내 모드 전환"을 구현한다: 플로팅 버튼에 지구본 ↔ 2D 지도 전환 버튼을 추가하고, 마지막 선택 모드를 localStorage에 저장한다(스펙 §2, Phase 6에서 users.map_mode 서버 저장으로 전환).

## 범위 제외 (후속 Phase)

- 지도 가장자리 fade 처리 (스펙 §4 "가능" 항목 — YAGNI)
- glassmorphism, 반응형 모달, 라이트 테마 (Phase 4)
- 줌 레벨별 국가/도시 단위 탐색 구분 (스펙 §4 "줌 레벨에 따른 동작"은 자유 줌으로 충족)

## 접근 방식

Phase 2와 동일하게 R3F 직접 구현. 입체감은 대륙 extrude로 표현한다 (스펙 §4 "대륙은 낮은 높이의 extrude 또는 얇은 면" 중 extrude 선택).

## 투영과 좌표

equirectangular 투영. 평면 크기 4×2, 지도는 XY 평면, +Z가 높이.

- `latLngToPlaneVector3(lat, lng, z): Vector3` — x = lng/180×2, y = lat/90×1, z는 높이
- `lib/geo.ts`에 순수 함수로 추가, Vitest 테스트

상수: `MAP_WIDTH = 4`, `MAP_HEIGHT = 2`, `LAND_DEPTH = 0.02` (extrude 높이).

## 대륙 extrude

- land-110m TopoJSON에서 `feature()`로 MultiPolygon 추출 (기존 `mesh()`는 globe 라인용으로 유지)
- `geoPolygonsToShapes(multiPolygonCoords): Shape[]` 순수 함수 — 폴리곤별 외곽 링을 `THREE.Shape`로, 내부 링(구멍)을 `Shape.holes`에 추가. 좌표는 latLngToPlaneVector3의 x/y와 동일한 투영 사용
- `ExtrudeGeometry({ depth: LAND_DEPTH, bevelEnabled: false })` + 다크 네이비 머티리얼
- 바다: 지도 크기의 어두운 바닥 평면(plane) 하나
- 배경: globe와 동일한 그라데이션 + Stars 톤 유지

## 핀·경로 공통화 (Phase 2 리팩토링 포함)

핀의 호버/클릭/pulse/툴팁과 경로의 라인/빛 점/강조 로직은 globe와 동일하고 위치 계산만 다르다. 복붙 대신 공통 컴포넌트로 추출한다.

- `components/map/shared/city-pin.tsx` — `marker`와 `position: Vector3`를 props로 받는 공통 CityPin. 기존 globe `city-pins.tsx`의 CityPin에서 추출 (호버 cleanup, glow raycast 제외 로직 포함 그대로)
- `components/map/shared/route-arc.tsx` — `route`, `curve`, `phase`를 props로 받는 공통 RouteArc (drei Line + moving dot + hoveredCityKey 강조)
- globe의 `city-pins.tsx`/`route-arcs.tsx`는 구면 위치/곡선 계산 후 공통 컴포넌트 사용으로 변경. 동작 변화 없음 — 리팩토링 후 globe를 다시 구동 검증
- map2d의 `map2d-city-pins.tsx`/`map2d-route-arcs.tsx`는 평면 위치/곡선 계산 후 동일 공통 컴포넌트 사용

### 2D 경로 곡선

`buildPlaneArcCurve(from, to): QuadraticBezierCurve3` — 제어점은 두 점의 중간에서 +Z로 거리 비례만큼 띄움 (예: z = 0.05 + distance × 0.15). 베지어 곡선은 제어점들의 볼록 껍질 안에 있으므로 평면 아래로 파고들 수 없다. `lib/geo.ts` 순수 함수 + 테스트.

## 핀 밀도 조절 일반화

`declutterMarkers`의 greedy 코어를 분리해 거리 함수를 주입받게 한다.

- 코어: `declutterByDistance(markers, threshold, selectedCityKey, toVector3, distanceFn)` (비공개 또는 export)
- 구면 래퍼: 기존 `declutterMarkers(markers, cameraDistance, selectedCityKey)` 시그니처·동작·테스트 유지 (각거리)
- 평면 래퍼: `declutterMarkersPlane(markers, cameraDistance, selectedCityKey)` — 유클리드 거리, 임계값은 평면 스케일에 맞게 조정 (테스트로 고정)

## 카메라 (2D 모드)

`map2d-camera-controls.tsx` — CameraControls 재사용:

- 좌클릭 드래그 = truck(이동), 휠 = dolly(줌), 회전 비활성 (mouseButtons 설정)
- 초기 카메라는 약간 기울어진 각도(예: 위치 (0, -0.8, 1.6), lookAt 원점)로 입체감 부여
- `setBoundary`로 지도 밖 이동 제한, minDistance/maxDistance 줌 제한
- 도시 클릭(selectedCityKey 변경) 시 해당 평면 좌표로 `moveTo` 애니메이션
- 매 프레임 `controls.distance`를 0.1 양자화해 `cameraDistance`에 반영 (globe와 동일 패턴) → 핀 밀도

## 모드 전환 + 저장

- `floating-buttons.tsx`에 모드 전환 버튼 추가: 현재 모드에 따라 "2D 지도" / "지구본" 라벨 토글 → `setMapMode`
- `map-view.tsx`: `mapMode === 'map2d'`이면 별도 Canvas + `Map2DScene` (globe 분기와 대칭). 모드별 카메라 초기값이 다르므로 Canvas를 모드별로 분리
- `ui-store.ts`: zustand `persist` 미들웨어 적용, `partialize`로 `mapMode`만 localStorage(키 `map-diary-ui`) 저장. 나머지 상태는 비저장 유지
- 모달/그룹 필터는 Canvas 밖 DOM이라 변경 없이 양 모드에서 동작

## 컴포넌트 구조

```
components/map/
├── map-view.tsx              # 수정: map2d 분기 추가
├── shared/                   # 신규
│   ├── city-pin.tsx          # 공통 핀 (position prop)
│   └── route-arc.tsx         # 공통 경로 (curve prop)
├── globe/                    # 핀/arc는 shared 사용하도록 리팩토링
│   ├── globe-scene.tsx
│   ├── globe.tsx
│   ├── city-pins.tsx
│   ├── route-arcs.tsx
│   └── globe-camera-controls.tsx
└── map2d/                    # 신규
    ├── map2d-scene.tsx       # 조명 + Stars + LandMesh + 핀/경로 + 카메라
    ├── land-mesh.tsx         # 바닥 평면 + extrude 대륙
    ├── map2d-city-pins.tsx
    ├── map2d-route-arcs.tsx
    └── map2d-camera-controls.tsx
```

## 데이터 흐름

Phase 1~2 인프라 그대로: `useCityMarkers`/`useRoutes`(그룹 필터 내장), `useDiaries`/`useGroups`, ui-store(`selectedCityKey`, `hoveredCityKey`, `cameraDistance`, `selectedGroupId`, `mapMode`). 새 데이터 레이어 없음.

## 테스트 전략

순수 함수만 Vitest (`tests/lib/geo.test.ts`에 추가):

- `latLngToPlaneVector3`: (0,0)→원점, (90,180)→(2,1), 음수 좌표, z 보존
- `buildPlaneArcCurve`: 시작/끝점 일치, 제어점 z > 끝점 z, 거리 비례 높이
- `geoPolygonsToShapes`: 단일 폴리곤→Shape 1개, 구멍 있는 폴리곤→holes 포함, MultiPolygon 개수
- `declutterMarkersPlane`: 줌인 전체 유지 / 줌아웃 병합 / 선택 핀 유지 (globe 테스트와 대칭)
- 기존 globe declutter 테스트는 변경 없이 통과해야 함 (리팩토링 회귀 검증)

렌더링·인터랙션은 스펙 §9 "2D Map PoC" 체크리스트 수동 검증 + Playwright 구동 검증 (모드 전환 → 2D 지도 → 핀 클릭 → 모달, localStorage 저장 확인).

## 완료 기준

Map_Visual_Spec §9 "2D Map PoC" 체크리스트 전 항목 + 모드 전환/저장 동작 + globe 회귀 없음 + `npm run build`, `npm test`, `npm run lint` 통과.

## Git

브랜치 `feat/map2d-poc` (feat/globe-poc에서 분기). 커밋·푸시만 하고 main 머지는 보류.
