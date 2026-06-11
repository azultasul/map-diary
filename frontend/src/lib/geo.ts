import {
  CatmullRomCurve3,
  Path,
  QuadraticBezierCurve3,
  Shape,
  Spherical,
  Vector2,
  Vector3,
} from 'three';
import type { CityMarker } from '@/types';

export const GLOBE_RADIUS = 1;

export const MAP_WIDTH = 4;
export const MAP_HEIGHT = 2;
export const LAND_DEPTH = 0.02;

// 수평 무한 래핑: 지도(땅/핀/경로)를 좌우로 이만큼 복제해 끝과 끝이 이어지게 한다.
// 카메라 x는 매 프레임 [-MAP_WIDTH/2, MAP_WIDTH/2]로 되돌려지므로
// 복제본이 시야를 항상 덮는다(복제본은 정확히 MAP_WIDTH 간격으로 타일링됨).
export const MAP_WRAP_OFFSETS = [-2, -1, 0, 1, 2];

export function latLngToVector3(
  lat: number,
  lng: number,
  radius: number,
): Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

export function latLngToCameraAngles(
  lat: number,
  lng: number,
): { azimuth: number; polar: number } {
  // radius=1: 카메라 각도는 방향만 필요하므로 크기 독립적이다
  const spherical = new Spherical().setFromVector3(
    latLngToVector3(lat, lng, 1),
  );
  return { azimuth: spherical.theta, polar: spherical.phi };
}

export function buildArcCurve(
  from: Vector3,
  to: Vector3,
  radius: number,
): CatmullRomCurve3 {
  const fromDir = from.clone().normalize();
  const toDir = to.clone().normalize();
  const angle = fromDir.angleTo(toDir);

  // 대척점 근처에서는 cross가 퇴화하므로 임의의 수직축으로 대체한다
  const axis = new Vector3().crossVectors(fromDir, toDir);
  if (axis.lengthSq() < 1e-10) {
    axis.copy(new Vector3(0, 1, 0).cross(fromDir));
    if (axis.lengthSq() < 1e-10) {
      axis.copy(new Vector3(1, 0, 0).cross(fromDir));
    }
  }
  axis.normalize();

  // 호 최고 높이는 각거리에 비례한다 (짧은 경로는 낮게, 대륙 간 경로는 높게)
  const maxAltitude = radius * (0.05 + 0.2 * (angle / Math.PI));

  const segments = 32;
  const points: Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const r =
      from.length() * (1 - t) +
      to.length() * t +
      maxAltitude * Math.sin(Math.PI * t);
    points.push(
      fromDir.clone().applyAxisAngle(axis, angle * t).multiplyScalar(r),
    );
  }
  return new CatmullRomCurve3(points);
}

export function geoLinesToPositions(
  lines: number[][][],
  radius: number,
): Float32Array {
  const positions: number[] = [];
  for (const line of lines) {
    for (let i = 0; i < line.length - 1; i++) {
      const [lng1, lat1] = line[i];
      const [lng2, lat2] = line[i + 1];
      const a = latLngToVector3(lat1, lng1, radius);
      const b = latLngToVector3(lat2, lng2, radius);
      positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
  }
  return new Float32Array(positions);
}

export function cityKey(city: string, country: string): string {
  return `${city}-${country}`;
}

function declutterByDistance(
  markers: CityMarker[],
  threshold: number,
  selectedCityKey: string | null,
  toVector3: (marker: CityMarker) => Vector3,
  distanceBetween: (a: Vector3, b: Vector3) => number,
): CityMarker[] {
  if (threshold === 0) return markers;

  const sorted = [...markers].sort((a, b) => b.diaryCount - a.diaryCount);
  const kept: CityMarker[] = [];
  const keptVectors: Vector3[] = [];

  for (const marker of sorted) {
    const v = toVector3(marker);
    const isSelected =
      selectedCityKey === cityKey(marker.city, marker.country);
    const tooClose = keptVectors.some((k) => distanceBetween(k, v) < threshold);
    if (isSelected || !tooClose) {
      kept.push(marker);
      keptVectors.push(v);
    }
  }
  return kept;
}

export function declutterMarkers(
  markers: CityMarker[],
  cameraDistance: number,
  selectedCityKey: string | null,
): CityMarker[] {
  // 카메라가 멀수록(줌아웃) 각도 임계값이 커져 가까운 핀이 합쳐진다
  const threshold = Math.max(0, (cameraDistance - 1.8) * 0.06);
  return declutterByDistance(
    markers,
    threshold,
    selectedCityKey,
    (m) => latLngToVector3(m.latitude, m.longitude, 1),
    (a, b) => a.angleTo(b),
  );
}

export function declutterMarkersPlane(
  markers: CityMarker[],
  cameraDistance: number,
  selectedCityKey: string | null,
): CityMarker[] {
  // 평면 유클리드 거리 기준 임계값 (2D 카메라 거리 범위 0.5~2.5에 맞춤)
  const threshold = Math.max(0, (cameraDistance - 0.8) * 0.04);
  return declutterByDistance(
    markers,
    threshold,
    selectedCityKey,
    (m) => latLngToPlaneVector3(m.latitude, m.longitude),
    (a, b) => a.distanceTo(b),
  );
}

export function latLngToPlaneVector3(lat: number, lng: number, z = 0): Vector3 {
  return new Vector3(
    (lng / 180) * (MAP_WIDTH / 2),
    (lat / 90) * (MAP_HEIGHT / 2),
    z,
  );
}

// 현재 카메라 x에 가장 가까운 도시 복제본의 x를 구한다. 래핑된 지도에서
// 사용자가 본 복제본으로 카메라를 이동시켜 세계를 가로지르는 점프를 막는다.
export function nearestWrappedX(baseX: number, cameraX: number): number {
  let best = baseX;
  let bestDist = Math.abs(baseX - cameraX);
  for (const k of [-1, 1]) {
    const cand = baseX + k * MAP_WIDTH;
    const d = Math.abs(cand - cameraX);
    if (d < bestDist) {
      bestDist = d;
      best = cand;
    }
  }
  return best;
}


export function buildPlaneArcCurve(
  from: Vector3,
  to: Vector3,
): QuadraticBezierCurve3 {
  const distance = from.distanceTo(to);
  const control = from.clone().add(to).multiplyScalar(0.5);
  // 베지어 곡선은 제어점들의 볼록 껍질 안에 있으므로 평면 아래로 내려가지 않는다
  control.z = Math.max(from.z, to.z) + 0.05 + distance * 0.15;
  return new QuadraticBezierCurve3(from.clone(), control, to.clone());
}

// 날짜변경선(±180°)을 가로지르는 링은 경도가 +180↔-180으로 점프해
// 지도 전체를 가로지르는 현(chord)을 만든다(유라시아→대서양이 대륙색으로 채워짐).
// 경도를 연속값으로 언랩하면 링이 ±180을 넘어 이어지고, 넘친 부분은
// 좌우 타일 복제본이 받아 이음매 없이 연결된다.
function unwrapRingLng(ring: number[][]): number[][] {
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
    return [adjusted, lat];
  });
}

function ringToPoints(ring: number[][], closePole: boolean): Vector2[] {
  const unwrapped = unwrapRingLng(ring);
  const points = unwrapped.map(([lng, lat]) => {
    const v = latLngToPlaneVector3(lat, lng);
    return new Vector2(v.x, v.y);
  });
  // 극을 감싸는 링(남극): 언랩 후 시작/끝 경도가 ~360° 차이가 난다.
  // 그대로 닫으면 위도 현이 생기므로, 지도 위/아래 모서리를 경유해 닫아
  // 극지방까지 채운다.
  const dLng = unwrapped[unwrapped.length - 1][0] - unwrapped[0][0];
  if (closePole && Math.abs(dLng) > 180) {
    const edgeLat = unwrapped[0][1] < 0 ? -90 : 90;
    const last = latLngToPlaneVector3(
      edgeLat,
      unwrapped[unwrapped.length - 1][0],
    );
    const first = latLngToPlaneVector3(edgeLat, unwrapped[0][0]);
    points.push(new Vector2(last.x, last.y), new Vector2(first.x, first.y));
  }
  return points;
}

export function geoPolygonsToShapes(polygons: number[][][][]): Shape[] {
  return polygons.map((rings) => {
    const [outer, ...holes] = rings;
    const shape = new Shape(ringToPoints(outer, true));
    for (const hole of holes) {
      shape.holes.push(new Path(ringToPoints(hole, false)));
    }
    return shape;
  });
}
