# Map Diary PRD v1

## 1. 서비스 개요

Map Diary는 여행 기록을 지도 기반으로 시각화하는 개인 여행 일기 서비스이다.

사용자는 여행한 도시에 대한 일기를 작성할 수 있으며, 작성된 일기는 세계 지도 위에 핀으로 표시된다.

지도는 3D 지구본 모드와 2D 지도 모드를 제공하며, 사용자는 자신의 여행 기록과 이동 경로를 직관적으로 탐색할 수 있다.

장기적으로는 여행 기록 공유 기능과 AI 기반 여행 기록 검색 기능을 제공하는 것을 목표로 한다.

---

# 2. 핵심 가치

## 여행 기록의 시각화

일반적인 블로그 형태의 기록이 아닌 지도 기반 시각화를 통해 사용자의 여행 히스토리를 보여준다.

## 이동 경로의 추억화

도시별 기록뿐 아니라 여행 순서와 이동 경로를 함께 보여준다.

## 기록 탐색 경험

사용자는 특정 도시, 날짜, 그룹, 대륙 기준으로 자신의 여행 기록을 쉽게 탐색할 수 있다.

---

# 3. 타겟 사용자

* 여행 기록을 남기고 싶은 사용자
* 방문 도시를 시각적으로 관리하고 싶은 사용자
* 여행 루트를 한눈에 확인하고 싶은 사용자
* 향후 친구와 여행 기록을 공유하고 싶은 사용자

---

# 4. MVP 범위

## 로그인

* 이메일 로그인
* OAuth 로그인 (Google)

---

## 지도 모드

사용자는 두 가지 모드를 선택할 수 있다.

### 3D Globe Mode

* Three.js 기반
* 3D 지구본
* 도시 핀 표시
* 도시 간 이동 경로 표시
* 곡선 형태의 항공 경로 표현

### 2D Map Mode

* Three.js 기반
* 평면 세계 지도
* 약간의 입체감과 깊이감을 가진 스타일
* 도시 핀 표시
* 도시 간 이동 경로 표시
* 3D 지구본과 동일한 데이터 사용

사용자의 마지막 선택 모드는 저장된다.

---

## 여행 일기 작성

사용자는 일기를 작성할 수 있다.

입력 항목

* 국가
* 도시
* 여행 날짜
* 제목
* 내용
* 사진 (0~2장)
* 그룹 선택

자동 생성 데이터

* 대륙
* 위도
* 경도

제약 조건

* 하루에 여러 개 작성 가능
* 동일 도시에 여러 개 작성 가능

대륙 정보는 국가 및 도시 정보를 기반으로 자동 저장되며, 이후 필터링 기능에 활용한다.

---

## 그룹 기능

사용자는 커스텀 그룹을 생성할 수 있다.

예시

* 일본 여행
* 유럽 배낭여행
* 신혼여행
* 출장

그룹은 일기 작성 시 선택 가능하다.

---

## 메인 화면

초기 진입 화면

구성 요소

### 지도 영역

* 3D 지구본 또는 2D 지도

### 플로팅 버튼

* 일기 추가
* 전체 일기 목록
* 지도 모드 변경
* 그룹 필터

---

## 그룹 필터

사용자가 그룹을 생성한 경우 노출

동작

그룹 선택 시

* 해당 그룹의 도시 핀만 표시
* 해당 그룹의 이동 경로만 표시
* 해당 그룹의 일기만 조회

전체 선택 시 전체 데이터 표시

---

## 도시 핀

지도 위 도시를 클릭할 수 있다.

클릭 시

해당 도시에 저장된 일기 목록을 모달로 표시

예시

Tokyo (3)

* 시부야 첫날
* 디즈니랜드 방문
* 마지막 날 쇼핑

---

## 일기 상세

일기 목록에서 특정 일기를 선택하면 상세 모달을 표시한다.

표시 정보

* 국가
* 도시
* 날짜
* 제목
* 내용
* 사진
* 그룹

---

## 전체 일기 목록

전체 일기 목록 모달

지원 기능

### 정렬

* 최신순
* 오래된순

### 필터

* 날짜
* 그룹
* 대륙
* 국가

---

# 5. 사용자 플로우

## 일기 작성

로그인

→ 메인 화면

→ 일기 추가 버튼

→ 일기 작성 모달 오픈

→ 일기 작성

→ 저장

→ 지도 핀 생성

→ 경로 업데이트

---

## 도시 탐색

메인 화면

→ 도시 핀 클릭

→ 해당 도시 일기 목록 모달 표시

→ 일기 선택

→ 상세 모달 표시

---

## 그룹 탐색

메인 화면

→ 그룹 필터 선택

→ 그룹 데이터만 지도 표시

→ 도시 선택

→ 일기 조회

---

## 전체 기록 탐색

메인 화면

→ 전체 일기 목록 모달

→ 필터 선택

→ 일기 선택

→ 상세 모달 표시

---

# 6. 화면 목록

## 메인 화면

지도 + 플로팅 버튼

---

## 일기 작성 모달

일기 생성 및 수정

---

## 전체 일기 목록 모달

필터 및 정렬 지원

---

## 도시 일기 목록 모달

도시 클릭 시 표시

---

## 일기 상세 모달

일기 상세 정보 표시

---

## 로그인 화면

Google 로그인

---

# 7. ERD 초안

users

* id
* email
* nickname
* avatar_url
* map_mode
* created_at

groups

* id
* user_id
* name
* color
* departure (CityRef, nullable) — 트립 경로 출발지. 기본 홈(서울)
* arrival (CityRef, nullable) — 트립 경로 도착지. 기본 홈(서울)
* visibility
* created_at

diaries

* id
* user_id
* group_id
* continent
* country
* city
* latitude
* longitude
* visited_date
* title
* content
* visibility
* created_at
* updated_at

diary_images

* id
* diary_id
* image_url
* order_index

diary_shared_users

* id
* diary_id
* user_id
* created_at

### visibility 값

* private
* shared
* friends
* public

설명

* private: 작성자만 조회 가능
* shared: 특정 사용자에게만 공유
* friends: 친구 공개 (향후 기능)
* public: 전체 공개

> `groups.visibility`와 `diaries.visibility`는 MVP에서는 `private`만 사용하지만, 이후 공유 기능 확장을 위해 미리 스키마에 포함한다.

### 필드 보충 설명

* `diaries.group_id`: **nullable** — 그룹 없이 일기를 작성할 수 있다. 그룹 필터 UI에서는 "그룹 없음" 항목으로 노출한다.
* `groups.departure`/`groups.arrival`: 트립 경로의 출발지/도착지(`CityRef`={city,country,continent,latitude,longitude}, nullable). 새 그룹 기본값은 홈(서울). 경로는 그룹 단위로 `출발지 → 도시들(날짜순) → 도착지`로 그리며, null이면 앵커 없이 날짜순만. 그룹 없는 일기는 항상 홈에서 출발·도착한다. 홈은 추후 사용자 거주지 설정으로 대체.
* `diary_images.order_index`: 현재 최대 2장이지만, 향후 확장을 고려하여 순서 인덱스를 유지한다.

---

# 8. 더미 데이터 구조

초기 개발 단계에서는 Supabase 없이 JSON 데이터 사용

예시

users.json

groups.json

diaries.json

지도 핀 및 경로는 diaries 데이터를 기반으로 생성

정렬 기준

created_at ASC (일기 생성 순서 기준으로 경로를 결정한다)

diaries 데이터에는 아래 정보가 포함된다.

* continent
* country
* city
* latitude
* longitude
* visited_date
* group_id

---

# 8-1. 좌표 및 지역 데이터 전략

## 좌표 변환 (국가/도시 → latitude, longitude, continent)

Phase 1~5 (Supabase 연동 전)

* 도시명 → 좌표 매핑 JSON 파일을 로컬에 두고 사용한다.
* 국가/도시 입력은 자유 텍스트가 아닌 **검색 가능한 SelectBox**로 제공하며, 매핑 JSON에 존재하는 도시만 선택 가능하다.
* continent는 국가 정보로부터 자동 매핑한다.

Phase 6 이후 (Supabase 연동 후)

* Geocoding API(Google Maps Geocoding 등) 도입을 검토한다.
* 또는 기존 매핑 JSON을 DB 테이블로 마이그레이션하여 관리한다.

## 지도 지리 데이터 소스

3D 지구본과 2D 평면 지도의 대륙/국가 경계 렌더링에 사용할 지리 데이터:

* **Natural Earth** 데이터셋 기반
* **TopoJSON** 포맷으로 변환하여 사용 (GeoJSON 대비 파일 크기 절감)
* 해상도: 1:110m (전체 지도) / 필요 시 1:50m (줌인 시)

---

# 8-2. 반응형 및 플랫폼 전략

## 기본 방향

* **데스크탑 퍼스트**로 개발한다.
* 이후 **PWA 방식으로 모바일 앱**으로 확장할 계획이 있다.

## 브레이크포인트

Tailwind CSS 기본값을 따른다.

| 이름 | 범위 | 대상 |
|------|------|------|
| `sm` | ≥ 640px | 큰 모바일 |
| `md` | ≥ 768px | 태블릿 |
| `lg` | ≥ 1024px | 작은 데스크탑 |
| `xl` | ≥ 1280px | 데스크탑 |
| `2xl` | ≥ 1536px | 대형 모니터 |

주요 레이아웃 분기점:

* **< 768px (모바일)**: 바텀시트 모달, 플로팅 버튼 하단 고정, 단일 컬럼
* **768px ~ 1279px (태블릿)**: 사이드 패널 가능, 모달 중앙 배치
* **≥ 1280px (데스크탑)**: 풀 레이아웃, 도시 근처 팝오버 모달

## PWA 고려사항 (Phase 8 이후)

* `next-pwa` 또는 동등한 방법으로 서비스 워커 등록
* 오프라인 지도 캐싱은 비MVP (데이터 크기 이슈)
* 홈 화면 추가(A2HS) 지원

---

# 8-3. 상태 관리 경계

## Zustand (클라이언트/UI 상태)

앱 내부에서 발생하는 일시적 UI 상태를 관리한다.

* 현재 지도 모드 (3D / 2D)
* 선택된 그룹 필터
* 카메라 위치 / 줌 레벨
* 열린 모달 상태 (어떤 모달이 열렸는지, 선택된 도시/일기 ID)
* 테마 모드 (다크 / 라이트)

## TanStack Query (서버/데이터 상태)

외부 데이터 소스(Phase 1~5에서는 목 JSON, Phase 6+에서는 Supabase)로부터 가져오는 데이터를 관리한다.

* 일기 목록 (`diaries`)
* 그룹 목록 (`groups`)
* 사용자 정보 (`users`)
* 파생 데이터: `cityMarkers`, `routes` (쿼리 결과를 변환 함수로 가공)

> Phase 1~5에서도 목 JSON을 `queryFn`으로 감싸서 TanStack Query로 관리한다. 이렇게 하면 Phase 6에서 Supabase로 교체할 때 `queryFn`만 변경하면 되어 마이그레이션 비용이 최소화된다.

---

# 9. 비MVP 기능

## 공유 기능

* 그룹 공개
* 일기 공개
* 특정 사용자 공유
* 친구 초대
* 공동 여행 기록

---

## AI 검색

채팅 기반 검색

예시

"도쿄에서 먹었던 라멘집 알려줘"

"2024년에 가장 기억에 남는 여행은?"

---

## RAG

1차

* Vector RAG

2차

* Graph 구조 추가 검토

---

# 10. 기술 스택

Framework

* Next.js App Router
* TypeScript

UI

* Tailwind CSS
* shadcn/ui

State

* TanStack Query
* Zustand

Map

* Three.js
* React Three Fiber
* Drei
* MapLibre GL (데이터 및 좌표 처리 보조)

Database

* Supabase

Storage

* Supabase Storage

Validation

* React Hook Form
* Zod

Animation

* Framer Motion

---

# 11. 개발 우선순위

## Phase 1

더미 데이터 JSON 작성

* 사용자 데이터
* 그룹 데이터
* 여행 일기 데이터
* 도시 좌표 데이터 포함

---

## Phase 2

3D 지구본 PoC (메인 화면 구조 안에서 구현)

> Phase 2~4는 처음부터 메인 화면 레이아웃(지도 영역 + 플로팅 버튼 + 모달 시스템) 안에서 구현한다. 별도 PoC 페이지를 만들지 않는다.

* 메인 화면 레이아웃 기본 구조 (지도 영역 + 플로팅 버튼 영역)
* 도시 핀 표시
* 이동 경로 표시
* 도시 선택
* 도시별 일기 목록 모달

---

## Phase 3

2D 지도 PoC (메인 화면 내 모드 전환으로 구현)

* Three.js 기반 입체형 지도
* 도시 핀 표시
* 이동 경로 표시
* 도시 선택
* 도시별 일기 목록 모달

---

## Phase 4

메인 화면 완성

* 지도 모드 전환 완성
* 그룹 필터
* 플로팅 버튼 완성
* 모달 시스템 완성
* 다크/라이트 테마 전환

---

## Phase 5

일기 CRUD

* 생성
* 수정
* 삭제
* 조회

---

## Phase 6

Supabase 연동

* Database
* Storage

---

## Phase 7

인증 기능

* Google OAuth
* 사용자 설정 저장

---

## Phase 8

배포
