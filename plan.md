# Project Zenith — Master-Prompt Pivot Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement each phase plan task-by-task.

**Goal:** Pivot Zenith to the GLM 5.2 master-prompt stack (MapTiler globe + InstancedMesh sky planetarium + GSAP transition + GLB satellites), reusing the proven astronomy math.

**Architecture:** Single `<Canvas>`, dual scene-graph, phase-driven swap (`globe` → `fly` → `sky`), GSAP camera transition across the swap, Theatre.js retained for the within-sky reveal.

**Tech Stack:** Next.js 16 · React 19 · three.js 0.184 · @react-three/fiber 9 · drei 10 · MapTiler (raster + MVT buildings + terrain-rgb + geocoding) · astronomy-engine · satellite.js · gsap · three-mesh-bvh.

**Spec:** `docs/superpowers/specs/2026-06-25-zenith-pivot-design.md`

---

## Five phase plans (built in dependency order)

| # | Phase | Status | Plan file | Depends on |
|---|-------|--------|-----------|------------|
| 1 | **Foundation** — MapTiler proxy routes + `MAPTILER_KEY` + smoke-test | `[ ]` pending | `docs/superpowers/plans/2026-06-25-phase1-foundation.md` | nothing |
| 2 | **Globe** — `MapTilerGlobe` (raster sphere + MVT buildings + terrain displacement) | `[ ]` pending | _to be written_ | Phase 1 |
| 3 | **Transition** — `GlobeToSkyTransition` (GSAP camera timeline) | `[ ]` pending | _to be written_ | Phase 2 |
| 4 | **Sky rebuild** — `SkyPlanetarium` (InstancedMesh stars, BVH picking, constellations, GLB satellites) | `[ ]` pending | _to be written_ | can parallel Phase 2/3 |
| 5 | **UI + Assets** — overlay components + NASA `.glb` Draco pipeline | `[ ]` pending | _to be written_ | Phase 4 |

---

## Phase 1 — Foundation checklist (granular)

These map 1:1 to `docs/superpowers/plans/2026-06-25-phase1-foundation.md`:

- [ ] Add `MAPTILER_KEY` to `.env.example` (documented as optional, with OSM fallback)
- [ ] Add `MAPTILER_KEY` to `.env.local` (real key, server-side only)
- [ ] Smoke-test: confirm `satellite-v4`, buildings tileset, terrain-rgb endpoints return tiles with the key
- [ ] Create `app/api/maptiler/tiles/route.ts` — proxy raster + MVT + terrain tiles (key server-side)
- [ ] Create `app/api/maptiler/geocode/route.ts` — proxy MapTiler Geocoding (forward + reverse)
- [ ] Create `lib/maptiler.ts` — endpoint builders + attribution constants
- [ ] Add MapTiler types to `types/index.ts` (`MapTilerTileResponse`, `MapTilerGeocodeResponse`)
- [ ] Write `lib/maptiler.test.ts` — endpoint builder unit tests
- [ ] Rewire `app/api/geocode/route.ts` to prefer MapTiler, fall back to Nominatim
- [ ] Verify `tsc --noEmit` clean, `npm test` green
- [ ] Commit

---

## Phase 2 — Globe checklist (to be planned in detail when Phase 1 lands)

- [ ] `components/scene/MapTilerGlobe.tsx` — sphere with raster-tile texture, raycast→lat/lon via existing `pickLocation()`
- [ ] MVT building layer → extruded InstancedMesh, fades in at zoom z ≥ 14
- [ ] Terrain-RGB vertex displacement
- [ ] Fresnel atmosphere (preserved from existing Globe.tsx)
- [ ] SearchBar → MapTiler geocode → GSAP camera fly-to coords
- [ ] Attribution UI: "© MapTiler © OpenStreetMap"
- [ ] OSM-raster fallback when MapTiler quota exceeded

## Phase 3 — Transition checklist (to be planned when Phase 2 lands)

- [ ] Add `gsap` dependency
- [ ] `components/scene/GlobeToSkyTransition.tsx` — GSAP timeline (~2.5s): dolly, tilt, FOV widen, skybox fade
- [ ] Extend `app/page.tsx` phase router with `fly` phase
- [ ] Dispose globe meshes on `phase='sky'`
- [ ] Theatre.js within-sky reveal plays after transition completes

## Phase 4 — Sky rebuild checklist (to be planned)

- [ ] Add `three-mesh-bvh` dependency
- [ ] `components/scene/SkyPlanetarium.tsx` — replaces SkyDome.tsx
- [ ] `InstancedStars` — 2851 stars via `altAzToVec3` (math unchanged)
- [ ] `three-mesh-bvh` raycast for sub-pixel star picking
- [ ] `ConstellationLines` via drei `<Line>`
- [ ] `ConstellationArt` proximity-fade
- [ ] `Bodies` (Sun/Moon/planets) billboard sprites
- [ ] `SatMarker` → `SatModel` LOD swap
- [ ] Delete `components/scene/SkyDome.tsx`

## Phase 5 — UI + Assets checklist (to be planned)

- [ ] `ObjectInfoOverlay` — name/distance/facts on raycast click
- [ ] `SidebarNav` — 3-dot drawer, searchable index, snap-camera
- [ ] `ViewModeToggle` — Static Horizon ↔ Free Roam
- [ ] `scripts/prepare-models.mjs` — download NASA ISS/Hubble, license-check, convert, Draco-encode → `/public/models/`
- [ ] DracoDecoder bundled to `/public/draco/`
- [ ] Rewire `LocationCard`/`OverheadPanel`/`LayerControls`/`Hud` to new sky
