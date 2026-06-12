'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { CityCombobox } from '@/components/diary/city-combobox';
import {
  GROUP_COLORS,
  type GroupDraft,
  GroupEditor,
} from '@/components/diary/group-editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { Textarea } from '@/components/ui/textarea';
import { useDiaries, useGroups } from '@/hooks/use-diary-data';
import {
  useCreateDiary,
  useCreateGroup,
  useUpdateDiary,
} from '@/hooks/use-diary-mutations';
import type { City } from '@/lib/cities';
import { type DiaryFormValues, diaryFormSchema } from '@/lib/diary-schema';
import { cityKey } from '@/lib/geo';
import { HOME } from '@/lib/home';
import { useUIStore } from '@/stores/ui-store';

const NEW_GROUP = '__new__';

const EMPTY_GROUP: GroupDraft = {
  name: '',
  color: GROUP_COLORS[0],
  departure: HOME,
  arrival: HOME,
};

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
  const setSelectedGroupId = useUIStore((s) => s.setSelectedGroupId);
  const { data: diaries } = useDiaries();
  const { data: groups } = useGroups();
  const createDiary = useCreateDiary();
  const updateDiary = useUpdateDiary();
  const createGroup = useCreateGroup();

  const [newGroup, setNewGroup] = useState<GroupDraft>(EMPTY_GROUP);
  const [newGroupError, setNewGroupError] = useState('');

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

  const groupSelection = useWatch({ control, name: 'groupId' });
  const creatingGroup = groupSelection === NEW_GROUP;

  // 모달이 열릴 때(또는 수정 대상이 바뀔 때) 폼/새그룹 상태를 채운다.
  useEffect(() => {
    if (!diaryFormOpen) return;
    // 외부(모달 open/editing) → 폼 동기화. open 시 1회성이라 cascading render 우려 없음.
    /* eslint-disable react-hooks/set-state-in-effect */
    setNewGroup(EMPTY_GROUP);
    setNewGroupError('');
    /* eslint-enable react-hooks/set-state-in-effect */
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diaryFormOpen, editingDiaryId]);

  const pending =
    createDiary.isPending || updateDiary.isPending || createGroup.isPending;

  const onSubmit = handleSubmit(async (values) => {
    let groupId = values.groupId;
    // 새 그룹 모드면 먼저 그룹을 생성하고 그 id를 사용한다.
    if (groupId === NEW_GROUP) {
      const name = newGroup.name.trim();
      if (!name) {
        setNewGroupError('그룹 이름을 입력하세요');
        return;
      }
      const group = await createGroup.mutateAsync({
        name,
        color: newGroup.color,
        departure: newGroup.departure,
        arrival: newGroup.arrival,
      });
      groupId = group.id;
    }
    const input = {
      city: values.city,
      visitedDate: values.visitedDate,
      title: values.title,
      content: values.content,
      groupId,
    };
    if (editing) {
      await updateDiary.mutateAsync({ id: editing.id, input });
    } else {
      await createDiary.mutateAsync(input);
      // 그룹 필터가 걸려 있어도 새 일기가 보이도록 전체보기로 해제하고,
      // 추가된 도시로 카메라를 포커스한다. (setSelectedGroupId가 city/center 초기화)
      setSelectedGroupId(null);
      setSelectedCityKey(cityKey(values.city.city, values.city.country));
    }
    setDiaryFormOpen(false);
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
            <option value={NEW_GROUP}>+ 새 그룹 만들기</option>
          </select>

          {creatingGroup && (
            <div className="rounded-md border border-border bg-muted/30 p-3">
              <GroupEditor
                value={newGroup}
                onChange={(next) => {
                  setNewGroup(next);
                  if (newGroupError) setNewGroupError('');
                }}
                nameError={newGroupError}
              />
            </div>
          )}
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
