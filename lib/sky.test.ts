import { describe, it, expect } from 'vitest';
import { computeBody, BODY_DEFS } from './ephemeris';
import { parseTle, propagateSatellite, satId } from './satellites';
import { buildSkyState } from './sky';
import type { ObserverLocation } from '@/types';

// A real ISS TLE (epoch 2024-01-01-ish). SGP4 is valid for the near term around
// its epoch; we propagate at the epoch for deterministic checks.
const ISS_NAME = 'ISS (ZARYA)';
const ISS_L1 =
  '1 25544U 98067A   24001.50000000  .00016717  00000-0  30771-3 0  9999';
const ISS_L2 =
  '2 25544  51.6416 247.4627 0006703 130.5360 325.0288 15.49514714 10000';

describe('satellite propagation + zenith', () => {
  it('parses the ISS TLE with the right NORAD id', () => {
    const tle = parseTle(ISS_NAME, ISS_L1, ISS_L2, 'stations');
    expect(tle.noradId).toBe(25544);
    expect(Number.isFinite(tle.epochMs)).toBe(true);
  });

  it('puts the satellite at the zenith when the observer is at its sub-point', () => {
    const tle = parseTle(ISS_NAME, ISS_L1, ISS_L2, 'stations');
    const date = new Date(tle.epochMs);

    // First, find the ISS sub-point from an arbitrary observer.
    const probe: ObserverLocation = { latDeg: 0, lonDeg: 0, elevationM: 0, source: 'globe' };
    const first = propagateSatellite(tle, probe, date);
    expect(first).not.toBeNull();

    // Now stand directly under it: elevation must be ~90° (zenith).
    const underneath: ObserverLocation = {
      latDeg: first!.subLatDeg,
      lonDeg: first!.subLonDeg,
      elevationM: 0,
      source: 'globe',
    };
    const overhead = propagateSatellite(tle, underneath, date);
    expect(overhead).not.toBeNull();
    expect(overhead!.elevationDeg).toBeGreaterThan(89);
    expect(overhead!.aboveHorizon).toBe(true);
  });

  it('reports a plausible ISS altitude and speed', () => {
    const tle = parseTle(ISS_NAME, ISS_L1, ISS_L2, 'stations');
    const probe: ObserverLocation = { latDeg: 0, lonDeg: 0, elevationM: 0, source: 'globe' };
    const s = propagateSatellite(tle, probe, new Date(tle.epochMs))!;
    expect(s.altKm).toBeGreaterThan(380);
    expect(s.altKm).toBeLessThan(440);
    expect(s.velocityKmS).toBeGreaterThan(7);
    expect(s.velocityKmS).toBeLessThan(8);
  });
});

describe('ephemeris Alt/Az wiring', () => {
  it('the Sun is near the zenith at the equator at equinox local noon', () => {
    // Equator, prime meridian, ~solar noon at 2025-03-20 12:00 UTC.
    const observer: ObserverLocation = { latDeg: 0, lonDeg: 0, elevationM: 0, source: 'globe' };
    const date = new Date(Date.UTC(2025, 2, 20, 12, 0, 0));
    const sunDef = BODY_DEFS.find((d) => d.id === 'sun')!;
    const sun = computeBody(sunDef, observer, date);
    expect(sun.altDeg).toBeGreaterThan(85);
    expect(sun.aboveHorizon).toBe(true);
    expect(sun.raDeg).toBeGreaterThanOrEqual(0);
    expect(sun.raDeg).toBeLessThanOrEqual(360);
  });

  it('the Sun is below the horizon at the antipode at the same instant', () => {
    const observer: ObserverLocation = { latDeg: 0, lonDeg: 180, elevationM: 0, source: 'globe' };
    const date = new Date(Date.UTC(2025, 2, 20, 12, 0, 0));
    const sunDef = BODY_DEFS.find((d) => d.id === 'sun')!;
    const sun = computeBody(sunDef, observer, date);
    expect(sun.altDeg).toBeLessThan(0);
    expect(sun.aboveHorizon).toBe(false);
  });

  it('all bodies return finite, in-range Alt/Az', () => {
    const observer: ObserverLocation = { latDeg: 19.076, lonDeg: 72.8777, elevationM: 14, source: 'globe' };
    const date = new Date(Date.UTC(2025, 5, 1, 18, 0, 0));
    for (const def of BODY_DEFS) {
      const b = computeBody(def, observer, date);
      expect(Number.isFinite(b.altDeg)).toBe(true);
      expect(b.azDeg).toBeGreaterThanOrEqual(0);
      expect(b.azDeg).toBeLessThanOrEqual(360);
      expect(b.altDeg).toBeGreaterThanOrEqual(-90);
      expect(b.altDeg).toBeLessThanOrEqual(90);
    }
  });
});

describe('buildSkyState', () => {
  it('selects the highest object as zenith and counts above-horizon', () => {
    const observer: ObserverLocation = { latDeg: 0, lonDeg: 0, elevationM: 0, source: 'globe' };
    const tle = parseTle(ISS_NAME, ISS_L1, ISS_L2, 'stations');
    const date = new Date(tle.epochMs);
    const under = propagateSatellite(tle, observer, date)!;
    const overhead = propagateSatellite(
      tle,
      { latDeg: under.subLatDeg, lonDeg: under.subLonDeg, elevationM: 0, source: 'globe' },
      date,
    )!;

    const sky = buildSkyState(
      { latDeg: under.subLatDeg, lonDeg: under.subLonDeg, elevationM: 0, source: 'globe' },
      date.getTime(),
      {
        bodies: [
          {
            id: 'planet:mars',
            name: 'Mars',
            kind: 'planet',
            raDeg: 0,
            decDeg: 0,
            altDeg: 30,
            azDeg: 100,
            aboveHorizon: true,
            source: 'astronomy-engine',
          },
        ],
        satellites: [overhead],
      },
    );

    expect(sky.zenithObjectId).toBe(satId(overhead.noradId));
    expect(sky.countAboveHorizon).toBe(2);
  });
});
