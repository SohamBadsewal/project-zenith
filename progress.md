# Project Zenith — Progress

## Current Status
Phase 5 complete. Globe reverted to static equirectangular earth_day.jpg (MapTiler single-tile texture dropped — Web Mercator z0 tile distorted the sphere UV + shifted lat/lon).

## Just Completed
- [x] fix: satellite.js v7 → v6.0.2 (pure-JS SGP4, no WASM node: imports) + pinned to `next build --webpack` — build-hang resolved, 48/48 tests pass
- [x] Reverted Globe texture to static /textures/earth_day.jpg (correct equirectangular mapping, no coordinate mismatch). MapTiler globe-texture attempt + attribution removed.

## Current Blockers/Bugs
- MapTiler raster tiles are Web Mercator (per-tile XYZ) — a single tile cannot texture an equirectangular sphere. Proper use needs either per-tile-mesh LOD or an equirectangular source. Globe stays on static texture.

## Next Immediate Task
Globe is stable on the static texture. MapTiler proxy routes remain for geocoding search (Phase 2A) only. Optional: snap-camera/zoom-LOD for satellites.
