# Phase 4 — 메인 화면 완성 설계

작성일: 2026-06-12
브랜치: `feat/phase4-main-screen` (`fix/map2d-visual`에서 분기)

## 배경

Phase 1~3에서 지도 렌더링(3D 지구본 / 2D 지도)·핀·경로·그룹필터·도시 모달의 기본 동작은 완성됐다. Phase 4의 목표는 지도 위에 얹히는 UI 크롬(플로팅 버튼, 모달, 테마, 반응형)을 `docs/Map_Visual_Spec_v0.1.md` §5~7, §11 수준으로 폴리싱하는 것이다.

해결한 미완성 항목:
- 플로팅 버튼 2종 누락(일기 추가, 전체 일기 목록), 테마 토글 없음
- 모달이 커스텀 DOM이라 Esc 닫기·모바일 바텀시트·접근성 미지원
- 라이트 모드 CSS 변수는 있으나 UI 크롬이 다크색 하드코딩이라 전환 안 됨, 토글 UI 없음
- 도시 클릭 시 회전/이동만 하고 dolly(줌인)가 없어 포커스감이 약함
- 목 데이터가 구버전(20 diaries) → 신규 62 diaries로 교체

## 스코프 경계

- 포함: UI 크롬의 테마 반응 + 라이트 모드 토글, shadcn(Base UI) 기반 반응형 모달, dolly 포커스, 목데이터 교체.
- 제외(후속 visual 브랜치): 3D 지구본/2D 지도 내부 머티리얼·텍스처의 라이트 모드 리컬러링. 라이트 모드에서 캔버스 배경 그라데이션만 밝게 적응시키고 3D 씬 색은 다크 톤 유지.

## 결정 사항

| 항목 | 결정 |
|------|------|
| 범위 | 전체 폴리싱 |
| 모달 | shadcn/ui(Base UI) Dialog + Sheet 도입 |
| 일기 추가 버튼 | 버튼 + 비활성 폼 골격 모달 (실제 CRUD는 Phase 5) |
| 목 데이터 | 신규 62 diaries로 교체, groups를 7개 여행 단위로 재작성 |

## 데이터: groups 재정의

신규 diaries는 7개 여행 그룹(모두 groupId 보유, null 없음)·24 도시·서울 허브 구조.

| groupId | name | color |
|---|---|---|
| `2023_osaka` | 오사카 여행 | `#FF6B9A` |
| `2023_mongolia` | 몽골 여행 | `#4DD6B6` |
| `2024_australia` | 호주 여행 | `#FFB347` |
| `2024_spain` | 스페인 여행 | `#7C8CFF` |
| `2024_taipei` | 타이베이 여행 | `#5BC0EB` |
| `2024_bangkok` | 방콕 여행 | `#C792EA` |
| `2025_fukuoka` | 후쿠오카 여행 | `#FFD166` |

`group_id = null` diary가 없으므로 "그룹 없음" 필터는 데이터 기반으로 자동 미노출.

## 컴포넌트 구조

- `hooks/use-media-query.ts` — SSR-safe 미디어 쿼리 훅
- `components/ui/responsive-modal.tsx` — ≥768px Dialog(중앙) / 그 미만 Sheet(바텀시트) 래퍼. Esc·바깥클릭·포커스 트랩은 Base UI 기본 제공
- `components/layout/theme-toggle.tsx` — next-themes 단일 출처 토글(mounted 가드)
- `components/layout/floating-buttons.tsx` — 일기추가·전체목록·모드전환·그룹필터(DropdownMenu)+테마토글. 시맨틱 토큰 glassmorphism, 터치 타겟 44px, 데스크탑 우하단 세로 / 모바일 하단 가로
- `components/diary/city-diary-modal.tsx` — ResponsiveModal 기반 재작성
- `components/diary/all-diaries-modal.tsx` — 전체 일기 목록(createdAt ASC), 항목 클릭 시 해당 도시 포커스
- `components/diary/diary-form-modal.tsx` — 비활성 폼 골격(Phase 5 예정)

## 상태 관리

`stores/ui-store.ts`: 중복된 Zustand `theme` 제거(테마 단일 출처는 next-themes), `allDiariesOpen`·`diaryFormOpen` 추가.

## 카메라 dolly 포커스

도시 선택 시 회전/이동과 함께 줌인. 기존 완료 신호(`setCenteredCityKey`)는 두 애니메이션이 모두 끝난 뒤 발화하도록 `Promise.all`로 결합.
- 지구본: `rotateTo` + `dollyTo(min(현재, 1.8))`
- 2D: `moveTo` + `dollyTo(min(현재, 1.2))`. 줌인 거리 기준으로 `clampTargetY` 재계산.

## 검증

- `npm run lint` 통과, `npm test` 45 passed, `npm run build` 성공
- dev 서버 200, `/mock-data.json` 7 groups·62 diaries·1 user, 런타임 에러 없음
- 수동 시각 확인 권장: 테마 토글 전환, 모달 Esc/바깥클릭/바텀시트, dolly 줌인
