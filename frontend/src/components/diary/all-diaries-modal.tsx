'use client';

import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { useDiaries, useGroups } from '@/hooks/use-diary-data';
import { cityKey } from '@/lib/geo';
import { useUIStore } from '@/stores/ui-store';

export function AllDiariesModal() {
  const allDiariesOpen = useUIStore((s) => s.allDiariesOpen);
  const setAllDiariesOpen = useUIStore((s) => s.setAllDiariesOpen);
  const setSelectedCityKey = useUIStore((s) => s.setSelectedCityKey);
  const { data: diaries } = useDiaries();
  const { data: groups } = useGroups();

  const sorted = diaries
    ? [...diaries].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      )
    : [];

  const groupNameOf = (groupId: string | null) =>
    groupId ? (groups?.find((g) => g.id === groupId)?.name ?? null) : null;

  const focusCity = (city: string, country: string) => {
    // 해당 도시로 카메라 포커스 → 정착 후 도시 모달이 열린다
    setSelectedCityKey(cityKey(city, country));
    setAllDiariesOpen(false);
  };

  return (
    <ResponsiveModal
      open={allDiariesOpen}
      onOpenChange={setAllDiariesOpen}
      title="전체 일기"
      description={`총 ${sorted.length}개`}
    >
      <ul className="space-y-2">
        {sorted.map((diary) => {
          const groupName = groupNameOf(diary.groupId);
          return (
            <li key={diary.id}>
              <button
                type="button"
                onClick={() => focusCity(diary.city, diary.country)}
                className="w-full rounded-md border border-border p-3 text-left transition hover:bg-accent hover:text-accent-foreground"
              >
                <p className="font-medium text-foreground">{diary.title}</p>
                <p className="text-sm text-muted-foreground">
                  {diary.city}, {diary.country} · {diary.visitedDate}
                  {groupName ? ` · ${groupName}` : ''}
                </p>
              </button>
            </li>
          );
        })}
      </ul>
    </ResponsiveModal>
  );
}
