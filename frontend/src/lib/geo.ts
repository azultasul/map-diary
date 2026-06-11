import {
  CatmullRomCurve3,
  QuadraticBezierCurve3,
  Spherical,
  Vector3,
} from 'three';
import type { CityMarker } from '@/types';

export const GLOBE_RADIUS = 1;

export const MAP_WIDTH = 4;
export const MAP_HEIGHT = 2;
export const LAND_DEPTH = 0.02;

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

export function declutterMarkers(
  markers: CityMarker[],
  cameraDistance: number,
  selectedCityKey: string | null,
): CityMarker[] {
  // 카메라가 멀수록(줌아웃) 각도 임계값이 커져 가까운 핀이 합쳐진다
  const threshold = Math.max(0, (cameraDistance - 1.8) * 0.06);
  if (threshold === 0) return markers;

  const sorted = [...markers].sort((a, b) => b.diaryCount - a.diaryCount);
  const kept: CityMarker[] = [];
  const keptVectors: Vector3[] = [];

  for (const marker of sorted) {
    const v = latLngToVector3(marker.latitude, marker.longitude, 1);
    const isSelected =
      selectedCityKey === cityKey(marker.city, marker.country);
    const tooClose = keptVectors.some((k) => k.angleTo(v) < threshold);
    if (isSelected || !tooClose) {
      kept.push(marker);
      keptVectors.push(v);
    }
  }
  return kept;
}

export function latLngToPlaneVector3(lat: number, lng: number, z = 0): Vector3 {
  return new Vector3(
    (lng / 180) * (MAP_WIDTH / 2),
    (lat / 90) * (MAP_HEIGHT / 2),
    z,
  );
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
