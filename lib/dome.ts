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

/** Points of a circle of radius `r` on the z=0 plane, for drei <Line>. */
export function circlePoints(r: number, segments = 128): [number, number, number][] {
  const pts: [number, number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    pts.push([Math.cos(a) * r, Math.sin(a) * r, 0]);
  }
  return pts;
}
