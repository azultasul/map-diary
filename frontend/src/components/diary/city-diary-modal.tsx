'use client';

import { ChevronLeft, Pencil, Trash2 } from 'lucide-react';
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
  const selectedDiaryId = useUIStore((s) => s.selectedDiaryId);
  const setSelectedDiaryId = useUIStore((s) => s.setSelectedDiaryId);
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

  // 현재 도시 안에서 상세로 볼 일기(없으면 목록 모드). 다른 도시의 stale id는 매칭 안 됨.
  const detail = selectedDiaryId
    ? (cityDiaries.find((d) => d.id === selectedDiaryId) ?? null)
    : null;

  const closeModal = () => {
    setSelectedCityKey(null);
    setSelectedDiaryId(null);
  };

  // 수정: 모달을 닫고(포커스 해제) 폼 모달을 수정 모드로 연다.
  const startEdit = (id: string) => {
    setEditingDiaryId(id);
    setSelectedDiaryId(null);
    setSelectedCityKey(null);
    setDiaryFormOpen(true);
  };

  const detailGroupName = detail ? groupNameOf(detail.groupId) : null;

  return (
    <>
      <ResponsiveModal
        open={open}
        onOpenChange={(next) => {
          if (!next) closeModal();
        }}
        title={detail ? detail.title : city}
        description={
          detail
            ? `${detail.city}, ${detail.country} · ${detail.visitedDate}${
                detailGroupName ? ` · ${detailGroupName}` : ''
              }`
            : `${country} · 일기 ${cityDiaries.length}개`
        }
      >
        {detail ? (
          // 상세 보기
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDiaryId(null)}
              >
                <ChevronLeft /> 목록
              </Button>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="일기 수정"
                  onClick={() => startEdit(detail.id)}
                >
                  <Pencil />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="일기 삭제"
                  onClick={() => setPendingDelete(detail)}
                >
                  <Trash2 />
                </Button>
              </div>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {detail.content}
            </p>
          </div>
        ) : (
          // 목록
          <ul className="space-y-2">
            {cityDiaries.map((diary) => {
              const groupName = groupNameOf(diary.groupId);
              return (
                <li
                  key={diary.id}
                  className="flex items-stretch justify-between gap-2 rounded-md border border-border"
                >
                  <button
                    type="button"
                    onClick={() => setSelectedDiaryId(diary.id)}
                    className="min-w-0 flex-1 rounded-l-md p-3 text-left transition hover:bg-accent hover:text-accent-foreground"
                  >
                    <p className="truncate font-medium text-foreground">
                      {diary.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {diary.visitedDate}
                      {groupName ? ` · ${groupName}` : ''}
                    </p>
                  </button>
                  <div className="flex shrink-0 items-center gap-1 pr-2">
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
        )}
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
          if (pendingDelete) {
            deleteDiary.mutate(pendingDelete.id);
            // 상세에서 삭제했으면 목록으로 복귀
            if (selectedDiaryId === pendingDelete.id) setSelectedDiaryId(null);
          }
        }}
      />
    </>
  );
}
