'use client';

import { ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react';
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
          // 상세 보기 — 본문, 하단 푸터에 목록(좌)·수정·삭제(우) 아이콘 버튼(동일 크기)
          <div className="space-y-3">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {detail.content}
            </p>
            <div className="flex items-center justify-between border-t border-border pt-3">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="목록으로"
                onClick={() => setSelectedDiaryId(null)}
              >
                <ChevronLeft />
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
                  className="text-destructive hover:text-destructive"
                  onClick={() => setPendingDelete(detail)}
                >
                  <Trash2 />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          // 목록 — 행 전체가 클릭 영역(전체 hover), 우측에 chevron 어포던스
          <ul className="space-y-2">
            {cityDiaries.map((diary) => {
              const groupName = groupNameOf(diary.groupId);
              return (
                <li key={diary.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedDiaryId(diary.id)}
                    className="group flex w-full items-center gap-2 rounded-md border border-border p-3 text-left transition hover:border-foreground/20 hover:bg-accent hover:text-accent-foreground"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-foreground">
                        {diary.title}
                      </span>
                      <span className="block text-sm text-muted-foreground">
                        {diary.visitedDate}
                        {groupName ? ` · ${groupName}` : ''}
                      </span>
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
                  </button>
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
            if (selectedDiaryId === pendingDelete.id) setSelectedDiaryId(null);
          }
        }}
      />
    </>
  );
}
