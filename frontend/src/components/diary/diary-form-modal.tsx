'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { CityCombobox } from '@/components/diary/city-combobox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { Textarea } from '@/components/ui/textarea';
import { useDiaries, useGroups } from '@/hooks/use-diary-data';
import { useCreateDiary, useUpdateDiary } from '@/hooks/use-diary-mutations';
import type { City } from '@/lib/cities';
import { type DiaryFormValues, diaryFormSchema } from '@/lib/diary-schema';
import { cityKey } from '@/lib/geo';
import { useUIStore } from '@/stores/ui-store';

const EMPTY: DiaryFormValues = {
  title: '',
  content: '',
  visitedDate: '',
  city: undefined as unknown as City,
  groupId: null,
};

export function DiaryFormModal() {
  const diaryFormOpen = useUIStore((s) => s.diaryFormOpen);
  const setDiaryFormOpen = useUIStore((s) => s.setDiaryFormOpen);
  const editingDiaryId = useUIStore((s) => s.editingDiaryId);
  const setSelectedCityKey = useUIStore((s) => s.setSelectedCityKey);
  const { data: diaries } = useDiaries();
  const { data: groups } = useGroups();
  const createDiary = useCreateDiary();
  const updateDiary = useUpdateDiary();

  const editing = editingDiaryId
    ? (diaries?.find((d) => d.id === editingDiaryId) ?? null)
    : null;

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DiaryFormValues>({
    resolver: zodResolver(diaryFormSchema),
    defaultValues: EMPTY,
  });

  // 모달이 열릴 때(또는 수정 대상이 바뀔 때) 폼을 채운다.
  useEffect(() => {
    if (!diaryFormOpen) return;
    if (editing) {
      reset({
        title: editing.title,
        content: editing.content,
        visitedDate: editing.visitedDate,
        groupId: editing.groupId,
        city: {
          city: editing.city,
          country: editing.country,
          continent: editing.continent,
          latitude: editing.latitude,
          longitude: editing.longitude,
        },
      });
    } else {
      reset(EMPTY);
    }
    // editing.id를 의존성으로 — 객체 자체는 매 렌더 새로 생성될 수 있어 id로 고정
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diaryFormOpen, editingDiaryId]);

  const pending = createDiary.isPending || updateDiary.isPending;

  const onSubmit = handleSubmit((values) => {
    const input = {
      city: values.city,
      visitedDate: values.visitedDate,
      title: values.title,
      content: values.content,
      groupId: values.groupId,
    };
    if (editing) {
      updateDiary.mutate(
        { id: editing.id, input },
        { onSuccess: () => setDiaryFormOpen(false) },
      );
    } else {
      createDiary.mutate(input, {
        onSuccess: () => {
          // 작성 도시를 포커스 → 카메라 이동 후 해당 도시 일기 목록이 열린다
          setSelectedCityKey(cityKey(values.city.city, values.city.country));
          setDiaryFormOpen(false);
        },
      });
    }
  });

  return (
    <ResponsiveModal
      open={diaryFormOpen}
      onOpenChange={setDiaryFormOpen}
      title={editing ? '일기 수정' : '일기 추가'}
    >
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="diary-title">제목</Label>
          <Input
            id="diary-title"
            placeholder="제목"
            aria-invalid={!!errors.title}
            {...register('title')}
          />
          {errors.title && (
            <p className="text-xs text-destructive">{errors.title.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>도시</Label>
          <Controller
            control={control}
            name="city"
            render={({ field }) => (
              <CityCombobox
                value={field.value ?? null}
                onChange={field.onChange}
                invalid={!!errors.city}
              />
            )}
          />
          {errors.city && (
            <p className="text-xs text-destructive">{errors.city.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="diary-date">여행 날짜</Label>
          <Input
            id="diary-date"
            type="date"
            aria-invalid={!!errors.visitedDate}
            {...register('visitedDate')}
          />
          {errors.visitedDate && (
            <p className="text-xs text-destructive">
              {errors.visitedDate.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="diary-group">그룹</Label>
          <select
            id="diary-group"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
            {...register('groupId', {
              setValueAs: (v) => (v === '' ? null : v),
            })}
          >
            <option value="">그룹 없음</option>
            {groups?.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="diary-content">내용</Label>
          <Textarea
            id="diary-content"
            rows={4}
            placeholder="내용"
            aria-invalid={!!errors.content}
            {...register('content')}
          />
          {errors.content && (
            <p className="text-xs text-destructive">{errors.content.message}</p>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setDiaryFormOpen(false)}
          >
            닫기
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? '저장 중…' : '저장'}
          </Button>
        </div>
      </form>
    </ResponsiveModal>
  );
}
