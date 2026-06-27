// lib/maptiler.ts — MapTiler Cloud endpoint builders + attribution.
// All builders are pure (no fetch); the route handlers own the network call.
// URL order is MapTiler's convention: /{z}/{x}/{y} (NOT /z/lat/lon).
// Terrain-RGB lives under /tiles/terrain-rgb/ (note the /tiles/ prefix).

import type { MapTilerTileset } from '@/types';

const BASE = 'https://api.maptiler.com';

/** Required attribution per MapTiler ToS — show in globe UI. */
export const ATTRIBUTION = '© MapTiler © OpenStreetMap contributors';

/** Raster tile (satellite/streets) → .jpg at z/x/y. */
export function rasterTileUrl(
  tileset: MapTilerTileset,
  lat: number,
  lon: number,
  z: number,
  key: string,
): string {
  const { x, y } = latLonToTileXY(lat, lon, z);
  return `${BASE}/maps/${tileset}/${z}/${x}/${y}.jpg?key=${key}`;
}

/** Vector MVT tile (buildings) → .pbf at z/x/y. */
export function vectorTileUrl(
  tileset: MapTilerTileset,
  lat: number,
  lon: number,
  z: number,
  key: string,
): string {
  const { x, y } = latLonToTileXY(lat, lon, z);
  return `${BASE}/tiles/${tileset}/${z}/${x}/${y}.pbf?key=${key}`;
}

/** Terrain-RGB tile → .png at z/x/y. NOTE: /tiles/ prefix, maxzoom 12. */
export function terrainTileUrl(lat: number, lon: number, z: number, key: string): string {
  const { x, y } = latLonToTileXY(lat, lon, z);
  return `${BASE}/tiles/terrain-rgb/${z}/${x}/${y}.png?key=${key}`;
}

/** Forward geocode (place name → coords). */
export function geocodeForwardUrl(query: string, key: string): string {
  return `${BASE}/geocoding/${encodeURIComponent(query)}.json?key=${key}`;
}

/** Reverse geocode (coords → place name). MapTiler order is lon,lat. */
export function geocodeReverseUrl(lat: number, lon: number, key: string): string {
  return `${BASE}/geocoding/${lon},${lat}.json?key=${key}`;
}

/** Direct z/x/y raster tile URL (for the proxy route). */
export function rasterTileUrlXYZ(
  tileset: MapTilerTileset,
  x: number,
  y: number,
  z: number,
  key: string,
): string {
  return `${BASE}/maps/${tileset}/${z}/${x}/${y}.jpg?key=${key}`;
}

/** Direct z/x/y vector tile URL (for the proxy route). */
export function vectorTileUrlXYZ(
  tileset: MapTilerTileset,
  x: number,
  y: number,
  z: number,
  key: string,
): string {
  return `${BASE}/tiles/${tileset}/${z}/${x}/${y}.pbf?key=${key}`;
}

/** Direct z/x/y terrain tile URL (for the proxy route). */
export function terrainTileUrlXYZ(x: number, y: number, z: number, key: string): string {
  return `${BASE}/tiles/terrain-rgb/${z}/${x}/${y}.png?key=${key}`;
}

/**
 * Slippy-map tile coords from lat/lon/zoom. Standard Web Mercator.
 * MapTiler tiles are 512px, but the tile *coordinate* math is independent
 * of tile size — size only matters for pixel-scale in the renderer.
 */
export function latLonToTileXY(lat: number, lon: number, z: number): { x: number; y: number } {
  const n = Math.pow(2, z);
  const x = Math.floor(((lon + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
  return { x, y };
}

/** Read the key server-side; returns '' if unset (triggers fallback). */
export function readKey(): string {
  return process.env.MAPTILER_KEY ?? process.env.NEXT_PUBLIC_MAPTILER_KEY ?? '';
}
