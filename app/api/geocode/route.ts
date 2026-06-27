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

function transliterateCyrillic(str: string): string {
  const map: Record<string, string> = {
    'А': 'A', 'а': 'a', 'Б': 'B', 'б': 'b', 'В': 'V', 'в': 'v', 'Г': 'G', 'г': 'g',
    'Д': 'D', 'д': 'd', 'Е': 'E', 'е': 'e', 'Ё': 'Yo', 'ё': 'yo', 'Ж': 'Zh', 'ж': 'zh',
    'З': 'Z', 'з': 'z', 'И': 'I', 'и': 'i', 'Й': 'Y', 'й': 'y', 'К': 'K', 'к': 'k',
    'Л': 'L', 'л': 'l', 'М': 'M', 'м': 'm', 'Н': 'N', 'н': 'n', 'О': 'O', 'о': 'o',
    'П': 'P', 'п': 'p', 'Р': 'R', 'р': 'r', 'С': 'S', 'с': 's', 'Т': 'T', 'т': 't',
    'У': 'U', 'у': 'u', 'Ф': 'F', 'ф': 'f', 'Х': 'Kh', 'х': 'kh', 'Ц': 'Ts', 'ц': 'ts',
    'Ч': 'Ch', 'ч': 'ch', 'Ш': 'Sh', 'ш': 'sh', 'Щ': 'Shch', 'щ': 'shch', 'Ъ': '', 'ъ': '',
    'Ы': 'Y', 'ы': 'y', 'Ь': '', 'ь': '', 'Э': 'E', 'э': 'e', 'Ю': 'Yu', 'ю': 'yu',
    'Я': 'Ya', 'я': 'ya'
  };
  return str.split('').map(char => map[char] ?? char).join('');
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

  // 1. Try MapTiler first (key lives in /api/maptiler/geocode, browser stays keyless).
  // MapTiler has high-fidelity transliterations and translations to English.
  try {
    const key = process.env.MAPTILER_KEY ?? process.env.NEXT_PUBLIC_MAPTILER_KEY;
    const base = key
      ? `https://api.maptiler.com/geocoding/${lon},${lat}.json?key=${key}&language=en`
      : null;
    if (base) {
      const r = await fetch(base, { cache: 'no-store' });
      if (r.ok) {
        const j = (await r.json()) as { features?: { place_name?: string }[] };
        out.placeName = j.features?.[0]?.place_name;
      }
    }
  } catch {
    /* fallback to Nominatim */
  }

  // 2. Fallback: Nominatim geocoding.
  if (!out.placeName) {
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10&accept-language=en`,
        {
          headers: { 'User-Agent': 'ProjectZenith/1.0 (hackathon demo; reverse geocode)' },
          cache: 'no-store',
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

  // 3. Guarantee Cyrillic/Russian characters are transliterated to English
  if (out.placeName) {
    out.placeName = transliterateCyrillic(out.placeName);
  }

  const response = NextResponse.json(out);
  response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
  return response;
}
