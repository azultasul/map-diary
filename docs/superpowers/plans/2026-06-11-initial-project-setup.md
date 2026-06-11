# Initial Project Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** frontend(Next.js) + backend(FastAPI) 초기 프로젝트 세팅을 현업 기준으로 구성한다.

**Architecture:** Frontend는 Next.js 16 App Router가 이미 create-next-app으로 생성된 상태. 여기에 PRD 기술 스택 의존성 설치, shadcn/ui 초기화, 디렉토리 구조, Provider 설정, 다크/라이트 테마를 구성한다. Backend는 uv로 FastAPI 프로젝트를 초기화하고 기본 구조를 잡는다.

**Tech Stack:**
- Frontend: Next.js 16 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui, Zustand, TanStack Query, Three.js + R3F + Drei, MapLibre GL, React Hook Form + Zod, Framer Motion
- Backend: Python 3.12+, FastAPI, uv

**Branch:** `chore/initial-setup` (main에서 분기 → 완료 후 main으로 머지)

---

## File Structure

### Frontend (`frontend/`)

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx          (수정: Provider 래핑, 테마, 메타데이터)
│   │   ├── page.tsx            (수정: 기본 페이지 정리)
│   │   └── globals.css         (수정: shadcn/ui + 다크모드 CSS 변수)
│   ├── components/
│   │   └── ui/                 (shadcn/ui 컴포넌트가 여기 생성됨)
│   ├── lib/
│   │   └── utils.ts            (shadcn/ui가 생성하는 cn 유틸)
│   ├── providers/
│   │   ├── query-provider.tsx  (TanStack Query Provider)
│   │   └── theme-provider.tsx  (next-themes Provider)
│   ├── stores/
│   │   └── ui-store.ts         (Zustand UI 상태 스토어)
│   └── types/
│       └── index.ts            (도메인 타입 정의)
├── components.json             (shadcn/ui 설정)
├── .prettierrc                 (Prettier 설정)
├── .prettierignore             (Prettier 무시 파일)
└── package.json                (수정: scripts 추가)
```

### Backend (`backend/`)

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 (FastAPI 앱 진입점)
│   ├── config.py               (설정)
│   └── api/
│       ├── __init__.py
│       └── health.py           (헬스체크 라우터)
├── tests/
│   ├── __init__.py
│   └── test_health.py          (헬스체크 테스트)
├── pyproject.toml              (uv 프로젝트 설정)
├── .python-version             (Python 버전 고정)
└── .gitignore                  (Python gitignore)
```

---

## Task 1: 브랜치 생성

**Files:** 없음 (git 작업만)

- [ ] **Step 1: chore/initial-setup 브랜치 생성 및 전환**

```bash
git checkout -b chore/initial-setup
```

Expected: `Switched to a new branch 'chore/initial-setup'`

---

## Task 2: Frontend 의존성 설치

**Files:**
- Modify: `frontend/package.json`

- [ ] **Step 1: 핵심 의존성 설치**

```bash
cd frontend
npm install zustand @tanstack/react-query three @react-three/fiber @react-three/drei maplibre-gl react-hook-form @hookform/resolvers zod framer-motion next-themes
```

`next-themes`는 다크/라이트 테마 전환에 사용한다 (shadcn/ui 공식 권장).

- [ ] **Step 2: 개발 의존성 설치**

```bash
cd frontend
npm install -D @types/three prettier eslint-config-prettier eslint-plugin-prettier
```

- [ ] **Step 3: package.json scripts 확인 및 format 스크립트 추가**

`frontend/package.json`의 scripts에 format 추가:

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "format": "prettier --write \"src/**/*.{ts,tsx,css,json}\""
  }
}
```

- [ ] **Step 4: dev 서버 기동 테스트**

```bash
cd frontend && npm run dev
```

Expected: `Local: http://localhost:3000` 출력 후 브라우저에서 기본 페이지 확인. Ctrl+C로 종료.

- [ ] **Step 5: 커밋**

```bash
git add frontend/package.json frontend/package-lock.json
git commit -m "chore:frontend 핵심 의존성 및 개발 도구 설치"
```

---

## Task 3: Frontend Prettier + ESLint 설정

**Files:**
- Create: `frontend/.prettierrc`
- Create: `frontend/.prettierignore`
- Modify: `frontend/eslint.config.mjs`

- [ ] **Step 1: Prettier 설정 파일 생성**

`frontend/.prettierrc`:

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 80,
  "tabWidth": 2,
  "plugins": []
}
```

- [ ] **Step 2: Prettier ignore 파일 생성**

`frontend/.prettierignore`:

```
node_modules
.next
out
build
coverage
package-lock.json
```

- [ ] **Step 3: ESLint에 Prettier 통합**

`frontend/eslint.config.mjs`:

```js
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
```

- [ ] **Step 4: lint 실행 확인**

```bash
cd frontend && npm run lint
```

Expected: 에러 없이 통과.

- [ ] **Step 5: 커밋**

```bash
git add frontend/.prettierrc frontend/.prettierignore frontend/eslint.config.mjs
git commit -m "chore:Prettier 및 ESLint-Prettier 통합 설정"
```

---

## Task 4: shadcn/ui 초기화

**Files:**
- Create: `frontend/components.json`
- Create: `frontend/src/lib/utils.ts`
- Modify: `frontend/src/app/globals.css`

- [ ] **Step 1: shadcn/ui 초기화**

```bash
cd frontend
npx shadcn@latest init -d
```

`-d` 플래그는 기본 설정으로 초기화. 만약 대화형 프롬프트가 뜨면:
- Style: New York
- Base color: Neutral
- CSS variables: Yes

이 명령은 `components.json`, `src/lib/utils.ts`, `globals.css` 수정을 자동으로 수행한다.

- [ ] **Step 2: shadcn/ui가 생성한 globals.css 확인**

shadcn/ui가 CSS 변수를 주입한다. 다크모드 변수가 포함되어 있는지 확인.

- [ ] **Step 3: 기본 컴포넌트 하나 설치하여 동작 확인**

```bash
cd frontend
npx shadcn@latest add button
```

Expected: `frontend/src/components/ui/button.tsx` 생성.

- [ ] **Step 4: 빌드 확인**

```bash
cd frontend && npm run build
```

Expected: 빌드 성공.

- [ ] **Step 5: 커밋**

```bash
git add frontend/components.json frontend/src/lib/ frontend/src/components/ui/ frontend/src/app/globals.css
git commit -m "chore:shadcn/ui 초기화 및 Button 컴포넌트 추가"
```

---

## Task 5: 테마 Provider 설정 (다크/라이트)

**Files:**
- Create: `frontend/src/providers/theme-provider.tsx`
- Modify: `frontend/src/app/layout.tsx`

- [ ] **Step 1: ThemeProvider 컴포넌트 생성**

`frontend/src/providers/theme-provider.tsx`:

```tsx
'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { type ReactNode } from 'react';

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
```

- [ ] **Step 2: layout.tsx에 ThemeProvider 적용**

`frontend/src/app/layout.tsx`:

```tsx
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ThemeProvider } from '@/providers/theme-provider';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Map Diary',
  description: '여행 일기를 세계 지도 위의 핀으로 시각화하는 개인 여행 일기 서비스',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
```

주요 변경: `lang="ko"`, `suppressHydrationWarning` (next-themes 필수), 메타데이터 Map Diary로 변경, ThemeProvider 래핑.

- [ ] **Step 3: 빌드 확인**

```bash
cd frontend && npm run build
```

Expected: 빌드 성공.

- [ ] **Step 4: 커밋**

```bash
git add frontend/src/providers/theme-provider.tsx frontend/src/app/layout.tsx
git commit -m "chore:다크/라이트 테마 Provider 설정"
```

---

## Task 6: TanStack Query Provider 설정

**Files:**
- Create: `frontend/src/providers/query-provider.tsx`
- Modify: `frontend/src/app/layout.tsx`

- [ ] **Step 1: QueryProvider 컴포넌트 생성**

`frontend/src/providers/query-provider.tsx`:

```tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
```

`useState`로 QueryClient를 생성하는 것은 React 18+ SSR 환경에서 인스턴스 공유를 방지하는 공식 패턴이다.

- [ ] **Step 2: layout.tsx에 QueryProvider 추가**

`frontend/src/app/layout.tsx`의 body 안을 다음으로 변경:

```tsx
<body className="min-h-full flex flex-col">
  <ThemeProvider>
    <QueryProvider>{children}</QueryProvider>
  </ThemeProvider>
</body>
```

상단에 import 추가:

```tsx
import { QueryProvider } from '@/providers/query-provider';
```

- [ ] **Step 3: 빌드 확인**

```bash
cd frontend && npm run build
```

Expected: 빌드 성공.

- [ ] **Step 4: 커밋**

```bash
git add frontend/src/providers/query-provider.tsx frontend/src/app/layout.tsx
git commit -m "chore:TanStack Query Provider 설정"
```

---

## Task 7: Zustand UI 스토어 + 도메인 타입 정의

**Files:**
- Create: `frontend/src/stores/ui-store.ts`
- Create: `frontend/src/types/index.ts`

- [ ] **Step 1: 도메인 타입 정의**

`frontend/src/types/index.ts`:

```ts
export type MapMode = 'globe' | 'map2d';

export type Visibility = 'private' | 'shared' | 'friends' | 'public';

export type Continent =
  | 'Asia'
  | 'Europe'
  | 'North America'
  | 'South America'
  | 'Africa'
  | 'Oceania'
  | 'Antarctica';

export interface User {
  id: string;
  email: string;
  nickname: string;
  avatarUrl: string;
  mapMode: MapMode;
  createdAt: string;
}

export interface Group {
  id: string;
  userId: string;
  name: string;
  color: string;
  visibility: Visibility;
  createdAt: string;
}

export interface DiaryImage {
  id: string;
  imageUrl: string;
  orderIndex: number;
}

export interface Diary {
  id: string;
  userId: string;
  groupId: string | null;
  continent: Continent;
  country: string;
  city: string;
  latitude: number;
  longitude: number;
  visitedDate: string;
  title: string;
  content: string;
  visibility: Visibility;
  images: DiaryImage[];
  createdAt: string;
  updatedAt: string;
}

export interface CityMarker {
  city: string;
  country: string;
  continent: Continent;
  latitude: number;
  longitude: number;
  diaryCount: number;
  groupColor: string | null;
  diaryIds: string[];
}

export interface Route {
  from: { city: string; country: string; latitude: number; longitude: number };
  to: { city: string; country: string; latitude: number; longitude: number };
  groupColor: string | null;
}
```

- [ ] **Step 2: Zustand UI 스토어 생성**

`frontend/src/stores/ui-store.ts`:

```ts
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
```

- [ ] **Step 3: TypeScript 컴파일 확인**

```bash
cd frontend && npx tsc --noEmit
```

Expected: 에러 없이 통과.

- [ ] **Step 4: 커밋**

```bash
git add frontend/src/stores/ui-store.ts frontend/src/types/index.ts
git commit -m "chore:도메인 타입 정의 및 Zustand UI 스토어 생성"
```

---

## Task 8: 기본 페이지 정리

**Files:**
- Modify: `frontend/src/app/page.tsx`

- [ ] **Step 1: 기본 페이지를 Map Diary placeholder로 교체**

`frontend/src/app/page.tsx`:

```tsx
export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center bg-background">
      <h1 className="text-2xl font-semibold text-foreground">Map Diary</h1>
    </div>
  );
}
```

- [ ] **Step 2: 불필요한 public 파일 정리**

```bash
cd frontend
rm -f public/next.svg public/vercel.svg public/file.svg public/globe.svg public/window.svg
```

- [ ] **Step 3: dev 서버로 확인**

```bash
cd frontend && npm run dev
```

Expected: 화면 중앙에 "Map Diary" 텍스트만 표시. Ctrl+C로 종료.

- [ ] **Step 4: 커밋**

```bash
git add frontend/src/app/page.tsx
git add frontend/public/
git commit -m "chore:기본 페이지 정리 및 불필요한 에셋 제거"
```

---

## Task 9: next.config.ts 설정

**Files:**
- Modify: `frontend/next.config.ts`

- [ ] **Step 1: Three.js 관련 설정 추가**

`frontend/next.config.ts`:

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['three'],
};

export default nextConfig;
```

`serverExternalPackages`에 `three`를 추가하여 서버 사이드에서 Three.js가 번들되지 않도록 한다.

- [ ] **Step 2: 빌드 확인**

```bash
cd frontend && npm run build
```

Expected: 빌드 성공.

- [ ] **Step 3: 커밋**

```bash
git add frontend/next.config.ts
git commit -m "chore:next.config Three.js 서버 번들링 제외 설정"
```

---

## Task 10: 루트 .gitignore 업데이트

**Files:**
- Modify: `.gitignore` (루트)

- [ ] **Step 1: 루트 .gitignore 생성/업데이트**

프로젝트 루트 `.gitignore`:

```
# OS
.DS_Store

# IDE
.idea/
.vscode/
*.swp
*.swo

# Claude
.claude/
```

frontend와 backend는 각각 자체 `.gitignore`를 가진다.

- [ ] **Step 2: 커밋**

```bash
git add .gitignore
git commit -m "chore:루트 .gitignore 업데이트"
```

---

## Task 11: Backend FastAPI 프로젝트 초기화

**Files:**
- Create: `backend/pyproject.toml`
- Create: `backend/.python-version`
- Create: `backend/.gitignore`
- Create: `backend/app/__init__.py`
- Create: `backend/app/main.py`
- Create: `backend/app/config.py`
- Create: `backend/app/api/__init__.py`
- Create: `backend/app/api/health.py`

- [ ] **Step 1: uv 프로젝트 초기화**

```bash
cd backend
uv init --name map-diary-backend --python 3.12
```

이 명령은 `pyproject.toml`과 `.python-version`을 생성한다.

- [ ] **Step 2: pyproject.toml 수정**

`backend/pyproject.toml`:

```toml
[project]
name = "map-diary-backend"
version = "0.1.0"
description = "Map Diary Backend API"
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.30.0",
    "pydantic>=2.0.0",
    "pydantic-settings>=2.0.0",
]

[dependency-groups]
dev = [
    "pytest>=8.0.0",
    "pytest-asyncio>=0.24.0",
    "httpx>=0.27.0",
    "ruff>=0.6.0",
]

[tool.ruff]
target-version = "py312"
line-length = 88

[tool.ruff.lint]
select = ["E", "F", "I", "N", "W", "UP"]

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
```

- [ ] **Step 3: 의존성 설치**

```bash
cd backend
uv sync
```

Expected: `.venv` 디렉토리 생성, 의존성 설치 완료.

- [ ] **Step 4: Python .gitignore 생성**

`backend/.gitignore`:

```
__pycache__/
*.py[cod]
*.so
.venv/
.env
.env.local
dist/
*.egg-info/
.pytest_cache/
.ruff_cache/
```

- [ ] **Step 5: app 패키지 구조 생성**

`backend/app/__init__.py`:

```python
```

`backend/app/api/__init__.py`:

```python
```

- [ ] **Step 6: 설정 모듈 생성**

`backend/app/config.py`:

```python
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Map Diary API"
    debug: bool = True

    model_config = {"env_prefix": "MAP_DIARY_"}


settings = Settings()
```

- [ ] **Step 7: 헬스체크 라우터 생성**

`backend/app/api/health.py`:

```python
from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check():
    return {"status": "ok"}
```

- [ ] **Step 8: FastAPI 앱 진입점 생성**

`backend/app/main.py`:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.health import router as health_router
from app.config import settings

app = FastAPI(title=settings.app_name, debug=settings.debug)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
```

- [ ] **Step 9: 서버 기동 테스트**

```bash
cd backend
uv run uvicorn app.main:app --reload
```

Expected: `Uvicorn running on http://127.0.0.1:8000` 출력. 별도 터미널에서:

```bash
curl http://localhost:8000/health
```

Expected: `{"status":"ok"}`

Ctrl+C로 종료.

- [ ] **Step 10: 커밋**

```bash
git add backend/
git commit -m "chore:FastAPI 백엔드 프로젝트 초기화"
```

---

## Task 12: Backend 헬스체크 테스트

**Files:**
- Create: `backend/tests/__init__.py`
- Create: `backend/tests/test_health.py`

- [ ] **Step 1: 테스트 디렉토리 생성**

`backend/tests/__init__.py`:

```python
```

- [ ] **Step 2: 헬스체크 테스트 작성**

`backend/tests/test_health.py`:

```python
from httpx import ASGITransport, AsyncClient

from app.main import app


async def test_health_check():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
```

- [ ] **Step 3: 테스트 실행**

```bash
cd backend
uv run pytest -v
```

Expected: `test_health_check PASSED`

- [ ] **Step 4: 커밋**

```bash
git add backend/tests/
git commit -m "test:헬스체크 엔드포인트 테스트 추가"
```

---

## Task 13: CLAUDE.md 스크립트 섹션 업데이트

**Files:**
- Modify: `CLAUDE.md` (루트)

- [ ] **Step 1: CLAUDE.md에 빌드/린트/테스트 명령어 추가**

CLAUDE.md의 `코드 컨벤션` 섹션에서 "아직 빌드/린트/테스트 명령어가 없다" 문구를 다음으로 교체:

```markdown
### 명령어

Frontend (`frontend/` 디렉토리에서 실행):

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 (Turbopack) |
| `npm run build` | 프로덕션 빌드 |
| `npm run lint` | ESLint 실행 |
| `npm run format` | Prettier 포맷팅 |

Backend (`backend/` 디렉토리에서 실행):

| 명령어 | 설명 |
|--------|------|
| `uv run uvicorn app.main:app --reload` | 개발 서버 |
| `uv run pytest -v` | 테스트 실행 |
| `uv run ruff check .` | 린트 실행 |
| `uv run ruff format .` | 포맷팅 |
```

- [ ] **Step 2: 커밋**

```bash
git add CLAUDE.md
git commit -m "docs:CLAUDE.md에 빌드/린트/테스트 명령어 추가"
```

---

## Task 14: 자동 생성 파일 정리 및 최종 확인

**Files:**
- Delete: `frontend/CLAUDE.md` (루트 CLAUDE.md와 중복)
- Delete: `frontend/AGENTS.md` (불필요)
- Delete: `frontend/README.md` (루트 README 사용)

- [ ] **Step 1: create-next-app이 생성한 불필요 파일 제거**

```bash
rm -f frontend/CLAUDE.md frontend/AGENTS.md frontend/README.md
```

- [ ] **Step 2: 전체 빌드 최종 확인**

```bash
cd frontend && npm run build && cd ../backend && uv run pytest -v
```

Expected: Frontend 빌드 성공, Backend 테스트 PASSED.

- [ ] **Step 3: 커밋**

```bash
git add frontend/
git commit -m "chore:자동 생성 불필요 파일 제거"
```

---

## Task 15: main 브랜치 머지

- [ ] **Step 1: main으로 전환 후 머지**

```bash
git checkout main
git merge chore/initial-setup
```

- [ ] **Step 2: 브랜치 삭제**

```bash
git branch -d chore/initial-setup
```

Expected: `Deleted branch chore/initial-setup`
