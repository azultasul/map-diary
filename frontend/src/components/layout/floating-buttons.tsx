'use client';

import { useState } from 'react';
import { useGroups } from '@/hooks/use-diary-data';
import { useUIStore } from '@/stores/ui-store';

interface FilterOption {
  id: string | null;
  name: string;
  color: string | null;
}

export function FloatingButtons() {
  const [filterOpen, setFilterOpen] = useState(false);
  const { data: groups } = useGroups();
  const selectedGroupId = useUIStore((s) => s.selectedGroupId);
  const setSelectedGroupId = useUIStore((s) => s.setSelectedGroupId);
  const mapMode = useUIStore((s) => s.mapMode);
  const setMapMode = useUIStore((s) => s.setMapMode);

  const hasGroups = !!groups && groups.length > 0;

  const options: FilterOption[] = hasGroups
    ? [
        { id: null, name: '전체 보기', color: null },
        ...groups.map((g) => ({ id: g.id, name: g.name, color: g.color })),
        { id: 'ungrouped', name: '그룹 없음', color: null },
      ]
    : [];

  return (
    <div className="absolute bottom-6 right-6 z-10 flex flex-col items-end gap-2">
      {hasGroups && filterOpen && (
        <ul className="rounded-lg border border-white/10 bg-neutral-900/90 p-2 text-sm text-white">
          {options.map((option) => (
            <li key={option.id ?? 'all'}>
              <button
                type="button"
                onClick={() => {
                  setSelectedGroupId(option.id);
                  setFilterOpen(false);
                }}
                className={`flex w-full items-center gap-2 rounded px-3 py-1.5 text-left hover:bg-white/10 ${
                  selectedGroupId === option.id ? 'bg-white/15' : ''
                }`}
              >
                {option.color && (
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: option.color }}
                  />
                )}
                {option.name}
              </button>
            </li>
          ))}
        </ul>
      )}
      {hasGroups && (
        <button
          type="button"
          onClick={() => setFilterOpen((open) => !open)}
          className="rounded-full border border-white/15 bg-neutral-900/80 px-4 py-2 text-sm text-white hover:bg-neutral-800"
        >
          그룹 필터
        </button>
      )}
      <button
        type="button"
        onClick={() => setMapMode(mapMode === 'globe' ? 'map2d' : 'globe')}
        className="rounded-full border border-white/15 bg-neutral-900/80 px-4 py-2 text-sm text-white hover:bg-neutral-800"
      >
        {mapMode === 'globe' ? '2D 지도' : '지구본'}
      </button>
    </div>
  );
}
