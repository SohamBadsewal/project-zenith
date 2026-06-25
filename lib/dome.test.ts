import { describe, it, expect } from 'vitest';
import { altAzToVec3, horizonRing, altitudeRing } from './dome';

const R = 5;
const mag = ([x, y, z]: [number, number, number]) => Math.hypot(x, y, z);

describe('altAzToVec3 — celestial sphere placement', () => {
  it('zenith (alt 90°) is straight up at +y', () => {
    const [x, y, z] = altAzToVec3(90, 0, R);
    expect(x).toBeCloseTo(0, 6);
    expect(y).toBeCloseTo(R, 6);
    expect(z).toBeCloseTo(0, 6);
  });

  it('North horizon (alt 0°, az 0°) is straight ahead at -z', () => {
    const [x, y, z] = altAzToVec3(0, 0, R);
    expect(x).toBeCloseTo(0, 6);
    expect(y).toBeCloseTo(0, 6);
    expect(z).toBeCloseTo(-R, 6);
  });

  it('East horizon (az 90°) falls to the right at -x (facing north)', () => {
    const [x, y, z] = altAzToVec3(0, 90, R);
    expect(x).toBeCloseTo(-R, 6);
    expect(y).toBeCloseTo(0, 6);
    expect(z).toBeCloseTo(0, 6);
  });

  it('South horizon (az 180°) is behind the viewer at +z', () => {
    const [x, y, z] = altAzToVec3(0, 180, R);
    expect(x).toBeCloseTo(0, 6);
    expect(y).toBeCloseTo(0, 6);
    expect(z).toBeCloseTo(R, 6);
  });

  it('West horizon (az 270°) falls to the left at +x', () => {
    const [x] = altAzToVec3(0, 270, R);
    expect(x).toBeCloseTo(R, 6);
  });

  it('every point lies on the sphere of the given radius', () => {
    for (const alt of [0, 15, 30, 45, 60, 89]) {
      for (const az of [0, 45, 137, 220, 359]) {
        expect(mag(altAzToVec3(alt, az, R))).toBeCloseTo(R, 6);
      }
    }
  });

  it('altitude controls height: higher alt → larger y', () => {
    const low = altAzToVec3(20, 45, R)[1];
    const high = altAzToVec3(70, 45, R)[1];
    expect(high).toBeGreaterThan(low);
    expect(low).toBeGreaterThan(0);
  });

  it('defaults to unit radius', () => {
    expect(mag(altAzToVec3(33, 210))).toBeCloseTo(1, 6);
  });
});

describe('horizonRing / altitudeRing', () => {
  it('horizon ring is a closed great circle at y≈0', () => {
    const pts = horizonRing(R, 64);
    expect(pts.length).toBe(65);
    for (const [, y] of pts) expect(y).toBeCloseTo(0, 6);
    for (const p of pts) expect(mag(p)).toBeCloseTo(R, 6);
    // closed loop (within floating-point tolerance)
    const first = pts[0];
    const last = pts[pts.length - 1];
    for (let k = 0; k < 3; k++) expect(last[k]).toBeCloseTo(first[k], 6);
  });

  it('altitude ring at 60° sits above the horizon at constant height', () => {
    const pts = altitudeRing(60, R, 32);
    const y0 = pts[0][1];
    expect(y0).toBeGreaterThan(0);
    for (const [, y] of pts) expect(y).toBeCloseTo(y0, 6);
    for (const p of pts) expect(mag(p)).toBeCloseTo(R, 6);
  });
});
