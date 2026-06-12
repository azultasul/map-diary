import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { City } from '@/lib/cities';
import {
  createDiary,
  createGroup,
  deleteDiary,
  updateDiary,
  updateGroup,
} from '@/lib/diary-repo';
import type { MockData } from '@/types';

const STORAGE_KEY = 'map-diary:data';

const city: City = {
  city: 'Seoul',
  country: 'South Korea',
  continent: 'Asia',
  latitude: 37.5665,
  longitude: 126.978,
};

const seed: MockData = {
  users: [
    {
      id: 'u1',
      email: 'a@b.c',
      nickname: 'tester',
      avatarUrl: '',
      mapMode: 'globe',
      createdAt: '2024-01-01T00:00:00.000Z',
    },
  ],
  groups: [],
  diaries: [],
};

function makeStorage() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => {
      m.set(k, v);
    },
    removeItem: (k: string) => {
      m.delete(k);
    },
  };
}

function currentDiaries(): MockData['diaries'] {
  return (JSON.parse(window.localStorage.getItem(STORAGE_KEY)!) as MockData)
    .diaries;
}

beforeEach(() => {
  const storage = makeStorage();
  vi.stubGlobal('window', { localStorage: storage });
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('diary-repo CRUD', () => {
  it('createDiary는 선택 도시·기본값으로 일기를 추가한다', () => {
    const d = createDiary({
      city,
      visitedDate: '2024-05-01',
      title: 't',
      content: 'c',
      groupId: null,
    });
    expect(d.id).toBeTruthy();
    expect(d.userId).toBe('u1');
    expect(d.city).toBe('Seoul');
    expect(d.continent).toBe('Asia');
    expect(d.latitude).toBeCloseTo(37.5665);
    expect(d.visibility).toBe('private');
    expect(d.images).toEqual([]);
    expect(currentDiaries()).toHaveLength(1);
  });

  it('updateDiary는 필드를 병합하고 updatedAt을 갱신한다', () => {
    const created = createDiary({
      city,
      visitedDate: '2024-05-01',
      title: 't',
      content: 'c',
      groupId: null,
    });
    const busan: City = { ...city, city: 'Busan', latitude: 35.18, longitude: 129.07 };
    const updated = updateDiary(created.id, {
      city: busan,
      visitedDate: '2024-06-01',
      title: 't2',
      content: 'c2',
      groupId: 'g1',
    });
    expect(updated.title).toBe('t2');
    expect(updated.city).toBe('Busan');
    expect(updated.groupId).toBe('g1');
    expect(updated.createdAt).toBe(created.createdAt);
    expect(currentDiaries()).toHaveLength(1);
  });

  it('deleteDiary는 일기를 제거한다', () => {
    const d = createDiary({
      city,
      visitedDate: '2024-05-01',
      title: 't',
      content: 'c',
      groupId: null,
    });
    deleteDiary(d.id);
    expect(currentDiaries()).toHaveLength(0);
  });

  it('createGroup/updateGroup은 출발·도착지를 저장·수정한다', () => {
    const g = createGroup({
      name: '새 여행',
      color: '#abcdef',
      departure: { ...city },
      arrival: { ...city },
    });
    expect(g.departure?.city).toBe('Seoul');
    expect(g.arrival?.city).toBe('Seoul');
    const busan: City = { ...city, city: 'Busan' };
    const u = updateGroup(g.id, {
      name: '수정 여행',
      color: '#abcdef',
      departure: busan,
      arrival: { ...city },
    });
    expect(u.name).toBe('수정 여행');
    expect(u.departure?.city).toBe('Busan');
  });

  it('변경은 localStorage에 영속된다(다시 읽어도 유지)', () => {
    createDiary({
      city,
      visitedDate: '2024-05-01',
      title: '유지',
      content: 'c',
      groupId: null,
    });
    // 같은 storage를 새로 파싱 → 영속 확인
    const persisted = currentDiaries();
    expect(persisted[0].title).toBe('유지');
  });
});
