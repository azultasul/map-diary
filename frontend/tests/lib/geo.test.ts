import { describe, expect, it } from 'vitest';
import {
  buildArcCurve,
  geoLinesToPositions,
  latLngToCameraAngles,
  latLngToVector3,
} from '@/lib/geo';

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

describe('buildArcCurve', () => {
  const tokyo = latLngToVector3(35.68, 139.65, 1);
  const seoul = latLngToVector3(37.57, 126.98, 1);
  const paris = latLngToVector3(48.86, 2.35, 1);
  const buenosAires = latLngToVector3(-34.6, -58.38, 1);

  it('곡선의 시작/끝점이 from/to와 일치한다', () => {
    const curve = buildArcCurve(tokyo, seoul, 1);
    expect(curve.getPoint(0).distanceTo(tokyo)).toBeCloseTo(0);
    expect(curve.getPoint(1).distanceTo(seoul)).toBeCloseTo(0);
  });

  it('대척점 근처 경로도 곡선 전체가 구 표면 위에 있다', () => {
    const curve = buildArcCurve(seoul, buenosAires, 1);
    for (let i = 0; i <= 20; i++) {
      expect(curve.getPoint(i / 20).length()).toBeGreaterThan(0.99);
    }
  });

  it('곡선 중간점이 구 표면보다 바깥에 있다', () => {
    const curve = buildArcCurve(tokyo, seoul, 1);
    expect(curve.getPoint(0.5).length()).toBeGreaterThan(1);
  });

  it('각거리가 먼 경로일수록 호가 더 높다', () => {
    const short = buildArcCurve(tokyo, seoul, 1);
    const long = buildArcCurve(tokyo, paris, 1);
    expect(long.getPoint(0.5).length()).toBeGreaterThan(
      short.getPoint(0.5).length(),
    );
  });
});

describe('geoLinesToPositions', () => {
  it('n개 점의 라인을 n-1개 세그먼트(쌍 좌표)로 변환한다', () => {
    const lines = [
      [
        [0, 0],
        [90, 0],
        [90, 45],
      ],
    ];
    const positions = geoLinesToPositions(lines, 1);
    expect(positions).toHaveLength(12); // 2 segments * 2 points * 3 floats
  });

  it('각 점은 latLngToVector3 결과와 일치한다 (GeoJSON은 [lng, lat] 순서)', () => {
    const lines = [
      [
        [0, 0],
        [90, 0],
      ],
    ];
    const positions = geoLinesToPositions(lines, 1);
    const start = latLngToVector3(0, 0, 1);
    const end = latLngToVector3(0, 90, 1);
    expect(positions[0]).toBeCloseTo(start.x);
    expect(positions[1]).toBeCloseTo(start.y);
    expect(positions[2]).toBeCloseTo(start.z);
    expect(positions[3]).toBeCloseTo(end.x);
    expect(positions[4]).toBeCloseTo(end.y);
    expect(positions[5]).toBeCloseTo(end.z);
  });

  it('세그먼트는 연속된 점을 잇는다 (이전 세그먼트 끝 = 다음 세그먼트 시작)', () => {
    const lines = [
      [
        [0, 0],
        [90, 0],
        [90, 45],
      ],
    ];
    const positions = geoLinesToPositions(lines, 1);
    expect(positions[6]).toBeCloseTo(positions[3]);
    expect(positions[7]).toBeCloseTo(positions[4]);
    expect(positions[8]).toBeCloseTo(positions[5]);
  });
});
