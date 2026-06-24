// GET /api/iss — live ISS sub-point. OpenNotify (HTTPS-upgraded, ~5s cache) with
// a TLE-derived fallback (the pass-times endpoint is deprecated — never used).
// SCHEMA §3.2 / TRD §3.2. Failure is never user-visible.

import { NextResponse } from 'next/server';
import { parseTleText, CELESTRAK_BASE } from '@/lib/celestrak';
import { subPoint } from '@/lib/satellites';
import type { IssResponse } from '@/types';

export const dynamic = 'force-dynamic';

const ISS_CATNR = 25544;

interface OpenNotify {
  iss_position?: { latitude: string; longitude: string };
  timestamp?: number;
  message?: string;
}

export async function GET() {
  try {
    const r = await fetch('http://api.open-notify.org/iss-now.json', {
      next: { revalidate: 5 },
    });
    if (!r.ok) throw new Error(`open-notify ${r.status}`);
    const j = (await r.json()) as OpenNotify;
    if (!j.iss_position) throw new Error('open-notify: no position');
    const body: IssResponse = {
      subLatDeg: parseFloat(j.iss_position.latitude),
      subLonDeg: parseFloat(j.iss_position.longitude),
      timestampMs: (j.timestamp ?? Math.floor(Date.now() / 1000)) * 1000,
      source: 'open-notify',
    };
    return NextResponse.json(body);
  } catch {
    // Fallback: derive the sub-point from the ISS TLE (no user-visible failure).
    try {
      const tleRes = await fetch(
        `${CELESTRAK_BASE}?CATNR=${ISS_CATNR}&FORMAT=TLE`,
        {
          headers: { 'User-Agent': 'ProjectZenith/1.0 (hackathon)' },
          next: { revalidate: 3600 },
        },
      );
      const text = await tleRes.text();
      const tle = parseTleText(text, 'stations')[0];
      if (!tle) throw new Error('no ISS TLE');
      const now = new Date();
      const sp = subPoint(tle, now);
      if (!sp) throw new Error('SGP4 failed');
      const body: IssResponse = {
        subLatDeg: sp.subLatDeg,
        subLonDeg: sp.subLonDeg,
        altKm: sp.altKm,
        timestampMs: now.getTime(),
        source: 'tle-derived',
      };
      return NextResponse.json(body);
    } catch (err2) {
      return NextResponse.json({ error: String(err2) }, { status: 502 });
    }
  }
}
