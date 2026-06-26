# Project Zenith — Celestial Viewer Overhaul ("SkyView Lite" parity)

**Branch:** `phase5-cinematic` · **Status:** Implemented & verified (tsc clean, 48/48 tests, build OK, live preview).

## Goal
Match SkyView Lite: an infinite 360° celestial sphere, a dual camera system, high-fidelity 3D objects with cursor-proximity interaction, decluttered stars, and proximity-gated constellations under realistic lighting.

## Locked decisions
1. **Planets** → textured spheres (`MeshStandardMaterial`, NASA-style maps via `scripts/prepare-models.mjs`), Saturn with a ring disc, lit by the real sun direction. ISS/Hubble keep their working Draco GLBs.
2. **Stars** → random procedural `Starfield` removed from the sky phase; catalog stars sized by brightness (dim → tiny), labels only for proper-named stars. (Catalog is already mag ≤ 5.5, so literal "mag<6" was a no-op — the real declutter is dropping the procedural field.)
3. **Static camera** → origin, looking south tilted +45°, FOV 55, rotation locked. Free Roam re-enables OrbitControls.

## Architecture (sky phase)
```
<Canvas>
  SkyPlanetarium
    ambientLight(0.22) + SunLight(directional @ sun alt/az)
    FocusController        screen-center raycast → focusedId (≤6°)
    InstancedStars         full sphere, BVH picking, brightness sizing
    Constellations         centroid-gated fade-in (≤22°)
    bodies → PlanetModel   textured sphere + Saturn ring, lerp scale on focus/select
    satellites             billboard marker → SatModel (GLB) on select
    FocusCard              drei <Html>, fade-in beneath focused object
  EffectComposer/Bloom
  StaticCamera | OrbitControls   (by useZenith.viewMode)
DOM: center crosshair, ViewModeToggle (right), LayerControls (left), OverheadPanel
```

## Components
- `store/useZenith.ts` — `viewMode: 'static'|'freeroam'` + `setViewMode`.
- `components/scene/SkyPlanetarium.tsx` — dome removed (no horizon/altitude rings, cardinals, zenith marker); full-sphere render; owns lighting + focus state.
- `components/scene/PlanetModel.tsx` — textured sphere + procedural color fallback (`AssetBoundary`+`Suspense`), Saturn ring, focus/select scale lerp.
- `components/scene/Constellations.tsx` — proximity-gated line opacity (index-keyed; note Serpens shares IAU id `Ser`).
- `components/scene/ProximityReticle.tsx` — `FocusController` + `FocusCard` (+ star ring).
- `components/scene/StaticCamera.tsx` — fixed south+45°, FOV 55.
- `components/scene/InstancedStars.tsx` — full sphere + brightness-scaled sizes.
- `components/ui/ViewModeToggle.tsx` — right-side Static/Free Roam toggle (LayerControls styling).
- `scripts/prepare-models.mjs` — fetch planet textures (idempotent, fallback-safe) + documents the Blender→`gltf-pipeline -d` GLB path. `npm run prepare:models`.

## Reused (unchanged)
`lib/dome.ts altAzToVec3/circlePoints`, `hooks/useSky.ts`, `lib/ephemeris.ts` (sun gives light dir), `lib/starColor.ts bvToRgb`, `SatModel.tsx` GLB/Draco pattern, `three-mesh-bvh`.

## Constraints
New/modified code: no comments, low NLOC, self-documenting. `using namespace std;` in any C++/WASM (none here).

## Verification
`npx tsc --noEmit` clean · `npm test` 48/48 · `npm run build` OK · live: dome gone, planets are shaded spheres (Saturn ringed), Static/Free Roam toggle works, crosshair present, no console errors. Screenshot capture intermittently times out on this GPU — verified via console + DOM probes.
