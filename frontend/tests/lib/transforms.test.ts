import { describe, expect, it } from 'vitest';
import { deriveCityMarkers, deriveRoutes } from '@/lib/transforms';
import type { CityRef, Diary, Group } from '@/types';

const SEOUL: CityRef = {
  city: 'Seoul',
  country: 'South Korea',
  continent: 'Asia',
  latitude: 37.5665,
  longitude: 126.978,
};

// 기본 그룹은 출발/도착 없음(null) → 앵커 없이 날짜순만
const groups: Group[] = [
  {
    id: 'group_a',
    userId: 'user_001',
    name: 'Trip A',
    color: '#FF0000',
    departure: null,
    arrival: null,
    visibility: 'private',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'group_b',
    userId: 'user_001',
    name: 'Trip B',
    color: '#00FF00',
    departure: null,
    arrival: null,
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

  it('그룹 출발/도착지는 일기가 없어도 홈 마커로 표시', () => {
    const gWithEnds: Group[] = [
      { ...groups[0], departure: SEOUL, arrival: SEOUL },
    ];
    const diaries: Diary[] = [
      makeDiary({ id: 'd1', city: 'Osaka', country: 'Japan', latitude: 34.6937, longitude: 135.5023, groupId: 'group_a' }),
    ];
    const markers = deriveCityMarkers(diaries, gWithEnds, SEOUL);
    const seoul = markers.find((m) => m.city === 'Seoul');
    expect(seoul?.isHome).toBe(true);
    expect(seoul?.diaryCount).toBe(0);
  });

  it('그룹 없는 일기가 있으면 HOME 마커를 추가한다', () => {
    const diaries: Diary[] = [
      makeDiary({ id: 'd1', city: 'Bangkok', country: 'Thailand', latitude: 13.7, longitude: 100.5, groupId: null }),
    ];
    const markers = deriveCityMarkers(diaries, groups, SEOUL);
    expect(markers.find((m) => m.city === 'Seoul')?.isHome).toBe(true);
  });

  it('빈 배열 → 빈 결과', () => {
    const markers = deriveCityMarkers([], groups);
    expect(markers).toEqual([]);
  });
});

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

  it('서로 다른 그룹은 각자 독립 경로(교차 경로 없음)', () => {
    const diaries: Diary[] = [
      makeDiary({ id: 'd1', city: 'Tokyo', country: 'Japan', latitude: 35.6762, longitude: 139.6503, groupId: 'group_a', createdAt: '2026-01-01T01:00:00.000Z' }),
      makeDiary({ id: 'd2', city: 'Osaka', country: 'Japan', latitude: 34.6937, longitude: 135.5023, groupId: 'group_a', createdAt: '2026-01-01T02:00:00.000Z' }),
      makeDiary({ id: 'd3', city: 'Sydney', country: 'Australia', latitude: -33.8, longitude: 151.2, groupId: 'group_b', createdAt: '2026-01-01T03:00:00.000Z' }),
      makeDiary({ id: 'd4', city: 'Melbourne', country: 'Australia', latitude: -37.8, longitude: 144.9, groupId: 'group_b', createdAt: '2026-01-01T04:00:00.000Z' }),
    ];
    const routes = deriveRoutes(diaries, groups);
    expect(routes).toHaveLength(2);
    // group_a: Osaka→Sydney 같은 교차 경로는 생기지 않는다
    expect(
      routes.some((r) => r.from.city === 'Osaka' && r.to.city === 'Sydney'),
    ).toBe(false);
  });

  it('그룹 출발/도착지 → HOME 앵커로 감싼 경로', () => {
    const gWithEnds: Group[] = [
      { ...groups[0], departure: SEOUL, arrival: SEOUL },
    ];
    const diaries: Diary[] = [
      makeDiary({ id: 'd1', city: 'Osaka', country: 'Japan', latitude: 34.6937, longitude: 135.5023, groupId: 'group_a', createdAt: '2026-01-01T01:00:00.000Z' }),
    ];
    const routes = deriveRoutes(diaries, gWithEnds);
    expect(routes.map((r) => [r.from.city, r.to.city])).toEqual([
      ['Seoul', 'Osaka'],
      ['Osaka', 'Seoul'],
    ]);
  });

  it('그룹 없는 일기 → 항상 HOME에서 출발·도착', () => {
    const diaries: Diary[] = [
      makeDiary({ id: 'd1', city: 'Bangkok', country: 'Thailand', latitude: 13.7, longitude: 100.5, groupId: null, createdAt: '2026-01-01T01:00:00.000Z' }),
    ];
    const routes = deriveRoutes(diaries, groups, SEOUL);
    expect(routes.map((r) => [r.from.city, r.to.city])).toEqual([
      ['Seoul', 'Bangkok'],
      ['Bangkok', 'Seoul'],
    ]);
  });

  it('일기 1개 + 그룹 앵커 없음 → 경로 없음', () => {
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
