'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

/**
 * 다크/라이트 테마 토글. 테마의 단일 출처는 next-themes(localStorage 저장).
 * 마운트 전에는 현재 테마를 알 수 없어 hydration mismatch가 나므로 mounted 가드.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // next-themes 권장 패턴: 마운트 여부를 1회 표시해 hydration mismatch를 막는다.
  // 외부 시스템(브라우저)과의 동기화이며 1회만 실행되므로 cascading render 우려 없음.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  // 마운트 전에는 서버와 동일하게(테마 미확정) 취급해야 aria-label/title까지 hydration 일치
  const isDark = mounted && resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={className}
      aria-label={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
      title={isDark ? '라이트 모드' : '다크 모드'}
    >
      {/* 마운트 전에는 빈 자리만 차지(아이콘 깜빡임 방지) */}
      {mounted ? (
        isDark ? (
          <Sun className="h-5 w-5" />
        ) : (
          <Moon className="h-5 w-5" />
        )
      ) : (
        <span className="block h-5 w-5" />
      )}
    </button>
  );
}
