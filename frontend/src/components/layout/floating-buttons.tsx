'use client';

import { Check, Globe, List, Map as MapIcon, Plus, Settings2, SlidersHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { useDiaries, useGroups } from '@/hooks/use-diary-data';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui-store';

interface FilterOption {
  id: string | null;
  name: string;
  color: string | null;
}

// glassmorphism 플로팅 버튼 — 시맨틱 토큰으로 라이트/다크 양쪽 대응, 터치 타겟 44px
const FAB_BASE =
  'flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background/70 text-foreground shadow-lg backdrop-blur-md transition hover:bg-accent hover:text-accent-foreground';

export function FloatingButtons() {
  const { data: groups } = useGroups();
  const { data: diaries } = useDiaries();
  const selectedGroupId = useUIStore((s) => s.selectedGroupId);
  const setSelectedGroupId = useUIStore((s) => s.setSelectedGroupId);
  const mapMode = useUIStore((s) => s.mapMode);
  const setMapMode = useUIStore((s) => s.setMapMode);
  const setAllDiariesOpen = useUIStore((s) => s.setAllDiariesOpen);
  const setDiaryFormOpen = useUIStore((s) => s.setDiaryFormOpen);
  const setGroupManageOpen = useUIStore((s) => s.setGroupManageOpen);

  const hasGroups = !!groups && groups.length > 0;
  const hasUngrouped = !!diaries && diaries.some((d) => d.groupId === null);

  const options: FilterOption[] = hasGroups
    ? [
        { id: null, name: '전체 보기', color: null },
        ...groups.map((g) => ({ id: g.id, name: g.name, color: g.color })),
        ...(hasUngrouped
          ? [{ id: 'ungrouped', name: '그룹 없음', color: null } as FilterOption]
          : []),
      ]
    : [];

  return (
    <div
      className={cn(
        'absolute z-10 flex gap-2',
        'max-md:bottom-4 max-md:left-1/2 max-md:-translate-x-1/2 max-md:flex-row',
        'md:bottom-6 md:right-6 md:flex-col md:items-end',
      )}
    >
      <ThemeToggle className={FAB_BASE} />

      {hasGroups && (
        <DropdownMenu>
          <DropdownMenuTrigger
            className={FAB_BASE}
            aria-label="그룹 필터"
            title="그룹 필터"
          >
            <SlidersHorizontal className="h-5 w-5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-44">
            {options.map((option) => {
              const active = selectedGroupId === option.id;
              return (
                <DropdownMenuItem
                  key={option.id ?? 'all'}
                  onClick={() => setSelectedGroupId(option.id)}
                  className="gap-2"
                >
                  <span className="flex h-3 w-3 items-center justify-center">
                    {option.color ? (
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: option.color }}
                      />
                    ) : null}
                  </span>
                  <span className="flex-1">{option.name}</span>
                  {active ? <Check className="h-4 w-4" /> : null}
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setGroupManageOpen(true)}
              className="gap-2"
            >
              <span className="flex h-3 w-3 items-center justify-center">
                <Settings2 className="h-3.5 w-3.5" />
              </span>
              <span className="flex-1">그룹 관리</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <button
        type="button"
        onClick={() => setMapMode(mapMode === 'globe' ? 'map2d' : 'globe')}
        className={FAB_BASE}
        aria-label={mapMode === 'globe' ? '2D 지도로 전환' : '지구본으로 전환'}
        title={mapMode === 'globe' ? '2D 지도' : '지구본'}
      >
        {mapMode === 'globe' ? (
          <MapIcon className="h-5 w-5" />
        ) : (
          <Globe className="h-5 w-5" />
        )}
      </button>

      <button
        type="button"
        onClick={() => setAllDiariesOpen(true)}
        className={FAB_BASE}
        aria-label="전체 일기 목록"
        title="전체 일기 목록"
      >
        <List className="h-5 w-5" />
      </button>

      <button
        type="button"
        onClick={() => setDiaryFormOpen(true)}
        className={cn(
          FAB_BASE,
          'border-transparent bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground',
        )}
        aria-label="일기 추가"
        title="일기 추가"
      >
        <Plus className="h-5 w-5" />
      </button>
    </div>
  );
}
