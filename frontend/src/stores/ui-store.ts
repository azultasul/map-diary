import { create } from 'zustand';
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
}

export const useUIStore = create<UIState>((set) => ({
  mapMode: 'globe',
  setMapMode: (mode) => set({ mapMode: mode }),

  selectedGroupId: null,
  setSelectedGroupId: (groupId) => set({ selectedGroupId: groupId }),

  theme: 'dark',
  setTheme: (theme) => set({ theme }),

  selectedCityKey: null,
  setSelectedCityKey: (key) => set({ selectedCityKey: key }),

  selectedDiaryId: null,
  setSelectedDiaryId: (id) => set({ selectedDiaryId: id }),
}));
