# Sky Visual Overhaul — Design Spec

**Date:** 2026-06-27
**Status:** Approved design (pending implementation)
**Reference:** `videosample2.mp4` (31s portrait, 386×850), frames analyzed via image inspection.

## Goal

Five visual upgrades to the sky-view experience, grounded in the reference video and the user's explicit asks:

1. Constellation art subtle + only when the reticle is centered on it
2. Stars as round, luminous points sized by magnitude (not chunky polygonal spheres)
3. ISS/Hubble as 3D objects when clicked (dot by default), with animated glowing trajectories
4. Richer sky background (deep-sky object sprites) without clashing with the clean aesthetic
5. Drag-up detail panel with curated facts, replacing the fixed mini-card

## Ground truth from the reference video

Frames were extracted and analyzed. Key observations that shape this design:

- **Stars:** round, glowing points with soft halos; brighter stars have larger cores + more pronounced halos; colors are white/yellow/amber (few blues). → confirms Section 2.
- **Constellation lines:** thin, muted blue (`#5b9bf6`-ish), semi-transparent (~0.3 opacity). → already matches current code; no change.
- **Satellite/ISS:** shown as a **small bright dot**, not a 3D model. → user explicitly wants the 3D model on click; dot-by-default is retained to match the video.
- **Trajectory:** a **faint, smooth, glowing cyan curved line** — continuous, NOT dashed, with a subtle glow. → the current gray dashed `IssOrbitTrack` must be replaced.
- **Background:** near-empty dark blue-black — no Milky Way band, no nebulae. → user wants it richer; we add DSOs but deliberately avoid a heavy photographic Milky Way texture.

## Section 1 — Constellation art: subtle + reticle-gated

**File:** `components/scene/ConstellationArt.tsx`

Reverse the prior over-tuning. Art should be subtle and appear only when the center reticle dot is on the constellation.

- `MAX_OPACITY`: `0.8` → **`0.35`**
- `SHOW` gate: tighten to reticle proximity — `Math.cos((12 * Math.PI) / 180)` (~12° half-angle). Art fades to target opacity only when its centroid is within ~12° of camera forward (the center dot).
- `LOAD` gate: keep wide enough to mount nearby art so it's ready to fade in quickly: `Math.cos((45 * Math.PI) / 180)` (~45°).
- Remove the `.slice(0, 2)` cap remains removed (all mounted art can render); the SHOW gate now does the visual filtering.

## Section 2 — Stars: round luminous points sized by magnitude

**File:** `components/scene/InstancedStars.tsx`

### Problem
Stars are `sphereGeometry(8,8)` instances — chunky polygonal dots, not luminous points. No hover feedback. Size ramp is flat.

### Solution
Keep `InstancedMesh` (required for BVH raycast picking — `THREE.Points` cannot be picked), but change the appearance:

- **Shape/texture:** Apply the existing `circlePointTexture()` radial-gradient sprite (from `lib/pointTexture.ts`) via an `InstancedBufferAttribute`-driven material, OR a custom `ShaderMaterial` that draws a soft round point with a bright core and Gaussian-ish falloff. The latter gives the "glowing point with soft halo" look the video shows. Decision during implementation: ShaderMaterial is preferred for the halo control; fall back to textured billboards if shader complexity bites.
- **Magnitude sizing:** `size = base * (4.5 - mag)^1.4`, clamped to `[min, max]`. Steeper ramp than the current `(6-mag)/3` so bright stars (Sirius mag −1.5) are visibly larger and fainter named stars (mag +3) stay small. This is the size gradient the video shows.
- **Hover glow:** on raycast hover, scale that instance up ~2.5× and boost its emissive/brightness; the existing Bloom postprocessing pass makes it bloom. On click, keep the existing pulse.
- **Color:** unchanged — `bvToRgb` gives correct white/yellow/amber/blue tints. The video confirms these are the right hues.

## Section 3 — Satellites & animated trajectories

**Files:** `components/scene/SkyPlanetarium.tsx`, new `lib/trajectory.ts`, new `components/scene/Trajectory.tsx`

### Satellite rendering (per video + user ask)
- **Default:** ISS/Hubble render as a small bright dot — matches the video.
- **On click:** swap the dot for the `SatModel` 3D object (GLB with `Suspense` + `GltfBoundary` fallback to procedural). The model spins gently (existing behavior).
- This satisfies both the video (dot) and the user's explicit request (object when pressed).

### Trajectory (per video: smooth glowing cyan, not dashed)
- **Generalize** the existing ISS orbit computation to any selected object via `lib/trajectory.ts`:
  - **Satellites:** reuse `propagateSatellite` over the next ~90 min (ISS already computed in `useSky.ts`; extend to the selected satellite).
  - **Planets / Sun / Moon:** sample `computeBody` at intervals over the next ~8 hours (planet motion on the dome is slow; 8h yields a clear arc). astronomy-engine's `computeBody` accepts any date, so this is straightforward.
- **Render:** replace the current always-on gray dashed `IssOrbitTrack` with a per-selected-object `Trajectory` component:
  - Smooth, **continuous** (not dashed) line, **glowing cyan** (`#5fdde6`-ish) with additive blending.
  - **Animated draw-in:** animate the line's `drawRange` from 0 → full over ~0.6s with an ease-out curve; subtle opacity fade accompanying the draw. Only the selected object's trajectory renders.
  - Self-occludes across the horizon (reuse the existing above-horizon segment-splitting logic from `IssOrbitTrack`).

## Section 4 — Background: deep-sky objects

**Files:** new `components/scene/DeepSkyObjects.tsx`, new `data/dso.json`, wire into `useSky.ts` projection + `SkyPlanetarium.tsx`.

- The video's background is near-empty dark blue-black. The user wants it richer. We add **real deep-sky objects at their true sky positions**, but deliberately **do NOT add a full Milky Way band texture** (the video lacks one and a photographic band can clash with the clean aesthetic).
- `data/dso.json`: ~20–30 named objects with `{ id, name, raDeg, decDeg, type, apparentSizeArcmin, fact }`. Examples: Andromeda Galaxy (M31), LMC, SMC, Orion Nebula (M42), Pleiades (M45), Hercules Cluster (M13), Beehive (M44), Ring Nebula (M57).
- Rendered as billboard sprites projected via the existing `altAzToVec3` path, sized by apparent angular size. Each is pickable and surfaces in the detail panel with its fact.
- **Textures are procedural** (canvas-drawn spiral-galaxy, elliptical-galaxy, nebula-glow, cluster sprites) — zero external asset dependencies, license-free.

## Section 5 — Drag-up detail panel + facts

**Files:** new `components/ui/DetailPanel.tsx`, new `data/facts.ts`, edit `app/page.tsx`, extend `FocusInfo` type.

- Convert the fixed mini-card at `app/page.tsx:211` into a two-state `DetailPanel`:
  - **Collapsed (default):** current small card — name, subtitle, blurb.
  - **Expanded:** drag up (pointer down + move up) or click a chevron handle → GSAP spring animation into a larger panel: bigger title, curated **fact**, data table (mag, distance, type, altitude/azimuth), and the object's trajectory renders in the sky.
- `data/facts.ts`: curated fact per object (keyed by id/name). Stars, planets, Sun/Moon, ISS, Hubble all get facts. Fallback: a generated sentence from existing data fields if no curated fact.
- Panel is pointer-events-auto when expanded; collapses on drag-down or Escape.

## Build order

1. **Section 1** (art tuning) — trivial, immediate visual win.
2. **Section 2** (stars) — self-contained rewrite, high impact.
3. **Section 3** (sat models + trajectories) — medium; trajectories are new but reuse existing compute.
4. **Section 4** (DSOs) — data + new component; procedural textures.
5. **Section 5** (detail panel + facts) — UI work; integrates everything above.

## Risks / decisions

- **Procedural textures only** for DSOs (and no Milky Way band) — avoids licensing/fetch issues, keeps the app self-contained.
- **ShaderMaterial vs textured billboards** for stars — decide during Section 2 implementation based on halo quality vs complexity. ShaderMaterial preferred.
- **Trajectory computation cost** — planet arcs sample `computeBody` ~16 times over 8h on selection; negligible (astronomy-engine is fast, runs on idle). Satellites reuse existing propagation.
