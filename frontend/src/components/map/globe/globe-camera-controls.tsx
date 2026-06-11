'use client';

import { CameraControls } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type CameraControlsImpl from 'camera-controls';
import { useEffect, useRef } from 'react';
import { useCityMarkers } from '@/hooks/use-diary-data';
import { cityKey, latLngToCameraAngles } from '@/lib/geo';
import { useUIStore } from '@/stores/ui-store';

const MIN_DISTANCE = 1.4;
const MAX_DISTANCE = 4;

export function GlobeCameraControls() {
  const controlsRef = useRef<CameraControlsImpl | null>(null);
  const selectedCityKey = useUIStore((s) => s.selectedCityKey);
  const setCameraDistance = useUIStore((s) => s.setCameraDistance);
  const { data: cityMarkers } = useCityMarkers();

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls || !selectedCityKey || !cityMarkers) return;
    const marker = cityMarkers.find(
      (m) => cityKey(m.city, m.country) === selectedCityKey,
    );
    if (!marker) return;
    const { azimuth, polar } = latLngToCameraAngles(
      marker.latitude,
      marker.longitude,
    );
    let active = true;
    // 회전이 끝나(도시가 중앙) Promise가 resolve되면 모달 오픈 신호를 보낸다.
    // 중간에 다른 도시가 선택되면 stale resolve를 무시한다.
    void controls.rotateTo(azimuth, polar, true).then(() => {
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
    />
  );
}
