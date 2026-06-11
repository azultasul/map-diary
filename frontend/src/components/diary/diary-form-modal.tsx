'use client';

import { Button } from '@/components/ui/button';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { useUIStore } from '@/stores/ui-store';

/**
 * 일기 추가 모달의 골격. 실제 작성/저장(CRUD)은 Phase 5에서 구현한다.
 * 현재는 비활성 폼 필드와 안내 문구만 노출한다.
 */
export function DiaryFormModal() {
  const diaryFormOpen = useUIStore((s) => s.diaryFormOpen);
  const setDiaryFormOpen = useUIStore((s) => s.setDiaryFormOpen);

  return (
    <ResponsiveModal
      open={diaryFormOpen}
      onOpenChange={setDiaryFormOpen}
      title="일기 추가"
      description="일기 작성 기능은 Phase 5에서 제공됩니다."
    >
      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">제목</label>
          <input
            disabled
            placeholder="제목"
            className="w-full rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">도시</label>
          <input
            disabled
            placeholder="도시 / 국가"
            className="w-full rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">내용</label>
          <textarea
            disabled
            rows={4}
            placeholder="내용"
            className="w-full resize-none rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => setDiaryFormOpen(false)}>
            닫기
          </Button>
          <Button disabled>저장 (준비 중)</Button>
        </div>
      </div>
    </ResponsiveModal>
  );
}
