'use client';

import { CameraControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import CameraControlsImpl from 'camera-controls';
import { useCallback, useEffect, useRef } from 'react';
import { Box3, type PerspectiveCamera, Vector3 } from 'three';
import { useCityMarkers } from '@/hooks/use-diary-data';
import {
  MAP_HEIGHT,
  MAP_WIDTH,
  cityKey,
  latLngToPlaneVector3,
  nearestWrappedX,
} from '@/lib/geo';
import { useUIStore } from '@/stores/ui-store';

const MIN_DISTANCE = 0.5;
// 최대 줌아웃 시에도 지도 세로가 화면을 (거의) 꽉 채우도록 제한 → 위/아래 우주 노출 최소화.
// fov 45에서 halfHeight = d*tan(22.5°)=d*0.414, MAP_HEIGHT/2=1 → d≈2.41
const MAX_DISTANCE = 2.4;
const INITIAL_DISTANCE = 1.8;
// 도시 포커스 시 줌인 목표 거리 (이미 더 가까우면 현 거리 유지)
const FOCUS_DISTANCE = 1.2;
// 평면 지도를 정면(수직 부감)에서 보도록 polar/azimuth를 잠근다.
// π/2 = 카메라가 평면 정면(+z)에 위치 → 사선 왜곡 없는 정사각 비율
const POLAR_ANGLE = Math.PI / 2;
// 초기 중심: 대한민국 상공
const INITIAL_CENTER = latLngToPlaneVector3(36.5, 127.8);
// 수평은 무한 래핑이라 x는 넓게 열고, y는 동적 클램프(아래)로 막는다
const BOUNDARY = new Box3(
  new Vector3(-MAP_WIDTH * 4, -MAP_HEIGHT / 2, -1),
  new Vector3(MAP_WIDTH * 4, MAP_HEIGHT / 2, 1),
);

export function Map2DCameraControls() {
  const controlsRef = useRef<CameraControlsImpl | null>(null);
  // 도시 포커스 애니메이션 중에는 x 래핑을 멈춰 moveTo Promise가 깨지지 않게 한다
  const focusingRef = useRef(false);
  const tmpTarget = useRef(new Vector3());
  const tmpPosition = useRef(new Vector3());
  const camera = useThree((s) => s.camera);
  const selectedCityKey = useUIStore((s) => s.selectedCityKey);
  const setCameraDistance = useUIStore((s) => s.setCameraDistance);
  const { data: cityMarkers } = useCityMarkers();

  // 현재 줌에서 화면 밖(지도 위/아래 우주)이 보이지 않도록 target.y를 제한한다.
  // 구글지도처럼 지도 끝이 화면 끝에서 멈춘다.
  const clampTargetY = useCallback(
    (y: number, distance: number) => {
      const fov = (camera as PerspectiveCamera).fov ?? 45;
      const halfHeight = distance * Math.tan((fov * Math.PI) / 360);
      const maxY = Math.max(0, MAP_HEIGHT / 2 - halfHeight);
      return Math.max(-maxY, Math.min(maxY, y));
    },
    [camera],
  );

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    controls.mouseButtons.left = CameraControlsImpl.ACTION.TRUCK;
    controls.touches.one = CameraControlsImpl.ACTION.TOUCH_TRUCK;
    controls.setBoundary(BOUNDARY);
    // 대한민국이 화면 중앙에 오도록 초기 카메라 배치(polar 잠금과 일치)
    const oy = INITIAL_DISTANCE * Math.cos(POLAR_ANGLE);
    const oz = INITIAL_DISTANCE * Math.sin(POLAR_ANGLE);
    void controls.setLookAt(
      INITIAL_CENTER.x,
      INITIAL_CENTER.y + oy,
      oz,
      INITIAL_CENTER.x,
      INITIAL_CENTER.y,
      0,
      false,
    );
  }, []);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls || !selectedCityKey || !cityMarkers) return;
    const marker = cityMarkers.find(
      (m) => cityKey(m.city, m.country) === selectedCityKey,
    );
    if (!marker) return;
    const target = latLngToPlaneVector3(marker.latitude, marker.longitude);
    // 사용자가 클릭한 복제본(현재 카메라에 가장 가까운 쪽)으로 이동
    const camX = controls.getTarget(tmpTarget.current).x;
    const targetX = nearestWrappedX(target.x, camX);
    // 줌인 후 거리 기준으로 y 클램프(우주 노출 방지) 계산
    const focusDistance = Math.min(controls.distance, FOCUS_DISTANCE);
    const targetY = clampTargetY(target.y, focusDistance);
    let active = true;
    focusingRef.current = true;
    // 이동(도시가 중앙) + dolly(줌인)가 모두 끝나면 모달 오픈 신호를 보낸다.
    // 중간에 다른 도시가 선택되면 stale resolve를 무시한다.
    void Promise.all([
      controls.moveTo(targetX, targetY, 0, true),
      controls.dollyTo(focusDistance, true),
    ]).then(() => {
      focusingRef.current = false;
      if (active && useUIStore.getState().selectedCityKey === selectedCityKey) {
        useUIStore.getState().setCenteredCityKey(selectedCityKey);
      }
    });
    return () => {
      active = false;
      focusingRef.current = false;
    };
  }, [selectedCityKey, cityMarkers, clampTargetY]);

  useFrame(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const quantized = Math.round(controls.distance * 10) / 10;
    if (useUIStore.getState().cameraDistance !== quantized) {
      setCameraDistance(quantized);
    }

    if (focusingRef.current) return;

    const target = controls.getTarget(tmpTarget.current);
    const position = controls.getPosition(tmpPosition.current);

    // 수평 무한 래핑: 카메라 x가 한 칸을 넘으면 MAP_WIDTH만큼 되돌린다.
    // 장면이 MAP_WIDTH 주기로 반복되므로 화면은 그대로(이음매 없음).
    let tx = target.x;
    let px = position.x;
    if (target.x > MAP_WIDTH / 2) {
      tx -= MAP_WIDTH;
      px -= MAP_WIDTH;
    } else if (target.x < -MAP_WIDTH / 2) {
      tx += MAP_WIDTH;
      px += MAP_WIDTH;
    }

    // 수직: 지도 끝이 화면 끝을 넘지 않도록 클램프 (정면 뷰라 position.y == target.y)
    const ty = clampTargetY(target.y, controls.distance);

    if (tx !== target.x || ty !== target.y) {
      void controls.setLookAt(px, ty, position.z, tx, ty, target.z, false);
    }
  });

  return (
    <CameraControls
      ref={controlsRef}
      minDistance={MIN_DISTANCE}
      maxDistance={MAX_DISTANCE}
      smoothTime={0.3}
      draggingSmoothTime={0.15}
      minPolarAngle={POLAR_ANGLE}
      maxPolarAngle={POLAR_ANGLE}
      minAzimuthAngle={0}
      maxAzimuthAngle={0}
    />
  );
}
