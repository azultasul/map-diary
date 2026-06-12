import { describe, expect, it } from 'vitest';
import type { City } from '@/lib/cities';
import { diaryFormSchema } from '@/lib/diary-schema';

const city: City = {
  city: 'Seoul',
  country: 'South Korea',
  continent: 'Asia',
  latitude: 37.5,
  longitude: 127,
};

const base = {
  title: '여행 첫날',
  content: '도착했다',
  visitedDate: '2024-01-01',
  city,
  groupId: null,
};

describe('diaryFormSchema', () => {
  it('유효한 입력을 통과시킨다', () => {
    expect(diaryFormSchema.safeParse(base).success).toBe(true);
  });

  it('제목이 비면 실패한다', () => {
    expect(diaryFormSchema.safeParse({ ...base, title: '' }).success).toBe(false);
  });

  it('내용이 비면 실패한다', () => {
    expect(diaryFormSchema.safeParse({ ...base, content: '   ' }).success).toBe(
      false,
    );
  });

  it('미래 날짜는 실패한다', () => {
    expect(
      diaryFormSchema.safeParse({ ...base, visitedDate: '2999-01-01' }).success,
    ).toBe(false);
  });

  it('도시 미선택(undefined)은 실패한다', () => {
    expect(
      diaryFormSchema.safeParse({ ...base, city: undefined }).success,
    ).toBe(false);
  });

  it('groupId는 null을 허용한다', () => {
    const r = diaryFormSchema.safeParse({ ...base, groupId: null });
    expect(r.success).toBe(true);
  });
});
