'use client';

import { createContext, useContext, type ReactNode } from 'react';

/**
 * 지구본·2D 지도 씬 내부 색의 단일 출처(테마별).
 *
 * next-themes는 React Context 기반이라 <Canvas> 내부(별도 reconciler)에서는
 * useTheme()이 읽히지 않는다. 대신 Canvas 바깥(MapView)에서 테마를 읽어
 * Scene에 prop으로 넘기고, 여기 PaletteContext로 Canvas 안에서 다시 배포한다.
 */
export interface ScenePalette {
  // 캔버스 텍스처(globe·2D 공유)
  sea: string;
  land: string;
  coast: string;
  // 국경선(육지 내부 경계) — 해안선보다 옅게
  border: string;
  // 경로 이동 빛점 코어
  routeDot: string;
  // groupColor 없을 때 fallback
  defaultPin: string;
  defaultRoute: string;
  // 홈(출발/도착지) 마커 색 — 일반 핀과 구분
  home: string;
  // 대기 글로우(오로라) 강도 배율 — 라이트에서 은은하게 낮춘다
  atmosphereStrength: number;
}

export const DARK_PALETTE: ScenePalette = {
  sea: '#060b17',
  land: '#1b2d47',
  coast: 'rgba(100, 180, 255, 0.55)',
  border: 'rgba(130, 165, 215, 0.28)',
  routeDot: '#ffffff',
  defaultPin: '#f5f5f5',
  defaultRoute: '#9aa4b8',
  home: '#ffd479',
  atmosphereStrength: 1.0,
};

// 클래식 아틀라스: 크림/베이지 육지 + 옅은 하늘색 바다, 진한 청회색 해안선
export const LIGHT_PALETTE: ScenePalette = {
  sea: '#cfe0f0',
  land: '#e8e2d0',
  coast: 'rgba(70, 100, 130, 0.6)',
  border: 'rgba(95, 115, 140, 0.4)',
  // 연한 회색 — 파스텔 배경에 과하지 않게 묻어가되 옅은 바다·크림에서 식별 가능.
  routeDot: '#9ca3ad',
  defaultPin: '#475569',
  defaultRoute: '#64748b',
  home: '#e08a2b',
  // 라이트에선 오로라를 더 연하게 (additive라 밝은 배경에서 과하지 않게)
  atmosphereStrength: 0.18,
};

const PaletteContext = createContext<ScenePalette>(DARK_PALETTE);

export function PaletteProvider({
  palette,
  children,
}: {
  palette: ScenePalette;
  children: ReactNode;
}) {
  return (
    <PaletteContext.Provider value={palette}>
      {children}
    </PaletteContext.Provider>
  );
}

export function usePalette(): ScenePalette {
  return useContext(PaletteContext);
}
