# Phase 1: 목 데이터 구성 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** mock-data.json 구성, diaries → cityMarkers / routes 변환 함수 작성, TanStack Query 훅으로 데이터 제공 파이프라인 완성.

**Architecture:** `frontend/public/mock-data.json`을 fetch로 가져오고, TanStack Query 훅으로 캐싱한다. 순수 변환 함수 `deriveCityMarkers`와 `deriveRoutes`가 diaries 배열을 소비하여 핀/경로 데이터를 파생한다. 변환 함수는 Three.js/React 타입에 의존하지 않으며, Phase 2~3에서 3D/2D 렌더러가 이 결과를 바로 소비한다.

**Tech Stack:** TypeScript, TanStack Query, Vitest (테스트)

**Branch:** `feat/phase1-mock-data`

---

## File Structure

```
frontend/
├── public/
│   └── mock-data.json              (Create: 20개 일기 목 데이터)
├── src/
│   ├── lib/
│   │   ├── transforms.ts           (Create: deriveCityMarkers, deriveRoutes 순수 변환 함수)
│   │   └── api.ts                  (Create: fetchMockData queryFn)
│   ├── hooks/
│   │   └── use-diary-data.ts       (Create: useUsers, useGroups, useDiaries, useCityMarkers, useRoutes)
│   └── types/
│       └── index.ts                (Modify: MockData 타입 추가)
├── tests/
│   └── lib/
│       └── transforms.test.ts      (Create: 변환 함수 테스트)
├── vitest.config.ts                (Create: Vitest 설정)
└── package.json                    (Modify: vitest 의존성 + test 스크립트)

(Delete: datas/dummy.json)
```

---

## Task 1: 테스트 환경 설정 (Vitest)

**Files:**
- Modify: `frontend/package.json`
- Create: `frontend/vitest.config.ts`

- [ ] **Step 1: Vitest 설치**

```bash
cd /Users/onomaai/Documents/workspace/tutorial/map-diary/frontend
npm install -D vitest
```

- [ ] **Step 2: vitest.config.ts 생성**

`frontend/vitest.config.ts`:

```ts
import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

- [ ] **Step 3: package.json에 test 스크립트 추가**

`frontend/package.json`의 `scripts`에 추가:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: vitest 실행 확인**

```bash
cd /Users/onomaai/Documents/workspace/tutorial/map-diary/frontend
npm test
```

Expected: `No test files found` (아직 테스트 파일이 없으므로 정상)

- [ ] **Step 5: 커밋**

```bash
cd /Users/onomaai/Documents/workspace/tutorial/map-diary
git add frontend/package.json frontend/package-lock.json frontend/vitest.config.ts
git commit -m "chore:Vitest 테스트 환경 설정"
```

---

## Task 2: mock-data.json 생성

**Files:**
- Create: `frontend/public/mock-data.json`
- Delete: `datas/dummy.json`

- [ ] **Step 1: mock-data.json 생성**

`frontend/public/mock-data.json`:

```json
{
  "users": [
    {
      "id": "user_001",
      "email": "demo@mapdiary.dev",
      "nickname": "따쑬",
      "avatarUrl": "/mock/images/avatar-demo.png",
      "mapMode": "globe",
      "createdAt": "2026-06-01T09:00:00.000Z"
    }
  ],
  "groups": [
    {
      "id": "group_japan_2024",
      "userId": "user_001",
      "name": "일본 여행",
      "color": "#FF6B9A",
      "visibility": "private",
      "createdAt": "2026-06-01T09:10:00.000Z"
    },
    {
      "id": "group_europe_2025",
      "userId": "user_001",
      "name": "유럽 여행",
      "color": "#7C8CFF",
      "visibility": "private",
      "createdAt": "2026-06-01T09:20:00.000Z"
    },
    {
      "id": "group_business_2025",
      "userId": "user_001",
      "name": "출장 기록",
      "color": "#4DD6B6",
      "visibility": "private",
      "createdAt": "2026-06-01T09:30:00.000Z"
    },
    {
      "id": "group_south_america_2026",
      "userId": "user_001",
      "name": "남미 여행",
      "color": "#FFB347",
      "visibility": "private",
      "createdAt": "2026-06-01T09:40:00.000Z"
    }
  ],
  "diaries": [
    {
      "id": "diary_001",
      "userId": "user_001",
      "groupId": "group_japan_2024",
      "continent": "Asia",
      "country": "Japan",
      "city": "Tokyo",
      "latitude": 35.6762,
      "longitude": 139.6503,
      "visitedDate": "2024-04-03",
      "title": "도쿄에 도착한 첫날",
      "content": "공항에서 도심으로 들어오는 길부터 여행이 시작된 느낌이었다. 밤의 도쿄는 생각보다 차분했고, 거리의 조명들이 오래 기억에 남았다.",
      "visibility": "private",
      "images": [
        { "id": "image_001", "imageUrl": "/mock/images/tokyo-01.jpg", "orderIndex": 0 }
      ],
      "createdAt": "2026-06-01T10:00:00.000Z",
      "updatedAt": "2026-06-01T10:00:00.000Z"
    },
    {
      "id": "diary_002",
      "userId": "user_001",
      "groupId": "group_japan_2024",
      "continent": "Asia",
      "country": "Japan",
      "city": "Tokyo",
      "latitude": 35.6762,
      "longitude": 139.6503,
      "visitedDate": "2024-04-04",
      "title": "시부야에서 보낸 하루",
      "content": "시부야 스크램블 교차로를 걸었다. 사람이 많았지만 이상하게 질서정연했고, 카페에서 쉬면서 여행 일정을 다시 정리했다.",
      "visibility": "private",
      "images": [
        { "id": "image_002", "imageUrl": "/mock/images/tokyo-02.jpg", "orderIndex": 0 },
        { "id": "image_003", "imageUrl": "/mock/images/tokyo-03.jpg", "orderIndex": 1 }
      ],
      "createdAt": "2026-06-01T10:10:00.000Z",
      "updatedAt": "2026-06-01T10:10:00.000Z"
    },
    {
      "id": "diary_003",
      "userId": "user_001",
      "groupId": "group_japan_2024",
      "continent": "Asia",
      "country": "Japan",
      "city": "Osaka",
      "latitude": 34.6937,
      "longitude": 135.5023,
      "visitedDate": "2024-04-06",
      "title": "오사카의 밤",
      "content": "도톤보리의 간판과 강가의 분위기가 강렬했다. 길거리 음식을 먹으며 걷는 시간이 가장 즐거웠다.",
      "visibility": "private",
      "images": [],
      "createdAt": "2026-06-01T10:20:00.000Z",
      "updatedAt": "2026-06-01T10:20:00.000Z"
    },
    {
      "id": "diary_004",
      "userId": "user_001",
      "groupId": "group_japan_2024",
      "continent": "Asia",
      "country": "Japan",
      "city": "Kyoto",
      "latitude": 35.0116,
      "longitude": 135.7681,
      "visitedDate": "2024-04-08",
      "title": "교토에서 느린 산책",
      "content": "교토는 도쿄와 오사카와 달리 시간이 천천히 흐르는 느낌이었다. 골목과 사찰, 조용한 풍경이 좋았다.",
      "visibility": "private",
      "images": [
        { "id": "image_004", "imageUrl": "/mock/images/kyoto-01.jpg", "orderIndex": 0 }
      ],
      "createdAt": "2026-06-01T10:30:00.000Z",
      "updatedAt": "2026-06-01T10:30:00.000Z"
    },
    {
      "id": "diary_005",
      "userId": "user_001",
      "groupId": "group_japan_2024",
      "continent": "Asia",
      "country": "Japan",
      "city": "Tokyo",
      "latitude": 35.6762,
      "longitude": 139.6503,
      "visitedDate": "2024-04-10",
      "title": "도쿄로 돌아온 마지막 날",
      "content": "다시 돌아온 도쿄는 처음과 다르게 느껴졌다. 익숙해진 거리와 지하철이 어딘가 편안했다.",
      "visibility": "private",
      "images": [
        { "id": "image_005", "imageUrl": "/mock/images/tokyo-04.jpg", "orderIndex": 0 }
      ],
      "createdAt": "2026-06-01T10:40:00.000Z",
      "updatedAt": "2026-06-01T10:40:00.000Z"
    },
    {
      "id": "diary_006",
      "userId": "user_001",
      "groupId": "group_europe_2025",
      "continent": "Europe",
      "country": "France",
      "city": "Paris",
      "latitude": 48.8566,
      "longitude": 2.3522,
      "visitedDate": "2025-05-12",
      "title": "파리에서의 첫 아침",
      "content": "숙소 근처 빵집에서 산 크루아상이 인상적이었다. 특별한 일정 없이 걷기만 해도 도시 전체가 여행지처럼 느껴졌다.",
      "visibility": "private",
      "images": [
        { "id": "image_006", "imageUrl": "/mock/images/paris-01.jpg", "orderIndex": 0 }
      ],
      "createdAt": "2026-06-01T10:50:00.000Z",
      "updatedAt": "2026-06-01T10:50:00.000Z"
    },
    {
      "id": "diary_007",
      "userId": "user_001",
      "groupId": "group_europe_2025",
      "continent": "Europe",
      "country": "United Kingdom",
      "city": "London",
      "latitude": 51.5072,
      "longitude": -0.1276,
      "visitedDate": "2025-05-16",
      "title": "런던의 흐린 날씨",
      "content": "날씨는 흐렸지만 도시의 분위기와 잘 어울렸다. 지하철을 타고 이동하며 오래된 도시의 리듬을 느꼈다.",
      "visibility": "private",
      "images": [],
      "createdAt": "2026-06-01T11:00:00.000Z",
      "updatedAt": "2026-06-01T11:00:00.000Z"
    },
    {
      "id": "diary_008",
      "userId": "user_001",
      "groupId": "group_europe_2025",
      "continent": "Europe",
      "country": "Italy",
      "city": "Rome",
      "latitude": 41.9028,
      "longitude": 12.4964,
      "visitedDate": "2025-05-20",
      "title": "로마의 오래된 풍경",
      "content": "도시 전체가 거대한 유적지 같았다. 걷다가 마주치는 건물과 광장이 모두 기억에 남았다.",
      "visibility": "private",
      "images": [
        { "id": "image_007", "imageUrl": "/mock/images/rome-01.jpg", "orderIndex": 0 }
      ],
      "createdAt": "2026-06-01T11:10:00.000Z",
      "updatedAt": "2026-06-01T11:10:00.000Z"
    },
    {
      "id": "diary_009",
      "userId": "user_001",
      "groupId": "group_europe_2025",
      "continent": "Europe",
      "country": "Spain",
      "city": "Barcelona",
      "latitude": 41.3874,
      "longitude": 2.1686,
      "visitedDate": "2025-05-24",
      "title": "바르셀로나의 해변",
      "content": "사그라다 파밀리아를 보고 해변을 걸었다. 지중해의 바람이 따뜻하고 도시 전체가 에너지로 가득했다.",
      "visibility": "private",
      "images": [
        { "id": "image_008", "imageUrl": "/mock/images/barcelona-01.jpg", "orderIndex": 0 }
      ],
      "createdAt": "2026-06-01T11:20:00.000Z",
      "updatedAt": "2026-06-01T11:20:00.000Z"
    },
    {
      "id": "diary_010",
      "userId": "user_001",
      "groupId": "group_europe_2025",
      "continent": "Europe",
      "country": "Czech Republic",
      "city": "Prague",
      "latitude": 50.0755,
      "longitude": 14.4378,
      "visitedDate": "2025-05-28",
      "title": "프라하의 다리 위에서",
      "content": "카를교 위에서 바라본 도시는 동화 속 같았다. 오래된 건물들과 강이 만드는 풍경이 아름다웠다.",
      "visibility": "private",
      "images": [],
      "createdAt": "2026-06-01T11:30:00.000Z",
      "updatedAt": "2026-06-01T11:30:00.000Z"
    },
    {
      "id": "diary_011",
      "userId": "user_001",
      "groupId": "group_business_2025",
      "continent": "North America",
      "country": "United States",
      "city": "New York",
      "latitude": 40.7128,
      "longitude": -74.006,
      "visitedDate": "2025-09-10",
      "title": "뉴욕 출장 첫날",
      "content": "출장 일정이 빡빡했지만 밤에 잠깐 걸었던 맨해튼 거리가 가장 기억에 남았다.",
      "visibility": "private",
      "images": [],
      "createdAt": "2026-06-01T11:40:00.000Z",
      "updatedAt": "2026-06-01T11:40:00.000Z"
    },
    {
      "id": "diary_012",
      "userId": "user_001",
      "groupId": "group_business_2025",
      "continent": "North America",
      "country": "United States",
      "city": "San Francisco",
      "latitude": 37.7749,
      "longitude": -122.4194,
      "visitedDate": "2025-09-13",
      "title": "샌프란시스코 미팅",
      "content": "금문교를 건너며 잠깐의 여유를 느꼈다. 바람이 거세지만 전망은 최고였다.",
      "visibility": "private",
      "images": [
        { "id": "image_009", "imageUrl": "/mock/images/sf-01.jpg", "orderIndex": 0 }
      ],
      "createdAt": "2026-06-01T11:50:00.000Z",
      "updatedAt": "2026-06-01T11:50:00.000Z"
    },
    {
      "id": "diary_013",
      "userId": "user_001",
      "groupId": "group_business_2025",
      "continent": "Asia",
      "country": "South Korea",
      "city": "Seoul",
      "latitude": 37.5665,
      "longitude": 126.978,
      "visitedDate": "2025-09-18",
      "title": "서울로 돌아온 날",
      "content": "긴 이동 끝에 서울에 도착했다. 여행과 출장이 끝났다는 안도감이 컸다.",
      "visibility": "private",
      "images": [],
      "createdAt": "2026-06-01T12:00:00.000Z",
      "updatedAt": "2026-06-01T12:00:00.000Z"
    },
    {
      "id": "diary_014",
      "userId": "user_001",
      "groupId": "group_south_america_2026",
      "continent": "South America",
      "country": "Argentina",
      "city": "Buenos Aires",
      "latitude": -34.6037,
      "longitude": -58.3816,
      "visitedDate": "2026-01-10",
      "title": "부에노스아이레스의 열기",
      "content": "탱고 공연을 보며 남미의 열정을 느꼈다. 스테이크와 와인이 훌륭했다.",
      "visibility": "private",
      "images": [
        { "id": "image_010", "imageUrl": "/mock/images/buenos-aires-01.jpg", "orderIndex": 0 }
      ],
      "createdAt": "2026-06-01T12:10:00.000Z",
      "updatedAt": "2026-06-01T12:10:00.000Z"
    },
    {
      "id": "diary_015",
      "userId": "user_001",
      "groupId": "group_south_america_2026",
      "continent": "South America",
      "country": "Peru",
      "city": "Lima",
      "latitude": -12.0464,
      "longitude": -77.0428,
      "visitedDate": "2026-01-15",
      "title": "리마의 해안 절벽",
      "content": "미라플로레스 해안가를 걸으며 태평양을 바라봤다. 세비체가 정말 맛있었다.",
      "visibility": "private",
      "images": [],
      "createdAt": "2026-06-01T12:20:00.000Z",
      "updatedAt": "2026-06-01T12:20:00.000Z"
    },
    {
      "id": "diary_016",
      "userId": "user_001",
      "groupId": null,
      "continent": "Asia",
      "country": "Thailand",
      "city": "Bangkok",
      "latitude": 13.7563,
      "longitude": 100.5018,
      "visitedDate": "2025-12-02",
      "title": "방콕에서의 짧은 휴식",
      "content": "짧은 일정이었지만 따뜻한 공기와 야시장의 활기가 좋았다. 다음에는 더 오래 머물고 싶다.",
      "visibility": "private",
      "images": [
        { "id": "image_011", "imageUrl": "/mock/images/bangkok-01.jpg", "orderIndex": 0 }
      ],
      "createdAt": "2026-06-01T12:30:00.000Z",
      "updatedAt": "2026-06-01T12:30:00.000Z"
    },
    {
      "id": "diary_017",
      "userId": "user_001",
      "groupId": null,
      "continent": "Oceania",
      "country": "Australia",
      "city": "Sydney",
      "latitude": -33.8688,
      "longitude": 151.2093,
      "visitedDate": "2026-03-05",
      "title": "시드니 오페라 하우스",
      "content": "항구 앞에서 바라본 오페라 하우스는 사진보다 훨씬 인상적이었다. 따뜻한 가을 날씨가 좋았다.",
      "visibility": "private",
      "images": [
        { "id": "image_012", "imageUrl": "/mock/images/sydney-01.jpg", "orderIndex": 0 },
        { "id": "image_013", "imageUrl": "/mock/images/sydney-02.jpg", "orderIndex": 1 }
      ],
      "createdAt": "2026-06-01T12:40:00.000Z",
      "updatedAt": "2026-06-01T12:40:00.000Z"
    },
    {
      "id": "diary_018",
      "userId": "user_001",
      "groupId": null,
      "continent": "Africa",
      "country": "South Africa",
      "city": "Cape Town",
      "latitude": -33.9249,
      "longitude": 18.4241,
      "visitedDate": "2026-04-12",
      "title": "케이프타운의 테이블 마운틴",
      "content": "테이블 마운틴에서 내려다본 도시와 바다의 경계가 장관이었다.",
      "visibility": "private",
      "images": [
        { "id": "image_014", "imageUrl": "/mock/images/capetown-01.jpg", "orderIndex": 0 }
      ],
      "createdAt": "2026-06-01T12:50:00.000Z",
      "updatedAt": "2026-06-01T12:50:00.000Z"
    },
    {
      "id": "diary_019",
      "userId": "user_001",
      "groupId": null,
      "continent": "Europe",
      "country": "Iceland",
      "city": "Reykjavik",
      "latitude": 64.1466,
      "longitude": -21.9426,
      "visitedDate": "2026-05-01",
      "title": "레이캬비크의 백야",
      "content": "밤인데도 밝은 하늘이 신기했다. 작은 도시지만 독특한 분위기가 매력적이었다.",
      "visibility": "private",
      "images": [],
      "createdAt": "2026-06-01T13:00:00.000Z",
      "updatedAt": "2026-06-01T13:00:00.000Z"
    },
    {
      "id": "diary_020",
      "userId": "user_001",
      "groupId": null,
      "continent": "Asia",
      "country": "Singapore",
      "city": "Singapore",
      "latitude": 1.3521,
      "longitude": 103.8198,
      "visitedDate": "2026-05-20",
      "title": "싱가포르의 야경",
      "content": "마리나 베이 샌즈에서 바라본 야경이 인상적이었다. 깨끗하고 정돈된 도시.",
      "visibility": "private",
      "images": [
        { "id": "image_015", "imageUrl": "/mock/images/singapore-01.jpg", "orderIndex": 0 }
      ],
      "createdAt": "2026-06-01T13:10:00.000Z",
      "updatedAt": "2026-06-01T13:10:00.000Z"
    }
  ]
}
```

- [ ] **Step 2: datas/dummy.json 삭제**

```bash
cd /Users/onomaai/Documents/workspace/tutorial/map-diary
rm datas/dummy.json
rmdir datas
```

- [ ] **Step 3: 커밋**

```bash
cd /Users/onomaai/Documents/workspace/tutorial/map-diary
git add frontend/public/mock-data.json
git rm datas/dummy.json
git commit -m "feat:mock-data.json 생성 및 dummy.json 삭제"
```

---

## Task 3: MockData 타입 추가

**Files:**
- Modify: `frontend/src/types/index.ts`

- [ ] **Step 1: MockData 인터페이스 추가**

`frontend/src/types/index.ts` 파일 끝에 추가:

```ts
export interface MockData {
  users: User[];
  groups: Group[];
  diaries: Diary[];
}
```

- [ ] **Step 2: TypeScript 확인**

```bash
cd /Users/onomaai/Documents/workspace/tutorial/map-diary/frontend
npx tsc --noEmit
```

Expected: 에러 없음.

- [ ] **Step 3: 커밋**

```bash
cd /Users/onomaai/Documents/workspace/tutorial/map-diary
git add frontend/src/types/index.ts
git commit -m "feat:MockData 타입 추가"
```

---

## Task 4: deriveCityMarkers 변환 함수 (TDD)

**Files:**
- Create: `frontend/tests/lib/transforms.test.ts`
- Create: `frontend/src/lib/transforms.ts`

- [ ] **Step 1: 테스트 파일 생성 — deriveCityMarkers 테스트**

`frontend/tests/lib/transforms.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { deriveCityMarkers } from '@/lib/transforms';
import type { Diary, Group } from '@/types';

const groups: Group[] = [
  {
    id: 'group_a',
    userId: 'user_001',
    name: 'Trip A',
    color: '#FF0000',
    visibility: 'private',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'group_b',
    userId: 'user_001',
    name: 'Trip B',
    color: '#00FF00',
    visibility: 'private',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

function makeDiary(overrides: Partial<Diary> & Pick<Diary, 'id' | 'city' | 'country' | 'latitude' | 'longitude'>): Diary {
  return {
    userId: 'user_001',
    groupId: 'group_a',
    continent: 'Asia',
    visitedDate: '2024-01-01',
    title: 'Test',
    content: 'Test content',
    visibility: 'private',
    images: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('deriveCityMarkers', () => {
  it('같은 도시 일기 여러 개 → 핀 하나, diaryCount 반영', () => {
    const diaries: Diary[] = [
      makeDiary({ id: 'd1', city: 'Tokyo', country: 'Japan', latitude: 35.6762, longitude: 139.6503 }),
      makeDiary({ id: 'd2', city: 'Tokyo', country: 'Japan', latitude: 35.6762, longitude: 139.6503 }),
    ];

    const markers = deriveCityMarkers(diaries, groups);
    expect(markers).toHaveLength(1);
    expect(markers[0].city).toBe('Tokyo');
    expect(markers[0].diaryCount).toBe(2);
    expect(markers[0].diaryIds).toEqual(['d1', 'd2']);
  });

  it('다른 도시 → 각각 핀 생성', () => {
    const diaries: Diary[] = [
      makeDiary({ id: 'd1', city: 'Tokyo', country: 'Japan', latitude: 35.6762, longitude: 139.6503 }),
      makeDiary({ id: 'd2', city: 'Osaka', country: 'Japan', latitude: 34.6937, longitude: 135.5023 }),
    ];

    const markers = deriveCityMarkers(diaries, groups);
    expect(markers).toHaveLength(2);
  });

  it('같은 그룹 → groupColor에 그룹 색상', () => {
    const diaries: Diary[] = [
      makeDiary({ id: 'd1', city: 'Tokyo', country: 'Japan', latitude: 35.6762, longitude: 139.6503, groupId: 'group_a' }),
    ];

    const markers = deriveCityMarkers(diaries, groups);
    expect(markers[0].groupColor).toBe('#FF0000');
  });

  it('여러 그룹 섞인 도시 → groupColor null', () => {
    const diaries: Diary[] = [
      makeDiary({ id: 'd1', city: 'Tokyo', country: 'Japan', latitude: 35.6762, longitude: 139.6503, groupId: 'group_a' }),
      makeDiary({ id: 'd2', city: 'Tokyo', country: 'Japan', latitude: 35.6762, longitude: 139.6503, groupId: 'group_b' }),
    ];

    const markers = deriveCityMarkers(diaries, groups);
    expect(markers[0].groupColor).toBeNull();
  });

  it('groupId null인 일기 → groupColor null', () => {
    const diaries: Diary[] = [
      makeDiary({ id: 'd1', city: 'Bangkok', country: 'Thailand', latitude: 13.7563, longitude: 100.5018, groupId: null }),
    ];

    const markers = deriveCityMarkers(diaries, groups);
    expect(markers[0].groupColor).toBeNull();
  });

  it('빈 배열 → 빈 결과', () => {
    const markers = deriveCityMarkers([], groups);
    expect(markers).toEqual([]);
  });
});
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
cd /Users/onomaai/Documents/workspace/tutorial/map-diary/frontend
npm test
```

Expected: FAIL — `deriveCityMarkers` is not a function.

- [ ] **Step 3: deriveCityMarkers 구현**

`frontend/src/lib/transforms.ts`:

```ts
import type { CityMarker, Diary, Group, Route } from '@/types';

export function deriveCityMarkers(
  diaries: Diary[],
  groups: Group[],
): CityMarker[] {
  const groupColorMap = new Map(groups.map((g) => [g.id, g.color]));
  const cityMap = new Map<string, Diary[]>();

  for (const diary of diaries) {
    const key = `${diary.city}-${diary.country}`;
    const existing = cityMap.get(key);
    if (existing) {
      existing.push(diary);
    } else {
      cityMap.set(key, [diary]);
    }
  }

  const markers: CityMarker[] = [];

  for (const [, cityDiaries] of cityMap) {
    const first = cityDiaries[0];
    const groupIds = new Set(cityDiaries.map((d) => d.groupId));
    let groupColor: string | null = null;

    if (groupIds.size === 1) {
      const onlyGroupId = [...groupIds][0];
      groupColor = onlyGroupId ? (groupColorMap.get(onlyGroupId) ?? null) : null;
    }

    markers.push({
      city: first.city,
      country: first.country,
      continent: first.continent,
      latitude: first.latitude,
      longitude: first.longitude,
      diaryCount: cityDiaries.length,
      groupColor,
      diaryIds: cityDiaries.map((d) => d.id),
    });
  }

  return markers;
}
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

```bash
cd /Users/onomaai/Documents/workspace/tutorial/map-diary/frontend
npm test
```

Expected: 6 tests passed.

- [ ] **Step 5: 커밋**

```bash
cd /Users/onomaai/Documents/workspace/tutorial/map-diary
git add frontend/tests/lib/transforms.test.ts frontend/src/lib/transforms.ts
git commit -m "feat:deriveCityMarkers 변환 함수 구현 및 테스트"
```

---

## Task 5: deriveRoutes 변환 함수 (TDD)

**Files:**
- Modify: `frontend/tests/lib/transforms.test.ts`
- Modify: `frontend/src/lib/transforms.ts`

- [ ] **Step 1: deriveRoutes 테스트 추가**

`frontend/tests/lib/transforms.test.ts` 파일 끝에 추가:

```ts
import { deriveRoutes } from '@/lib/transforms';

describe('deriveRoutes', () => {
  it('created_at 순서로 도시 간 경로 생성', () => {
    const diaries: Diary[] = [
      makeDiary({ id: 'd1', city: 'Tokyo', country: 'Japan', latitude: 35.6762, longitude: 139.6503, createdAt: '2026-01-01T01:00:00.000Z' }),
      makeDiary({ id: 'd2', city: 'Osaka', country: 'Japan', latitude: 34.6937, longitude: 135.5023, createdAt: '2026-01-01T02:00:00.000Z' }),
    ];

    const routes = deriveRoutes(diaries, groups);
    expect(routes).toHaveLength(1);
    expect(routes[0].from.city).toBe('Tokyo');
    expect(routes[0].to.city).toBe('Osaka');
  });

  it('연속 동일 도시 → 경로 합침 (스킵)', () => {
    const diaries: Diary[] = [
      makeDiary({ id: 'd1', city: 'Tokyo', country: 'Japan', latitude: 35.6762, longitude: 139.6503, createdAt: '2026-01-01T01:00:00.000Z' }),
      makeDiary({ id: 'd2', city: 'Tokyo', country: 'Japan', latitude: 35.6762, longitude: 139.6503, createdAt: '2026-01-01T02:00:00.000Z' }),
      makeDiary({ id: 'd3', city: 'Osaka', country: 'Japan', latitude: 34.6937, longitude: 135.5023, createdAt: '2026-01-01T03:00:00.000Z' }),
    ];

    const routes = deriveRoutes(diaries, groups);
    expect(routes).toHaveLength(1);
    expect(routes[0].from.city).toBe('Tokyo');
    expect(routes[0].to.city).toBe('Osaka');
  });

  it('재방문 → 별도 경로 생성', () => {
    const diaries: Diary[] = [
      makeDiary({ id: 'd1', city: 'Tokyo', country: 'Japan', latitude: 35.6762, longitude: 139.6503, createdAt: '2026-01-01T01:00:00.000Z' }),
      makeDiary({ id: 'd2', city: 'Osaka', country: 'Japan', latitude: 34.6937, longitude: 135.5023, createdAt: '2026-01-01T02:00:00.000Z' }),
      makeDiary({ id: 'd3', city: 'Tokyo', country: 'Japan', latitude: 35.6762, longitude: 139.6503, createdAt: '2026-01-01T03:00:00.000Z' }),
    ];

    const routes = deriveRoutes(diaries, groups);
    expect(routes).toHaveLength(2);
    expect(routes[0].from.city).toBe('Tokyo');
    expect(routes[0].to.city).toBe('Osaka');
    expect(routes[1].from.city).toBe('Osaka');
    expect(routes[1].to.city).toBe('Tokyo');
  });

  it('같은 그룹 → groupColor에 색상', () => {
    const diaries: Diary[] = [
      makeDiary({ id: 'd1', city: 'Tokyo', country: 'Japan', latitude: 35.6762, longitude: 139.6503, groupId: 'group_a', createdAt: '2026-01-01T01:00:00.000Z' }),
      makeDiary({ id: 'd2', city: 'Osaka', country: 'Japan', latitude: 34.6937, longitude: 135.5023, groupId: 'group_a', createdAt: '2026-01-01T02:00:00.000Z' }),
    ];

    const routes = deriveRoutes(diaries, groups);
    expect(routes[0].groupColor).toBe('#FF0000');
  });

  it('다른 그룹 간 경로 → groupColor null', () => {
    const diaries: Diary[] = [
      makeDiary({ id: 'd1', city: 'Tokyo', country: 'Japan', latitude: 35.6762, longitude: 139.6503, groupId: 'group_a', createdAt: '2026-01-01T01:00:00.000Z' }),
      makeDiary({ id: 'd2', city: 'Osaka', country: 'Japan', latitude: 34.6937, longitude: 135.5023, groupId: 'group_b', createdAt: '2026-01-01T02:00:00.000Z' }),
    ];

    const routes = deriveRoutes(diaries, groups);
    expect(routes[0].groupColor).toBeNull();
  });

  it('일기 1개 → 경로 없음', () => {
    const diaries: Diary[] = [
      makeDiary({ id: 'd1', city: 'Tokyo', country: 'Japan', latitude: 35.6762, longitude: 139.6503 }),
    ];

    const routes = deriveRoutes(diaries, groups);
    expect(routes).toEqual([]);
  });

  it('빈 배열 → 빈 결과', () => {
    const routes = deriveRoutes([], groups);
    expect(routes).toEqual([]);
  });
});
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
cd /Users/onomaai/Documents/workspace/tutorial/map-diary/frontend
npm test
```

Expected: deriveRoutes 테스트 FAIL.

- [ ] **Step 3: deriveRoutes 구현**

`frontend/src/lib/transforms.ts`에 추가:

```ts
export function deriveRoutes(diaries: Diary[], groups: Group[]): Route[] {
  if (diaries.length < 2) return [];

  const groupColorMap = new Map(groups.map((g) => [g.id, g.color]));
  const sorted = [...diaries].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  const routes: Route[] = [];
  let prevDiary = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const curr = sorted[i];
    const sameCity =
      prevDiary.city === curr.city && prevDiary.country === curr.country;

    if (!sameCity) {
      const fromGroupColor = prevDiary.groupId
        ? (groupColorMap.get(prevDiary.groupId) ?? null)
        : null;
      const toGroupColor = curr.groupId
        ? (groupColorMap.get(curr.groupId) ?? null)
        : null;

      routes.push({
        from: {
          city: prevDiary.city,
          country: prevDiary.country,
          latitude: prevDiary.latitude,
          longitude: prevDiary.longitude,
        },
        to: {
          city: curr.city,
          country: curr.country,
          latitude: curr.latitude,
          longitude: curr.longitude,
        },
        groupColor:
          fromGroupColor === toGroupColor ? fromGroupColor : null,
      });
    }

    prevDiary = curr;
  }

  return routes;
}
```

- [ ] **Step 4: 테스트 실행 — 전체 통과 확인**

```bash
cd /Users/onomaai/Documents/workspace/tutorial/map-diary/frontend
npm test
```

Expected: 13 tests passed (6 deriveCityMarkers + 7 deriveRoutes).

- [ ] **Step 5: 커밋**

```bash
cd /Users/onomaai/Documents/workspace/tutorial/map-diary
git add frontend/tests/lib/transforms.test.ts frontend/src/lib/transforms.ts
git commit -m "feat:deriveRoutes 변환 함수 구현 및 테스트"
```

---

## Task 6: TanStack Query API + 커스텀 훅

**Files:**
- Create: `frontend/src/lib/api.ts`
- Create: `frontend/src/hooks/use-diary-data.ts`

- [ ] **Step 1: fetchMockData 함수 생성**

`frontend/src/lib/api.ts`:

```ts
import type { MockData } from '@/types';

export async function fetchMockData(): Promise<MockData> {
  const response = await fetch('/mock-data.json');
  if (!response.ok) {
    throw new Error(`Failed to fetch mock data: ${response.status}`);
  }
  return response.json();
}
```

- [ ] **Step 2: TanStack Query 커스텀 훅 생성**

`frontend/src/hooks/use-diary-data.ts`:

```ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchMockData } from '@/lib/api';
import { deriveCityMarkers, deriveRoutes } from '@/lib/transforms';
import { useUIStore } from '@/stores/ui-store';
import type { Diary } from '@/types';

const MOCK_DATA_KEY = ['mock-data'] as const;

export function useUsers() {
  return useQuery({
    queryKey: MOCK_DATA_KEY,
    queryFn: fetchMockData,
    select: (data) => data.users,
  });
}

export function useGroups() {
  return useQuery({
    queryKey: MOCK_DATA_KEY,
    queryFn: fetchMockData,
    select: (data) => data.groups,
  });
}

export function useDiaries() {
  return useQuery({
    queryKey: MOCK_DATA_KEY,
    queryFn: fetchMockData,
    select: (data) => data.diaries,
  });
}

function filterDiaries(
  diaries: Diary[],
  selectedGroupId: string | null,
): Diary[] {
  if (selectedGroupId === null) return diaries;
  if (selectedGroupId === 'ungrouped') {
    return diaries.filter((d) => d.groupId === null);
  }
  return diaries.filter((d) => d.groupId === selectedGroupId);
}

export function useCityMarkers() {
  const selectedGroupId = useUIStore((s) => s.selectedGroupId);

  return useQuery({
    queryKey: MOCK_DATA_KEY,
    queryFn: fetchMockData,
    select: (data) => {
      const filtered = filterDiaries(data.diaries, selectedGroupId);
      return deriveCityMarkers(filtered, data.groups);
    },
  });
}

export function useRoutes() {
  const selectedGroupId = useUIStore((s) => s.selectedGroupId);

  return useQuery({
    queryKey: MOCK_DATA_KEY,
    queryFn: fetchMockData,
    select: (data) => {
      const filtered = filterDiaries(data.diaries, selectedGroupId);
      return deriveRoutes(filtered, data.groups);
    },
  });
}
```

- [ ] **Step 3: TypeScript 확인**

```bash
cd /Users/onomaai/Documents/workspace/tutorial/map-diary/frontend
npx tsc --noEmit
```

Expected: 에러 없음.

- [ ] **Step 4: 빌드 확인**

```bash
cd /Users/onomaai/Documents/workspace/tutorial/map-diary/frontend
npm run build
```

Expected: 빌드 성공.

- [ ] **Step 5: 커밋**

```bash
cd /Users/onomaai/Documents/workspace/tutorial/map-diary
git add frontend/src/lib/api.ts frontend/src/hooks/use-diary-data.ts
git commit -m "feat:TanStack Query API 함수 및 커스텀 훅 구현"
```

---

## Task 7: CLAUDE.md 업데이트 + 최종 확인

**Files:**
- Modify: `frontend/CLAUDE.md`

- [ ] **Step 1: frontend/CLAUDE.md에 Phase 1 관련 내용 추가**

`frontend/CLAUDE.md`의 `## 디렉토리 구조` 섹션을 다음으로 교체:

```markdown
## 디렉토리 구조

\```
src/
├── app/              # Next.js App Router (라우팅, 레이아웃, 페이지)
├── components/ui/    # shadcn/ui 컴포넌트
├── hooks/            # TanStack Query 커스텀 훅 (use-diary-data.ts)
├── lib/              # 유틸 함수 (transforms.ts, api.ts, utils.ts)
├── providers/        # ThemeProvider, QueryProvider
├── stores/           # Zustand 스토어 (ui-store.ts)
└── types/            # 도메인 타입 정의
tests/
└── lib/              # 변환 함수 테스트
\```
```

그리고 `## 명령어` 테이블에 추가:

```markdown
| `npm test` | Vitest 테스트 실행 |
| `npm run test:watch` | Vitest watch 모드 |
```

- [ ] **Step 2: 전체 테스트 + 빌드 최종 확인**

```bash
cd /Users/onomaai/Documents/workspace/tutorial/map-diary/frontend
npm test && npm run build
```

Expected: 13 tests passed, 빌드 성공.

- [ ] **Step 3: 커밋**

```bash
cd /Users/onomaai/Documents/workspace/tutorial/map-diary
git add frontend/CLAUDE.md
git commit -m "docs:frontend CLAUDE.md Phase 1 반영"
```
