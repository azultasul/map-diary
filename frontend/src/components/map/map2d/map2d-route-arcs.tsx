'use client';

import { useMemo } from 'react';
import { RouteArc } from '@/components/map/shared/route-arc';
import { useRoutes } from '@/hooks/use-diary-data';
import {
  LAND_DEPTH,
  buildPlaneArcCurve,
  cityKey,
  latLngToPlaneVector3,
} from '@/lib/geo';
import type { Route } from '@/types';

const ARC_BASE_HEIGHT = LAND_DEPTH + 0.005;

function PlaneRouteArc({ route, phase }: { route: Route; phase: number }) {
  const curve = useMemo(() => {
    const from = latLngToPlaneVector3(
      route.from.latitude,
      route.from.longitude,
      ARC_BASE_HEIGHT,
    );
    const to = latLngToPlaneVector3(
      route.to.latitude,
      route.to.longitude,
      ARC_BASE_HEIGHT,
    );
    return buildPlaneArcCurve(from, to);
  }, [route]);

  return <RouteArc route={route} curve={curve} phase={phase} />;
}

export function Map2DRouteArcs() {
  const { data: routes } = useRoutes();
  if (!routes) return null;
  return (
    <>
      {routes.map((route, index) => (
        <PlaneRouteArc
          key={`${cityKey(route.from.city, route.from.country)}->${cityKey(route.to.city, route.to.country)}-${index}`}
          route={route}
          phase={index * 0.17}
        />
      ))}
    </>
  );
}
