import {
  CanvasTexture,
  LinearFilter,
  SRGBColorSpace,
  type WebGLRenderer,
} from 'three';
import { feature, mesh } from 'topojson-client';
import type { GeometryCollection, Topology } from 'topojson-specification';
import type { ScenePalette } from '@/components/map/shared/scene-palette';

function lngToX(lng: number, width: number): number {
  return ((lng + 180) / 360) * width;
}

function latToY(lat: number, height: number): number {
  return ((90 - lat) / 180) * height;
}

// 날짜변경선(±180°)을 가로지르는 선/링은 경도가 점프해 캔버스 전체를 가로지른다.
// 경도를 연속 값으로 언랩(누적 오프셋)해 점프를 없앤다. 좌우 타일링(shifts)이
// 래핑된 부분을 올바른 쪽에 그린다.
function unwrapLngLat(line: number[][]): [number, number][] {
  let offset = 0;
  let prev = line[0][0];
  return line.map(([lng, lat]) => {
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
}

// land topology를 equirectangular 캔버스 텍스처로 렌더한다.
// 평면 2D와 구 텍스처 모두 equirectangular UV이므로 그대로 공유 가능하다.
// 날짜변경선/극지방 처리가 캔버스 fill 단계에서 끝나므로 삼각분할 아티팩트가 없다.
export function createLandTexture(
  topology: Topology,
  gl: WebGLRenderer,
  palette: Pick<ScenePalette, 'sea' | 'land' | 'coast' | 'border'>,
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

  ctx.fillStyle = palette.sea;
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

  // 언랩된 링을 캔버스 폭만큼 좌우로도 그려(타일링) 래핑 부분을 보정한다.
  const shifts = [-texW, 0, texW];
  const unwrappedPolys = polygons.map((rings) => rings.map(unwrapLngLat));

  // 경도가 날짜변경선(±180° ≡ 180 mod 360) 위에 있는지
  const onAntimeridian = (lng: number) =>
    Math.abs((((lng % 360) + 360) % 360) - 180) < 1e-4;

  // 1) 육지 채우기 — 절단 모서리를 포함한 전체 닫힌 경로로 채워야 정상 채움
  ctx.fillStyle = palette.land;
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
  ctx.strokeStyle = palette.coast;
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

  // 3) 국경선 — countries 토폴로지의 내부 경계만(a !== b) mesh로 추출해 그린다.
  // 공유 arc라 인접국 사이에 선이 한 번만 생긴다. 해안선보다 옅고 얇게.
  const countries = topology.objects.countries as GeometryCollection | undefined;
  if (countries) {
    const borders = mesh(topology, countries, (a, b) => a !== b);
    const unwrappedBorders = borders.coordinates.map(unwrapLngLat);
    ctx.strokeStyle = palette.border;
    ctx.lineWidth = Math.max(1, Math.round(texW / 9000));
    for (const line of unwrappedBorders) {
      for (const shiftX of shifts) {
        ctx.beginPath();
        line.forEach(([lng, lat], i) => {
          const x = lngToX(lng, texW) + shiftX;
          const y = latToY(lat, texH);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      }
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
