import { describe, it, expect } from 'vitest';
import {
  latLonToUnitVector,
  pickLocation,
  normalizeLonDeg,
  toObserverGd,
  degToRad,
} from './geo';

// Known cities — the council's "verify against 5 known cities" gate.
const CITIES: Array<{ name: string; lat: number; lon: number }> = [
  { name: 'London', lat: 51.5074, lon: -0.1278 },
  { name: 'Mumbai', lat: 19.076, lon: 72.8777 },
  { name: 'New York', lat: 40.7128, lon: -74.006 },
  { name: 'Sydney', lat: -33.8688, lon: 151.2093 },
  { name: 'Nairobi', lat: -1.2921, lon: 36.8219 },
];

describe('pickLocation ∘ latLonToUnitVector is identity', () => {
  for (const c of CITIES) {
    it(`round-trips ${c.name}`, () => {
      const v = latLonToUnitVector(c.lat, c.lon);
      const back = pickLocation(v);
      expect(back.latDeg).toBeCloseTo(c.lat, 5);
      expect(back.lonDeg).toBeCloseTo(c.lon, 5);
    });
  }
});

describe('cardinal axis anchors (texture orientation)', () => {
  it('+X is the prime meridian (0°, 0°)', () => {
    const { latDeg, lonDeg } = pickLocation({ x: 1, y: 0, z: 0 });
    expect(latDeg).toBeCloseTo(0, 6);
    expect(lonDeg).toBeCloseTo(0, 6);
  });
  it('+Y is the north pole', () => {
    expect(pickLocation({ x: 0, y: 1, z: 0 }).latDeg).toBeCloseTo(90, 6);
  });
  it('-Y is the south pole', () => {
    expect(pickLocation({ x: 0, y: -1, z: 0 }).latDeg).toBeCloseTo(-90, 6);
  });
  it('+Z is lon -90°', () => {
    expect(pickLocation({ x: 0, y: 0, z: 1 }).lonDeg).toBeCloseTo(-90, 6);
  });
  it('-Z is lon +90°', () => {
    expect(pickLocation({ x: 0, y: 0, z: -1 }).lonDeg).toBeCloseTo(90, 6);
  });
  it('-X is the antimeridian (normalised to -180°)', () => {
    expect(pickLocation({ x: -1, y: 0, z: 0 }).lonDeg).toBeCloseTo(-180, 6);
  });
});

describe('pickLocation normalises non-unit input', () => {
  it('handles a raw hit point of arbitrary radius', () => {
    const v = latLonToUnitVector(19.076, 72.8777);
    const scaled = { x: v.x * 2.5, y: v.y * 2.5, z: v.z * 2.5 };
    const back = pickLocation(scaled);
    expect(back.latDeg).toBeCloseTo(19.076, 5);
    expect(back.lonDeg).toBeCloseTo(72.8777, 5);
  });
});

describe('normalizeLonDeg', () => {
  it('wraps values outside [-180,180)', () => {
    expect(normalizeLonDeg(190)).toBeCloseTo(-170, 9);
    expect(normalizeLonDeg(-190)).toBeCloseTo(170, 9);
    expect(normalizeLonDeg(180)).toBeCloseTo(-180, 9);
    expect(normalizeLonDeg(0)).toBeCloseTo(0, 9);
  });
});

describe('toObserverGd (satellite.js shape)', () => {
  it('returns radians + km', () => {
    const gd = toObserverGd(19.076, 72.8777, 14);
    expect(gd.latitude).toBeCloseTo(degToRad(19.076), 9);
    expect(gd.longitude).toBeCloseTo(degToRad(72.8777), 9);
    expect(gd.height).toBeCloseTo(0.014, 9);
  });
});
