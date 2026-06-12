'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  type CreateDiaryInput,
  type CreateGroupInput,
  type UpdateDiaryInput,
  createDiary,
  createGroup,
  deleteDiary,
  updateDiary,
} from '@/lib/diary-repo';

const MOCK_DATA_KEY = ['mock-data'] as const;

// 모든 뮤테이션은 성공 시 ['mock-data']를 무효화 → useDiaries/useCityMarkers/
// useRoutes(동일 queryKey)가 재계산되어 목록·핀·경로가 즉시 갱신된다.
export function useCreateDiary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateDiaryInput) => createDiary(input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: MOCK_DATA_KEY }),
  });
}

export function useUpdateDiary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateDiaryInput }) =>
      updateDiary(id, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: MOCK_DATA_KEY }),
  });
}

export function useDeleteDiary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => deleteDiary(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: MOCK_DATA_KEY }),
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateGroupInput) => createGroup(input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: MOCK_DATA_KEY }),
  });
}
