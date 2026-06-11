'use client';

import { CameraControls } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import CameraControlsImpl from 'camera-controls';
import { useEffect, useRef } from 'react';
import { Box3, Vector3 } from 'three';
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
const MAX_DISTANCE = 2.5;
const INITIAL_DISTANCE = 1.8;
// 평면 지도를 정면(수직 부감)에서 보도록 polar/azimuth를 잠근다.
// π/2 = 카메라가 평면 정면(+z)에 위치 → 사선 왜곡 없는 정사각 비율
const POLAR_ANGLE = Math.PI / 2;
// 초기 중심: 대한민국 상공
const INITIAL_CENTER = latLngToPlaneVector3(36.5, 127.8);
// 수평은 무한 래핑이므로 x는 넓게 열어두고, y(극지방)만 막는다
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
  const selectedCityKey = useUIStore((s) => s.selectedCityKey);
  const setCameraDistance = useUIStore((s) => s.setCameraDistance);
  const { data: cityMarkers } = useCityMarkers();

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
    let active = true;
    focusingRef.current = true;
    // 이동이 끝나(도시가 중앙) Promise가 resolve되면 모달 오픈 신호를 보낸다.
    // 중간에 다른 도시가 선택되면 stale resolve를 무시한다.
    void controls.moveTo(targetX, target.y, 0, true).then(() => {
      focusingRef.current = false;
      if (active && useUIStore.getState().selectedCityKey === selectedCityKey) {
        useUIStore.getState().setCenteredCityKey(selectedCityKey);
      }
    });
    return () => {
      active = false;
      focusingRef.current = false;
    };
  }, [selectedCityKey, cityMarkers]);

  useFrame(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const quantized = Math.round(controls.distance * 10) / 10;
    if (useUIStore.getState().cameraDistance !== quantized) {
      setCameraDistance(quantized);
    }

    // 수평 무한 래핑: 카메라 x가 한 칸을 넘으면 MAP_WIDTH만큼 되돌린다.
    // 장면이 MAP_WIDTH 주기로 반복되므로 화면은 그대로(이음매 없음).
    if (focusingRef.current) return;
    const target = controls.getTarget(tmpTarget.current);
    if (target.x > MAP_WIDTH / 2 || target.x < -MAP_WIDTH / 2) {
      const shift = target.x > 0 ? -MAP_WIDTH : MAP_WIDTH;
      const position = controls.getPosition(tmpPosition.current);
      void controls.setLookAt(
        position.x + shift,
        position.y,
        position.z,
        target.x + shift,
        target.y,
        target.z,
        false,
      );
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
