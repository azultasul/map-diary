import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MapMode } from '@/types';

interface UIState {
  mapMode: MapMode;
  setMapMode: (mode: MapMode) => void;

  selectedGroupId: string | null;
  setSelectedGroupId: (groupId: string | null) => void;

  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;

  selectedCityKey: string | null;
  setSelectedCityKey: (key: string | null) => void;

  selectedDiaryId: string | null;
  setSelectedDiaryId: (id: string | null) => void;

  hoveredCityKey: string | null;
  setHoveredCityKey: (key: string | null) => void;

  cameraDistance: number;
  setCameraDistance: (distance: number) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      mapMode: 'globe',
      // 모드별 거리 스케일이 다르므로 전환 시 해당 모드의 초기 거리로 재설정한다
      setMapMode: (mode) =>
        set({ mapMode: mode, cameraDistance: mode === 'globe' ? 3 : 1.8 }),

      selectedGroupId: null,
      // 필터 변경 시 선택된 도시(모달/카메라 포커스)도 함께 해제한다
      setSelectedGroupId: (groupId) =>
        set({ selectedGroupId: groupId, selectedCityKey: null }),

      theme: 'dark',
      setTheme: (theme) => set({ theme }),

      selectedCityKey: null,
      setSelectedCityKey: (key) => set({ selectedCityKey: key }),

      selectedDiaryId: null,
      setSelectedDiaryId: (id) => set({ selectedDiaryId: id }),

      hoveredCityKey: null,
      setHoveredCityKey: (key) => set({ hoveredCityKey: key }),

      cameraDistance: 3,
      setCameraDistance: (distance) => set({ cameraDistance: distance }),
    }),
    {
      name: 'map-diary-ui',
      partialize: (state) => ({ mapMode: state.mapMode }),
      // SSR hydration mismatch 방지: 마운트 후 수동 rehydrate (map-view.tsx)
      skipHydration: true,
    },
  ),
);
