# Project Zenith — Master-Prompt Pivot Plan

**Goal:** Pivot Zenith to the master-prompt stack (MapTiler globe + InstancedMesh sky + GSAP transition + GLB satellites), reusing the proven astronomy math.

**Spec:** `docs/superpowers/specs/2026-06-25-zenith-pivot-design.md`
**Branch:** `phase5-cinematic`

| # | Phase | Status | Plan file |
|---|-------|--------|-----------|
| 1 | Foundation — MapTiler proxy routes | `[x]` done (`a619175`,`57bb3ab`) | `plans/2026-06-25-phase1-foundation.md` |
| 4 | Sky rebuild — SkyPlanetarium (InstancedMesh + BVH) | `[x]` done (`42d95b6`,`14414df`) | `plans/2026-06-25-phase4-sky-planetarium.md` |
| A | Verification gate | `[ ]` active | this session |
| 2 | Globe — MapTilerGlobe (2A done; 2B pending) | `[~]` 2A done | this session |
| 3 | Transition — GSAP globe→sky (single canvas) | `[x]` done, verified | this session |
| 5 | UI + Assets — overlays + NASA GLB Draco pipeline | `[ ]` deferred | _to write_ |

## Phase 1 — Foundation (done)
- [x] `lib/maptiler.ts` builders + `latLonToTileXY` + `.test.ts`
- [x] `app/api/maptiler/tiles` (raster/MVT/terrain, key server-side)
- [x] `app/api/maptiler/geocode` (forward + reverse)
- [x] `app/api/geocode` rewired MapTiler-first → Nominatim fallback
- [x] MapTiler types in `types/index.ts`; `.env.example`

## Phase 4 — Sky rebuild (done)
- [x] `three-mesh-bvh`; `lib/starColor.ts` `bvToRgb` + `.test.ts`
- [x] `InstancedStars.tsx` (2851 stars, per-instance color, BVH pick)
- [x] `SkyDome.tsx` → `SkyPlanetarium.tsx`; wired in `app/page.tsx`

## Part A — Verification gate (active)
- [ ] A1 `tsc --noEmit` → 0
- [ ] A2 `vitest run` → all green (~33 = 21 + 6 maptiler + 6 starColor)
- [ ] A3 `npm run build` → ok
- [ ] A4 `NEXT_PUBLIC_MAPTILER_KEY` present in `.env.local`
- [ ] A5 proxy tile smoke (200 / 503-fallback)
- [ ] A6 proxy geocode smoke
- [ ] A7 sky InstancedMesh + BVH pick smoke

## Phase 2A — Geocoding search + GSAP fly-to (done, verified)
- [x] dep `gsap`
- [x] `lib/maptilerClient.ts` (geocode + tileUrl)
- [x] `components/ui/SearchBar.tsx` (debounced, skip-guarded)
- [x] `Globe.tsx` GSAP fly-to (quaternion slerp on `source:'search'`)
- [x] mount `<SearchBar/>` in `app/page.tsx`; `'search'` added to source union

## Phase 2B — Local MapTiler 3D patch
- [ ] deps `@mapbox/vector-tile` + `pbf`
- [ ] `lib/mvtBuildings.ts` (+test) · `lib/terrainRgb.ts` (+test)
- [ ] `components/scene/MapTilerPatch.tsx` (raster + terrain displace + building InstancedMesh)
- [ ] `components/ui/Attribution.tsx`
- [ ] LOD swap sphere↔patch; OSM fallback

## Phase 3 — Cinematic globe→sky transition (done, verified)
- [x] Single `<Canvas>` (merged the two-Canvas split); scene swapped by phase
- [x] `TransitionRig.tsx` drives one camera (globe/descent dolly/sky)
- [x] `descent`: GSAP camera dolly + FOV; CSS dip-to-black overlay (compositor — survives main-thread saturation); `setTimeout` phase advance (starvation-proof)
- [x] Sky mounts only in `phase==='sky'` (A7 known-good path); back-nav resets camera
- [x] Replaced Theatre `CinematicCamera` inter-phase use (files retained, unused)

## Deferred
- Phase 5 NASA ISS/Hubble Draco GLB, `SatMarker→SatModel` LOD, selective B-V bloom
- Phase 2B local MapTiler terrain+buildings patch
- UI overlays §4.4 — `ObjectInfoOverlay`, `SidebarNav`, `ViewModeToggle`
- Perf: `useSky` first recompute saturates main thread on slow machines (jank during transition; masked by black dip). Consider deferring/chunking the cold star compute.
