'use client';

import { useMemo } from 'react';
import { CityPin } from '@/components/map/shared/city-pin';
import { useCityMarkers } from '@/hooks/use-diary-data';
import {
  LAND_DEPTH,
  MAP_WIDTH,
  MAP_WRAP_OFFSETS,
  cityKey,
  declutterMarkersPlane,
  latLngToPlaneVector3,
} from '@/lib/geo';
import { useUIStore } from '@/stores/ui-store';

const PIN_HEIGHT = LAND_DEPTH + 0.01;

export function Map2DCityPins() {
  const { data: cityMarkers } = useCityMarkers();
  const cameraDistance = useUIStore((s) => s.cameraDistance);
  const selectedCityKey = useUIStore((s) => s.selectedCityKey);

  const visibleMarkers = useMemo(() => {
    if (!cityMarkers) return [];
    return declutterMarkersPlane(cityMarkers, cameraDistance, selectedCityKey);
  }, [cityMarkers, cameraDistance, selectedCityKey]);

  return (
    <>
      {/* 래핑된 지도에 맞춰 핀도 MAP_WIDTH 간격으로 타일링 */}
      {MAP_WRAP_OFFSETS.map((k) => (
        <group key={k} position-x={k * MAP_WIDTH}>
          {visibleMarkers.map((marker) => (
            <CityPin
              key={cityKey(marker.city, marker.country)}
              marker={marker}
              position={latLngToPlaneVector3(
                marker.latitude,
                marker.longitude,
                PIN_HEIGHT,
              )}
              baseDistance={1.8}
            />
          ))}
        </group>
      ))}
    </>
  );
}
