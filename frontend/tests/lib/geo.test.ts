import { describe, expect, it } from 'vitest';
import { latLngToCameraAngles, latLngToVector3 } from '@/lib/geo';

describe('latLngToVector3', () => {
  it('적도/본초자오선 (0, 0)은 +X 축 위의 점으로 변환된다', () => {
    const v = latLngToVector3(0, 0, 1);
    expect(v.x).toBeCloseTo(1);
    expect(v.y).toBeCloseTo(0);
    expect(v.z).toBeCloseTo(0);
  });

  it('북극 (90, 0)은 +Y 축 위의 점으로 변환된다', () => {
    const v = latLngToVector3(90, 0, 1);
    expect(v.x).toBeCloseTo(0);
    expect(v.y).toBeCloseTo(1);
    expect(v.z).toBeCloseTo(0);
  });

  it('적도/동경 90도 (0, 90)은 -Z 축 위의 점으로 변환된다', () => {
    const v = latLngToVector3(0, 90, 1);
    expect(v.x).toBeCloseTo(0);
    expect(v.y).toBeCloseTo(0);
    expect(v.z).toBeCloseTo(-1);
  });

  it('반지름이 보존된다', () => {
    const v = latLngToVector3(37.57, 126.98, 2.5);
    expect(v.length()).toBeCloseTo(2.5);
  });
});

describe('latLngToCameraAngles', () => {
  it('(0, 0)의 카메라 각도는 azimuth=π/2, polar=π/2', () => {
    const { azimuth, polar } = latLngToCameraAngles(0, 0);
    expect(azimuth).toBeCloseTo(Math.PI / 2);
    expect(polar).toBeCloseTo(Math.PI / 2);
  });

  it('북위로 갈수록 polar가 작아진다', () => {
    const equator = latLngToCameraAngles(0, 0);
    const north = latLngToCameraAngles(60, 0);
    expect(north.polar).toBeLessThan(equator.polar);
  });
});
