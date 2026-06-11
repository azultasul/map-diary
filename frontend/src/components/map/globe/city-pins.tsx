'use client';

import { useMemo } from 'react';
import { CityPin } from '@/components/map/shared/city-pin';
import { useCityMarkers } from '@/hooks/use-diary-data';
import {
  GLOBE_RADIUS,
  cityKey,
  declutterMarkers,
  latLngToVector3,
} from '@/lib/geo';
import { useUIStore } from '@/stores/ui-store';

export function CityPins() {
  const { data: cityMarkers } = useCityMarkers();
  const cameraDistance = useUIStore((s) => s.cameraDistance);
  const selectedCityKey = useUIStore((s) => s.selectedCityKey);

  const visibleMarkers = useMemo(() => {
    if (!cityMarkers) return [];
    return declutterMarkers(cityMarkers, cameraDistance, selectedCityKey);
  }, [cityMarkers, cameraDistance, selectedCityKey]);

  return (
    <>
      {visibleMarkers.map((marker) => (
        <CityPin
          key={cityKey(marker.city, marker.country)}
          marker={marker}
          position={latLngToVector3(
            marker.latitude,
            marker.longitude,
            GLOBE_RADIUS * 1.005,
          )}
        />
      ))}
    </>
  );
}
