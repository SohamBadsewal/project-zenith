// lib/starColor.ts — B-V color index → approximate RGB for star rendering.
// B-V (B minus V magnitude) encodes stellar temperature: negative = hot/blue,
// ~0.65 = Sun-like yellow, >1.4 = cool red. Simplified interpolation over the
// stellar classification color curve — visually convincing, not physically exact.

/** B-V color index → [r, g, b] each 0..1. Pure function, no three.js dep. */
export function bvToRgb(bv?: number): [number, number, number] {
  if (bv == null || !Number.isFinite(bv)) return [1, 1, 1];
  const t = Math.max(-0.4, Math.min(2.0, bv)); // clamp to stellar range

  // Piecewise interpolation across key B-V anchors (Osterbrock-derived colors).
  if (t < 0.0) return lerp([0.6, 0.7, 1.0], [0.85, 0.9, 1.0], (t + 0.4) / 0.4);
  if (t < 0.4) return lerp([0.85, 0.9, 1.0], [1.0, 1.0, 1.0], t / 0.4);
  if (t < 0.8) return lerp([1.0, 1.0, 1.0], [1.0, 0.92, 0.7], (t - 0.4) / 0.4);
  if (t < 1.4) return lerp([1.0, 0.92, 0.7], [1.0, 0.6, 0.3], (t - 0.8) / 0.6);
  return lerp([1.0, 0.6, 0.3], [1.0, 0.4, 0.2], Math.min(1, (t - 1.4) / 0.6));
}

function lerp(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}
