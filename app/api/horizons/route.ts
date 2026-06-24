// GET /api/horizons?body=&lat=&lon=&... — optional precision upgrade for planet
// positions (SCHEMA §3.3). DEFERRED per the cut-list: astronomy-engine is the
// verified default and the designed fallback ("client recomputes with
// astronomy-engine"). This route responds 501 so the client uses that path
// cleanly, rather than risk surfacing unverified parsed values (RULES §3).
//
// To enable later: proxy https://ssd.jpl.nasa.gov/api/horizons.api with
// CENTER='coord@399', SITE_COORD='<lonE>,<lat>,<altKm>', EPHEM_TYPE='OBSERVER',
// QUANTITIES='4,1,2', a short time series, then interpolate client-side.

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(
    { error: 'horizons precision upgrade deferred; using astronomy-engine' },
    { status: 501 },
  );
}
