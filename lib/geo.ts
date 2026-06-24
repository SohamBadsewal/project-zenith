// geo.ts — pure coordinate transforms. The load-bearing math of the whole app.
// Every angular conversion in the project goes through here (SCHEMA §6 invariant:
// no inline `* Math.PI / 180` scattered around).
//
// Globe convention — matches Three.js SphereGeometry with default UVs and a
// standard equirectangular Earth texture (centre column = prime meridian 0°,
// top row = +90° latitude). Derivation of the parametrisation:
//
//   For polar angle  φ = (90 - lat)  and  azimuth θ = (lon + 180):
//     y =  sin(latRad)                 (vertical axis, +Y = north pole)
//     x = -cos(θ) * cos(latRad)
//     z =  sin(θ) * cos(latRad)
//
//   This makes:  +X → lon 0° (prime meridian),  +Z → lon -90°,
//                -X → lon ±180°,                 -Z → lon +90°.
//
// pickLocation() is the exact inverse and is unit-tested against this mapping.

export const DEG2RAD = Math.PI / 180;
export const RAD2DEG = 180 / Math.PI;

export const degToRad = (deg: number): number => deg * DEG2RAD;
export const radToDeg = (rad: number): number => rad * RAD2DEG;

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface LatLon {
  latDeg: number;
  lonDeg: number;
}

const clamp = (v: number, lo: number, hi: number): number =>
  Math.min(hi, Math.max(lo, v));

/** Normalise a longitude into the half-open range [-180, 180). */
export function normalizeLonDeg(lonDeg: number): number {
  let lon = ((lonDeg + 180) % 360 + 360) % 360; // [0,360)
  lon -= 180; // [-180,180)
  return lon;
}

/**
 * lat/lon (degrees) → unit vector in the globe's LOCAL space (radius 1).
 * Used to place pins/markers and as the inverse checked by the tests.
 */
export function latLonToUnitVector(latDeg: number, lonDeg: number): Vec3 {
  const latRad = degToRad(latDeg);
  const theta = degToRad(lonDeg + 180);
  const cosLat = Math.cos(latRad);
  return {
    x: -Math.cos(theta) * cosLat,
    y: Math.sin(latRad),
    z: Math.sin(theta) * cosLat,
  };
}

/**
 * A point in the globe's LOCAL space → lat/lon (degrees).
 * The input need not be normalised; it is normalised internally.
 *
 * In a React Three Fiber click handler, obtain the local point from the world
 * hit point by cancelling the mesh's current transform (this is what makes the
 * pick correct even while the globe auto-rotates):
 *
 *   const local = event.point.clone()
 *     .applyMatrix4(mesh.matrixWorld.clone().invert());
 *   const { latDeg, lonDeg } = pickLocation(local);
 */
export function pickLocation(point: Vec3): LatLon {
  const len = Math.hypot(point.x, point.y, point.z) || 1;
  const x = point.x / len;
  const y = point.y / len;
  const z = point.z / len;

  const latDeg = radToDeg(Math.asin(clamp(y, -1, 1)));
  // θ = atan2(z, -x) recovers the azimuth; subtract 180° to undo (lon + 180).
  const thetaDeg = radToDeg(Math.atan2(z, -x));
  const lonDeg = normalizeLonDeg(thetaDeg - 180);

  return { latDeg, lonDeg };
}

/**
 * Observer geodetic position for satellite.js `ecfToLookAngles`.
 * satellite.js expects longitude/latitude in RADIANS and height in KM.
 */
export interface ObserverGd {
  longitude: number; // radians, +E
  latitude: number; // radians, +N
  height: number; // km above WGS84 ellipsoid
}

export function toObserverGd(
  latDeg: number,
  lonDeg: number,
  elevationM: number,
): ObserverGd {
  return {
    longitude: degToRad(lonDeg),
    latitude: degToRad(latDeg),
    height: elevationM / 1000,
  };
}

/** Format a coordinate for HUD display, e.g. "19.0760° N  72.8777° E". */
export function formatLatLon(latDeg: number, lonDeg: number): string {
  const lat = `${Math.abs(latDeg).toFixed(4)}° ${latDeg >= 0 ? 'N' : 'S'}`;
  const lon = `${Math.abs(lonDeg).toFixed(4)}° ${lonDeg >= 0 ? 'E' : 'W'}`;
  return `${lat}  ${lon}`;
}
