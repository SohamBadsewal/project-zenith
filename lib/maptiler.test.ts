import { describe, it, expect } from 'vitest';
import {
  rasterTileUrl,
  vectorTileUrl,
  terrainTileUrl,
  geocodeForwardUrl,
  geocodeReverseUrl,
  rasterTileUrlXYZ,
  vectorTileUrlXYZ,
  terrainTileUrlXYZ,
  latLonToTileXY,
  ATTRIBUTION,
} from './maptiler';

describe('maptiler endpoint builders', () => {
  const KEY = 'test-key-123';

  it('builds a raster satellite tile URL from lat/lon (z0 → single global tile)', () => {
    // z0 means the whole world is one tile (0,0,0) regardless of lat/lon.
    expect(rasterTileUrl('satellite-v4', 5, 10, 0, KEY)).toBe(
      'https://api.maptiler.com/maps/satellite-v4/0/0/0.jpg?key=test-key-123',
    );
  });

  it('builds a vector MVT tile URL from lat/lon (z0 → single tile)', () => {
    expect(vectorTileUrl('v3', 5, 10, 0, KEY)).toBe(
      'https://api.maptiler.com/tiles/v3/0/0/0.pbf?key=test-key-123',
    );
  });

  it('builds a terrain-rgb tile URL from lat/lon (z0 → single tile, /tiles/ prefix)', () => {
    expect(terrainTileUrl(5, 10, 0, KEY)).toBe(
      'https://api.maptiler.com/tiles/terrain-rgb/0/0/0.png?key=test-key-123',
    );
  });

  it('builds a forward geocode URL with encoded query', () => {
    expect(geocodeForwardUrl('Mumbai, IN', KEY)).toBe(
      'https://api.maptiler.com/geocoding/Mumbai%2C%20IN.json?key=test-key-123',
    );
  });

  it('builds a reverse geocode URL (lon,lat order)', () => {
    expect(geocodeReverseUrl(19.076, 72.877, KEY)).toBe(
      'https://api.maptiler.com/geocoding/72.877,19.076.json?key=test-key-123',
    );
  });

  it('XYZ raster URL', () => {
    expect(rasterTileUrlXYZ('satellite-v4', 10, 5, 15, KEY)).toBe(
      'https://api.maptiler.com/maps/satellite-v4/15/10/5.jpg?key=test-key-123',
    );
  });

  it('XYZ vector URL', () => {
    expect(vectorTileUrlXYZ('v3', 10, 5, 15, KEY)).toBe(
      'https://api.maptiler.com/tiles/v3/15/10/5.pbf?key=test-key-123',
    );
  });

  it('XYZ terrain URL', () => {
    expect(terrainTileUrlXYZ(10, 5, 15, KEY)).toBe(
      'https://api.maptiler.com/tiles/terrain-rgb/15/10/5.png?key=test-key-123',
    );
  });

  it('latLonToTileXY at z0 is always (0,0)', () => {
    expect(latLonToTileXY(0, 0, 0)).toEqual({ x: 0, y: 0 });
    expect(latLonToTileXY(45, 90, 0)).toEqual({ x: 0, y: 0 });
  });

  it('latLonToTileXY at z1 splits the world into 4', () => {
    // (lat=0, lon=0) ≈ origin → tile (1,1); (lat=0, lon=-90) west → tile (0,1)
    expect(latLonToTileXY(0, 0, 1)).toEqual({ x: 1, y: 1 });
    expect(latLonToTileXY(0, -90, 1)).toEqual({ x: 0, y: 1 });
  });

  it('carries the attribution string', () => {
    expect(ATTRIBUTION).toContain('MapTiler');
    expect(ATTRIBUTION).toContain('OpenStreetMap');
  });
});

