import type { CityRef } from '@/types';

// 일기/그룹 출발·도착 선택용 데이터셋 항목. CityRef(좌표 포함)에 검색·표시용 한글을 더한다.
export interface City extends CityRef {
  // 한글 표시명(있을 때) — 도시/국가
  ko?: string;
  countryKo?: string;
  // 검색용 통합 문자열(영문·한글 별칭 모두 소문자로 결합). 데이터셋에만 존재.
  q?: string;
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

// 대소문자 무시. 한국어/영어 모두 매칭(데이터셋의 q에 별칭이 결합돼 있음).
// 도시명(영/한)이 query로 "시작"하는 항목을 앞에, 그 외 부분일치(q)를 뒤에 둔다.
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
    const ko = c.ko?.toLowerCase() ?? '';
    if (city.startsWith(q) || ko.startsWith(q)) {
      starts.push(c);
    } else if (
      c.q
        ? c.q.includes(q)
        : city.includes(q) || c.country.toLowerCase().includes(q)
    ) {
      contains.push(c);
    }
    if (starts.length >= limit) break;
  }
  return [...starts, ...contains].slice(0, limit);
}
