// satellites.ts — CelesTrak TLE parsing + satellite.js SGP4 propagation + look angles.
// Pipeline (TRD §3.1): twoline2satrec → propagate → gstime → eciToEcf →
// ecfToLookAngles. Elevation ≈ 90° ⇒ the satellite is at the observer's zenith.

import * as satellite from 'satellite.js';
import type { SatelliteTLE, SatelliteState, ObserverLocation } from '@/types';
import { toObserverGd, radToDeg, normalizeLonDeg } from './geo';

const JD_UNIX_EPOCH = 2440587.5; // Julian Date of 1970-01-01T00:00:00Z

/** Build a SatelliteTLE record from raw TLE lines (epoch derived from the satrec). */
export function parseTle(
  name: string,
  line1: string,
  line2: string,
  group: SatelliteTLE['group'],
): SatelliteTLE {
  const satrec = satellite.twoline2satrec(line1, line2);
  const epochMs = (satrec.jdsatepoch - JD_UNIX_EPOCH) * 86_400_000;
  return {
    noradId: Number(satrec.satnum),
    name,
    line1,
    line2,
    epochMs,
    group,
  };
}

/** Stable id used for selection/zenith across the app. */
export const satId = (noradId: number): string => `sat:${noradId}`;

export interface SubPoint {
  subLatDeg: number;
  subLonDeg: number;
  altKm: number;
}

/** Ground sub-point of a satellite (no observer needed). Null if SGP4 fails. */
export function subPoint(tle: SatelliteTLE, date: Date): SubPoint | null {
  const satrec = satellite.twoline2satrec(tle.line1, tle.line2);
  const pv = satellite.propagate(satrec, date);
  if (!pv || !pv.position) return null;
  const gmst = satellite.gstime(date);
  const geo = satellite.eciToGeodetic(pv.position, gmst);
  return {
    subLatDeg: radToDeg(geo.latitude),
    subLonDeg: normalizeLonDeg(radToDeg(geo.longitude)),
    altKm: geo.height,
  };
}

export interface PropagateOptions {
  /** Previous elevation (deg) for this satellite, to derive rising/setting/peak. */
  prevElevationDeg?: number;
  source?: SatelliteState['source'];
}

/**
 * Propagate one TLE to `date` and compute its state for `observer`.
 * Returns null if SGP4 fails (decayed/invalid element set).
 */
export function propagateSatellite(
  tle: SatelliteTLE,
  observer: ObserverLocation,
  date: Date,
  opts: PropagateOptions = {},
): SatelliteState | null {
  const satrec = satellite.twoline2satrec(tle.line1, tle.line2);
  const pv = satellite.propagate(satrec, date);
  if (!pv || !pv.position || !pv.velocity) return null;

  const gmst = satellite.gstime(date);
  const ecf = satellite.eciToEcf(pv.position, gmst);
  const geo = satellite.eciToGeodetic(pv.position, gmst);
  const observerGd = toObserverGd(observer.latDeg, observer.lonDeg, observer.elevationM);
  const look = satellite.ecfToLookAngles(observerGd, ecf);

  const elevationDeg = radToDeg(look.elevation);
  const v = pv.velocity;
  const velocityKmS = Math.hypot(v.x, v.y, v.z);

  let trend: SatelliteState['trend'];
  if (opts.prevElevationDeg !== undefined) {
    const delta = elevationDeg - opts.prevElevationDeg;
    if (Math.abs(delta) < 0.01) trend = 'peak';
    else trend = delta > 0 ? 'rising' : 'setting';
  }

  return {
    noradId: tle.noradId,
    name: tle.name,
    subLatDeg: radToDeg(geo.latitude),
    subLonDeg: normalizeLonDeg(radToDeg(geo.longitude)),
    altKm: geo.height,
    azDeg: (radToDeg(look.azimuth) + 360) % 360,
    elevationDeg,
    rangeKm: look.rangeSat,
    aboveHorizon: elevationDeg > 0,
    velocityKmS,
    trend,
    source: opts.source ?? 'celestrak',
  };
}

/** Propagate many TLEs; drops any that fail SGP4. */
export function propagateAll(
  tles: SatelliteTLE[],
  observer: ObserverLocation,
  date: Date,
  prevElevation?: Map<number, number>,
): SatelliteState[] {
  const out: SatelliteState[] = [];
  for (const tle of tles) {
    const state = propagateSatellite(tle, observer, date, {
      prevElevationDeg: prevElevation?.get(tle.noradId),
    });
    if (state) out.push(state);
  }
  return out;
}
