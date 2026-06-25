# Project Zenith — Master-Prompt Pivot Design

**Date:** 2026-06-25
**Status:** Approved (brainstorming complete, awaiting implementation plan)
**Branch context:** `phase5-cinematic` (HEAD `7b142e7`)
**Supersedes:** The keyless/lightweight-globe architecture documented in the current README "Key design decisions"

## 1. Purpose & the decision to pivot

The GLM 5.2 master prompt specifies a Google-3D-Tiles + InstancedMesh + GLB-satellite planetarium
that materially differs from the shipped Project Zenith (Three.js sphere globe + 2D azimuthal
sky dome + Theatre.js reveal). After surfacing the contradiction and confirming intent, the
owner chose to **pivot to the master-prompt stack** using a **MapTiler** key in place of Google's.

This spec is the engineering source of truth for that pivot. It records the five locked
architectural decisions, the verified external constraints, and the honest limits of what is
buildable with the chosen stack.

## 2. The five locked decisions

1. **Globe engine:** MapTiler Buildings (MVT vector tiles) + Terrain-RGB displacement.
   Extruded building boxes on real terrain — geographically accurate, NOT Google photorealistic.
2. **Sky:** Rebuild the renderer (`SkyDome.tsx` → `SkyPlanetarium`), reuse the proven astronomy
   math (`altAzToVec3`, `propagateSatellite`, `computeBodies`, the Hipparcos/constellation data).
3. **3D models:** Source real NASA `.glb` ISS + Hubble; convert/Draco-encode via a reproducible
   build script.
4. **Trackers:** Keep three — engineering spec/plan (this + writing-plans output), TRACKER.md
   (existing status/decisions log), and plan.md/progress.md (master-prompt-mandated).
5. **Architecture:** Single `<Canvas>`, dual scene-graph, GSAP camera transition between phases,
   Theatre.js retained for the within-sky reveal only.

## 3. Verified external constraints (the honest limits)

### MapTiler (verified against docs.maptiler.com)
- Buildings served as **MVT/PBF** at `/tiles/v3/{tileset}/{z}/{x}/{y}.pbf`, building layer carries
  `render_height` / `render_min_height`.
- Tiles are **512px** (not 256) — tile-scale math must account for this.
- Terrain via **terrain-RGB** or **quantized-mesh** endpoints.
- Geocoding at `/geocoding/{query}.json` — replaces Nominatim.
- **No photorealistic 3D Tiles** — only extruded vector buildings. "Street level" = accurate
  extruded blocks on real terrain, not Google Earth photogrammetry. This is accepted.
- Free tier: 100k tile loads/mo, 100 geocodes/session — fine for a hackathon, needs fallback.
- ToS requires attribution: "© MapTiler © OpenStreetMap" in the globe UI.

### 3D models (verified against science.nasa.gov/3d-resources + Sketchfab)
- ISS `.glb` confirmed freely available from NASA 3D Resources (US-gov public domain).
- Hubble available from NASA/Sketchfab but format varies (`.3ds`, `.blend`, some `.glb`).
- NASA assets are **not reliably Draco-compressed** → "Draco-compressed .glb" is an owned
  asset-pipeline step (download → license-check → convert if needed → Draco-encode), not a
  free property of the source.
- DracoDecoder must be bundled and configured on GLTFLoader.

## 4. Architecture

Single `<Canvas>` for the whole app; phase-driven scene-graph swap; shared OrbitControls,
raycaster, and post-processing chain. Same WebGL context throughout so the transition is
genuinely seamless (no cross-context crossfade).

```
<Canvas>
  <SharedInfra>
    <OrbitControls/>                       one instance, reconfigured per phase
    <PostProcessing><Bloom/></PostProcessing>  already in package.json (^3.0.4)
    <Suspense fallback={<SkyboxLoader/>}>  gates the transition to hide load
      <PhaseRouter phase={useZenith().phase}>
        'globe' → <MapTilerGlobe/>
        'fly'   → <GlobeToSkyTransition/>   GSAP, ~2.5s
        'sky'   → <SkyPlanetarium/>         replaces SkyDome.tsx
      </PhaseRouter>
    </Suspense>
  </SharedInfra>
</Canvas>
```

### 4.1 MapTilerGlobe (replaces components/scene/Globe.tsx body)
- Sphere with raycast→lat/lon via existing `lib/geo.ts` `pickLocation()` (unchanged).
- Raster-tile texture (LOD by camera altitude).
- Terrain-RGB vertex displacement (one mesh, no z-fighting).
- MVT building InstancedMesh, fades in when **zoom-level z ≥ 14** (the MVT-native metric; camera
  altitude is a derived approximation, not the control metric).
- Fresnel atmosphere shader survives from current Globe.tsx.
- SearchBar → MapTiler Geocoding → GSAP camera fly-to coords.
- All MapTiler calls proxied via `/api/maptiler/*` (key stays server-side); OSM-raster fallback
  on quota exhaustion, matching existing offline-first discipline.

### 4.2 GlobeToSkyTransition (new; replaces inter-phase Theatre use)
GSAP timeline (~2.5s): dolly up/out → tilt nadir→zenith → FOV widen 50°→75° → fade skybox
0→1 + globe 1→0 → on done: `phase='sky'`, dispose globe meshes, mount SkyPlanetarium, then play
the existing Theatre.js within-sky reveal. GSAP tweens a plain JS object; `useFrame` copies it
onto the camera each frame (avoids GSAP/R3F ownership contention).

### 4.3 SkyPlanetarium (replaces SkyDome.tsx)
3D celestial sphere the camera sits inside. Positions via existing `altAzToVec3()` (unchanged).
- Deep-space skybox (Suspense-gated).
- `InstancedStars` — 2851 Hipparcos stars as ONE InstancedMesh, per-instance color+magnitude.
  (Note: 2851 is not "tens of thousands"; InstancedMesh is correct but not under heavy load.)
- `ConstellationLines` — drei `<Line>` from `constellations.json`, projected via `altAzToVec3`.
- `ConstellationArt` — alpha-mapped art, opacity ∝ camera alignment (proximity fade).
- `Bodies` — Sun/Moon/7 planets as billboard sprites (astronomy-engine positions).
- `Satellites` — `<SatMarker>` (billboard, raycast target) → `<SatModel>` (GLB) on click/zoom.
- `RaycastPicker` — `three-mesh-bvh` on InstancedMesh for sub-pixel star picking; sprite raycast
  for bodies/sats.
- Horizon rings via existing `horizonRing()`/`altitudeRing()` (unchanged).
- `projectAltAz` kept in `dome.ts` for an optional minimap (low priority).

### 4.4 DOM overlay (separate from WebGL → UI text stays crisp without threshold tricks)
Survives: `LocationCard` (rewired to MapTiler geocoding), `OverheadPanel`, `LayerControls`, `Hud`.
New: `ObjectInfoOverlay` (name/distance/facts on raycast click), `SidebarNav` (3-dot left drawer,
searchable ISS/Hubble/Mirfak/ADS2843AB index, snap-camera), `ViewModeToggle` (Static Horizon ↔
Free Roam — OrbitControls az/el limits toggled).

## 5. What survives unchanged

`lib/geo.ts`, `lib/dome.ts` (incl. `altAzToVec3`, `horizonRing`, `altitudeRing`, `circlePoints`,
`projectAltAz`), `lib/ephemeris.ts`, `lib/satellites.ts`, `lib/sky.ts`, `lib/time.ts`,
`lib/shareUrl.ts`, `lib/pointTexture.ts`, `store/useZenith.ts`, `hooks/useSky.ts`,
`lib/cinematic/theatre.ts` + `CinematicCamera.tsx` (within-sky reveal),
`data/bsc5.json`, `data/constellations.json`, all 21 tests.

## 6. What gets deleted / replaced

- `components/scene/SkyDome.tsx` (2D azimuthal renderer) → `SkyPlanetarium`.
- `components/scene/Globe.tsx` body (texture sphere) → `MapTilerGlobe` (Fresnel shader kept).
- `app/api/geocode` Nominatim path → MapTiler Geocoding (proxied).
- Inter-phase camera animation: Theatre.js for globe→sky → GSAP. (Theatre.js retained for
  within-sky reveal only.)

## 7. New runtime dependencies

| Dep | Why | Note |
|-----|-----|------|
| `gsap` | Master-prompt transition | ~50kb gz; free for hackathon use |
| `three-mesh-bvh` | Star raycast acceleration | MIT |
| MVT parser (`@maptiler/tile-utils` or `@mapbox/vector-tile` + `pbf`) | Parse building layer | Vet for R3F fit during impl |
| Draco decoder (bundled, not a dep) | Decode compressed GLBs | three.js ships; copy to /public/draco |

`@react-three/postprocessing` already installed — no bloom dep needed.

## 8. New scripts

- `scripts/prepare-models.mjs` — download NASA ISS/Hubble, license-check, convert to `.glb`
  if needed, Draco-encode → `/public/models/*.glb`. Reproducible.
- `scripts/build-star-data.mjs` — unchanged (already produces bsc5/constellations).

## 9. Environment

- `.env.local`: `MAPTILER_KEY` (server-side only, consumed by `/api/maptiler/*`).
- `.env.example`: documents `MAPTILER_KEY` (optional, with OSM-raster fallback).

## 10. Project management (three trackers, non-overlapping)

| Artifact | Role | Updated |
|----------|------|---------|
| This spec | Engineering source of truth (the reasoned design) | On architectural change |
| Implementation plan (writing-plans) | Granular build steps | As steps complete |
| `TRACKER.md` | Existing status + decisions log (unchanged voice) | Each session |
| `plan.md` | Master-prompt blueprint, `[ ]` checklist, 1:1 with impl plan phases | On scope change |
| `progress.md` | Master-prompt live tracker (Status / Just Done / Blockers / Next) | Every impl response |

plan.md/progress.md appear from the **first implementation response**, not during design.
The master-prompt "no comments / no explanations / lowest NLOC" rule is **declined** — the
existing codebase is JSDoc-heavy and the better for it; the brainstorming skill requires
reasoned design. This decline is recorded, not silent.

## 11. Open items deferred to implementation

- **Verify exact MapTiler tileset IDs *before* impl planning** — `/api/maptiler/*` routing
  depends on it. Resolve this as the first implementation step (or a pre-impl verification).
- Which MVT parser composes cleanest with R3F (tile-utils vs hand-rolled PBF).
- KTX2 compression of constellation art (deferred to P2 — art is light).
- Draco encode target quality vs file-size for ISS/Hubble.
