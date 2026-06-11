'use client';

import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { useDiaries, useGroups } from '@/hooks/use-diary-data';
import { cityKey } from '@/lib/geo';
import { useUIStore } from '@/stores/ui-store';

export function CityDiaryModal() {
  const selectedCityKey = useUIStore((s) => s.selectedCityKey);
  const centeredCityKey = useUIStore((s) => s.centeredCityKey);
  const setSelectedCityKey = useUIStore((s) => s.setSelectedCityKey);
  const { data: diaries } = useDiaries();
  const { data: groups } = useGroups();

  const cityDiaries =
    selectedCityKey && diaries
      ? diaries
          .filter((d) => cityKey(d.city, d.country) === selectedCityKey)
          .sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          )
      : [];

  // 카메라가 선택 도시를 중앙에 정착시킨 뒤(centeredCityKey 일치)에만 모달을 연다.
  const open =
    selectedCityKey !== null &&
    centeredCityKey === selectedCityKey &&
    cityDiaries.length > 0;

  const city = cityDiaries[0]?.city ?? '';
  const country = cityDiaries[0]?.country ?? '';

  const groupNameOf = (groupId: string | null) =>
    groupId ? (groups?.find((g) => g.id === groupId)?.name ?? null) : null;

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={(next) => {
        if (!next) setSelectedCityKey(null);
      }}
      title={city}
      description={`${country} · 일기 ${cityDiaries.length}개`}
    >
      <ul className="space-y-2">
        {cityDiaries.map((diary) => {
          const groupName = groupNameOf(diary.groupId);
          return (
            <li key={diary.id} className="rounded-md border border-border p-3">
              <p className="font-medium text-foreground">{diary.title}</p>
              <p className="text-sm text-muted-foreground">
                {diary.visitedDate}
                {groupName ? ` · ${groupName}` : ''}
              </p>
            </li>
          );
        })}
      </ul>
    </ResponsiveModal>
  );
}
