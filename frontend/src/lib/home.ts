import type { CityRef } from '@/types';

/**
 * 홈(기준) 위치 — 그룹 없는 일기의 출발/도착지, 새 그룹의 기본 출발/도착지.
 *
 * 현재는 서울 고정. 추후 사용자 거주지 설정(users 프로필 등)이 생기면 이 상수 대신
 * 그 값을 transforms/폼에 주입하도록 교체한다. (deriveRoutes/deriveCityMarkers는
 * home을 파라미터로 받으므로 호출부만 바꾸면 됨.)
 */
export const HOME: CityRef = {
  city: 'Seoul',
  country: 'South Korea',
  continent: 'Asia',
  latitude: 37.5665,
  longitude: 126.978,
};
