# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> 본 문서의 안내는 한국어로 작성되어 있습니다.
> frontend/, backend/ 각각의 CLAUDE.md에 해당 영역의 세부 가이드가 있다.

## 프로젝트 현황

초기 세팅 완료. Phase 1(목 데이터 구성)부터 시작.

- `docs/PRD_v1.md` — 제품 요구사항: 범위, 사용자 플로우, ERD, 기술 스택, 단계별 개발 계획.
- `docs/Map_Visual_Spec_v0.1.md` — 지도 UI/UX 스펙: 비주얼 방향, 지구본/2D 동작, 데이터 표시 규칙, 구현 우선순위.

코드를 작성하기 전에 두 문서를 모두 읽으세요.

## 서비스 개요

**Map Diary** — 여행 일기를 세계 지도 위의 핀으로 시각화하는 개인 여행 일기 서비스. 일기는 도시 단위로 작성되고, 지도는 이를 핀과 도시 간 이동 경로로 렌더링한다. 두 가지 렌더링 모드(3D 지구본 / 평면 2D 지도)가 동일한 데이터를 공유하며, 사용자가 마지막으로 선택한 모드가 저장된다.

## 핵심 아키텍처 개념: 모든 것은 `diaries`에서 파생된다

도시 핀과 경로는 저장하지 않는다 — `diaries` 목록으로부터 계산한다.

- `diaries → cityMarkers`: `(city, country)` 기준 그룹화. 도시당 핀 하나, `diaryCount` 노출.
- `diaries → routes`: `created_at` 오름차순 정렬, 연속 동일 도시 합침.
- 그룹 필터 시 diaries를 먼저 필터링한 뒤 두 변환을 재계산.

## 데이터 모델 (ERD 초안, PRD §7)

핵심 엔티티: `users`, `groups`, `diaries`, `diary_images`, `diary_shared_users`.

- `diaries.group_id`는 nullable — 그룹 없이 일기 작성 가능. "그룹 없음"으로 필터에 노출.
- `visibility` enum: `private` | `shared` | `friends` | `public`. MVP에서는 `private`만 사용.
- `users.map_mode`는 마지막으로 선택한 지도 모드(3D vs 2D)를 저장.

## 개발 순서 (PRD §11)

1. Phase 1 — 로컬 목 JSON
2. Phase 2 — 3D 지구본 PoC (메인 화면 레이아웃 안에서)
3. Phase 3 — 2D 지도 PoC (메인 화면 내 모드 전환)
4. Phase 4 — 메인 화면 완성 (테마, 모달, 플로팅 버튼)
5. Phase 5 — 일기 CRUD
6. Phase 6 — Supabase 연동
7. Phase 7 — Google OAuth
8. Phase 8 — 배포

## Git 컨벤션

### 커밋 메시지

`type:메시지` 형식. 콜론 뒤에 공백 없이 바로 메시지.

| type | 용도 |
|------|------|
| `feat` | 새로운 기능 |
| `fix` | 버그 수정 |
| `docs` | 문서 변경 |
| `style` | 코드 포맷팅 (동작 변경 없음) |
| `refactor` | 리팩토링 (기능 변경 없음) |
| `test` | 테스트 추가/수정 |
| `chore` | 빌드, 설정, 의존성 등 |

### 브랜치

`type/브랜치명` 형식. 영문 kebab-case.

예시: `feat/globe-rendering`, `fix/pin-click-event`

기본 브랜치는 `main`. 작업 시 `main`에서 브랜치를 생성하고, 완료 후 머지.

## 코드 컨벤션

- 스펙 문서는 한국어, 코드에서는 ERD 도메인 용어 사용: `diaries`, `groups`, `cityMarkers`, `routes`, `createdAt`, `groupId`
- frontend, backend 각각의 명령어와 세부 컨벤션은 해당 폴더의 CLAUDE.md 참조
