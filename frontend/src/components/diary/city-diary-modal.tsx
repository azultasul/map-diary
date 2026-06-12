'use client';

import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { useDiaries, useGroups } from '@/hooks/use-diary-data';
import { useDeleteDiary } from '@/hooks/use-diary-mutations';
import { cityKey } from '@/lib/geo';
import { useUIStore } from '@/stores/ui-store';
import type { Diary } from '@/types';

export function CityDiaryModal() {
  const selectedCityKey = useUIStore((s) => s.selectedCityKey);
  const centeredCityKey = useUIStore((s) => s.centeredCityKey);
  const setSelectedCityKey = useUIStore((s) => s.setSelectedCityKey);
  const setEditingDiaryId = useUIStore((s) => s.setEditingDiaryId);
  const setDiaryFormOpen = useUIStore((s) => s.setDiaryFormOpen);
  const { data: diaries } = useDiaries();
  const { data: groups } = useGroups();
  const deleteDiary = useDeleteDiary();
  const [pendingDelete, setPendingDelete] = useState<Diary | null>(null);

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

  // 수정: 도시 모달을 닫고(포커스 해제) 폼 모달을 수정 모드로 연다.
  const startEdit = (id: string) => {
    setEditingDiaryId(id);
    setSelectedCityKey(null);
    setDiaryFormOpen(true);
  };

  return (
    <>
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
              <li
                key={diary.id}
                className="flex items-start justify-between gap-2 rounded-md border border-border p-3"
              >
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{diary.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {diary.visitedDate}
                    {groupName ? ` · ${groupName}` : ''}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="일기 수정"
                    onClick={() => startEdit(diary.id)}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="일기 삭제"
                    onClick={() => setPendingDelete(diary)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </ResponsiveModal>

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(next) => {
          if (!next) setPendingDelete(null);
        }}
        title="일기를 삭제할까요?"
        description={
          pendingDelete
            ? `"${pendingDelete.title}" — 삭제하면 되돌릴 수 없습니다.`
            : undefined
        }
        onConfirm={() => {
          if (pendingDelete) deleteDiary.mutate(pendingDelete.id);
        }}
      />
    </>
  );
}
