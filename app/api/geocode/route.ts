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

  return NextResponse.json(out);
}
