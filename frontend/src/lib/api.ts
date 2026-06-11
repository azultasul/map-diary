import type { MockData } from '@/types';

export async function fetchMockData(): Promise<MockData> {
  const response = await fetch('/mock-data.json');
  if (!response.ok) {
    throw new Error(`Failed to fetch mock data: ${response.status}`);
  }
  return response.json();
}
