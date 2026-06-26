import type { MapTilerGeocodeFeature } from '@/types';

export async function geocode(q: string): Promise<MapTilerGeocodeFeature[]> {
  const query = q.trim();
  if (!query) return [];
  try {
    const r = await fetch(`/api/maptiler/geocode?q=${encodeURIComponent(query)}`);
    if (!r.ok) return [];
    const j = (await r.json()) as { features?: MapTilerGeocodeFeature[] };
    return j.features ?? [];
  } catch {
    return [];
  }
}

export function tileUrl(kind: string, z: number, x: number, y: number): string {
  return `/api/maptiler/tiles?kind=${kind}&z=${z}&x=${x}&y=${y}`;
}
