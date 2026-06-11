# Globe Visual Enhancement Design

Date: 2026-06-11
Branch: fix/globe-visual

## Overview

지구본 두 가지 시각적 개선: 확대 시 화질 향상 + 테두리 오로라 애니메이션 효과.

## 1. 확대 시 화질 개선

### 문제

현재 캔버스 텍스처가 4096×2048이라 가까이 확대하면 픽셀이 보임.

### 해결

- 캔버스 해상도를 8192×4096으로 업스케일 (2배)
- `canvasTexture.anisotropy = gl.capabilities.getMaxAnisotropy()` 적용
- `lineWidth` 1.5 → 2.5로 조정 (해상도 2배 대응)
- `useThree()`로 renderer 접근 (`Globe` 컴포넌트 내)

### 변경 상수

```
TEXTURE_WIDTH: 4096 → 8192
TEXTURE_HEIGHT: 2048 → 4096
```

## 2. 오로라 애니메이션 효과

### 색상

딥블루(#3f5fb8) → 시안(#00d4ff) → 퍼플(#8b00ff) 순환
속도: 천천히 (uTime * 0.08)

### 셰이더 변경

vertex shader에 `vPosition` varying 추가:
```glsl
varying vec3 vPosition;
// vPosition = position (구 표면 object-space 좌표)
```

fragment shader에서 방위각 기반 색 분배:
```glsl
float angle = atan(vPosition.z, vPosition.x);
float t = fract(angle / (2.0 * PI) + uTime * 0.08);
// t 기반으로 3색 보간
```

기존 rim intensity 계산은 그대로 유지.

### 애니메이션

`useFrame`으로 매 프레임 `uTime` 업데이트.

## 변경 파일

`frontend/src/components/map/globe/globe.tsx` 하나.
