import { HOME } from '@/lib/home';
import type { CityMarker, CityRef, Diary, Group, Route } from '@/types';

const refKey = (r: { city: string; country: string }) =>
  `${r.city}-${r.country}`;

export function deriveCityMarkers(
  diaries: Diary[],
  groups: Group[],
  home: CityRef = HOME,
): CityMarker[] {
  const groupColorMap = new Map(groups.map((g) => [g.id, g.color]));
  const groupMap = new Map(groups.map((g) => [g.id, g]));
  const cityMap = new Map<string, Diary[]>();

  for (const diary of diaries) {
    const key = refKey(diary);
    const existing = cityMap.get(key);
    if (existing) {
      existing.push(diary);
    } else {
      cityMap.set(key, [diary]);
    }
  }

  const markers: CityMarker[] = [];
  const markerByKey = new Map<string, CityMarker>();

  for (const [key, cityDiaries] of cityMap) {
    const first = cityDiaries[0];
    const groupIds = new Set(cityDiaries.map((d) => d.groupId));
    let groupColor: string | null = null;

    if (groupIds.size === 1) {
      const onlyGroupId = [...groupIds][0];
      groupColor = onlyGroupId ? (groupColorMap.get(onlyGroupId) ?? null) : null;
    }

    const marker: CityMarker = {
      city: first.city,
      country: first.country,
      continent: first.continent,
      latitude: first.latitude,
      longitude: first.longitude,
      diaryCount: cityDiaries.length,
      groupColor,
      diaryIds: cityDiaries.map((d) => d.id),
    };
    markers.push(marker);
    markerByKey.set(key, marker);
  }

  // 홈(출발/도착지) 마커: 현재 diaries에 존재하는 그룹들의 출발/도착지 + 그룹없음
  // 일기가 있으면 home. 이미 일기 마커가 있으면 isHome만 표시, 없으면 핀 추가.
  const presentGroupIds = new Set(diaries.map((d) => d.groupId));
  const endpoints: CityRef[] = [];
  if (presentGroupIds.has(null)) endpoints.push(home);
  for (const gid of presentGroupIds) {
    if (!gid) continue;
    const g = groupMap.get(gid);
    if (g?.departure) endpoints.push(g.departure);
    if (g?.arrival) endpoints.push(g.arrival);
  }

  const seen = new Set<string>();
  for (const ep of endpoints) {
    const key = refKey(ep);
    if (seen.has(key)) continue;
    seen.add(key);
    const existing = markerByKey.get(key);
    if (existing) {
      existing.isHome = true;
    } else {
      markers.push({
        city: ep.city,
        country: ep.country,
        continent: ep.continent,
        latitude: ep.latitude,
        longitude: ep.longitude,
        diaryCount: 0,
        groupColor: null,
        diaryIds: [],
        isHome: true,
      });
    }
  }

  return markers;
}

// 연속 동일 도시를 합친 CityRef 시퀀스
function citySequence(diaries: Diary[]): CityRef[] {
  const sorted = [...diaries].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  const seq: CityRef[] = [];
  for (const d of sorted) {
    const last = seq[seq.length - 1];
    if (last && last.city === d.city && last.country === d.country) continue;
    seq.push({
      city: d.city,
      country: d.country,
      continent: d.continent,
      latitude: d.latitude,
      longitude: d.longitude,
    });
  }
  return seq;
}

const toEndpoint = (r: CityRef) => ({
  city: r.city,
  country: r.country,
  latitude: r.latitude,
  longitude: r.longitude,
});

// 경로는 그룹 단위로 그린다: 출발지 → (그룹 내 일기 도시 날짜순) → 도착지.
// 그룹없음 일기는 항상 home → 도시들 → home. 출발/도착이 null인 그룹은 앵커 없이 날짜순만.
export function deriveRoutes(
  diaries: Diary[],
  groups: Group[],
  home: CityRef = HOME,
): Route[] {
  const groupMap = new Map(groups.map((g) => [g.id, g]));

  // groupId(null=그룹없음)별 파티션
  const byGroup = new Map<string | null, Diary[]>();
  for (const d of diaries) {
    const arr = byGroup.get(d.groupId);
    if (arr) arr.push(d);
    else byGroup.set(d.groupId, [d]);
  }

  const routes: Route[] = [];

  for (const [groupId, groupDiaries] of byGroup) {
    const group = groupId ? groupMap.get(groupId) : undefined;
    const departure = groupId ? (group?.departure ?? null) : home;
    const arrival = groupId ? (group?.arrival ?? null) : home;
    const color = groupId ? (group?.color ?? null) : null;

    const cities = citySequence(groupDiaries);
    const seq: CityRef[] = [];
    const pushUnique = (r: CityRef | null) => {
      if (!r) return;
      const last = seq[seq.length - 1];
      if (last && last.city === r.city && last.country === r.country) return;
      seq.push(r);
    };
    pushUnique(departure);
    cities.forEach(pushUnique);
    pushUnique(arrival);

    for (let i = 1; i < seq.length; i++) {
      routes.push({
        from: toEndpoint(seq[i - 1]),
        to: toEndpoint(seq[i]),
        groupColor: color,
      });
    }
  }

  return routes;
}
