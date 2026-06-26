// lib/trajectory.ts — future-path waypoints for a celestial body or satellite,
// as seen from the observer's dome.

import { BODY_DEFS, computeBody } from './ephemeris';
import { propagateSatellite } from './satellites';
import type { ObserverLocation, SatelliteTLE } from '@/types';

export interface TrajectoryPoint {
  altDeg: number;
  azDeg: number;
  minsFromNow: number;
}

const BODY_STEPS = 16;
const BODY_HORIZON_HOURS = 8;
const SAT_STEPS = 45;
const SAT_STEP_MS = 2 * 60 * 1000; // 2-min steps → ~90 min (one orbit)

/** Future arc of a planet/Sun/Moon over ~8h. [] if the body id is unknown. */
export function bodyTrajectory(
  bodyId: string,
  observer: ObserverLocation,
  date: Date,
): TrajectoryPoint[] {
  const def = BODY_DEFS.find((d) => d.id === bodyId);
  if (!def) return [];
  const pts: TrajectoryPoint[] = [];
  const stepMs = (BODY_HORIZON_HOURS * 3_600_000) / BODY_STEPS;
  for (let i = 0; i <= BODY_STEPS; i++) {
    const d = new Date(date.getTime() + i * stepMs);
    const b = computeBody(def, observer, d);
    pts.push({ altDeg: b.altDeg, azDeg: b.azDeg, minsFromNow: (i * stepMs) / 60_000 });
  }
  return pts;
}

/** Future orbit path of a satellite over ~90 min. [] if SGP4 fails. */
export function satTrajectory(
  tle: SatelliteTLE,
  observer: ObserverLocation,
  date: Date,
): TrajectoryPoint[] {
  const pts: TrajectoryPoint[] = [];
  for (let i = 0; i <= SAT_STEPS; i++) {
    const d = new Date(date.getTime() + i * SAT_STEP_MS);
    const s = propagateSatellite(tle, observer, d);
    if (s) pts.push({ altDeg: s.elevationDeg, azDeg: s.azDeg, minsFromNow: (i * SAT_STEP_MS) / 60_000 });
  }
  return pts;
}
