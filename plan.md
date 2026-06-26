# Project Zenith — Master-Prompt Pivot Plan

**Goal:** Pivot Zenith to the master-prompt stack (MapTiler globe + InstancedMesh sky + GSAP transition + GLB satellites), reusing the proven astronomy math.

**Spec:** `docs/superpowers/specs/2026-06-25-zenith-pivot-design.md`
**Branch:** `phase5-cinematic`

| # | Phase | Status | Plan file |
|---|-------|--------|-----------|
| 1 | Foundation — MapTiler proxy routes | `[x]` done (`a619175`,`57bb3ab`) | `plans/2026-06-25-phase1-foundation.md` |
| 4 | Sky rebuild — SkyPlanetarium (InstancedMesh + BVH) | `[x]` done (`42d95b6`,`14414df`) | `plans/2026-06-25-phase4-sky-planetarium.md` |
| A | Verification gate | `[ ]` active | this session |
| 2 | Globe — MapTilerGlobe (search + fly-to, then 3D patch) | `[ ]` active | this session |
| 3 | Transition — GSAP globe→sky | `[ ]` deferred | _to write_ |
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

## Phase 2A — Geocoding search + GSAP fly-to (active)
- [ ] dep `gsap`
- [ ] `lib/maptilerClient.ts`
- [ ] `components/ui/SearchBar.tsx`
- [ ] `Globe.tsx` GSAP fly-to (plain-object tween + `useFrame`)
- [ ] mount `<SearchBar/>` in `app/page.tsx`

## Phase 2B — Local MapTiler 3D patch
- [ ] deps `@mapbox/vector-tile` + `pbf`
- [ ] `lib/mvtBuildings.ts` (+test) · `lib/terrainRgb.ts` (+test)
- [ ] `components/scene/MapTilerPatch.tsx` (raster + terrain displace + building InstancedMesh)
- [ ] `components/ui/Attribution.tsx`
- [ ] LOD swap sphere↔patch; OSM fallback

## Deferred
- Phase 3 single-canvas + GSAP globe→sky (replaces two-Canvas + Theatre handoff)
- Phase 5 NASA ISS/Hubble Draco GLB, `SatMarker→SatModel` LOD, selective B-V bloom
- UI overlays §4.4 — `ObjectInfoOverlay`, `SidebarNav`, `ViewModeToggle`
