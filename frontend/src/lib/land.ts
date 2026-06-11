import type { Topology } from 'topojson-specification';

// 110m: 2D extrude용 (가벼움), 10m: 지구본 텍스처용 (고해상도 해안선)
export type LandResolution = '110m' | '10m';

export async function fetchLandTopology(
  resolution: LandResolution,
): Promise<Topology> {
  const response = await fetch(`/land-${resolution}.json`);
  if (!response.ok) {
    throw new Error(`Failed to fetch land topology: ${response.status}`);
  }
  return response.json();
}
