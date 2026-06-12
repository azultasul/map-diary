import type { City } from '@/lib/cities';
import type { Diary, MockData } from '@/types';

// Phase 5 영속 레이어: localStorage 백엔드.
// 첫 로드 시 /mock-data.json으로 시드한 뒤, 이후 모든 CRUD는 localStorage에 반영한다.
// Phase 6에서는 이 모듈만 Supabase 호출로 교체한다(상위 훅/쿼리 인터페이스 불변).
const STORAGE_KEY = 'map-diary:data';

function read(): MockData | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as MockData;
  } catch {
    return null;
  }
}

function write(data: MockData): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

async function seed(): Promise<MockData> {
  const response = await fetch('/mock-data.json');
  if (!response.ok) {
    throw new Error(`Failed to seed mock data: ${response.status}`);
  }
  const data = (await response.json()) as MockData;
  write(data);
  return data;
}

// 현재 데이터를 반환한다. localStorage가 비어 있으면 목 JSON으로 시드한다.
export async function loadData(): Promise<MockData> {
  return read() ?? (await seed());
}

// 동기 헬퍼: 뮤테이션은 항상 loadData() 이후(=시드 완료) 호출되므로 read()가 보장된다.
function requireData(): MockData {
  const data = read();
  if (!data) {
    throw new Error('Diary repo not initialized — loadData() must run first');
  }
  return data;
}

export interface CreateDiaryInput {
  city: City;
  visitedDate: string;
  title: string;
  content: string;
  groupId: string | null;
}

export function createDiary(input: CreateDiaryInput): Diary {
  const data = requireData();
  const now = new Date().toISOString();
  const diary: Diary = {
    id: crypto.randomUUID(),
    userId: data.users[0]?.id ?? 'mock-user',
    groupId: input.groupId,
    continent: input.city.continent,
    country: input.city.country,
    city: input.city.city,
    latitude: input.city.latitude,
    longitude: input.city.longitude,
    visitedDate: input.visitedDate,
    title: input.title,
    content: input.content,
    visibility: 'private',
    images: [],
    createdAt: now,
    updatedAt: now,
  };
  write({ ...data, diaries: [...data.diaries, diary] });
  return diary;
}

export interface UpdateDiaryInput {
  city: City;
  visitedDate: string;
  title: string;
  content: string;
  groupId: string | null;
}

export function updateDiary(id: string, input: UpdateDiaryInput): Diary {
  const data = requireData();
  const existing = data.diaries.find((d) => d.id === id);
  if (!existing) throw new Error(`Diary not found: ${id}`);
  const updated: Diary = {
    ...existing,
    groupId: input.groupId,
    continent: input.city.continent,
    country: input.city.country,
    city: input.city.city,
    latitude: input.city.latitude,
    longitude: input.city.longitude,
    visitedDate: input.visitedDate,
    title: input.title,
    content: input.content,
    updatedAt: new Date().toISOString(),
  };
  write({
    ...data,
    diaries: data.diaries.map((d) => (d.id === id ? updated : d)),
  });
  return updated;
}

export function deleteDiary(id: string): void {
  const data = requireData();
  write({ ...data, diaries: data.diaries.filter((d) => d.id !== id) });
}
