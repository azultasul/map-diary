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

export interface Group {
  id: string;
  userId: string;
  name: string;
  color: string;
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
}

export interface Route {
  from: { city: string; country: string; latitude: number; longitude: number };
  to: { city: string; country: string; latitude: number; longitude: number };
  groupColor: string | null;
}
