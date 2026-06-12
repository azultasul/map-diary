import { describe, expect, it } from 'vitest';
import { type City, searchCities } from '@/lib/cities';

const cities: City[] = [
  { city: 'Seoul', country: 'South Korea', continent: 'Asia', latitude: 37.5, longitude: 127 },
  { city: 'Seville', country: 'Spain', continent: 'Europe', latitude: 37.4, longitude: -6 },
  { city: 'Tokyo', country: 'Japan', continent: 'Asia', latitude: 35.7, longitude: 139.7 },
  { city: 'Busan', country: 'South Korea', continent: 'Asia', latitude: 35.2, longitude: 129 },
];

describe('searchCities', () => {
  it('빈 query는 빈 배열을 반환한다', () => {
    expect(searchCities(cities, '')).toEqual([]);
    expect(searchCities(cities, '   ')).toEqual([]);
  });

  it('도시명 prefix 매칭', () => {
    const r = searchCities(cities, 'se');
    expect(r.map((c) => c.city)).toEqual(['Seoul', 'Seville']);
  });

  it('대소문자를 무시한다', () => {
    expect(searchCities(cities, 'SEOUL')[0].city).toBe('Seoul');
  });

  it('국가명도 부분 매칭한다', () => {
    const r = searchCities(cities, 'korea');
    expect(r.map((c) => c.city).sort()).toEqual(['Busan', 'Seoul']);
  });

  it('prefix 매칭이 부분 매칭보다 앞에 온다', () => {
    // 'bu' → Busan(prefix). 'san'은 부분만 → 별도
    expect(searchCities(cities, 'bu')[0].city).toBe('Busan');
  });

  it('limit을 적용한다', () => {
    expect(searchCities(cities, 's', 2)).toHaveLength(2);
  });
});
