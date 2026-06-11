'use client';

import { useEffect, useState } from 'react';

/**
 * 미디어 쿼리 매칭 여부를 반환한다. SSR-safe — 서버/초기 렌더에서는 false,
 * 마운트 후 실제 매칭값으로 갱신된다. (모달은 마운트 이후 열리므로 정확)
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}
