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

  it('한국어로 검색한다(ko prefix + q 부분일치)', () => {
    const ko: City[] = [
      {
        city: 'Seoul',
        country: 'South Korea',
        continent: 'Asia',
        latitude: 37.5,
        longitude: 127,
        ko: '서울',
        countryKo: '대한민국',
        q: 'seoul 서울 경성 south korea 대한민국 한국',
      },
      {
        city: 'Sydney',
        country: 'Australia',
        continent: 'Oceania',
        latitude: -33.8,
        longitude: 151.2,
        ko: '시드니',
        countryKo: '오스트레일리아',
        q: 'sydney 시드니 australia 오스트레일리아 호주',
      },
    ];
    // 도시 한글명 prefix
    expect(searchCities(ko, '서울')[0].city).toBe('Seoul');
    // 국가 한글 별칭(q) 부분일치
    expect(searchCities(ko, '한국').map((c) => c.city)).toEqual(['Seoul']);
    expect(searchCities(ko, '호주').map((c) => c.city)).toEqual(['Sydney']);
  });
});
