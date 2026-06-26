// ephemeris.ts — astronomy-engine wrappers. Sun/Moon/planets/stars → CelestialObject
// (Alt/Az for the observer + time). astronomy-engine is the default + offline path;
// Horizons is the optional precision upgrade (added in the proxy/interpolation layer).
//
// Units note: astronomy-engine Equator() returns ra in HOURS, dec in degrees;
// Horizon() returns azimuth/altitude in degrees (0=N, clockwise). We store RA in
// degrees (raDeg) per SCHEMA, so multiply ra hours × 15.

import * as Astronomy from 'astronomy-engine';
import type {
  CelestialObject,
  CatalogStar,
  ObserverLocation,
  BodyKind,
} from '@/types';

interface BodyDef {
  id: string;
  name: string;
  kind: BodyKind;
  body: Astronomy.Body;
}

// SCHEMA §5.1 — always-computed bodies (Uranus/Neptune optional/dim).
export const BODY_DEFS: BodyDef[] = [
  { id: 'sun', name: 'Sun', kind: 'sun', body: Astronomy.Body.Sun },
  { id: 'moon', name: 'Moon', kind: 'moon', body: Astronomy.Body.Moon },
  { id: 'planet:mercury', name: 'Mercury', kind: 'planet', body: Astronomy.Body.Mercury },
  { id: 'planet:venus', name: 'Venus', kind: 'planet', body: Astronomy.Body.Venus },
  { id: 'planet:mars', name: 'Mars', kind: 'planet', body: Astronomy.Body.Mars },
  { id: 'planet:jupiter', name: 'Jupiter', kind: 'planet', body: Astronomy.Body.Jupiter },
  { id: 'planet:saturn', name: 'Saturn', kind: 'planet', body: Astronomy.Body.Saturn },
  { id: 'planet:uranus', name: 'Uranus', kind: 'planet', body: Astronomy.Body.Uranus },
  { id: 'planet:neptune', name: 'Neptune', kind: 'planet', body: Astronomy.Body.Neptune },
];

function toObserver(o: ObserverLocation): Astronomy.Observer {
  return new Astronomy.Observer(o.latDeg, o.lonDeg, o.elevationM);
}

export function computeBody(
  def: BodyDef,
  observer: ObserverLocation,
  date: Date,
): CelestialObject {
  const obs = toObserver(observer);
  const eq = Astronomy.Equator(def.body, date, obs, /*ofdate*/ true, /*aberration*/ true);
  const hor = Astronomy.Horizon(date, obs, eq.ra, eq.dec, 'normal');

  let magnitude: number | undefined;
  let phase: number | undefined;
  try {
    // Illumination throws for the Sun — guard it.
    const ill = Astronomy.Illumination(def.body, date);
    magnitude = ill.mag;
    if (def.kind === 'moon') phase = ill.phase_fraction;
  } catch {
    if (def.kind === 'sun') magnitude = -26.7;
  }

  return {
    id: def.id,
    name: def.name,
    kind: def.kind,
    raDeg: eq.ra * 15,
    decDeg: eq.dec,
    altDeg: hor.altitude,
    azDeg: hor.azimuth,
    magnitude,
    aboveHorizon: hor.altitude > 0,
    source: 'astronomy-engine',
    distanceAu: eq.dist,
    phase,
  };
}

export function computeBodies(observer: ObserverLocation, date: Date): CelestialObject[] {
  return BODY_DEFS.map((d) => computeBody(d, observer, date));
}

/**
 * Catalog star → CelestialObject. Uses J2000 RA/Dec directly with Horizon();
 * precession from J2000 to date is < ~0.5° for the near term — within the app's
 * ~1° plotting tolerance.
 */
export function computeStar(
  star: CatalogStar,
  observer: ObserverLocation,
  date: Date,
): CelestialObject {
  const obs = toObserver(observer);
  const hor = Astronomy.Horizon(date, obs, star.raDeg / 15, star.decDeg, 'normal');
  return {
    id: `star:HR${star.hr}`,
    name: star.name,
    kind: 'star',
    raDeg: star.raDeg,
    decDeg: star.decDeg,
    altDeg: hor.altitude,
    azDeg: hor.azimuth,
    magnitude: star.mag,
    aboveHorizon: hor.altitude > 0,
    source: 'astronomy-engine',
    bv: star.bv,
    con: star.con,
    distLy: star.dist,
    spect: star.spect,
  };
}

export function computeStars(
  stars: CatalogStar[],
  observer: ObserverLocation,
  date: Date,
): CelestialObject[] {
  return stars.map((s) => computeStar(s, observer, date));
}

/** Bare RA/Dec (deg, J2000) → Alt/Az (deg) for the observer/time. */
export function raDecToAltAz(
  raDeg: number,
  decDeg: number,
  observer: ObserverLocation,
  date: Date,
): { altDeg: number; azDeg: number } {
  const hor = Astronomy.Horizon(date, toObserver(observer), raDeg / 15, decDeg, 'normal');
  return { altDeg: hor.altitude, azDeg: hor.azimuth };
}
