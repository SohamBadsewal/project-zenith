# Project Zenith — Progress

## Current Status
Phase 2B complete. All phases shipped: MapTiler proxy → Globe → GSAP transition → SkyPlanetarium → Bloom → GLB satellites.

## Just Completed
- [x] fix: satellite.js v7 → v6.0.2 (pure-JS SGP4, no WASM node: imports) + pinned to `next build --webpack` — build-hang resolved, 48/48 tests pass
- [x] Phase 2B: Globe.tsx uses MapTiler satellite tile via proxy (`/api/maptiler/tiles?kind=satellite-v4&z=0&x=0&y=0`) with earth_day.jpg fallback when key unset
- [x] MapTiler ToS attribution added to globe UI (`© MapTiler © OpenStreetMap`)

## Current Blockers/Bugs
None. Build clean. Tests 48/48. All routes live.

## Next Immediate Task
Optional polish: multi-tile LOD globe texture (z≥2 stitched), MVT building InstancedMesh at z≥14, or snap-camera/zoom-LOD for satellites.
