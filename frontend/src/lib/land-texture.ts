import {
  CanvasTexture,
  LinearFilter,
  SRGBColorSpace,
  type WebGLRenderer,
} from 'three';
import { feature } from 'topojson-client';
import type { GeometryCollection, Topology } from 'topojson-specification';

// 지구본·2D 지도가 공유하는 팔레트 (한 곳에서 관리 → 디자인 일관성)
// 밝기 단계: 배경 < 바다 < 대륙 (채도 낮춘 슬레이트 톤)
export const SEA_COLOR = '#060b17';
export const LAND_COLOR = '#1b2d47';
export const COAST_COLOR = 'rgba(100, 180, 255, 0.55)';

function lngToX(lng: number, width: number): number {
  return ((lng + 180) / 360) * width;
}

function latToY(lat: number, height: number): number {
  return ((90 - lat) / 180) * height;
}

// land topology를 equirectangular 캔버스 텍스처로 렌더한다.
// 평면 2D와 구 텍스처 모두 equirectangular UV이므로 그대로 공유 가능하다.
// 날짜변경선/극지방 처리가 캔버스 fill 단계에서 끝나므로 삼각분할 아티팩트가 없다.
export function createLandTexture(
  topology: Topology,
  gl: WebGLRenderer,
  desiredWidth = 16384,
): CanvasTexture | null {
  // GPU가 지원하는 최대 텍스처 크기로 캡 (대부분 데스크탑 16384)
  const maxTex = gl.capabilities.maxTextureSize;
  const texW = Math.min(desiredWidth, maxTex);
  const texH = Math.min(Math.floor(desiredWidth / 2), Math.floor(maxTex / 2));
  const canvas = document.createElement('canvas');
  canvas.width = texW;
  canvas.height = texH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = SEA_COLOR;
  ctx.fillRect(0, 0, texW, texH);

  const land = feature(topology, topology.objects.land as GeometryCollection);
  const polygons: number[][][][] = [];
  for (const f of land.features) {
    const geom = f.geometry;
    if (geom.type === 'Polygon') {
      polygons.push(geom.coordinates as unknown as number[][][]);
    } else if (geom.type === 'MultiPolygon') {
      polygons.push(...(geom.coordinates as unknown as number[][][][]));
    }
  }

  // 날짜변경선(±180°)을 가로지르는 링은 경도가 180→-180으로 점프해
  // 캔버스 전체를 가로지르는 선을 만든다. 경도를 연속 값으로 언랩한 뒤,
  // 캔버스 폭만큼 좌우로 한 번씩 더 그려 래핑된 부분이 올바른 쪽에 나타나게 한다.
  const shifts = [-texW, 0, texW];
  const unwrappedPolys = polygons.map((rings) =>
    rings.map((ring) => {
      let offset = 0;
      let prev = ring[0][0];
      return ring.map(([lng, lat]) => {
        let adjusted = lng + offset;
        if (adjusted - prev > 180) {
          offset -= 360;
          adjusted -= 360;
        } else if (adjusted - prev < -180) {
          offset += 360;
          adjusted += 360;
        }
        prev = adjusted;
        return [adjusted, lat] as [number, number];
      });
    }),
  );

  // 경도가 날짜변경선(±180° ≡ 180 mod 360) 위에 있는지
  const onAntimeridian = (lng: number) =>
    Math.abs((((lng % 360) + 360) % 360) - 180) < 1e-4;

  // 1) 육지 채우기 — 절단 모서리를 포함한 전체 닫힌 경로로 채워야 정상 채움
  ctx.fillStyle = LAND_COLOR;
  for (const rings of unwrappedPolys) {
    for (const shiftX of shifts) {
      ctx.beginPath();
      for (const ring of rings) {
        ring.forEach(([lng, lat], i) => {
          const x = lngToX(lng, texW) + shiftX;
          if (i === 0) ctx.moveTo(x, latToY(lat, texH));
          else ctx.lineTo(x, latToY(lat, texH));
        });
        // 극을 한 바퀴 감싸는 링(남극)은 언랩 후 시작/끝 경도가 360° 차이 난다.
        // 그대로 닫으면 캔버스를 가로지르는 현이 생기므로, 모서리(극점) 바깥을 경유해 닫는다.
        const dLng = ring[ring.length - 1][0] - ring[0][0];
        if (Math.abs(dLng) > 180) {
          const edgeY = ring[0][1] < 0 ? texH + 4 : -4;
          ctx.lineTo(lngToX(ring[ring.length - 1][0], texW) + shiftX, edgeY);
          ctx.lineTo(lngToX(ring[0][0], texW) + shiftX, edgeY);
        }
        ctx.closePath();
      }
      ctx.fill('evenodd');
    }
  }

  // 2) 해안선 — 날짜변경선 절단 모서리(양 끝이 ±180에 걸친 인공 수직선)는
  // stroke에서 제외해 러시아·남극에 세로선이 생기지 않게 한다.
  ctx.strokeStyle = COAST_COLOR;
  ctx.lineWidth = Math.max(1, Math.round(texW / 5000));
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  for (const rings of unwrappedPolys) {
    for (const shiftX of shifts) {
      ctx.beginPath();
      for (const ring of rings) {
        for (let i = 0; i < ring.length - 1; i++) {
          const [lngA, latA] = ring[i];
          const [lngB, latB] = ring[i + 1];
          if (onAntimeridian(lngA) && onAntimeridian(lngB)) continue;
          ctx.moveTo(lngToX(lngA, texW) + shiftX, latToY(latA, texH));
          ctx.lineTo(lngToX(lngB, texW) + shiftX, latToY(latB, texH));
        }
      }
      ctx.stroke();
    }
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  // 밉맵은 극점 UV 극압축으로 LOD 링 아티팩트를 만들므로 끈다
  texture.generateMipmaps = false;
  texture.minFilter = LinearFilter;
  texture.anisotropy = gl.capabilities.getMaxAnisotropy();
  return texture;
}
