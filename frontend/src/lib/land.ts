import type { Topology } from 'topojson-specification';

// 110m: 2D extrude용 (가벼움), 10m: 지구본·2D 텍스처용 (고해상도)
export type LandResolution = '110m' | '10m';

// 10m은 world-atlas countries 파일을 쓴다 — objects.land(육지 채움)와
// objects.countries(국경선 mesh)가 한 파일에 들어 있어 텍스처에서 둘 다 그린다.
const TOPOLOGY_URLS: Record<LandResolution, string> = {
  '110m': '/land-110m.json',
  '10m': '/countries-10m.json',
};

export async function fetchLandTopology(
  resolution: LandResolution,
): Promise<Topology> {
  const response = await fetch(TOPOLOGY_URLS[resolution]);
  if (!response.ok) {
    throw new Error(`Failed to fetch land topology: ${response.status}`);
  }
  return response.json();
}
