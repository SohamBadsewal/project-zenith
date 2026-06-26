import { describe, it, expect } from 'vitest';
import { bodyTrajectory, satTrajectory } from './trajectory';
import type { ObserverLocation, SatelliteTLE } from '@/types';

const obs: ObserverLocation = { latDeg: 40, lonDeg: -74, elevationM: 0, source: 'search' };
const date = new Date('2026-06-27T22:00:00Z');

describe('bodyTrajectory', () => {
  it('returns waypoints for the Sun', () => {
    const pts = bodyTrajectory('sun', obs, date);
    expect(pts.length).toBeGreaterThanOrEqual(8);
    for (const p of pts) {
      expect(p.altDeg).toBeGreaterThanOrEqual(-90);
      expect(p.altDeg).toBeLessThanOrEqual(90);
      expect(p.azDeg).toBeGreaterThanOrEqual(0);
      expect(p.azDeg).toBeLessThan(360);
    }
  });
  it('returns waypoints for a planet', () => {
    expect(bodyTrajectory('planet:mars', obs, date).length).toBeGreaterThanOrEqual(8);
  });
  it('returns [] for an unknown body id', () => {
    expect(bodyTrajectory('planet:pluto', obs, date)).toEqual([]);
  });
  it('timestamps are monotonically increasing', () => {
    const pts = bodyTrajectory('moon', obs, date);
    for (let i = 1; i < pts.length; i++) {
      expect(pts[i].minsFromNow).toBeGreaterThan(pts[i - 1].minsFromNow);
    }
  });
});

describe('satTrajectory', () => {
  const tle: SatelliteTLE = {
    noradId: 25544,
    name: 'ISS (ZARYA)',
    line1: '1 25544U 98067A   26178.50000000  .00012345  00000-0  22345-3 0  9991',
    line2: '2 25544  51.6400 100.0000 0001234  90.0000 270.0000 15.50000000123456',
    epochMs: date.getTime(),
    group: 'stations',
  };
  it('returns waypoints for a valid TLE', () => {
    const pts = satTrajectory(tle, obs, date);
    expect(pts.length).toBeGreaterThanOrEqual(8);
    for (const p of pts) {
      expect(p.altDeg).toBeGreaterThanOrEqual(-90);
      expect(p.altDeg).toBeLessThanOrEqual(90);
    }
  });
  it('timestamps are monotonically increasing', () => {
    const pts = satTrajectory(tle, obs, date);
    for (let i = 1; i < pts.length; i++) {
      expect(pts[i].minsFromNow).toBeGreaterThan(pts[i - 1].minsFromNow);
    }
  });
});
