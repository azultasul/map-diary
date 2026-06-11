# Backend CLAUDE.md

## 기술 스택

- Python 3.12+ / FastAPI
- 패키지 관리: uv
- 검증: Pydantic v2 + pydantic-settings
- 린트/포맷: Ruff
- 테스트: pytest + pytest-asyncio + httpx

## 디렉토리 구조

```
backend/
├── app/
│   ├── main.py        # FastAPI 앱 진입점
│   ├── config.py      # pydantic-settings 기반 설정
│   └── api/
│       └── health.py  # 헬스체크 라우터
├── tests/
│   └── test_health.py
└── pyproject.toml
```

## 현재 역할

현재 백엔드는 최소 구성 상태. 향후 AI 기능(RAG, 채팅 검색 등)을 붙일 때 본격 확장 예정.

- Phase 6에서 Supabase 연동 시 백엔드가 DB 프록시 역할 가능
- AI 기능은 FastAPI 라우터로 추가

## 설정

- 환경 변수 prefix: `MAP_DIARY_` (예: `MAP_DIARY_DEBUG=true`)
- CORS: `http://localhost:3000` 허용

## 명령어

| 명령어 | 설명 |
|--------|------|
| `uv run uvicorn app.main:app --reload` | 개발 서버 |
| `uv run pytest -v` | 테스트 실행 |
| `uv run ruff check .` | 린트 실행 |
| `uv run ruff format .` | 포맷팅 |
| `uv sync` | 의존성 설치/동기화 |

## 코드 컨벤션

- Ruff 설정: `line-length = 88`, `target-version = "py312"`
- Ruff lint rules: E, F, I, N, W, UP
- pytest asyncio_mode: auto
