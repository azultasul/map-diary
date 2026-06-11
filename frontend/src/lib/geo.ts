import { QuadraticBezierCurve3, Spherical, Vector3 } from 'three';

export const GLOBE_RADIUS = 1;

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
): QuadraticBezierCurve3 {
  const distance = from.distanceTo(to);
  const control = from
    .clone()
    .add(to)
    .multiplyScalar(0.5)
    .normalize()
    .multiplyScalar(radius + distance * 0.5);
  return new QuadraticBezierCurve3(from.clone(), control, to.clone());
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
