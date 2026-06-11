import type { CityMarker, Diary, Group, Route } from '@/types';

export function deriveCityMarkers(
  diaries: Diary[],
  groups: Group[],
): CityMarker[] {
  const groupColorMap = new Map(groups.map((g) => [g.id, g.color]));
  const cityMap = new Map<string, Diary[]>();

  for (const diary of diaries) {
    const key = `${diary.city}-${diary.country}`;
    const existing = cityMap.get(key);
    if (existing) {
      existing.push(diary);
    } else {
      cityMap.set(key, [diary]);
    }
  }

  const markers: CityMarker[] = [];

  for (const [, cityDiaries] of cityMap) {
    const first = cityDiaries[0];
    const groupIds = new Set(cityDiaries.map((d) => d.groupId));
    let groupColor: string | null = null;

    if (groupIds.size === 1) {
      const onlyGroupId = [...groupIds][0];
      groupColor = onlyGroupId ? (groupColorMap.get(onlyGroupId) ?? null) : null;
    }

    markers.push({
      city: first.city,
      country: first.country,
      continent: first.continent,
      latitude: first.latitude,
      longitude: first.longitude,
      diaryCount: cityDiaries.length,
      groupColor,
      diaryIds: cityDiaries.map((d) => d.id),
    });
  }

  return markers;
}

export function deriveRoutes(diaries: Diary[], groups: Group[]): Route[] {
  if (diaries.length < 2) return [];

  const groupColorMap = new Map(groups.map((g) => [g.id, g.color]));
  const sorted = [...diaries].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  const routes: Route[] = [];
  let prevDiary = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const curr = sorted[i];
    const sameCity =
      prevDiary.city === curr.city && prevDiary.country === curr.country;

    if (!sameCity) {
      const fromGroupColor = prevDiary.groupId
        ? (groupColorMap.get(prevDiary.groupId) ?? null)
        : null;
      const toGroupColor = curr.groupId
        ? (groupColorMap.get(curr.groupId) ?? null)
        : null;

      routes.push({
        from: {
          city: prevDiary.city,
          country: prevDiary.country,
          latitude: prevDiary.latitude,
          longitude: prevDiary.longitude,
        },
        to: {
          city: curr.city,
          country: curr.country,
          latitude: curr.latitude,
          longitude: curr.longitude,
        },
        groupColor:
          fromGroupColor === toGroupColor ? fromGroupColor : null,
      });
    }

    prevDiary = curr;
  }

  return routes;
}
