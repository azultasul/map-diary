# Phase 1: 목 데이터 구성 설계

## 목표

frontend에서 사용할 mock-data.json을 구성하고, diaries → cityMarkers / routes 변환 함수를 작성한다. Phase 2~3 PoC에서 이 데이터와 변환 함수를 바로 소비할 수 있도록 준비한다.

## 파일 구조

- `frontend/public/mock-data.json` — 통합 목 데이터 (users, groups, diaries)
- `frontend/src/lib/transforms.ts` — 순수 변환 함수 (diaries → cityMarkers, diaries → routes)
- `frontend/src/lib/api.ts` — TanStack Query용 queryFn (fetch 기반)
- `frontend/src/hooks/use-diary-data.ts` — TanStack Query 커스텀 훅
- `datas/dummy.json` — 삭제 (mock-data.json으로 통합)

## mock-data.json 스키마

`frontend/src/types/index.ts`에 정의된 타입을 그대로 따른다.

```json
{
  "users": [User],
  "groups": [Group],
  "diaries": [Diary]
}
```

Diary 내부에 images 배열이 중첩되어 있다 (ERD의 diary_images를 flatten).

## 데이터 구성

### users (1명)

| id | nickname | mapMode |
|----|----------|---------|
| user_001 | 따쑬 | globe |

### groups (4개)

| id | name | color | 설명 |
|----|------|-------|------|
| group_japan_2024 | 일본 여행 | #FF6B9A (핑크) | Asia, 4개 도시 |
| group_europe_2025 | 유럽 여행 | #7C8CFF (보라) | Europe, 5개 도시 |
| group_business_2025 | 출장 기록 | #4DD6B6 (민트) | 북미 2개 도시 + 서울 |
| group_south_america_2026 | 남미 여행 | #FFB347 (오렌지) | 남미 2개 도시 |

### diaries (20개)

#### 일본 여행 그룹 (5개) — Asia

| # | city | country | visitedDate | 비고 |
|---|------|---------|-------------|------|
| 1 | Tokyo | Japan | 2024-04-03 | |
| 2 | Tokyo | Japan | 2024-04-04 | 같은 도시 연속 → 경로 합침 |
| 3 | Osaka | Japan | 2024-04-06 | |
| 4 | Kyoto | Japan | 2024-04-08 | |
| 5 | Tokyo | Japan | 2024-04-10 | 재방문 → 별도 경로 (Kyoto→Tokyo) |

경로: Tokyo → Osaka → Kyoto → Tokyo

#### 유럽 여행 그룹 (5개) — Europe

| # | city | country | visitedDate | 비고 |
|---|------|---------|-------------|------|
| 6 | Paris | France | 2025-05-12 | |
| 7 | London | United Kingdom | 2025-05-16 | |
| 8 | Rome | Italy | 2025-05-20 | |
| 9 | Barcelona | Spain | 2025-05-24 | 추가 |
| 10 | Prague | Czech Republic | 2025-05-28 | 추가 |

경로: Paris → London → Rome → Barcelona → Prague

#### 출장 기록 그룹 (3개) — North America + Asia

| # | city | country | visitedDate | 비고 |
|---|------|---------|-------------|------|
| 11 | New York | United States | 2025-09-10 | |
| 12 | San Francisco | United States | 2025-09-13 | 추가, 같은 나라 다른 도시 |
| 13 | Seoul | South Korea | 2025-09-18 | 대륙 간 이동 |

경로: New York → San Francisco → Seoul

#### 남미 여행 그룹 (2개) — South America

| # | city | country | visitedDate | 비고 |
|---|------|---------|-------------|------|
| 14 | Buenos Aires | Argentina | 2026-01-10 | 추가 |
| 15 | Lima | Peru | 2026-01-15 | 추가 |

경로: Buenos Aires → Lima

#### 그룹 없음 (5개) — 여러 대륙

| # | city | country | continent | visitedDate | 비고 |
|---|------|---------|-----------|-------------|------|
| 16 | Bangkok | Thailand | Asia | 2025-12-02 | 기존 |
| 17 | Sydney | Australia | Oceania | 2026-03-05 | 추가 |
| 18 | Cape Town | South Africa | Africa | 2026-04-12 | 추가 |
| 19 | Reykjavik | Iceland | Europe | 2026-05-01 | 추가, 고위도 |
| 20 | Singapore | Singapore | Asia | 2026-05-20 | 추가, 적도 근처 |

경로 (전체 보기 시): ...Bangkok → Sydney → Cape Town → Reykjavik → Singapore

### 대륙 분포 요약

| 대륙 | 일기 수 | 도시 |
|------|---------|------|
| Asia | 7 | Tokyo, Osaka, Kyoto, Seoul, Bangkok, Singapore |
| Europe | 6 | Paris, London, Rome, Barcelona, Prague, Reykjavik |
| North America | 2 | New York, San Francisco |
| South America | 2 | Buenos Aires, Lima |
| Africa | 1 | Cape Town |
| Oceania | 1 | Sydney |

총 16개 고유 도시, 20개 일기.

## 변환 함수 설계

### `deriveCityMarkers(diaries: Diary[], groups: Group[]): CityMarker[]`

1. diaries를 `${city}-${country}` 키로 그룹화
2. 그룹당 하나의 CityMarker 생성
3. diaryCount = 해당 도시의 일기 수
4. groupColor = 해당 도시 일기들의 그룹 색상. 여러 그룹이 섞이면 null (전체 보기 시)
5. diaryIds = 해당 도시의 일기 ID 목록

### `deriveRoutes(diaries: Diary[], groups: Group[]): Route[]`

1. diaries를 created_at 오름차순 정렬
2. 연속한 도시를 순회하며 from/to 쌍 생성
3. 연속한 동일 도시는 합침 (Tokyo→Tokyo 스킵)
4. groupColor = from/to 일기의 그룹이 같으면 해당 색상, 다르면 null

### 그룹 필터 적용

두 변환 함수를 호출하기 전에 diaries를 groupId로 필터링한다. 변환 함수 자체는 필터 로직을 모른다.

- `selectedGroupId === null` → 전체 보기
- `selectedGroupId === 'ungrouped'` → groupId가 null인 일기만
- `selectedGroupId === 'group_xxx'` → 해당 그룹 일기만

### TanStack Query 구조

```
useUsers()   → fetch('/mock-data.json') → data.users
useGroups()  → fetch('/mock-data.json') → data.groups
useDiaries() → fetch('/mock-data.json') → data.diaries
```

하나의 mock-data.json을 fetch하되, 각 훅에서 필요한 부분만 select한다. staleTime이 60초이므로 실제 fetch는 한 번만 발생.

## 검증 포인트

이 데이터로 확인 가능한 엣지 케이스:

- 같은 도시 연속 일기 (Tokyo #1, #2): 경로 합침
- 같은 도시 재방문 (Tokyo #5): 별도 경로 생성
- groupId: null 일기 5개: "그룹 없음" 필터
- 6개 대륙 분포: 지구본 전체 활용
- 같은 나라 다른 도시 (New York, San Francisco): 가까운 거리 경로
- 고위도 (Reykjavik), 적도 (Singapore): 지구본 위치 테스트
- 이미지 0/1/2장: 일기 상세 모달 대응
