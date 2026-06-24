// GET /api/celestrak?group=visual | ?catnr=25544
// Proxies CelesTrak GP (FORMAT=TLE), normalises to SatelliteTLE[], caches, and
// serves the last-good snapshot if the upstream fails (SCHEMA §3.1, RULES §4/§5).

import { NextRequest, NextResponse } from 'next/server';
import { parseTleText, CELESTRAK_BASE } from '@/lib/celestrak';
import type { CelestrakResponse, SatelliteTLE } from '@/types';

export const dynamic = 'force-dynamic';

// Warm-instance last-good snapshot (best-effort across serverless invocations).
let lastGood: { tles: SatelliteTLE[]; fetchedAtMs: number } | null = null;

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const catnr = sp.get('catnr');
  const group = sp.get('group') ?? 'visual';
  const url = catnr
    ? `${CELESTRAK_BASE}?CATNR=${encodeURIComponent(catnr)}&FORMAT=TLE`
    : `${CELESTRAK_BASE}?GROUP=${encodeURIComponent(group)}&FORMAT=TLE`;

  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': 'ProjectZenith/1.0 (hackathon)' },
      next: { revalidate: 3600 }, // TLEs change a few times/day
    });
    if (!r.ok) throw new Error(`celestrak ${r.status}`);
    const text = await r.text();
    const tles = parseTleText(text, catnr ? 'stations' : group);
    if (tles.length === 0) throw new Error('no TLEs parsed');

    lastGood = { tles, fetchedAtMs: Date.now() };
    const body: CelestrakResponse = { tles, fetchedAtMs: lastGood.fetchedAtMs, cached: false };
    return NextResponse.json(body);
  } catch (err) {
    if (lastGood) {
      const body: CelestrakResponse = {
        tles: lastGood.tles,
        fetchedAtMs: lastGood.fetchedAtMs,
        cached: true,
      };
      return NextResponse.json(body);
    }
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
