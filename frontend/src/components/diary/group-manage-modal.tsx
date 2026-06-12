'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import {
  type GroupDraft,
  GroupEditor,
} from '@/components/diary/group-editor';
import { Button } from '@/components/ui/button';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { useGroups } from '@/hooks/use-diary-data';
import { useUpdateGroup } from '@/hooks/use-diary-mutations';
import { useUIStore } from '@/stores/ui-store';
import type { Group } from '@/types';

export function GroupManageModal() {
  const open = useUIStore((s) => s.groupManageOpen);
  const setOpen = useUIStore((s) => s.setGroupManageOpen);
  const { data: groups } = useGroups();
  const updateGroup = useUpdateGroup();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<GroupDraft | null>(null);
  const [nameError, setNameError] = useState('');

  const editing = editingId
    ? (groups?.find((g) => g.id === editingId) ?? null)
    : null;

  const startEdit = (g: Group) => {
    setEditingId(g.id);
    setDraft({
      name: g.name,
      color: g.color,
      departure: g.departure,
      arrival: g.arrival,
    });
    setNameError('');
  };

  const backToList = () => {
    setEditingId(null);
    setDraft(null);
    setNameError('');
  };

  const close = () => {
    setOpen(false);
    backToList();
  };

  const save = () => {
    if (!editing || !draft) return;
    const name = draft.name.trim();
    if (!name) {
      setNameError('그룹 이름을 입력하세요');
      return;
    }
    updateGroup.mutate(
      {
        id: editing.id,
        input: {
          name,
          color: draft.color,
          departure: draft.departure,
          arrival: draft.arrival,
        },
      },
      { onSuccess: backToList },
    );
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={(next) => {
        if (!next) close();
      }}
      title={editing ? '그룹 편집' : '그룹 관리'}
      description={editing ? undefined : '그룹의 이름·색·출발/도착지를 편집합니다'}
    >
      {editing && draft ? (
        <div className="space-y-3">
          <GroupEditor
            value={draft}
            onChange={(next) => {
              setDraft(next);
              if (nameError) setNameError('');
            }}
            nameError={nameError}
          />
          <div className="flex items-center justify-between border-t border-border pt-3">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="목록으로"
              onClick={backToList}
            >
              <ChevronLeft />
            </Button>
            <Button onClick={save} disabled={updateGroup.isPending}>
              {updateGroup.isPending ? '저장 중…' : '저장'}
            </Button>
          </div>
        </div>
      ) : (
        <ul className="space-y-2">
          {groups?.map((g) => (
            <li key={g.id}>
              <button
                type="button"
                onClick={() => startEdit(g)}
                className="group flex w-full items-center gap-2 rounded-md border border-border p-3 text-left outline-none transition hover:border-foreground/20 hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: g.color }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-foreground">
                    {g.name}
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    {g.departure?.city ?? '—'} → {g.arrival?.city ?? '—'}
                  </span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </ResponsiveModal>
  );
}
