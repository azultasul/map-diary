import { Spherical, Vector3 } from 'three';

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
  const spherical = new Spherical().setFromVector3(
    latLngToVector3(lat, lng, 1),
  );
  return { azimuth: spherical.theta, polar: spherical.phi };
}
