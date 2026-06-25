// Shared domain types for Project Zenith — mirrors SCHEMA.md.
// Angles state their unit per-field (deg vs rad) — mixing them is the classic bug.
// Distances: km. Observer elevation: metres. Sky angles: degrees. Time: epoch ms (UTC).

// ── Core domain models ────────────────────────────────────────────────

export interface ObserverLocation {
  latDeg: number; // degrees, +N / -S  (-90..90)
  lonDeg: number; // degrees, +E / -W  (-180..180)
  elevationM: number; // metres above sea level (0 if unknown)
  placeName?: string; // reverse-geocoded, e.g. "Mumbai, IN"
  timezone?: string; // IANA tz, e.g. "Asia/Kolkata"
  source: 'globe' | 'map' | 'geolocation';
}

export interface SimTime {
  liveEpochMs: number; // wall-clock "now" in UTC ms, ticked by the app
  scrubOffsetMs: number; // -6h..+6h from the scrubber; 0 = live
  // derived: effectiveEpochMs = liveEpochMs + scrubOffsetMs
}

export type BodyKind = 'sun' | 'moon' | 'planet' | 'star';

export interface CelestialObject {
  id: string; // stable, e.g. "planet:mars", "star:HR2491"
  name: string; // display, e.g. "Mars", "Sirius"
  kind: BodyKind;
  raDeg: number; // right ascension, degrees (0..360)
  decDeg: number; // declination, degrees (-90..90)
  altDeg: number; // altitude, degrees (-90..90); 90 = zenith
  azDeg: number; // azimuth, degrees (0..360, 0=N, 90=E)
  magnitude?: number; // apparent visual magnitude (lower = brighter)
  aboveHorizon: boolean; // altDeg > 0
  source: 'astronomy-engine' | 'horizons';
  distanceAu?: number; // planets/sun, astronomical units
  phase?: number; // moon illuminated fraction 0..1
  bv?: number; // B-V color index (stars only) — spectral tint for rendering
}

export interface SatelliteTLE {
  noradId: number; // catalogue number, e.g. 25544 (ISS)
  name: string; // e.g. "ISS (ZARYA)"
  line1: string;
  line2: string;
  epochMs: number; // TLE epoch (UTC ms) — staleness check
  group: 'stations' | 'visual' | string;
}

export interface SatelliteState {
  noradId: number;
  name: string;
  subLatDeg: number; // ground point, degrees
  subLonDeg: number; // ground point, degrees
  altKm: number; // height above Earth, km
  azDeg: number; // look-angle azimuth, degrees
  elevationDeg: number; // look-angle elevation, degrees; ~90 = zenith
  rangeKm: number; // slant range, km
  aboveHorizon: boolean; // elevationDeg > 0
  velocityKmS?: number;
  trend?: 'rising' | 'setting' | 'peak';
  source: 'celestrak' | 'open-notify' | 'cached';
}

export interface ConstellationFigure {
  id: string; // IAU abbr, e.g. "Ori"
  name: string; // display name, e.g. "Orion" (falls back to id)
  // polylines of [raDeg, decDeg] (J2000); the renderer resolves each point to
  // Alt/Az via astronomy-engine for the observer + time.
  paths: Array<Array<[number, number]>>;
}

export interface SkyState {
  observer: ObserverLocation;
  epochMs: number; // effective time this snapshot was computed for
  bodies: CelestialObject[]; // sun, moon, planets, plotted stars
  constellations: ConstellationFigure[];
  satellites: SatelliteState[];
  zenithObjectId: string | null; // object closest to zenith (highest altDeg)
  countAboveHorizon: number;
  dataMode: 'live' | 'offline' | 'mixed';
}

// ── Bundled static data ───────────────────────────────────────────────

export interface CatalogStar {
  hr: number; // Harvard Revised / BSC number (id)
  name?: string; // proper name if notable, e.g. "Sirius"
  raDeg: number; // degrees, J2000
  decDeg: number; // degrees, J2000
  mag: number; // apparent visual magnitude
  bv?: number; // B-V colour index (optional, for star tint)
}

// ── Proxy route response contracts (app/api/*) ────────────────────────

export interface CelestrakResponse {
  tles: SatelliteTLE[];
  fetchedAtMs: number;
  cached: boolean;
}

export interface IssResponse {
  subLatDeg: number;
  subLonDeg: number;
  altKm?: number;
  timestampMs: number;
  source: 'open-notify' | 'tle-derived';
}

export interface HorizonsSeriesResponse {
  body: string;
  samples: Array<{
    epochMs: number;
    raDeg: number;
    decDeg: number;
    azDeg: number;
    altDeg: number;
    distanceAu?: number;
  }>;
  source: 'horizons';
}

export interface GeocodeResponse {
  placeName?: string;
  timezone?: string;
  elevationM?: number;
}

// ── MapTiler proxy contracts (app/api/maptiler/*) ─────────────────────

export type MapTilerTileset = 'satellite-v4' | 'v3' | 'terrain-rgb';

export interface MapTilerGeocodeFeature {
  placeName: string; // MapTiler "place_name" (full, comma-separated)
  center: [number, number]; // [lon, lat]
  placeType: string[]; // e.g. ["city"], ["address"]
  relevance: number; // 0..1
}

export interface MapTilerGeocodeResponse {
  features: MapTilerGeocodeFeature[];
  source: 'maptiler';
  cached?: boolean;
}
