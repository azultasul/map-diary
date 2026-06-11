import { CatmullRomCurve3, Spherical, Vector3 } from 'three';

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
