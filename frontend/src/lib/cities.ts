import type { Continent } from '@/types';

// 일기 작성 시 도시 검색·선택용 데이터셋의 한 항목.
// 도시 선택 시 diary의 city/country/continent/latitude/longitude를 채운다.
export interface City {
  city: string;
  country: string;
  continent: Continent;
  latitude: number;
  longitude: number;
}

let cache: City[] | null = null;

// public/cities.json(주요 도시 + 기존 목 도시)을 한 번만 불러와 캐시한다.
export async function loadCities(): Promise<City[]> {
  if (cache) return cache;
  const response = await fetch('/cities.json');
  if (!response.ok) {
    throw new Error(`Failed to fetch cities: ${response.status}`);
  }
  cache = (await response.json()) as City[];
  return cache;
}

// 대소문자 무시, 도시명 우선·국가명 보조 매칭. query가 비면 빈 배열.
// 도시명이 query로 "시작"하는 항목을 앞에, 그 외 부분일치를 뒤에 둔다.
export function searchCities(
  cities: City[],
  query: string,
  limit = 30,
): City[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const starts: City[] = [];
  const contains: City[] = [];
  for (const c of cities) {
    const city = c.city.toLowerCase();
    if (city.startsWith(q)) {
      starts.push(c);
    } else if (city.includes(q) || c.country.toLowerCase().includes(q)) {
      contains.push(c);
    }
    if (starts.length >= limit) break;
  }
  return [...starts, ...contains].slice(0, limit);
}
