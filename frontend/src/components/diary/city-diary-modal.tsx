'use client';

import { useDiaries, useGroups } from '@/hooks/use-diary-data';
import { cityKey } from '@/lib/geo';
import { useUIStore } from '@/stores/ui-store';

export function CityDiaryModal() {
  const selectedCityKey = useUIStore((s) => s.selectedCityKey);
  const setSelectedCityKey = useUIStore((s) => s.setSelectedCityKey);
  const { data: diaries } = useDiaries();
  const { data: groups } = useGroups();

  if (!selectedCityKey || !diaries) return null;

  const cityDiaries = diaries
    .filter((d) => cityKey(d.city, d.country) === selectedCityKey)
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

  if (cityDiaries.length === 0) return null;

  const { city, country } = cityDiaries[0];
  const groupNameOf = (groupId: string | null) =>
    groupId ? (groups?.find((g) => g.id === groupId)?.name ?? null) : null;

  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center bg-black/50"
      onClick={() => setSelectedCityKey(null)}
    >
      <div
        className="max-h-[70vh] w-full max-w-md overflow-y-auto rounded-lg border border-white/10 bg-neutral-900 p-6 text-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">{city}</h2>
            <p className="text-sm text-neutral-400">
              {country} · 일기 {cityDiaries.length}개
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSelectedCityKey(null)}
            className="text-neutral-400 hover:text-white"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>
        <ul className="space-y-2">
          {cityDiaries.map((diary) => {
            const groupName = groupNameOf(diary.groupId);
            return (
              <li
                key={diary.id}
                className="rounded border border-white/10 p-3"
              >
                <p className="font-medium">{diary.title}</p>
                <p className="text-sm text-neutral-400">
                  {diary.visitedDate}
                  {groupName ? ` · ${groupName}` : ''}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
