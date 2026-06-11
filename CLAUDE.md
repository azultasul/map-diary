# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> 본 문서의 안내는 한국어로 작성되어 있습니다.

## 프로젝트 현황

이 저장소는 **구현 전(그린필드) 단계**입니다. 아직 코드가 없습니다 — `frontend/`와 `backend/`는 비어 있고, `package.json`도 없으며, git 저장소로 초기화되어 있지도 않습니다. 신뢰할 수 있는 기준은 `docs/`의 스펙 문서입니다.

- `docs/PRD_v1.md` — 제품 요구사항: 범위, 사용자 플로우, ERD, 기술 스택, 단계별 개발 계획.
- `docs/Map_Visual_Spec_v0.1.md` — 지도 UI/UX 스펙: 비주얼 방향, 지구본/2D 동작, 데이터 표시 규칙, 구현 우선순위.

코드를 작성하기 전에 두 문서를 모두 읽으세요. 스캐폴딩을 할 때는 임의로 다른 구성을 만들지 말고 아래의 의도된 스택과 단계 순서를 따르세요.

## 서비스 개요

**Map Diary** — 여행 일기를 세계 지도 위의 핀으로 시각화하는 개인 여행 일기 서비스. 일기는 도시 단위로 작성되고, 지도는 이를 핀과 도시 간 이동 경로로 렌더링한다. 두 가지 렌더링 모드(3D 지구본 / 평면 2D 지도)가 **동일한 데이터를 공유**하며, 사용자가 마지막으로 선택한 모드가 저장된다.

## 의도된 기술 스택 (PRD §10)

- **프레임워크**: Next.js (App Router) + TypeScript
- **UI**: Tailwind CSS + shadcn/ui, 애니메이션은 Framer Motion
- **상태 관리**: TanStack Query(서버 상태) + Zustand(클라이언트/UI 상태)
- **지도**: Three.js + React Three Fiber + Drei, 좌표/데이터 보조용으로 MapLibre GL
- **폼/검증**: React Hook Form + Zod
- **백엔드(후순위)**: Supabase (DB + Storage) — Phase 6 전까지는 도입하지 않음

## 핵심 아키텍처 개념: 모든 것은 `diaries`에서 파생된다

두 스펙 문서를 관통하는 가장 중요한 규칙: **도시 핀과 경로는 저장하지 않는다 — `diaries` 목록으로부터 계산한다.** 3D 지구본과 2D 지도는 *같은* 파생 데이터를 소비한다. 구현 시 순수 변환 함수 두 개를 만들어 두 모드에서 재사용하라.

- **`diaries → cityMarkers`**: 일기를 `(city, country)` 기준으로 그룹화한다. 같은 도시에 여러 일기가 있어도 **핀은 도시당 하나만** 만들고, 핀에 `diaryCount`를 노출한다. 핀 색상은 일기의 그룹 색상을 사용한다.
- **`diaries → routes`**: 일기를 `created_at` 오름차순으로 정렬한 뒤 연속한 도시를 잇는다. **연속한 동일 도시는 합친다** — `Tokyo → Tokyo → Osaka`는 두 구간이 아니라 `Tokyo → Osaka` 하나의 경로가 된다.

**그룹 필터**가 유일한 변형 지점이다: 그룹이 선택되면 *먼저* `diaries`를 `groupId`로 필터링한 다음, 두 변환을 다시 실행한다. 이미 만들어진 핀/경로를 사후에 거르지 말고, 필터링된 일기에서 재계산하라.

비주얼 스펙의 구현 우선순위(§10)도 이를 명시한다: 목 데이터 연결 → 두 변환 함수 작성 → *그다음* 렌더링. 변환 함수는 프레임워크에 의존하지 않게(Three.js/React 타입 없이) 유지하여 3D·2D 렌더러가 얇은 소비자가 되도록 하라.

## 데이터 모델 (ERD 초안, PRD §7)

핵심 엔티티: `users`, `groups`, `diaries`, `diary_images`(일기당 0~2장, `order_index`), `diary_shared_users`.

- 일기는 `continent`, `country`, `city`, `latitude`, `longitude`, `visited_date`, `title`, `content`, `group_id`, `visibility`를 저장한다.
- **저장 시 자동 생성**: `continent`, `latitude`, `longitude`는 입력한 국가/도시로부터 생성된다(사용자가 직접 입력하지 않음). `continent`는 전체 일기 목록의 대륙 필터를 위해 존재한다.
- `visibility` enum: `private` | `shared` | `friends` | `public`. MVP에서는 `private`/`shared`만 의미가 있고, `friends`/`public`은 향후 기능(공유 기능 자체가 비MVP, PRD §9).
- `diaries.group_id`는 **nullable** — 그룹 없이 일기를 작성할 수 있다. "그룹 없음"으로 필터에 노출한다.
- `users.map_mode`는 마지막으로 선택한 지도 모드(3D vs 2D)를 저장한다.

## 개발 순서 (PRD §11) — 단계를 지킬 것

초기 단계는 의도적으로 백엔드를 두지 않는다. **Supabase를 일찍 끌어오지 말 것.**

1. **Phase 1** — 로컬 목 JSON만 사용 (`users.json`, `groups.json`, 도시 좌표가 포함된 `diaries.json`. 비주얼 스펙은 통합 파일을 `mock-data.json`이라 부른다). 모든 핀/경로는 여기서 파생된다.
2. **Phase 2** — 3D 지구본 PoC: **메인 화면 레이아웃 안에서** 지구본 렌더링, 회전/줌 컨트롤, 도시 핀, 경로 arc, 도시 클릭 → 일기 목록 모달, 그룹 필터.
3. **Phase 3** — 2D 지도 PoC: Three.js 평면 지도가 *동일한* 목 데이터와 *동일한* 변환을 재사용. 메인 화면 내 모드 전환으로 구현.
4. **Phase 4** — 메인 화면 완성: 지도 모드 전환 완성, 그룹 필터, 플로팅 버튼, 모달 시스템, 다크/라이트 테마.
5. **Phase 5** — 일기 CRUD.
6. **Phase 6** — 목 JSON을 Supabase(DB + Storage)로 교체.
7. **Phase 7** — Google OAuth + 사용자 설정 저장.
8. **Phase 8** — 배포.

PoC 성공 기준은 비주얼 스펙 §9에 열거되어 있다 — Phase 2~3의 수용 기준 체크리스트로 사용하라.

## UI 방향 (비주얼 스펙 §2~7)

다크 모드 우선, 미니멀, "공간감 있는 / 항공 경로" 느낌. 지구본과 2D 지도는 위성처럼 사실적이지 않고 추상화된 어두운 표면이며, 핀과 경로가 밝게 강조되는 요소(그룹 색상 + 은은한 glow)다. 도시 간 경로는 `visitedDate` 순서로 정렬된 곡선 arc로 표시한다. 플로팅 버튼(일기 추가, 전체 일기 목록, 지도 모드 변경, 그룹 필터)은 우측 하단에 glassmorphism 스타일로 배치하며, 사용자에게 그룹이 없으면 그룹 필터 버튼을 숨기거나 비활성화한다. 모달은 어두운 반투명 카드 레이아웃을 사용하고, 모바일에서는 도시/일기 모달이 바텀시트가 된다.

## 상태 관리 경계

- **Zustand**: 지도 모드, 선택된 그룹 필터, 카메라 위치/줌, 모달 상태, 테마(다크/라이트)
- **TanStack Query**: diaries, groups, users 데이터. Phase 1~5에서도 목 JSON을 `queryFn`으로 감싸서 사용 → Phase 6에서 `queryFn`만 교체.

## 테마

- **다크 모드 기본**, 라이트 모드 지원. 테마 전환은 Zustand로 관리하고 로컬 저장.

## 반응형

- 데스크탑 퍼스트. Tailwind 기본 브레이크포인트 사용 (`sm` 640 / `md` 768 / `lg` 1024 / `xl` 1280 / `2xl` 1536).
- 주요 분기: 모바일 < 768px, 태블릿 768~1279px, 데스크탑 ≥ 1280px.

## Git 컨벤션

### 커밋 메시지

`type:메시지` 형식을 따른다. 콜론 뒤에 공백 없이 바로 메시지를 작성한다.

| type | 용도 |
|------|------|
| `feat` | 새로운 기능 |
| `fix` | 버그 수정 |
| `docs` | 문서 변경 |
| `style` | 코드 포맷팅 (동작 변경 없음) |
| `refactor` | 리팩토링 (기능 변경 없음) |
| `test` | 테스트 추가/수정 |
| `chore` | 빌드, 설정, 의존성 등 |

예시: `feat:3D 지구본 렌더링`, `fix:핀 클릭 이벤트 누락`

### 브랜치

`type/브랜치명` 형식을 따른다. 브랜치명은 영문 kebab-case로 작성한다.

| type | 용도 |
|------|------|
| `feat` | 기능 개발 |
| `fix` | 버그 수정 |
| `docs` | 문서 작업 |
| `refactor` | 리팩토링 |
| `chore` | 설정/환경 |

예시: `feat/globe-rendering`, `fix/pin-click-event`

기본 브랜치는 `main`이다. 작업 시 `main`에서 브랜치를 생성하고, 완료 후 `main`으로 머지한다.

## 코드 컨벤션

- 스펙 문서는 한국어로 작성되어 있다. 코드에서는 ERD의 도메인 용어를 그대로 사용하라(`diaries`, `groups`, `cityMarkers`, `routes`, `createdAt`, `groupId`).

### 명령어

Frontend (`frontend/` 디렉토리에서 실행):

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 (Turbopack) |
| `npm run build` | 프로덕션 빌드 |
| `npm run lint` | ESLint 실행 |
| `npm run format` | Prettier 포맷팅 |

Backend (`backend/` 디렉토리에서 실행):

| 명령어 | 설명 |
|--------|------|
| `uv run uvicorn app.main:app --reload` | 개발 서버 |
| `uv run pytest -v` | 테스트 실행 |
| `uv run ruff check .` | 린트 실행 |
| `uv run ruff format .` | 포맷팅 |
