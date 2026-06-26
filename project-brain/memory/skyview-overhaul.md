# SkyView Lite Overhaul — Core Constraints & Plan (persisted)

Branch `phase5-cinematic`. Sky phase rebuilt for SkyView Lite parity. Full spec: `docs/super_power.md`.

## Locked decisions
- Planets = textured spheres (NASA-style maps via `scripts/prepare-models.mjs`), Saturn ring, lit by real sun direction. ISS/Hubble keep Draco GLBs.
- Stars = random procedural Starfield removed in sky; brightness sizing; labels only proper-named stars. Catalog already mag ≤ 5.5.
- Static camera = south +45°, FOV 55, locked; Free Roam = OrbitControls. State: `useZenith.viewMode`.
- Dome removed: no horizon/altitude rings, cardinals, zenith marker; full 360° sphere.
- Proximity reticle: center-screen raycast → focus → lerp scale-up + drei <Html> card; constellations fade in near centroid.

## Coding constraints (non-negotiable)
- Lowest NLOC, NO comments (self-documenting names).
- `using namespace std;` in every C++/WASM program (none currently).

## Key files
SkyPlanetarium.tsx, PlanetModel.tsx, Constellations.tsx, ProximityReticle.tsx, StaticCamera.tsx, ViewModeToggle.tsx, scripts/prepare-models.mjs, store/useZenith.ts.

## Gotchas
- Serpens shares IAU id `Ser` (appears twice) → constellation keys must include index.
- Preview screenshots intermittently time out on this GPU → verify via console logs + DOM eval.
- Reach sky in preview: set `location.hash='sky/<lat>,<lon>,<epoch>'` then `location.reload()`.
