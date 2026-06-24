# TRACKER.md — Project Zenith progress

Single source of truth for what's done / in progress / blocked. Kept honest.

## Current focus
Deploy — production build running; 50-file initial commit made; waiting on `gh auth login` then push + Vercel.

## Phase status
| Phase | Scope | Status | Notes |
| :-- | :-- | :-- | :-- |
| P0 | Scaffold + raycast de-risk spike | DONE | Math proven both ways |
| P1 | Proxy routes + astronomy pipeline | DONE | Pipeline+store+routes+data built & verified |
| P2 | Interactive globe + location pick | DONE | Landing→globe→pick→card→confirm working visually |
| P3 | Sky view dome (the product) | DONE (core) | Live dome: planets/stars/constellations/satellites + panel + dropdowns. Mobile bottom-sheet + ISS track pending |
| P4 | Differentiators + polish + deploy | IN PROGRESS | Shareable URL ✓, ISS orbit/speed ✓, geolocation ✓, git commit ✓; Vercel deploy PENDING |

## P2/P3 — done (visible product)
- Dark theme + Space Grotesk/Mono fonts; Nothing-style chrome + design tokens in globals.css.
- `components/scene/Globe.tsx` (day texture + Fresnel atmosphere + auto-rotate-stop + raycast pick → store), `Starfield.tsx`.
- `components/ui/Hud.tsx`, `LocationCard.tsx` (geocode + tz + live local time + CONFIRM gate), `LayerControls.tsx` (default-ON dropdowns), `OverheadPanel.tsx` (zenith-sorted, status-coloured, LIVE/OFFLINE tag, N-sats footer).
- `components/scene/SkyDome.tsx` — azimuthal chart (`lib/dome.ts`): horizon+alt rings, N/E/S/W, red ZENITH centre, stars, blue constellation lines, planet/sun/moon markers, green satellite markers (ISS prominent).
- `hooks/useSky.ts` — live recompute loop (sats/bodies 1s, stars/constellations 15s), TLE fetch via proxy, perf cap 220 sats, pushes SkyState to store.
- `app/page.tsx` — phase router (landing/globe/sky) + overlays + back.
- VERIFIED IN BROWSER: full flow works; sky shows Moon/Venus/Jupiter + live satellites (COSMOS 1953, INTERCOSMOS 25, SL-8 R/B) with ● LIVE, correct zenith-sorted panel.

## P0 — done
- Next.js 16 + React 19 + TS strict + Tailwind 4 scaffolded into repo root (preserving Claude config).
- Deps: three 0.184, @react-three/fiber 9.6, @react-three/drei 10.7, @react-three/postprocessing 3.0, satellite.js 7.0, astronomy-engine 2.1, zustand 5.0; vitest for tests.
- `lib/geo.ts` — pure raycast-hit → lat/long transform (`pickLocation`) + inverse (`latLonToUnitVector`) + `toObserverGd` for satellite.js + `formatLatLon`.
- `lib/geo.test.ts` — 14 tests pass: 5-city round-trip, all 6 cardinal axes, non-unit input, lon wrap, observerGd shape.
- `app/spike/page.tsx` — THROWAWAY visual verification (delete when Phase 2 Globe lands). Confirmed: Americas correctly oriented, reference city dots land on correct countries, live centre click reads ~0°,−90° matching geography.
- `types/index.ts` — full SCHEMA.md contract.

## P1 — done so far (headless, verified)
- `lib/time.ts` (simTime), `store/useZenith.ts` (Zustand per SCHEMA §4).
- `lib/ephemeris.ts` — astronomy-engine Sun/Moon/planets/stars → CelestialObject (verified API: Equator ra=hours, Horizon deg).
- `lib/satellites.ts` — TLE parse + SGP4 propagation + look angles → SatelliteState (verified satellite.js v7 named exports).
- `lib/sky.ts` — `buildSkyState` (zenith pick + above-horizon count).
- `lib/sky.test.ts` — 7 tests pass: ISS sub-point→zenith (elev>89°), ISS alt ~400km/speed ~7.66km/s, Sun >85° at equinox-noon-equator & below horizon at antipode, all bodies in-range, buildSkyState zenith+count.
- Total suite: 21 tests pass; `tsc --noEmit` clean.

## P1 — done (routes + data)
- Verified all upstreams live (RULES §3): CelesTrak `FORMAT=TLE`, OpenNotify `iss-now`, Nominatim reverse.
- `app/api/celestrak` (TLE parse + last-good snapshot), `app/api/iss` (open-notify + TLE-derived fallback), `app/api/geocode` (Nominatim + tz-lookup offline tz; non-fatal). All smoke-tested on localhost.
- `app/api/horizons` — honest 501 (DEFERRED per cut-list; astronomy-engine is the verified default/fallback).
- `scripts/build-star-data.mjs` → `data/bsc5.json` (2851 stars, mag ≤ 5.5, HIP ids, RA normalised 0..360, 28 verified proper names) + `data/constellations.json` (89 IAU figures, [raDeg,decDeg] paths). ConstellationFigure schema → coordinate paths.
- Caught + fixed a data-integrity bug: d3-celestial ids are HIP not HR — re-keyed names to correct HIP, removed mislabels (RULES §3).
- `.env.example` (all keyless), `types/tz-lookup.d.ts`.

## Changelog
- 2026-06-24 — P1 headless pipeline complete & tested. Verified satellite.js v7 + astronomy-engine APIs against installed type defs before wiring (RULES §3).
- 2026-06-24 — P0 complete. Chose Three.js over CesiumJS (council-validated; rulebook says "like CesiumJS", deliverable accepts 3D globe OR map). De-risked the raycast→lat/long transform first per council's #1 priority; it passes tests + visual check.

## Decisions log
- Three.js + R3F, not CesiumJS (user direction + council pressure-test).
- Nothing-design constraints relaxed for the spectacle layer (globe/sky); chrome stays clean.
- Globe convention: SphereGeometry default UVs + equirectangular texture, prime meridian at +X. All angle math centralised in `lib/geo.ts` (SCHEMA §6).

## Assumptions to verify
- [ ] CelesTrak GP API params/shape (`gp.php?GROUP=visual&FORMAT=json`) unchanged — verify in P1 before the fetch.
- [ ] OpenNotify `iss-now.json` operational; pass-times still deprecated (derive from TLE).
- [ ] NASA Horizons param names (`CENTER=coord@399`, `SITE_COORD`, `QUANTITIES=4,1,2`) + JSON output.
- [ ] Geocoder choice + free-tier ToS.
- [ ] Earth day texture is a placeholder (three.js examples asset); swap for NASA Blue Marble + night/normal/specular in P2.

## Blockers
- (none)
