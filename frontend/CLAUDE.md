# Frontend CLAUDE.md

## 기술 스택

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4 + shadcn/ui (base-nova, Neutral)
- Zustand (클라이언트/UI 상태) + TanStack Query (서버/데이터 상태)
- Three.js + React Three Fiber + Drei (3D 지구본, 2D 지도)
- MapLibre GL (좌표/데이터 보조)
- React Hook Form + Zod (폼/검증)
- Framer Motion (애니메이션)
- next-themes (다크/라이트 테마)

## 디렉토리 구조

```
src/
├── app/              # Next.js App Router (라우팅, 레이아웃, 페이지)
├── components/ui/    # shadcn/ui 컴포넌트
├── lib/              # 유틸 함수 (cn 등)
├── providers/        # ThemeProvider, QueryProvider
├── stores/           # Zustand 스토어 (ui-store.ts)
└── types/            # 도메인 타입 정의
```

## 상태 관리 경계

- Zustand (`stores/ui-store.ts`): 지도 모드, 선택된 그룹 필터, 카메라 위치/줌, 모달 상태, 테마
- TanStack Query (`providers/query-provider.tsx`): diaries, groups, users 데이터. Phase 1~5에서도 목 JSON을 `queryFn`으로 감싸서 사용 → Phase 6에서 `queryFn`만 교체.

## 핵심 변환 함수 (프레임워크 비의존)

- `diaries → cityMarkers`: `(city, country)` 기준 그룹화, 도시당 핀 하나, `diaryCount` 노출
- `diaries → routes`: `created_at` 오름차순 정렬, 연속 동일 도시 합침
- 그룹 필터 시 diaries를 먼저 필터링 후 두 변환을 재계산
- Three.js/React 타입 없이 순수 함수로 유지

## 테마

- 다크 모드 기본, 라이트 모드 지원
- next-themes (`attribute="class"`, `defaultTheme="dark"`)
- shadcn/ui CSS 변수가 `.dark` 클래스 기반으로 전환

## 반응형

- 데스크탑 퍼스트
- Tailwind 브레이크포인트: `sm` 640 / `md` 768 / `lg` 1024 / `xl` 1280 / `2xl` 1536
- 모바일 < 768px (바텀시트) / 태블릿 768~1279px (중앙 모달) / 데스크탑 ≥ 1280px (팝오버)

## 명령어

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 (Turbopack) |
| `npm run build` | 프로덕션 빌드 |
| `npm run lint` | ESLint 실행 |
| `npm run format` | Prettier 포맷팅 |

## 코드 컨벤션

- ERD 도메인 용어 사용: `diaries`, `groups`, `cityMarkers`, `routes`, `createdAt`, `groupId`
- ESLint + Prettier 통합 (eslint-config-prettier)
- shadcn/ui 컴포넌트 추가: `npx shadcn@latest add <component>`
