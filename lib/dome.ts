// dome.ts — azimuthal-equidistant projection for the planetarium chart.
// Zenith (alt 90°) maps to the centre; the horizon (alt 0°) maps to the rim.
// Looking UP, North is up and East is to the LEFT (mirror of a ground map).

import { DEG2RAD } from './geo';

/** [altDeg, azDeg] → [x, y] on the chart plane (radius = `radius` at horizon). */
export function projectAltAz(
  altDeg: number,
  azDeg: number,
  radius = 1,
): [number, number] {
  const r = ((90 - altDeg) / 90) * radius;
  const az = azDeg * DEG2RAD;
  return [-r * Math.sin(az), r * Math.cos(az)];
}

/**
 * [altDeg, azDeg] → [x, y, z] on a celestial sphere of radius `radius`.
 * For an observer at the origin looking outward: zenith (alt 90°) is straight
 * up (+y), the horizon is the y≈0 great circle. The camera sits at the origin
 * looking outward; facing North (az 0° → −z) East (az 90°) falls to screen
 * right (+x) and West to the left — the natural naked-eye horizon orientation
 * (unlike the flat overhead chart, which is deliberately mirrored).
 */
export function altAzToVec3(
  altDeg: number,
  azDeg: number,
  radius = 1,
): [number, number, number] {
  const el = altDeg * DEG2RAD;
  const a = azDeg * DEG2RAD;
  const cosEl = Math.cos(el);
  return [
    radius * cosEl * Math.sin(a),
    radius * Math.sin(el),
    -radius * cosEl * Math.cos(a),
  ];
}

/** Great circle of the horizon (alt 0°) on the sphere, for drei <Line>. */
export function horizonRing(radius = 1, segments = 128): [number, number, number][] {
  const pts: [number, number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    pts.push(altAzToVec3(0, (i / segments) * 360, radius));
  }
  return pts;
}

/** Small circle of constant altitude (e.g. 30°, 60°) on the sphere. */
export function altitudeRing(
  altDeg: number,
  radius = 1,
  segments = 128,
): [number, number, number][] {
  const pts: [number, number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    pts.push(altAzToVec3(altDeg, (i / segments) * 360, radius));
  }
  return pts;
}

/** Points of a circle of radius `r` on the z=0 plane, for drei <Line>. */
export function circlePoints(r: number, segments = 128): [number, number, number][] {
  const pts: [number, number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    pts.push([Math.cos(a) * r, Math.sin(a) * r, 0]);
  }
  return pts;
}
