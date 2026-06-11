'use client';

import { useMemo } from 'react';
import { CityPin } from '@/components/map/shared/city-pin';
import { useCityMarkers } from '@/hooks/use-diary-data';
import {
  LAND_DEPTH,
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
      {visibleMarkers.map((marker) => (
        <CityPin
          key={cityKey(marker.city, marker.country)}
          marker={marker}
          position={latLngToPlaneVector3(
            marker.latitude,
            marker.longitude,
            PIN_HEIGHT,
          )}
        />
      ))}
    </>
  );
}
