import { z } from 'zod';
import type { City } from '@/lib/cities';

// 일기 작성/수정 폼 검증 스키마.
// city는 데이터셋에서 선택된 City 객체여야 한다(자유 입력 불가).
// visited_date는 유효한 날짜이며 미래일 수 없다. visibility는 폼에 없고 항상 private.
export const diaryFormSchema = z.object({
  title: z.string().trim().min(1, '제목을 입력하세요').max(120, '제목은 120자 이내'),
  content: z
    .string()
    .trim()
    .min(1, '내용을 입력하세요')
    .max(5000, '내용은 5000자 이내'),
  visitedDate: z
    .string()
    .min(1, '여행 날짜를 선택하세요')
    .refine((v) => !Number.isNaN(Date.parse(v)), '날짜 형식이 올바르지 않습니다')
    .refine((v) => {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      return new Date(v).getTime() <= today.getTime();
    }, '미래 날짜는 선택할 수 없습니다'),
  city: z.custom<City>((v) => !!v && typeof v === 'object' && 'latitude' in v, {
    message: '도시를 검색해 선택하세요',
  }),
  groupId: z.string().nullable(),
});

export type DiaryFormValues = z.infer<typeof diaryFormSchema>;
