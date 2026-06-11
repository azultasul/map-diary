'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchMockData } from '@/lib/api';
import { deriveCityMarkers, deriveRoutes } from '@/lib/transforms';
import { useUIStore } from '@/stores/ui-store';
import type { Diary } from '@/types';

const MOCK_DATA_KEY = ['mock-data'] as const;

export function useUsers() {
  return useQuery({
    queryKey: MOCK_DATA_KEY,
    queryFn: fetchMockData,
    select: (data) => data.users,
  });
}

export function useGroups() {
  return useQuery({
    queryKey: MOCK_DATA_KEY,
    queryFn: fetchMockData,
    select: (data) => data.groups,
  });
}

export function useDiaries() {
  return useQuery({
    queryKey: MOCK_DATA_KEY,
    queryFn: fetchMockData,
    select: (data) => data.diaries,
  });
}

function filterDiaries(
  diaries: Diary[],
  selectedGroupId: string | null,
): Diary[] {
  if (selectedGroupId === null) return diaries;
  if (selectedGroupId === 'ungrouped') {
    return diaries.filter((d) => d.groupId === null);
  }
  return diaries.filter((d) => d.groupId === selectedGroupId);
}

export function useCityMarkers() {
  const selectedGroupId = useUIStore((s) => s.selectedGroupId);

  return useQuery({
    queryKey: MOCK_DATA_KEY,
    queryFn: fetchMockData,
    select: (data) => {
      const filtered = filterDiaries(data.diaries, selectedGroupId);
      return deriveCityMarkers(filtered, data.groups);
    },
  });
}

export function useRoutes() {
  const selectedGroupId = useUIStore((s) => s.selectedGroupId);

  return useQuery({
    queryKey: MOCK_DATA_KEY,
    queryFn: fetchMockData,
    select: (data) => {
      const filtered = filterDiaries(data.diaries, selectedGroupId);
      return deriveRoutes(filtered, data.groups);
    },
  });
}
