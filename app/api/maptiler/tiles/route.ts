// GET /api/maptiler/tiles?kind=satellite-v4|v3|terrain-rgb&z=&x=&y=
// Streams a single MapTiler tile through with the key server-side. The browser
// never sees the MapTiler key. Tiles are static → cached via revalidate (no
// lastGood snapshot needed, unlike mutating data such as TLEs).

import { NextRequest, NextResponse } from 'next/server';
import { rasterTileUrlXYZ, vectorTileUrlXYZ, terrainTileUrlXYZ, readKey } from '@/lib/maptiler';
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

  if (
    !VALID_KINDS.includes(kind) ||
    !Number.isFinite(z) ||
    !Number.isFinite(x) ||
    !Number.isFinite(y)
  ) {
    return NextResponse.json({ error: 'invalid params' }, { status: 400 });
  }

  const key = readKey();
  if (!key) {
    // No key → 503; Phase 2 globe switches to OSM-raster fallback on this.
    return NextResponse.json({ error: 'MAPTILER_KEY unset' }, { status: 503 });
  }

  const url =
    kind === 'satellite-v4'
      ? rasterTileUrlXYZ(kind, x, y, z, key)
      : kind === 'v3'
        ? vectorTileUrlXYZ(kind, x, y, z, key)
        : terrainTileUrlXYZ(x, y, z, key);

  try {
    const r = await fetch(url, { next: { revalidate: 86400 } });
    if (!r.ok) throw new Error(`maptiler ${r.status}`);
    const buf = await r.arrayBuffer();
    return new NextResponse(buf, {
      headers: { 'content-type': MIME[kind], 'cache-control': 'public, max-age=86400' },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
