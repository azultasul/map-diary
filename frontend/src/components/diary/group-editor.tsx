'use client';

import { CityCombobox } from '@/components/diary/city-combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { City } from '@/lib/cities';
import { cn } from '@/lib/utils';

// 새 그룹 색 팔레트(기존 그룹 색감과 동일 계열)
export const GROUP_COLORS = [
  '#FF6B9A', '#4DD6B6', '#FFB347', '#7C8CFF',
  '#5BC0EB', '#C792EA', '#FFD166', '#6FCF97',
];

export interface GroupDraft {
  name: string;
  color: string;
  departure: City | null;
  arrival: City | null;
}

// 그룹 이름·색·출발지·도착지를 입력하는 공유 편집기(제어형).
// 새 그룹 생성(diary-form)과 기존 그룹 편집(group-manage-modal)에서 재사용한다.
export function GroupEditor({
  value,
  onChange,
  nameError,
}: {
  value: GroupDraft;
  onChange: (next: GroupDraft) => void;
  nameError?: string;
}) {
  const set = (patch: Partial<GroupDraft>) => onChange({ ...value, ...patch });

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>그룹 이름</Label>
        <Input
          placeholder="여행 이름"
          value={value.name}
          aria-invalid={!!nameError}
          onChange={(e) => set({ name: e.target.value })}
        />
        {nameError && <p className="text-xs text-destructive">{nameError}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>색</Label>
        <div className="flex flex-wrap items-center gap-1.5">
          {GROUP_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`색 ${c}`}
              onClick={() => set({ color: c })}
              style={{ backgroundColor: c }}
              className={cn(
                'h-6 w-6 rounded-full ring-offset-2 ring-offset-background transition',
                value.color.toLowerCase() === c.toLowerCase() &&
                  'ring-2 ring-foreground',
              )}
            />
          ))}
          <label
            className="relative h-6 w-6 cursor-pointer overflow-hidden rounded-full border border-border"
            aria-label="색 직접 선택"
            title="직접 선택"
            style={{
              background:
                'conic-gradient(red,orange,yellow,lime,cyan,blue,magenta,red)',
            }}
          >
            <input
              type="color"
              value={value.color}
              onChange={(e) => set({ color: e.target.value })}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
          </label>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>출발지</Label>
        <CityCombobox
          value={value.departure}
          onChange={(c) => set({ departure: c })}
        />
      </div>

      <div className="space-y-1.5">
        <Label>도착지</Label>
        <CityCombobox
          value={value.arrival}
          onChange={(c) => set({ arrival: c })}
        />
      </div>
    </div>
  );
}
