import { describe, it, expect } from 'vitest';
import { starScale, starBrightness } from './starSize';

describe('starScale — magnitude to instance scale', () => {
  it('makes brighter stars (lower mag) larger', () => {
    expect(starScale(-1.5)).toBeGreaterThan(starScale(4.0));
  });
  it('never returns zero or negative', () => {
    expect(starScale(6.5)).toBeGreaterThan(0);
  });
  it('is monotonic increasing as magnitude decreases', () => {
    expect(starScale(0.0)).toBeGreaterThan(starScale(2.0));
  });
});

describe('starBrightness — magnitude to core multiplier', () => {
  it('brighter stars are more luminous', () => {
    expect(starBrightness(-1.5)).toBeGreaterThan(starBrightness(3.0));
  });
  it('stays in a sane range', () => {
    expect(starBrightness(-10)).toBeLessThanOrEqual(1.5);
    expect(starBrightness(7)).toBeGreaterThan(0);
  });
});
