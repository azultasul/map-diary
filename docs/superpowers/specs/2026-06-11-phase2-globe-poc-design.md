# Phase 2: 3D 지구본 PoC 설계

## 목표

메인 화면 레이아웃 안에서 3D 지구본 PoC를 구현한다. Map_Visual_Spec §9의 "3D Globe PoC 성공 기준" 전체를 충족한다.

- 지구본 렌더링, 회전, 줌인/줌아웃
- mock-data.json의 도시가 핀으로 표시
- 도시 핀 클릭 → 도시명 출력, 카메라 애니메이션 이동, 일기 목록 모달
- created_at 기준 도시 간 경로 arc 표시
- 경로를 따라 작은 빛 점이 이동하는 애니메이션
- 줌 레벨에 따른 핀 밀도 자동 조절
- 그룹 필터 적용 시 해당 그룹 데이터만 표시

별도 PoC 페이지를 만들지 않고 메인 화면(`app/page.tsx`) 안에서 구현한다 (PRD §11 Phase 2 주석).

## 범위 제외 (후속 Phase)

- 2D 지도 모드 (Phase 3) — 단, `mapMode` 분기 구조는 이번에 마련
- glassmorphism 스타일, 반응형 모달(팝오버/바텀시트), 라이트 테마 (Phase 4)
- 일기 상세 모달, 일기 CRUD (Phase 4~5)

이번 Phase의 UI는 기능 위주 심플 버전으로 만든다. 일기 목록은 중앙 모달 하나, 그룹 필터는 심플한 플로팅 버튼.

## 접근 방식

R3F 직접 구현. three-globe / react-globe.gl 같은 지구본 라이브러리를 쓰지 않고, 이미 설치된 Three.js + React Three Fiber + Drei 스택으로 구체·대륙 라인·arc를 직접 만든다.

- 스펙의 추상화된 다크 스타일을 자유롭게 제어 가능
- Phase 3 (Three.js 기반 2D 지도)와 코드·경험 공유
- 의존성 추가는 topojson-client 하나 (+ 대륙 TopoJSON 정적 파일)

## 컴포넌트 구조

```
src/
├── app/page.tsx                          # MapView 마운트
├── components/
│   ├── map/
│   │   ├── map-view.tsx                  # 'use client', mapMode 분기, Canvas + UI 오버레이
│   │   └── globe/
│   │       ├── globe-scene.tsx           # R3F 씬 구성 (조명, 배경, 하위 컴포넌트)
│   │       ├── globe.tsx                 # 구체 + 대륙 윤곽 라인
│   │       ├── city-pins.tsx             # 핀 렌더링 (호버/선택/밀도 조절)
│   │       ├── route-arcs.tsx            # 경로 arc + 빛 점 애니메이션
│   │       └── globe-camera-controls.tsx # CameraControls 래핑 + 도시 포커스 이동
│   ├── layout/
│   │   └── floating-buttons.tsx          # 그룹 필터 심플 버전
│   └── diary/
│       └── city-diary-modal.tsx          # 도시 일기 목록 중앙 모달
└── lib/
    └── geo.ts                            # 좌표/arc/밀도 순수 함수
```

## 데이터 흐름

Phase 1 인프라를 그대로 소비한다. 새 데이터 레이어를 만들지 않는다.

- `useCityMarkers()` → CityPins (그룹 필터 이미 내장)
- `useRoutes()` → RouteArcs (그룹 필터 이미 내장)
- `useGroups()` → FloatingButtons 그룹 필터 목록
- `useDiaries()` → CityDiaryModal 일기 리스트 (selectedCityKey의 diaryIds로 조회)

상태는 ui-store를 그대로 사용한다.

- `selectedGroupId` — 그룹 필터. 플로팅 버튼에서 변경 → 훅들이 재계산
- `selectedCityKey` (`${city}-${country}`) — 핀 클릭 시 설정 → 카메라 포커스 이동 + 모달 열림. 모달 닫으면 null

## 지구본 렌더링

### 구체와 배경

- SphereGeometry 반지름 1, 다크 네이비 계열 머티리얼 (스펙 §3 "어두운 네이비 또는 블랙 계열 구체")
- 배경: 어두운 그라데이션 + drei Stars를 은은하게 (별 수·밝기 낮게)
- 테마: Phase 2는 다크 모드만

### 대륙 윤곽

- world-atlas의 land-110m TopoJSON을 `frontend/public/land-110m.json`으로 커밋
- topojson-client로 GeoJSON 변환 후, 폴리곤 링 좌표를 구면 위 점으로 변환해 라인으로 렌더 (스펙 §3 "육지 윤곽만 표시해도 충분")
- 라인 색상은 은은한 톤 (배경 구체보다 약간 밝게)

### 좌표 변환

`lib/geo.ts`에 순수 함수로 작성한다. Three.js 타입은 의존하되 React에는 비의존.

- `latLngToVector3(lat, lng, radius): Vector3` — 위경도 → 구면 좌표

## 도시 핀

- 구면 위 `latLngToVector3` 위치에 작은 원형 점 + additive glow
- 색상: `groupColor ?? 기본 화이트` (전체 보기에서 그룹 섞인 도시는 화이트)
- 호버: 크기 확대 + drei Html 툴팁(도시명, diaryCount) + 해당 도시와 연결된 경로 강조
- 선택: pulse 애니메이션 (useFrame에서 scale을 sin 곡선으로)
- 클릭: `setSelectedCityKey` 호출 (카메라 이동 + 모달은 상태 구독으로 연동)

### 핀 밀도 자동 조절

`declutterMarkers(markers, cameraDistance): CityMarker[]` 순수 함수.

- 카메라 거리(줌 레벨)에 비례한 각도 임계값을 정한다
- 임계값 이내로 모인 핀들 중 diaryCount가 가장 큰 핀만 남긴다 (greedy)
- 줌인하면 임계값이 줄어 숨었던 핀이 다시 나타난다
- 선택된 도시의 핀은 항상 표시한다

## 경로 arc

- from/to를 Vector3로 변환, 두 점의 중간 방향 벡터를 거리에 비례해 바깥으로 띄운 제어점으로 QuadraticBezierCurve3 생성
- arc 높이 계산도 `lib/geo.ts` 순수 함수로 분리 (`buildArcPoints` 또는 동등 함수)
- 라인 색상: `groupColor ?? 화이트/그레이` (스펙 §3 "그룹 없는 경로는 기본 색상")
- 빛 점: useFrame에서 시간 기반 t를 진행시키며 `curve.getPoint(t)` 위치에 작은 발광 점을 이동시킨다. 경로마다 위상을 어긋나게 해 단조로움을 피한다

## 카메라와 인터랙션

- drei CameraControls 사용
  - 회전·줌 + 관성(smoothTime 기반 부드러운 감속)
  - minDistance/maxDistance로 줌 레벨 제한
- 도시 포커스: `selectedCityKey` 변경 감지 → 해당 도시 lat/lng가 카메라 정면에 오도록 `rotateTo` 애니메이션 (필요 시 dolly 조합)
- 핀 클릭 시 도시명 출력은 툴팁/모달 표기로 충족

## 도시 일기 목록 모달

`selectedCityKey`가 있으면 중앙 모달로 표시. 심플 버전.

내용 (스펙 §7 기준):

- 도시명, 국가, 일기 개수
- 일기 리스트: 제목, 날짜(visitedDate), 그룹명

닫기 버튼 또는 바깥 클릭으로 닫힘 → `selectedCityKey = null`.

## 플로팅 버튼 (심플 버전)

우측 하단 고정. Phase 2에서는 그룹 필터만 동작하면 된다.

- 그룹 필터 버튼: 클릭 시 그룹 목록(전체 보기 / 각 그룹 / 그룹 없음) 표시, 선택 시 `setSelectedGroupId`
- 그룹 색상 점을 항목 옆에 표시
- 일기 추가·전체 목록·모드 전환 버튼은 자리만 잡거나 생략 (Phase 4~5)

## 의존성 추가

- `topojson-client` (+ `@types/topojson-client`)
- `frontend/public/land-110m.json` — world-atlas 110m land 데이터 정적 커밋

## 테스트 전략

순수 함수만 Vitest로 테스트한다 (`tests/lib/geo.test.ts`).

- `latLngToVector3`: 적도/극점/본초자오선 등 알려진 좌표의 변환 결과
- arc 제어점/높이 계산: 가까운 도시 vs 대륙 간 거리에서 높이 비례 확인
- `declutterMarkers`: 가까운 핀 병합, diaryCount 우선, 줌인 시 복원, 선택 핀 유지

Three.js 렌더링·인터랙션은 스펙 §9 성공 기준 체크리스트로 수동 검증한다.

## 완료 기준

Map_Visual_Spec §9 "3D Globe PoC" 체크리스트 전 항목 + `npm run build`, `npm test`, `npm run lint` 통과.
