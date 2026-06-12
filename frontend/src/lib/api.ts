import { loadData } from '@/lib/diary-repo';
import type { MockData } from '@/types';

// Phase 5: localStorage 영속 레이어(diary-repo)를 경유한다. 첫 호출 시 목 JSON으로
// 시드하고 이후 CRUD 결과를 읽는다. Phase 6에서 diary-repo만 Supabase로 교체.
export async function fetchMockData(): Promise<MockData> {
  return loadData();
}
