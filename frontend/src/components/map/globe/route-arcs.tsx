'use client';

import { useMemo } from 'react';
import { RouteArc } from '@/components/map/shared/route-arc';
import { useRoutes } from '@/hooks/use-diary-data';
import {
  GLOBE_RADIUS,
  buildArcCurve,
  cityKey,
  latLngToVector3,
} from '@/lib/geo';
import type { Route } from '@/types';

function GlobeRouteArc({ route, phase }: { route: Route; phase: number }) {
  const curve = useMemo(() => {
    const from = latLngToVector3(
      route.from.latitude,
      route.from.longitude,
      GLOBE_RADIUS * 1.005,
    );
    const to = latLngToVector3(
      route.to.latitude,
      route.to.longitude,
      GLOBE_RADIUS * 1.005,
    );
    return buildArcCurve(from, to, GLOBE_RADIUS);
  }, [route]);

  return <RouteArc route={route} curve={curve} phase={phase} baseDistance={3} />;
}

export function RouteArcs() {
  const { data: routes } = useRoutes();
  if (!routes) return null;
  return (
    <>
      {routes.map((route, index) => (
        <GlobeRouteArc
          key={`${cityKey(route.from.city, route.from.country)}->${cityKey(route.to.city, route.to.country)}-${index}`}
          route={route}
          phase={index * 0.17}
        />
      ))}
    </>
  );
}
