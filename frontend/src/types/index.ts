export type MapMode = 'globe' | 'map2d';

export type Visibility = 'private' | 'shared' | 'friends' | 'public';

export type Continent =
  | 'Asia'
  | 'Europe'
  | 'North America'
  | 'South America'
  | 'Africa'
  | 'Oceania'
  | 'Antarctica';

export interface User {
  id: string;
  email: string;
  nickname: string;
  avatarUrl: string;
  mapMode: MapMode;
  createdAt: string;
}

// 도시 참조(좌표 포함). 그룹 출발/도착지·홈 위치·마커에 공통으로 쓴다.
export interface CityRef {
  city: string;
  country: string;
  continent: Continent;
  latitude: number;
  longitude: number;
}

export interface Group {
  id: string;
  userId: string;
  name: string;
  color: string;
  // 트립 경로의 출발지/도착지. null이면 앵커 없이 날짜순으로만 연결.
  departure: CityRef | null;
  arrival: CityRef | null;
  visibility: Visibility;
  createdAt: string;
}

export interface DiaryImage {
  id: string;
  imageUrl: string;
  orderIndex: number;
}

export interface Diary {
  id: string;
  userId: string;
  groupId: string | null;
  continent: Continent;
  country: string;
  city: string;
  latitude: number;
  longitude: number;
  visitedDate: string;
  title: string;
  content: string;
  visibility: Visibility;
  images: DiaryImage[];
  createdAt: string;
  updatedAt: string;
}

export interface CityMarker {
  city: string;
  country: string;
  continent: Continent;
  latitude: number;
  longitude: number;
  diaryCount: number;
  groupColor: string | null;
  diaryIds: string[];
  // 그룹 출발/도착지(홈)인 도시. 일기가 없어도(diaryCount 0) 홈 핀으로 표시된다.
  isHome?: boolean;
}

export interface Route {
  from: { city: string; country: string; latitude: number; longitude: number };
  to: { city: string; country: string; latitude: number; longitude: number };
  groupColor: string | null;
}

export interface MockData {
  users: User[];
  groups: Group[];
  diaries: Diary[];
}
