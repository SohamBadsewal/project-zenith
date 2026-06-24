// URL hash persistence for sky-view state.
// Format: #sky/lat,lon,epochMs  (e.g. #sky/51.50000,-0.12000,1719273600000)

const PREFIX = 'sky/';

export function buildShareHash(latDeg: number, lonDeg: number, epochMs: number): string {
  return `#${PREFIX}${latDeg.toFixed(5)},${lonDeg.toFixed(5)},${epochMs}`;
}

export interface ShareParams {
  latDeg: number;
  lonDeg: number;
  epochMs: number;
}

export function parseShareHash(hash: string): ShareParams | null {
  const body = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!body.startsWith(PREFIX)) return null;
  const parts = body.slice(PREFIX.length).split(',');
  if (parts.length < 3) return null;
  const latDeg = parseFloat(parts[0]);
  const lonDeg = parseFloat(parts[1]);
  const epochMs = parseInt(parts[2], 10);
  if ([latDeg, lonDeg, epochMs].some((v) => !isFinite(v))) return null;
  if (latDeg < -90 || latDeg > 90 || lonDeg < -180 || lonDeg > 180) return null;
  return { latDeg, lonDeg, epochMs };
}
