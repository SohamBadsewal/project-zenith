// lib/starSize.ts — magnitude → render scale + core brightness.
// Bright stars (Sirius mag -1.5) are visibly larger than faint named stars
// (mag +3), matching the reference video's size gradient.

// Brighter → larger. Linear ramp on a clamped magnitude range: monotonic by
// construction, so ordering always holds regardless of input.
const FAINT_MAG = 5.0;
const BRIGHT_MAG = -1.5;
const MIN_SCALE = 0.05;
const MAX_SCALE = 0.17;

/** Apparent visual magnitude → instance scale. Lower mag (brighter) → larger. */
export function starScale(mag: number): number {
  const t = (FAINT_MAG - mag) / (FAINT_MAG - BRIGHT_MAG); // 0 faint → 1 bright
  const clamped = Math.min(1, Math.max(0, t));
  return MIN_SCALE + (MAX_SCALE - MIN_SCALE) * clamped;
}

/** Apparent visual magnitude → white-point brightness (kept below bloom threshold). */
export function starBrightness(mag: number): number {
  const b = Math.pow(0.7, Math.max(0, mag) / 2);
  return Math.min(0.75, Math.max(0.4, b));
}
