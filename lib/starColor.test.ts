import { describe, it, expect } from 'vitest';
import { bvToRgb } from './starColor';

describe('bvToRgb — B-V color index to RGB', () => {
  it('returns blue-white for hot stars (B-V < 0)', () => {
    const [r, g, b] = bvToRgb(-0.3);
    expect(b).toBeGreaterThan(r); // blue dominant
    expect(g).toBeGreaterThan(r * 0.9);
  });

  it('returns white for A-type stars (B-V ≈ 0)', () => {
    const [r, g, b] = bvToRgb(0.0);
    expect(Math.abs(r - g)).toBeLessThan(0.1);
    expect(Math.abs(g - b)).toBeLessThan(0.1);
  });

  it('returns yellow for Sun-like stars (B-V ≈ 0.65)', () => {
    const [r, g, b] = bvToRgb(0.65);
    expect(r).toBeGreaterThan(b); // red dominant over blue
    expect(g).toBeGreaterThan(b * 0.9);
  });

  it('returns red-orange for cool stars (B-V > 1.4)', () => {
    const [r, g, b] = bvToRgb(1.5);
    expect(r).toBeGreaterThan(0.8);
    expect(b).toBeLessThan(0.4);
  });

  it('clamps out-of-range B-V', () => {
    const cold = bvToRgb(99);
    const [r] = cold;
    expect(r).toBeGreaterThan(0.8); // still red, not NaN
    const hot = bvToRgb(-99);
    expect(hot.every((c) => Number.isFinite(c))).toBe(true);
  });

  it('falls back to white when B-V is undefined', () => {
    const [r, g, b] = bvToRgb(undefined);
    expect(r).toBeCloseTo(1);
    expect(g).toBeCloseTo(1);
    expect(b).toBeCloseTo(1);
  });
});
