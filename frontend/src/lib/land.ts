import type { Topology } from 'topojson-specification';

export async function fetchLandTopology(): Promise<Topology> {
  const response = await fetch('/land-110m.json');
  if (!response.ok) {
    throw new Error(`Failed to fetch land topology: ${response.status}`);
  }
  return response.json();
}
