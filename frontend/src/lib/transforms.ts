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
