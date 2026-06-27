# Project Zenith — The Celestial Eye

**AstralWeb Innovate · SRM Aaruush '26**

Launch a rocket, fly to orbit, then drop onto any point on Earth and look up: every planet, star, constellation and satellite passing through that location's zenith — rendered live, in real 3D, for the current time.

---

## 1. Installation and Setup Instructions

**Prerequisites:** [Node.js](https://nodejs.org) **≥ 20** and npm **≥ 10**. A modern WebGL2 browser (Chrome, Edge, Firefox, Safari).

```bash
# 1. Clone and enter the project
git clone <repo-url>
cd project-zenith

# 2. Install dependencies
npm install

# 3. Run the dev server
npm run dev
# → open http://localhost:3000
```

That's it — all sky data (stars, constellations, artwork) and 3D assets are **bundled in the repo**, so the app runs offline with no extra build step and no API keys.

**Optional — richer place search.** Location search/reverse-geocoding uses MapTiler when a key is present and silently falls back to OpenStreetMap (Nominatim) when it isn't:

```bash
cp .env.example .env.local
# then set NEXT_PUBLIC_MAPTILER_KEY=<your free key from cloud.maptiler.com>
```

**Production build:**

```bash
npm run build      # next build (webpack)
npm start          # serve the production build on :3000
```

**Quality checks:**

```bash
npx tsc --noEmit   # type-check (exits 0)
npm test           # unit tests (48 passing, Vitest)
```

**Optional — regenerate bundled data** (requires network; not needed for normal use):

```bash
node scripts/build-star-data.mjs   # HYG stars + IAU lines + Stellarium artwork
npm run prepare:models             # planet textures + GLB/Draco pipeline notes
```

---

## 2. Website Functionality and Unique Features

Project Zenith is a single-canvas WebGL experience that moves through four seamless phases — **rocket launch → warp → Earth picker → live sky** — without ever tearing down the 3D context.

**Core functionality**

- **Cinematic rocket launch intro.** A Draco-compressed Space Shuttle (Challenger) model. Hover/ignite to build thrust (with a keyboard- and reduced-motion-friendly fallback), launch, and a bloom "warp" flash bridges you to Earth — backed by a procedural Web-Audio engine roar that cross-fades into an orbital hum.
- **Interactive 3D Earth picker.** A textured globe with a Fresnel atmosphere. Click anywhere to drop a pin, search a place by name, or use one-tap browser geolocation. You get the resolved place name, IANA timezone, and live local time.
- **Live sky planetarium.** The camera sits *inside* a celestial sphere computed for your exact location and time:
  - **3,072 named stars** rendered as one `InstancedMesh` of crisp white points, sized by magnitude.
  - **89 constellation line-figures** plus **85 Stellarium constellation artworks** that fade in only when you look toward them.
  - **Planets as textured spheres** (Saturn with rings), plus the **Sun and Moon**, lit from the Sun's real direction so phases and shading are correct.
  - **Live satellites** — the **ISS and Hubble** as real 3D GLB models, with the ISS's upcoming orbit track.
- **Dual camera system.** *Static* mode locks an AR-style fixed window onto your local sky; *Free Roam* enables orbit-to-explore the whole sphere.
- **Cursor-proximity focus.** A center reticle detects the nearest object and gently scales it up while an info card fades in — star name, host constellation ("Star in Andromeda"), magnitude, spectral type and distance in light-years; planets and satellites get their own detail cards.
- **Left sidebar** with layer toggles (stars / constellations / planets / satellites / labels) and an "Overhead Now" list sorted by altitude.
- **Shareable sky URL.** The full view encodes to `#sky/lat,lon,epochMs` — open the link and anyone sees the exact same sky.

**What makes it stand out**

- **One seamless WebGL journey.** Rocket → globe → sky all share a single `<Canvas>`; GSAP animates the camera across phases, so there's no reload, no black screen, no context loss.
- **Real astronomy, not decoration.** Positions come from `astronomy-engine` (JPL-grade Sun/Moon/planets) and SGP4 satellite propagation — accurate to your location and the current minute.
- **Constellation art done right.** Each artwork is warped onto the sky through its three real anchor stars (the Stellarium method), so the figures sit exactly over their stars.
- **Named-only star catalog.** Built from the HYG database — every rendered star has a real name (proper, Bayer, or Flamsteed) and per-star facts; no anonymous filler.
- **O(log n) star picking.** `three-mesh-bvh` makes thousands of sub-pixel stars individually clickable without dropping frames.
- **Offline-first & keyless.** Every external call is proxied and cached; the core renders with zero API keys.

---

## 3. Dependencies

**Runtime libraries / frameworks**

| Package | Version | Role |
|---|---|---|
| `next` | 16.2 | App framework (App Router) + API route proxies |
| `react` / `react-dom` | 19.2 | UI runtime |
| `typescript` | 5 | Language (strict mode) |
| `three` | 0.184 | WebGL / 3D engine |
| `@react-three/fiber` | 9 | React renderer for three.js |
| `@react-three/drei` | 10 | R3F helpers (`useGLTF`, `OrbitControls`, `Billboard`, `Line`, `Html`, …) |
| `@react-three/postprocessing` | 3 | Selective UnrealBloom glow |
| `three-mesh-bvh` | 0.9 | BVH-accelerated raycast picking for InstancedMesh stars |
| `gsap` | 3 | Rocket animation + cinematic camera transitions |
| `@theatre/core` | 0.7 | Sequenced within-sky camera reveal |
| `astronomy-engine` | 2.1 | Offline Sun/Moon/planet/star ephemerides |
| `satellite.js` | 6.0.2 | SGP4 satellite propagation (pure-JS) |
| `tz-lookup` | 6.1 | Offline IANA timezone from lat/lon |
| `zustand` | 5 | Global state store |
| `tailwindcss` | 4 | Styling |

**Dev / build tooling:** `vitest` (tests), `eslint` + `eslint-config-next` (linting), `@tailwindcss/postcss`, `@types/*`, `@theatre/studio`.

**Bundled tools & assets (in-repo, no install needed):** Draco decoder (`public/draco/`), Challenger/ISS/Hubble GLB models (`public/`, `public/models/`), planet textures (`public/textures/planets/`), constellation artwork (`public/constellation-art/`), and prebuilt star/constellation data (`data/`).

**External data APIs** (all proxied through `/api/*`, cached, with fallbacks):

| Data | Source | Proxy route |
|---|---|---|
| Satellite TLEs | [CelesTrak](https://celestrak.org/) GP API | `/api/celestrak` |
| ISS sub-point | [Open Notify](http://open-notify.org/) (+ TLE fallback) | `/api/iss` |
| Geocode / reverse-geocode | [MapTiler](https://www.maptiler.com/) → [Nominatim](https://nominatim.openstreetmap.org/) fallback | `/api/maptiler/*`, `/api/geocode` |
| Planet/star ephemerides | `astronomy-engine` (runs locally) | — |

---

## Environment variables

All optional — see `.env.example`.

- `NEXT_PUBLIC_MAPTILER_KEY` — enables MapTiler geocoding for place search/reverse-geocode (free tier at [cloud.maptiler.com](https://cloud.maptiler.com)). Without it, search falls back to Nominatim and the globe uses its bundled Earth texture.

---

## Tech & data notes

- **Stars:** HYG database, magnitude ≤ 6.5, named stars only; J2000 RA/Dec → alt/az per observer via `astronomy-engine` (proper motion omitted, < 0.1° over decades).
- **Satellites (SGP4):** CelesTrak TLEs refresh every 1–8 h; ISS alt/az error < 0.1° within 24 h of epoch.
- **Planets / Sun / Moon:** `astronomy-engine` matches JPL DE421 to < 0.001° for inner planets.
- **Constellation artwork:** Stellarium "western" skyculture, each image positioned by 3 HIP anchor stars resolved against HYG.
- **Offline-first:** each proxy caches its last good response and the app renders an honest `[ OFFLINE DATA ]` sky rather than a blank screen.

---

## Architecture (high level)

```
app/page.tsx            Single <Canvas> phase router: launch → warp → globe → descent → sky
app/api/*               Cached proxies: celestrak, iss, geocode, maptiler/*
components/hero/         Rocket launch scene (Shuttle, CameraRig, SmokeSystem, HeroHud) + Web-Audio
components/scene/        Globe, SkyPlanetarium, InstancedStars, Constellations, ConstellationArt,
                        PlanetModel, SatModel, ProximityReticle, cameras, transitions
components/ui/           Sidebar, OverheadPanel, LayerControls, ViewModeToggle, DetailPanel, …
lib/                     ephemeris, satellites, dome (altAz↔vec3), starColor/size, maptiler, geo, time
store/useZenith.ts      Zustand state (phase + launch sub-machine, observer, selection, view mode)
hooks/useSky.ts         Live recompute loop (1 s sats/bodies · 15 s stars/constellations/art)
data/                   bsc5.json (stars), constellations.json, constellation-art.json, dso.json
scripts/                build-star-data.mjs (data), prepare-models.mjs (assets)
```

---

## Credits

- [CelesTrak](https://celestrak.org/) — satellite TLEs (Dr T.S. Kelso)
- [astronomy-engine](https://github.com/cosinekitty/astronomy) — Don Cross
- [satellite.js](https://github.com/shashwatak/satellite-js) — SGP4
- [HYG database](https://github.com/astronexus/HYG-Database) — star catalogue (names, magnitudes, distances)
- [d3-celestial](https://github.com/ofrohn/d3-celestial) — IAU constellation line figures (Olaf Frohn)
- [Stellarium](https://github.com/Stellarium/stellarium-skycultures) — western constellation artwork (GPL)
- [Open Notify](http://open-notify.org/) — ISS real-time position
- [MapTiler](https://www.maptiler.com/) / [Nominatim · OpenStreetMap](https://nominatim.openstreetmap.org/) — geocoding
- [NASA 3D Resources](https://github.com/nasa/NASA-3D-Resources) — ISS / Hubble models · [Solar System Scope](https://www.solarsystemscope.com/textures) — planet textures
- [tz-lookup](https://github.com/darkskyapp/tz-lookup) — offline timezone
