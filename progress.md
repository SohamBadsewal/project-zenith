# Project Zenith — Progress

## Current Status
SkyView Lite overhaul COMPLETE & verified. Dome removed; dual camera; planet spheres; proximity reticle; decluttered stars; proximity-gated constellations.

## Just Completed
- [x] Store: `viewMode: 'static'|'freeroam'` + `setViewMode`
- [x] Dome removed (no horizon/altitude rings, cardinals, zenith marker); full 360° sphere (dropped aboveHorizon filters)
- [x] PlanetModel: textured NASA-map spheres + Saturn ring + procedural fallback, lit by real sun direction (SunLight)
- [x] InstancedStars: full sphere + brightness sizing; random Starfield removed from sky phase
- [x] ProximityReticle: center-crosshair raycast → focus → lerp scale-up + drei <Html> fade-in card (+ star ring)
- [x] Constellations: extracted, fade in only near reticle centroid (fixed Serpens `Ser` duplicate-id key bug)
- [x] Dual camera: ViewModeToggle (right) + StaticCamera (south+45°, FOV55) vs OrbitControls
- [x] scripts/prepare-models.mjs (8 planet textures fetched) + `npm run prepare:models`
- [x] docs/super_power.md + project brain/memory written
- [x] tsc clean · 48/48 tests · build OK · live preview: no console errors, toggle works, textures 200

## Current Blockers/Bugs
- Preview screenshots intermittently time out on this GPU (verified via console + DOM eval instead).

## Next Immediate Task
Commit the overhaul. Optional polish: constellation art overlays (textures), star-instance focus scaling, planet ring texture.
