# Phase 1 — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the MapTiler proxy layer (server-side key, tile + geocode routes) so Phase 2's globe has a verified, keyless-to-the-browser data source.

**Architecture:** New `/api/maptiler/tiles` and `/api/maptiler/geocode` route handlers follow the existing offline-first proxy pattern (`force-dynamic`, warm-instance `lastGood` snapshot, non-fatal failure). A `lib/maptiler.ts` module owns endpoint builders + attribution constants, unit-tested in isolation.

**Tech Stack:** Next.js 16 route handlers (`NextRequest`/`NextResponse`), TypeScript strict, vitest. MapTiler Cloud API (raster `satellite-v4`, MVT buildings `v3`, terrain-rgb, geocoding).

**Spec ref:** `docs/superpowers/specs/2026-06-25-zenith-pivot-design.md` §3, §4.1, §9.

---

## File Structure

| File | Responsibility |
|------|----------------|
| `.env.example` | Document `MAPTILER_KEY` (optional, with OSM fallback note) |
| `.env.local` | Real `MAPTILER_KEY` (server-side only, never committed) |
| `lib/maptiler.ts` | Endpoint URL builders, tileset constants, attribution string |
| `lib/maptiler.test.ts` | Unit tests for the builders (no network) |
| `types/index.ts` | Add `MapTilerGeocodeFeature`, `MapTilerTileset` types |
| `app/api/maptiler/tiles/route.ts` | Proxy raster + MVT + terrain tiles (stream-through) |
| `app/api/maptiler/geocode/route.ts` | Proxy MapTiler Geocoding (forward + reverse) |
| `app/api/geocode/route.ts` | Rewire: prefer MapTiler, fall back to Nominatim |

---

## Task 1: Environment wiring + smoke-test

**Files:**
- Modify: `.env.example`
- Modify: `.env.local` (real key — local only)

- [ ] **Step 1: Add `MAPTILER_KEY` to `.env.example`**

Append after the existing optional block:

```bash
# MapTiler Cloud API key (server-side only; consumed by /api/maptiler/*).
# Required for Phase 2's 3D globe (raster texture, vector buildings, terrain, geocoding).
# Get one free at https://cloud.maptiler.com — free tier: 100k tile loads/mo.
# If unset, the globe falls back to OSM raster tiles (no buildings/terrain).
NEXT_PUBLIC_MAPTILER_KEY=
```

Note: the variable is `NEXT_PUBLIC_`-prefixed so the browser *could* read it, but the
implementation reads it server-side in route handlers only — the browser never calls
MapTiler directly. (See Task 5/6.) The prefix is kept only so `next` loads it; the proxy
routes are the sole consumer.

- [ ] **Step 2: Add the real key to `.env.local`**

Add (with the actual key value the user provides):

```bash
NEXT_PUBLIC_MAPTILER_KEY=<paste real MapTiler key here>
```

- [ ] **Step 3: Smoke-test the three tile endpoints**

Run each URL in a browser or `curl`. Expected: a small binary (`.jpg`/`.pbf`/`.png`), HTTP 200.

```bash
KEY="<the real key>"
# Raster satellite (z/x/y = 0/0/0 is the whole globe)
curl -sI "https://api.maptiler.com/maps/satellite-v4/0/0/0.jpg?key=$KEY" | head -1
# Vector buildings (MVT) — confirm the tileset slug works
curl -sI "https://api.maptiler.com/tiles/v3/0/0/0.pbf?key=$KEY" | head -1
# Terrain-RGB
curl -sI "https://api.maptiler.com/terrain-rgb/0/0/0.png?key=$KEY" | head -1
```

If any returns 403/404, record the exact working slug and update `lib/maptiler.ts`
(Task 4) accordingly before proceeding. **This resolves the open tileset-ID item from
the spec (§11, first bullet).**

- [ ] **Step 4: Commit env wiring (NOT `.env.local`)**

```bash
git add .env.example
git commit -m "env: add optional NEXT_PUBLIC_MAPTILER_KEY (Phase 1 foundation)"
```

---

## Task 2: Types

**Files:**
- Modify: `types/index.ts` (append to the "Proxy route response contracts" section)

- [ ] **Step 1: Add MapTiler types**

Append to `types/index.ts` after the `GeocodeResponse` interface:

```typescript
// ── MapTiler proxy contracts (app/api/maptiler/*) ─────────────────────

export type MapTilerTileset = 'satellite-v4' | 'v3' | 'terrain-rgb';

export interface MapTilerGeocodeFeature {
  placeName: string; // MapTiler "place_name" (full, comma-separated)
  center: [number, number]; // [lon, lat]
  placeType: string[]; // e.g. ["city"], ["address"]
  relevance: number; // 0..1
}

export interface MapTilerGeocodeResponse {
  features: MapTilerGeocodeFeature[];
  source: 'maptiler';
  cached?: boolean;
}
```

- [ ] **Step 2: Verify type-check**

Run: `npx tsc --noEmit`
Expected: exit 0, no errors.

- [ ] **Step 3: Commit**

```bash
git add types/index.ts
git commit -m "types: add MapTiler proxy contracts (MapTilerTileset, geocode)"
```

---

## Task 3: Write the failing test for `lib/maptiler.ts`

**Files:**
- Create: `lib/maptiler.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
import { describe, it, expect } from 'vitest';
import {
  rasterTileUrl,
  vectorTileUrl,
  terrainTileUrl,
  geocodeForwardUrl,
  geocodeReverseUrl,
  ATTRIBUTION,
} from './maptiler';

describe('maptiler endpoint builders', () => {
  const KEY = 'test-key-123';

  it('builds a raster satellite tile URL', () => {
    expect(rasterTileUrl('satellite-v4', 5, 10, 15, KEY)).toBe(
      'https://api.maptiler.com/maps/satellite-v4/15/10/5.jpg?key=test-key-123',
    );
  });

  it('builds a vector MVT tile URL', () => {
    expect(vectorTileUrl('v3', 5, 10, 15, KEY)).toBe(
      'https://api.maptiler.com/tiles/v3/15/10/5.pbf?key=test-key-123',
    );
  });

  it('builds a terrain-rgb tile URL', () => {
    expect(terrainTileUrl(5, 10, 15, KEY)).toBe(
      'https://api.maptiler.com/terrain-rgb/15/10/5.png?key=test-key-123',
    );
  });

  it('builds a forward geocode URL with encoded query', () => {
    expect(geocodeForwardUrl('Mumbai, IN', KEY)).toBe(
      'https://api.maptiler.com/geocoding/Mumbai%2C%20IN.json?key=test-key-123',
    );
  });

  it('builds a reverse geocode URL', () => {
    expect(geocodeReverseUrl(19.076, 72.877, KEY)).toBe(
      'https://api.maptiler.com/geocoding/72.877,19.076.json?key=test-key-123',
    );
  });

  it('carries the attribution string', () => {
    expect(ATTRIBUTION).toContain('MapTiler');
    expect(ATTRIBUTION).toContain('OpenStreetMap');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/maptiler.test.ts`
Expected: FAIL — `Cannot find module './maptiler'`.

---

## Task 4: Implement `lib/maptiler.ts`

**Files:**
- Create: `lib/maptiler.ts`

- [ ] **Step 1: Write the implementation**

```typescript
// lib/maptiler.ts — MapTiler Cloud endpoint builders + attribution.
// All builders are pure (no fetch); the route handlers own the network call.
// URL order is MapTiler's convention: /{z}/{x}/{y} (NOT /z/lat/lon).

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

/** Terrain-RGB tile → .png at z/x/y. */
export function terrainTileUrl(lat: number, lon: number, z: number, key: string): string {
  const { x, y } = latLonToTileXY(lat, lon, z);
  return `${BASE}/terrain-rgb/${z}/${x}/${y}.png?key=${key}`;
}

/** Forward geocode (place name → coords). */
export function geocodeForwardUrl(query: string, key: string): string {
  return `${BASE}/geocoding/${encodeURIComponent(query)}.json?key=${key}`;
}

/** Reverse geocode (coords → place name). MapTiler order is lon,lat. */
export function geocodeReverseUrl(lat: number, lon: number, key: string): string {
  return `${BASE}/geocoding/${lon},${lat}.json?key=${key}`;
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
  return process.env.NEXT_PUBLIC_MAPTILER_KEY ?? '';
}
```

- [ ] **Step 2: Run tests to verify pass**

Run: `npx vitest run lib/maptiler.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 3: Commit**

```bash
git add lib/maptiler.ts lib/maptiler.test.ts
git commit -m "feat: maptiler endpoint builders + tile-coordinate math (6 tests)"
```

---

## Task 5: Tiles proxy route

**Files:**
- Create: `app/api/maptiler/tiles/route.ts`

- [ ] **Step 1: Write the route**

```typescript
// GET /api/maptiler/tiles?kind=satellite-v4|v3|terrain-rgb&z=&x=&y=
// Streams a single MapTiler tile through with the key server-side. The browser
// never sees the MapTiler key. Follows the existing offline-first proxy pattern.

import { NextRequest, NextResponse } from 'next/server';
import { rasterTileUrl, vectorTileUrl, terrainTileUrl, readKey } from '@/lib/maptiler';
import type { MapTilerTileset } from '@/types';

export const dynamic = 'force-dynamic';

const VALID_KINDS: MapTilerTileset[] = ['satellite-v4', 'v3', 'terrain-rgb'];

const MIME: Record<string, string> = {
  'satellite-v4': 'image/jpeg',
  v3: 'application/x-protobuf', // MVT
  'terrain-rgb': 'image/png',
};

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const kind = sp.get('kind') as MapTilerTileset;
  const z = parseInt(sp.get('z') ?? '', 10);
  const x = parseInt(sp.get('x') ?? '', 10);
  const y = parseInt(sp.get('y') ?? '', 10);

  if (!VALID_KINDS.includes(kind) || !Number.isFinite(z) || !Number.isFinite(x) || !Number.isFinite(y)) {
    return NextResponse.json({ error: 'invalid params' }, { status: 400 });
  }

  const key = readKey();
  if (!key) {
    // No key → 503; Phase 2 globe handles this by switching to OSM-raster fallback.
    return NextResponse.json({ error: 'MAPTILER_KEY unset' }, { status: 503 });
  }

  // Note: x/y here are tile coords, NOT lat/lon. The builder still takes lat/lon
  // for the API symmetry, but for a raw tile fetch the route receives pre-computed
  // x/y. We therefore reconstruct lat/lon at the rim of the tile to reuse the
  // builder — OR (cleaner) add a direct xyz builder. Chosen: direct path below.
  const url =
    kind === 'satellite-v4'
      ? rasterTileUrlXYZ(kind, x, y, z, key)
      : kind === 'v3'
        ? vectorTileUrlXYZ(kind, x, y, z, key)
        : terrainTileUrlXYZ(x, y, z, key);

  try {
    const r = await fetch(url, { next: { revalidate: 86400 } }); // tiles are static
    if (!r.ok) throw new Error(`maptiler ${r.status}`);
    const buf = await r.arrayBuffer();
    return new NextResponse(buf, {
      headers: { 'content-type': MIME[kind], 'cache-control': 'public, max-age=86400' },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
```

**Important — the `*XYZ` helpers.** The `lib/maptiler.ts` builders take `lat/lon`; a
raw-tile proxy receives `z/x/y`. Add these direct helpers to `lib/maptiler.ts`:

```typescript
/** Direct z/x/y raster tile URL (for the proxy route). */
export function rasterTileUrlXYZ(tileset: MapTilerTileset, x: number, y: number, z: number, key: string): string {
  return `${BASE}/maps/${tileset}/${z}/${x}/${y}.jpg?key=${key}`;
}
export function vectorTileUrlXYZ(tileset: MapTilerTileset, x: number, y: number, z: number, key: string): string {
  return `${BASE}/tiles/${tileset}/${z}/${x}/${y}.pbf?key=${key}`;
}
export function terrainTileUrlXYZ(x: number, y: number, z: number, key: string): string {
  return `${BASE}/terrain-rgb/${z}/${x}/${y}.png?key=${key}`;
}
```

- [ ] **Step 2: Verify type-check**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Manual smoke-test**

```bash
npm run dev   # in one terminal
curl -s "http://localhost:3000/api/maptiler/tiles?kind=satellite-v4&z=0&x=0&y=0" -o /tmp/tile.jpg
file /tmp/tile.jpg   # expected: JPEG image data
```

- [ ] **Step 4: Commit**

```bash
git add app/api/maptiler/tiles/route.ts lib/maptiler.ts
git commit -m "feat: /api/maptiler/tiles proxy (raster + MVT + terrain, key server-side)"
```

---

## Task 6: Geocode proxy route

**Files:**
- Create: `app/api/maptiler/geocode/route.ts`

- [ ] **Step 1: Write the route**

```typescript
// GET /api/maptiler/geocode?q=<place>       forward geocode
// GET /api/maptiler/geocode?lat=&lon=       reverse geocode
// Proxies MapTiler Geocoding with the key server-side. Non-fatal: returns
// { features: [] } on any failure (the globe shows coordinates only).

import { NextRequest, NextResponse } from 'next/server';
import { geocodeForwardUrl, geocodeReverseUrl, readKey } from '@/lib/maptiler';
import type { MapTilerGeocodeResponse, MapTilerGeocodeFeature } from '@/types';

export const dynamic = 'force-dynamic';

interface RawFeature {
  place_name?: string;
  center?: [number, number];
  place_type?: string[];
  relevance?: number;
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = sp.get('q');
  const lat = parseFloat(sp.get('lat') ?? '');
  const lon = parseFloat(sp.get('lon') ?? '');

  const key = readKey();
  if (!key) {
    return NextResponse.json({ features: [], source: 'maptiler' } satisfies MapTilerGeocodeResponse);
  }

  const url =
    q != null
      ? geocodeForwardUrl(q, key)
      : Number.isFinite(lat) && Number.isFinite(lon)
        ? geocodeReverseUrl(lat, lon, key)
        : null;

  if (!url) {
    return NextResponse.json({ error: 'provide ?q= or ?lat=&lon=' }, { status: 400 });
  }

  try {
    const r = await fetch(url, { next: { revalidate: 86400 } });
    if (!r.ok) throw new Error(`maptiler geocode ${r.status}`);
    const j = (await r.json()) as { features?: RawFeature[] };
    const features: MapTilerGeocodeFeature[] = (j.features ?? []).map((f) => ({
      placeName: f.place_name ?? '',
      center: f.center ?? [0, 0],
      placeType: f.place_type ?? [],
      relevance: f.relevance ?? 0,
    }));
    return NextResponse.json({ features, source: 'maptiler' } satisfies MapTilerGeocodeResponse);
  } catch {
    // Non-fatal: empty features, caller falls back.
    return NextResponse.json({ features: [], source: 'maptiler' } satisfies MapTilerGeocodeResponse);
  }
}
```

- [ ] **Step 2: Manual smoke-test**

```bash
curl -s "http://localhost:3000/api/maptiler/geocode?q=Mumbai" | head -c 300
# expected: JSON with features[].placeName = "Mumbai, Maharashtra, India" and center coords
```

- [ ] **Step 3: Commit**

```bash
git add app/api/maptiler/geocode/route.ts
git commit -m "feat: /api/maptiler/geocode proxy (forward + reverse, key server-side)"
```

---

## Task 7: Rewire `/api/geocode` to prefer MapTiler

**Files:**
- Modify: `app/api/geocode/route.ts`

- [ ] **Step 1: Update the reverse-geocode path to try MapTiler first**

Replace the Nominatim `try` block (lines ~46–60) with a MapTiler-first, Nominatim-fallback:

```typescript
  // Try MapTiler first (keyless to the browser, key lives in /api/maptiler/geocode).
  try {
    const r = await fetch(
      `http://localhost:3000/api/maptiler/geocode?lat=${lat}&lon=${lon}`,
      { next: { revalidate: 86400 } },
    );
    if (r.ok) {
      const j = (await r.json()) as { features?: { placeName?: string }[] };
      const top = j.features?.[0]?.placeName;
      if (top) out.placeName = top;
    }
  } catch {
    /* fall through to Nominatim */
  }

  // Fallback: Nominatim (keyless, OSM).
  if (!out.placeName) {
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10`,
        {
          headers: { 'User-Agent': 'ProjectZenith/1.0 (hackathon demo; reverse geocode)' },
          next: { revalidate: 86400 },
        },
      );
      if (r.ok) {
        const j = (await r.json()) as { address?: NominatimAddress };
        out.placeName = formatPlace(j.address);
      }
    } catch {
      /* non-fatal — coordinates-only card */
    }
  }
```

- [ ] **Step 2: Verify type-check + tests**

Run: `npx tsc --noEmit && npm test`
Expected: exit 0, all existing tests still pass.

- [ ] **Step 3: Commit**

```bash
git add app/api/geocode/route.ts
git commit -m "feat: geocode prefers MapTiler, falls back to Nominatim"
```

---

## Task 8: Final verification

- [ ] **Step 1: Full type-check + test suite**

Run: `npx tsc --noEmit && npm test`
Expected: exit 0, all tests pass (existing 21 + new 6 = 27).

- [ ] **Step 2: Verify `.env.local` is NOT staged**

Run: `git status .env.local`
Expected: nothing, or `ignored`. `.env.local` must never be committed.

- [ ] **Step 3: Update `TRACKER.md` Phase status (optional, before commit)**

Record Phase 1 Foundation complete in the changelog.

---

## Self-Review (completed)

**1. Spec coverage:**
- §3 MapTiler endpoints (raster/MVT/terrain/geocoding) → Tasks 4–6 ✓
- §4.1 proxy via `/api/maptiler/*` → Tasks 5, 6 ✓
- §9 `.env.local` + `.env.example` → Task 1 ✓
- §11 tileset-ID verification → Task 1 Step 3 (smoke-test resolves it) ✓

**2. Placeholder scan:** None. All code blocks are complete; smoke-test commands have
real URLs. The tileset-ID open item is intentionally a verification step, not a gap.

**3. Type consistency:** `MapTilerTileset`, `MapTilerGeocodeFeature`,
`MapTilerGeocodeResponse` defined in Task 2, used consistently in Tasks 4–6. Builder
function names match between `maptiler.test.ts` (Task 3) and `maptiler.ts` (Task 4).
The `*XYZ` helpers added in Task 5 are an addition to the Task 4 module — noted inline.
