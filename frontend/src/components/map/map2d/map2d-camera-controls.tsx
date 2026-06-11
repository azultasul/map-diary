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
} from '@/lib/geo';
import { useUIStore } from '@/stores/ui-store';

const MIN_DISTANCE = 0.5;
const MAX_DISTANCE = 2.5;
// 카메라가 약간 기울어진 채로 회전이 고정되도록 polar/azimuth를 잠근다
const POLAR_ANGLE = Math.PI * 0.65;
const BOUNDARY = new Box3(
  new Vector3(-MAP_WIDTH / 2, -MAP_HEIGHT / 2, 0),
  new Vector3(MAP_WIDTH / 2, MAP_HEIGHT / 2, 0),
);

export function Map2DCameraControls() {
  const controlsRef = useRef<CameraControlsImpl | null>(null);
  const selectedCityKey = useUIStore((s) => s.selectedCityKey);
  const setCameraDistance = useUIStore((s) => s.setCameraDistance);
  const { data: cityMarkers } = useCityMarkers();

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    controls.mouseButtons.left = CameraControlsImpl.ACTION.TRUCK;
    controls.touches.one = CameraControlsImpl.ACTION.TOUCH_TRUCK;
    controls.setBoundary(BOUNDARY);
  }, []);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls || !selectedCityKey || !cityMarkers) return;
    const marker = cityMarkers.find(
      (m) => cityKey(m.city, m.country) === selectedCityKey,
    );
    if (!marker) return;
    const target = latLngToPlaneVector3(marker.latitude, marker.longitude);
    let active = true;
    // 이동이 끝나(도시가 중앙) Promise가 resolve되면 모달 오픈 신호를 보낸다.
    // 중간에 다른 도시가 선택되면 stale resolve를 무시한다.
    void controls.moveTo(target.x, target.y, 0, true).then(() => {
      if (active && useUIStore.getState().selectedCityKey === selectedCityKey) {
        useUIStore.getState().setCenteredCityKey(selectedCityKey);
      }
    });
    return () => {
      active = false;
    };
  }, [selectedCityKey, cityMarkers]);

  useFrame(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const quantized = Math.round(controls.distance * 10) / 10;
    if (useUIStore.getState().cameraDistance !== quantized) {
      setCameraDistance(quantized);
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
