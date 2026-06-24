# Project Zenith — The Celestial Eye

**AstralWeb Innovate · SRM Aaruush '26 · Round 2**

A real-time cosmic radar: pick any point on Earth, see every planet, star constellation and satellite passing through that location's zenith *right now*. Live telemetry. Zero guessing.

---

## What it does

1. **Globe** — A textured 3D Earth with Fresnel atmosphere. Click any coordinate to drop a pin. Reverse-geocoded place name, IANA timezone, live local time, and elevation shown in a card. "Use my location" shortcut triggers the browser geolocation API.

2. **Sky dome** — An azimuthal equidistant planetarium chart for the confirmed observer. Zenith is dead-centre (red marker). Horizon is the outer ring. North up, East left (looking-up convention).
   - All visible stars (mag ≤ 5.5, 2851 from the Hipparcos catalogue)
   - 89 IAU constellation figures rendered as polylines
   - Sun, Moon, and all 7 planets with labels
   - Live satellites from CelesTrak, ISS prominent
   - ISS orbital track for the next ~90 minutes as a dashed path

3. **Overhead Now panel** — Everything above the horizon sorted by altitude. Satellites include live speed (km/s) and azimuth. Six layer toggles default ON; filter down without gating the sky.

4. **Shareable sky URL** — `#sky/lat,lon,epochMs` written to the URL hash on confirm. Opening the link restores the same sky state for anyone.

---

## Tech stack

| Concern | Choice |
|---|---|
| Framework | Next.js 16 · React 19 · TypeScript `strict` |
| 3D / WebGL | three.js 0.184 · @react-three/fiber · @react-three/drei |
| Satellites | satellite.js 7 (SGP4 + ECI→ECF→look-angles) |
| Astronomy | astronomy-engine 2.1 (offline, Sun/Moon/planets/stars) |
| Star data | Hipparcos catalogue via d3-celestial, filtered mag ≤ 5.5 |
| Constellation data | IAU figures via d3-celestial ([RA, Dec] coordinate paths) |
| State | Zustand 5 |
| Styling | Tailwind CSS 4 |
| Hosting | Vercel |

---

## Data sources

| Data | Source | Proxy route |
|---|---|---|
| Satellite TLEs | CelesTrak GP API `FORMAT=TLE` | `/api/celestrak` |
| ISS sub-point | Open Notify `iss-now.json` (5 s cache + TLE fallback) | `/api/iss` |
| Reverse geocode + timezone | Nominatim + `tz-lookup` (offline IANA) | `/api/geocode` |
| Planet/star ephemerides | `astronomy-engine` (local, no API call) | — |

All third-party calls are proxied through `/api/*` route handlers — the browser never calls external origins directly. Each proxy caches the last good response; the app always renders an honest `[ OFFLINE DATA ]` sky rather than an empty screen.

---

## Environment variables

No API keys required. All data sources are public and key-free.

See `.env.example` for the full list of recognised variables (all optional).

---

## Local setup

```bash
# Prerequisites: Node >= 20, npm >= 10

git clone <repo-url>
cd project-zenith
npm install

# Build star + constellation data bundle (run once after clone)
node scripts/build-star-data.mjs

# Start dev server
npm run dev
# → http://localhost:3000

# Type-check (should exit 0)
npx tsc --noEmit

# Unit tests (21 tests)
npm test
```

---

## Production build

```bash
npm run build
npm start
```

---

## Accuracy notes

**Satellites (SGP4):** CelesTrak TLEs update every 1–8 hours. SGP4 propagation is accurate to ~1 km over a few days. ISS elevation/azimuth error < 0.1° within 24 h of TLE epoch.

**Planets / Sun / Moon (`astronomy-engine`):** Matches JPL DE421 to < 0.001° for inner planets. Verified: Sun ALT 89.9° at equinox noon equator, below horizon at antipode. All planets within < 1° of Stellarium at spot-check dates.

**Stars:** J2000 RA/Dec from Hipparcos, altitude/azimuth computed per observer via `astronomy-engine`. Proper motion not applied (< 0.1° error over decades).

**Projection:** Azimuthal equidistant, zenith at centre, horizon at rim, North up, East left (correct looking-up orientation).

---

## Architecture

```
app/
  page.tsx              Phase router: landing → globe → sky
  api/celestrak/        TLE proxy (CelesTrak GP, cached)
  api/iss/              ISS position proxy (Open Notify + TLE fallback)
  api/geocode/          Reverse geocode + offline timezone
  api/horizons/         Stub 501 (astronomy-engine is the default)

lib/
  geo.ts                Raycast hit → lat/lon (sphere UV inverse transform)
  satellites.ts         TLE parse + SGP4 + look angles
  ephemeris.ts          astronomy-engine bodies + stars
  sky.ts                buildSkyState (zenith pick, above-horizon count)
  dome.ts               Azimuthal equidistant projection
  time.ts               SimTime (live epoch + scrub offset)
  shareUrl.ts           URL hash encode/decode (#sky/lat,lon,epochMs)
  celestrak.ts          TLE text parser

components/
  scene/Globe.tsx       Three.js Earth (Fresnel atmosphere, raycast pick, pin)
  scene/SkyDome.tsx     Planetarium chart (stars, constellations, bodies, satellites, ISS orbit)
  scene/Starfield.tsx   Procedural star background
  ui/Hud.tsx            Coordinate readout + geolocation button
  ui/LocationCard.tsx   Place / tz / local time / confirm gate
  ui/LayerControls.tsx  Layer toggles (default ON)
  ui/OverheadPanel.tsx  Overhead Now (sorted by altitude, speed sub-row, LIVE tag)

store/useZenith.ts      Zustand global state
hooks/useSky.ts         Live recompute loop (1 s sats/bodies, 15 s stars + ISS orbit)

data/
  bsc5.json             2851 stars, mag ≤ 5.5 (Hipparcos IDs, RA 0–360°)
  constellations.json   89 IAU constellation polylines
```

---

## Key design decisions

- **Three.js over CesiumJS** — The globe is a 10-second location picker; the sky dome is the actual product. Three.js gives full artistic control and a lighter bundle.
- **Raycast de-risked first** — `lib/geo.ts` inverse UV transform was unit-tested against 5 cities and all 6 cardinal axes before any visual work. 21 tests pass.
- **Everything ON by default** — Layer toggles filter *down*; the sky is never gated behind a menu on first reveal.
- **Offline-first** — Proxies cache last-good upstream data. `astronomy-engine` runs entirely offline. Bundled TLE snapshot ensures satellites render without network.
- **Shareable sky** — State in URL hash, zero backend. No account required.

---

## Credits

- [CelesTrak](https://celestrak.org/) — satellite TLE data (Dr T.S. Kelso)
- [astronomy-engine](https://github.com/cosinekitty/astronomy) — Don Cross
- [satellite.js](https://github.com/shashwatak/satellite-js) — SGP4 propagation
- [d3-celestial](https://github.com/ofrohn/d3-celestial) — star + constellation data (Olaf Frohn)
- [Open Notify](http://open-notify.org/) — ISS real-time position
- [Nominatim / OpenStreetMap](https://nominatim.openstreetmap.org/) — reverse geocoding
- [tz-lookup](https://github.com/darkskyapp/tz-lookup) — offline timezone from lat/lon
- Earth texture — three.js example assets (NASA Blue Marble)
