// GET /api/maptiler/geocode?q=<place>       forward geocode
// GET /api/maptiler/geocode?lat=&lon=       reverse geocode
// Proxies MapTiler Geocoding with the key server-side. Non-fatal: returns
// { features: [] } on any failure (the caller falls back to Nominatim).

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
    return NextResponse.json({
      features: [],
      source: 'maptiler',
    } satisfies MapTilerGeocodeResponse);
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
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) throw new Error(`maptiler geocode ${r.status}`);
    const j = (await r.json()) as { features?: RawFeature[] };
    const features: MapTilerGeocodeFeature[] = (j.features ?? []).map((f) => ({
      placeName: f.place_name ?? '',
      center: f.center ?? [0, 0],
      placeType: f.place_type ?? [],
      relevance: f.relevance ?? 0,
    }));
    const response = NextResponse.json({
      features,
      source: 'maptiler',
    } satisfies MapTilerGeocodeResponse);
    response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
    return response;
  } catch {
    // Non-fatal: empty features, caller falls back.
    const response = NextResponse.json({
      features: [],
      source: 'maptiler',
    } satisfies MapTilerGeocodeResponse);
    response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
    return response;
  }
}
