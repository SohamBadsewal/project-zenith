// GET /api/geocode?lat=&lon= — reverse geocode (Nominatim) + IANA timezone
// (tz-lookup, offline). Failure is NON-FATAL: returns {} and the card shows
// coordinates only (SCHEMA §3.4).

import { NextRequest, NextResponse } from 'next/server';
import tzlookup from 'tz-lookup';
import type { GeocodeResponse } from '@/types';

export const dynamic = 'force-dynamic';

interface NominatimAddress {
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  state?: string;
  country?: string;
  country_code?: string;
}

function formatPlace(addr?: NominatimAddress): string | undefined {
  if (!addr) return undefined;
  const locality =
    addr.city ?? addr.town ?? addr.village ?? addr.municipality ?? addr.county ?? addr.state;
  const cc = addr.country_code?.toUpperCase();
  if (locality && cc) return `${locality}, ${cc}`;
  return locality ?? addr.country;
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const lat = parseFloat(sp.get('lat') ?? '');
  const lon = parseFloat(sp.get('lon') ?? '');
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({} satisfies GeocodeResponse);
  }

  const out: GeocodeResponse = {};
  try {
    out.timezone = tzlookup(lat, lon); // offline, never throws for valid coords
  } catch {
    /* leave timezone undefined */
  }

  // Try MapTiler first (key lives in /api/maptiler/geocode, browser stays keyless).
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10&accept-language=en`,
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

  // Fallback: MapTiler geocoding (if a key is configured).
  if (!out.placeName) {
    try {
      const key = process.env.MAPTILER_KEY ?? process.env.NEXT_PUBLIC_MAPTILER_KEY;
      const base = key
        ? `https://api.maptiler.com/geocoding/${lon},${lat}.json?key=${key}&language=en`
        : null;
      if (base) {
        const r = await fetch(base, { next: { revalidate: 86400 } });
        if (r.ok) {
          const j = (await r.json()) as { features?: { place_name?: string }[] };
          out.placeName = j.features?.[0]?.place_name;
        }
      }
    } catch {
      /* non-fatal — keep whatever Nominatim gave */
    }
  }

  return NextResponse.json(out);
}
