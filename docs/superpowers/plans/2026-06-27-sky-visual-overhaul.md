# Sky Visual Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the sky view to match the reference video and the user's asks — subtle reticle-gated constellation art, round luminous magnitude-sized stars, ISS/Hubble as 3D objects on click with animated glowing trajectories, deep-sky object sprites for background richness, and a drag-up detail panel with curated facts.

**Architecture:** Five layers, each a separate task. Pure logic (magnitude→size, trajectory sampling, fact lookup) is extracted into `lib/` and tested with vitest. Rendering (three.js) consumes those functions. Data (DSOs, facts) lives in `data/`. The detail panel replaces the fixed mini-card.

**Tech Stack:** Next.js 16, React 19, three.js 0.184, @react-three/fiber 9, @react-three/drei 10, gsap 3, vitest 4, astronomy-engine, satellite.js. Build is `next build --webpack`.

**Reference video ground truth** (`videosample2.mp4`, analyzed): round glowing star points with halos sized by brightness; thin muted-blue constellation lines; satellite shown as a dot; trajectory is a smooth glowing **cyan continuous** line (not dashed); near-empty dark blue-black background.

---

## File Structure

**Pure logic (tested):**
- `lib/starSize.ts` — magnitude → scale + brightness.
- `lib/trajectory.ts` — object id + observer + date → alt/az waypoints.
- `data/dso.json` — deep-sky objects at real RA/Dec.
- `data/facts.ts` — curated facts keyed by object id/name.

**Rendering:**
- `components/scene/ConstellationArt.tsx` (modify) — reticle-gated subtle art.
- `components/scene/InstancedStars.tsx` (modify) — round luminous points.
- `lib/starSpriteTexture.ts` (create) — procedural star glow sprite.
- `components/scene/Trajectory.tsx` (create) — animated glowing cyan line.
- `components/scene/DeepSkyObjects.tsx` (create) — DSO billboard sprites.
- `lib/dsoTexture.ts` (create) — procedural galaxy/nebula textures.
- `components/scene/SkyPlanetarium.tsx` (modify) — wire everything.

**UI/state:**
- `components/ui/DetailPanel.tsx` (create) — drag-up panel.
- `app/page.tsx` (modify) — replace mini-card.
- `hooks/useSky.ts` (modify) — project DSOs.

---

## Task 1: Constellation art — subtle + reticle-gated

**Files:** Modify `components/scene/ConstellationArt.tsx` lines 10-16.

- [ ] **Step 1: Update art gates + opacity**

Replace:
```ts
const DOME_R = 5;
const SEG = 14;
// Widened gates so the dome feels populated with art as you pan:
// LOAD decides which meshes mount, SHOW decides the per-frame fade target.
const LOAD = Math.cos((70 * Math.PI) / 180);
const SHOW = Math.cos((55 * Math.PI) / 180);
const MAX_OPACITY = 0.8;
```
with:
```ts
const DOME_R = 5;
const SEG = 14;
// Subtle art that appears only when the center reticle is on the constellation.
// LOAD = cone of mounted art (45°); SHOW = reticle proximity gate (12°).
const LOAD = Math.cos((45 * Math.PI) / 180);
const SHOW = Math.cos((12 * Math.PI) / 180);
const MAX_OPACITY = 0.35;
```

- [ ] **Step 2: Build + commit**

```bash
npm run build
git add components/scene/ConstellationArt.tsx
git commit -m "feat: subtle reticle-gated constellation art (opacity 0.35, 12° gate)"
```

---

## Task 2: Star magnitude→size logic (TDD)

**Files:** Create `lib/starSize.ts`, `lib/starSize.test.ts`.

- [ ] **Step 1: Write the failing test**

Create `lib/starSize.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { starScale, starBrightness } from './starSize';

describe('starScale — magnitude to instance scale', () => {
  it('makes brighter stars (lower mag) larger', () => {
    expect(starScale(-1.5)).toBeGreaterThan(starScale(4.0));
  });
  it('never returns zero or negative', () => {
    expect(starScale(6.5)).toBeGreaterThan(0);
  });
  it('is monotonic increasing as magnitude decreases', () => {
    expect(starScale(0.0)).toBeGreaterThan(starScale(2.0));
  });
});

describe('starBrightness — magnitude to core multiplier', () => {
  it('brighter stars are more luminous', () => {
    expect(starBrightness(-1.5)).toBeGreaterThan(starBrightness(3.0));
  });
  it('stays in a sane range', () => {
    expect(starBrightness(-10)).toBeLessThanOrEqual(1.5);
    expect(starBrightness(7)).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL** (module not found)

Run: `npm test -- starSize`

- [ ] **Step 3: Write implementation**

Create `lib/starSize.ts`:
```ts
// lib/starSize.ts — magnitude → render scale + core brightness.
// Power-law ramp so bright stars (Sirius mag -1.5) are visibly larger than faint
// named stars (mag +3), matching the reference video's size gradient.

const BASE = 0.022;
const MIN_SCALE = 0.5;
const MAX_SCALE = 3.2;

/** Apparent visual magnitude → instance scale. Lower mag (brighter) → larger. */
export function starScale(mag: number): number {
  const raw = Math.pow(Math.max(0.1, 4.5 - mag), 1.4) * BASE;
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, raw));
}

/** Apparent visual magnitude → core brightness multiplier (drives glow center). */
export function starBrightness(mag: number): number {
  const b = Math.pow(0.6, Math.max(0, mag) / 1.5);
  return Math.min(1.5, Math.max(0.1, b));
}
```

- [ ] **Step 4: Run test — expect PASS**

Run: `npm test -- starSize`

- [ ] **Step 5: Commit**

```bash
git add lib/starSize.ts lib/starSize.test.ts
git commit -m "feat: magnitude→size/brightness ramps for luminous stars"
```

---

## Task 3: Round luminous star rendering

**Files:** Create `lib/starSpriteTexture.ts`; rewrite `components/scene/InstancedStars.tsx`.

- [ ] **Step 1: Create the star glow texture**

Create `lib/starSpriteTexture.ts`:
```ts
import * as THREE from 'three';

let cached: THREE.Texture | null = null;

/**
 * Procedural soft-round star sprite: bright white core + Gaussian-ish halo
 * falloff to transparent. The instanced star texture. Cached. Client-only.
 */
export function starSpriteTexture(): THREE.Texture {
  if (cached) return cached;
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const half = size / 2;

  const halo = ctx.createRadialGradient(half, half, 0, half, half, half);
  halo.addColorStop(0, 'rgba(255,255,255,1)');
  halo.addColorStop(0.12, 'rgba(255,255,255,0.95)');
  halo.addColorStop(0.28, 'rgba(255,255,255,0.45)');
  halo.addColorStop(0.55, 'rgba(255,255,255,0.12)');
  halo.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  tex.colorSpace = THREE.SRGBColorSpace;
  cached = tex;
  return tex;
}
```

- [ ] **Step 2: Rewrite InstancedStars**

Replace the entire contents of `components/scene/InstancedStars.tsx` with:
```tsx
'use client';

import { useMemo, useRef, useEffect } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';
import { altAzToVec3 } from '@/lib/dome';
import { bvToRgb } from '@/lib/starColor';
import { starScale, starBrightness } from '@/lib/starSize';
import { starSpriteTexture } from '@/lib/starSpriteTexture';
import type { CelestialObject } from '@/types';

// BVH prototype patch for per-instance raycast picking.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const patchBVH = () => {
  (THREE.BufferGeometry.prototype as any).computeBoundsTree = computeBoundsTree;
  (THREE.BufferGeometry.prototype as any).disposeBoundsTree = disposeBoundsTree;
  THREE.Mesh.prototype.raycast = acceleratedRaycast;
};
patchBVH();

const DOME_R = 5;
const _matrix = new THREE.Matrix4();
const _color = new THREE.Color();

/**
 * Above-horizon stars as one InstancedMesh of round, soft-glowing sprites
 * (bright core + halo), sized by magnitude. BVH gives O(log n) raycast picking.
 */
export function InstancedStars({
  stars,
  visible,
  selectionId,
  onSelect,
}: {
  stars: CelestialObject[];
  visible: boolean;
  selectionId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const hoveredRef = useRef<number | null>(null);
  const lastHoveredRef = useRef<number | null>(null);

  const visibleStars = useMemo(() => stars, [stars]);
  const count = visibleStars.length;
  const tex = useMemo(() => starSpriteTexture(), []);

  // Base (per-instance) scale + brightness, so hover/selection can be restored.
  const baseScales = useRef<Float32Array>(new Float32Array(0));
  const baseBright = useRef<Float32Array>(new Float32Array(0));

  const applyInstance = (i: number, scaleMul = 1, brightMul = 1) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const s = visibleStars[i];
    const [x, y, z] = altAzToVec3(s.altDeg, s.azDeg, DOME_R);
    const sc = baseScales.current[i] * scaleMul;
    _matrix.makeScale(sc, sc, sc).setPosition(x, y, z);
    mesh.setMatrixAt(i, _matrix);
    const [r, g, b] = bvToRgb(s.bv);
    const br = baseBright.current[i] * brightMul;
    _color.setRGB(r * br, g * br, b * br);
    mesh.setColorAt(i, _color);
  };

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    baseScales.current = new Float32Array(count);
    baseBright.current = new Float32Array(count);
    visibleStars.forEach((s, i) => {
      const mag = s.magnitude ?? 6;
      baseScales.current[i] = starScale(mag);
      baseBright.current[i] = starBrightness(mag);
      applyInstance(i);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
    mesh.geometry.computeBoundsTree();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleStars, count]);

  // Hover glow + selected pulse.
  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    // Restore the previously-hovered instance to base when hover moves off.
    if (lastHoveredRef.current !== hoveredRef.current) {
      const prev = lastHoveredRef.current;
      if (prev != null && prev >= 0 && prev < count && visibleStars[prev]?.id !== selectionId) {
        applyInstance(prev);
      }
      lastHoveredRef.current = hoveredRef.current;
    }

    // Selected star pulses.
    if (selectionId) {
      const idx = visibleStars.findIndex((s) => s.id === selectionId);
      if (idx >= 0) {
        const pulse = 1 + Math.sin(Date.now() / 200) * 0.15;
        applyInstance(idx, 2.5 * pulse, 1.4);
        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      }
    }

    // Hovered star enlarges + brightens.
    const h = hoveredRef.current;
    if (h != null && h >= 0 && h < count && visibleStars[h]?.id !== selectionId) {
      applyInstance(h, 2.5, 1.5);
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const id = e.instanceId != null ? (visibleStars[e.instanceId]?.id ?? null) : null;
    onSelect(id === selectionId ? null : id);
  };

  if (!visible) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, count]}
      onPointerMove={(e) => { e.stopPropagation(); hoveredRef.current = e.instanceId ?? null; }}
      onPointerOut={() => { hoveredRef.current = null; }}
      onClick={handleClick}
      frustumCulled={false}
    >
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={tex}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
}
```

> Note: `planeGeometry` instances are camera-facing only when oriented; at dome radius 5 with the camera near origin, the flat planes read as round points because the glow texture is radially symmetric and additive-blended. If stars look edge-on after build, switch `<planeGeometry>` to a `<Billboard>` wrapper per-instance is not feasible for InstancedMesh — instead rotate each instance to face origin in `applyInstance` (add a `.lookAt(0,0,0)` before `setPosition`). Implement that fallback only if the build/screenshot shows edge-on planes.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: compiles. Fix any TS errors.

- [ ] **Step 4: Commit**

```bash
git add components/scene/InstancedStars.tsx lib/starSpriteTexture.ts
git commit -m "feat: round luminous stars sized by magnitude with hover/selection glow"
```

---

## Task 4: Trajectory logic (TDD)

**Files:** Create `lib/trajectory.ts`, `lib/trajectory.test.ts`.

- [ ] **Step 1: Write the failing test**

Create `lib/trajectory.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { bodyTrajectory, satTrajectory } from './trajectory';
import type { ObserverLocation, SatelliteTLE } from '@/types';

const obs: ObserverLocation = { latDeg: 40, lonDeg: -74, elevationM: 0, source: 'search' };
const date = new Date('2026-06-27T22:00:00Z');

describe('bodyTrajectory', () => {
  it('returns waypoints for the Sun', () => {
    const pts = bodyTrajectory('sun', obs, date);
    expect(pts.length).toBeGreaterThanOrEqual(8);
    for (const p of pts) {
      expect(p.altDeg).toBeGreaterThanOrEqual(-90);
      expect(p.altDeg).toBeLessThanOrEqual(90);
      expect(p.azDeg).toBeGreaterThanOrEqual(0);
      expect(p.azDeg).toBeLessThan(360);
    }
  });
  it('returns waypoints for a planet', () => {
    expect(bodyTrajectory('planet:mars', obs, date).length).toBeGreaterThanOrEqual(8);
  });
  it('returns [] for an unknown body id', () => {
    expect(bodyTrajectory('planet:pluto', obs, date)).toEqual([]);
  });
});

describe('satTrajectory', () => {
  const tle: SatelliteTLE = {
    noradId: 25544,
    name: 'ISS (ZARYA)',
    line1: '1 25544U 98067A   26178.50000000  .00012345  00000-0  22345-3 0  9991',
    line2: '2 25544  51.6400 100.0000 0001234  90.0000 270.0000 15.50000000123456',
    epochMs: date.getTime(),
    group: 'stations',
  };
  it('returns waypoints for a valid TLE', () => {
    const pts = satTrajectory(tle, obs, date);
    expect(pts.length).toBeGreaterThanOrEqual(8);
    for (const p of pts) {
      expect(p.altDeg).toBeGreaterThanOrEqual(-90);
      expect(p.altDeg).toBeLessThanOrEqual(90);
    }
  });
});
```

- [ ] **Step 2: Run test — expect FAIL** (module not found)

Run: `npm test -- trajectory`

- [ ] **Step 3: Write implementation**

Create `lib/trajectory.ts`:
```ts
// lib/trajectory.ts — future-path waypoints for a celestial body or satellite,
// as seen from the observer's dome.

import { BODY_DEFS, computeBody } from './ephemeris';
import { propagateSatellite } from './satellites';
import type { ObserverLocation, SatelliteTLE } from '@/types';

export interface TrajectoryPoint {
  altDeg: number;
  azDeg: number;
  minsFromNow: number;
}

const BODY_STEPS = 16;
const BODY_HORIZON_HOURS = 8;
const SAT_STEPS = 45;
const SAT_STEP_MS = 2 * 60 * 1000; // 2-min steps → ~90 min (one orbit)

/** Future arc of a planet/Sun/Moon over ~8h. [] if the body id is unknown. */
export function bodyTrajectory(
  bodyId: string,
  observer: ObserverLocation,
  date: Date,
): TrajectoryPoint[] {
  const def = BODY_DEFS.find((d) => d.id === bodyId);
  if (!def) return [];
  const pts: TrajectoryPoint[] = [];
  const stepMs = (BODY_HORIZON_HOURS * 3_600_000) / BODY_STEPS;
  for (let i = 0; i <= BODY_STEPS; i++) {
    const d = new Date(date.getTime() + i * stepMs);
    const b = computeBody(def, observer, d);
    pts.push({ altDeg: b.altDeg, azDeg: b.azDeg, minsFromNow: (i * stepMs) / 60_000 });
  }
  return pts;
}

/** Future orbit path of a satellite over ~90 min. [] if SGP4 fails. */
export function satTrajectory(
  tle: SatelliteTLE,
  observer: ObserverLocation,
  date: Date,
): TrajectoryPoint[] {
  const pts: TrajectoryPoint[] = [];
  for (let i = 0; i <= SAT_STEPS; i++) {
    const d = new Date(date.getTime() + i * SAT_STEP_MS);
    const s = propagateSatellite(tle, observer, d);
    if (s) pts.push({ altDeg: s.elevationDeg, azDeg: s.azDeg, minsFromNow: (i * SAT_STEP_MS) / 60_000 });
  }
  return pts;
}
```

- [ ] **Step 4: Run test — expect PASS**

Run: `npm test -- trajectory`

- [ ] **Step 5: Commit**

```bash
git add lib/trajectory.ts lib/trajectory.test.ts
git commit -m "feat: trajectory sampling for planets and satellites"
```

---

## Task 5: Animated glowing Trajectory component

**Files:** Create `components/scene/Trajectory.tsx`.

- [ ] **Step 1: Create the Trajectory component**

Create `components/scene/Trajectory.tsx`:
```tsx
'use client';

import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { altAzToVec3 } from '@/lib/dome';
import type { TrajectoryPoint } from '@/lib/trajectory';

const DOME_R = 5;
const COLOR = '#5fdde6'; // glowing cyan, per reference video

/**
 * Animated, glowing cyan trajectory line that draws itself in over ~0.6s.
 * Splits at the horizon so only above-horizon arcs render. Only the selected
 * object's trajectory is mounted.
 */
export function Trajectory({ points }: { points: TrajectoryPoint[] }) {
  const linesRef = useRef<any>(null);
  const startRef = useRef<number>(0);

  // Split into above-horizon segments.
  const segments = useMemo(() => {
    const segs: THREE.Vector3[][] = [];
    let current: THREE.Vector3[] = [];
    for (const p of points) {
      if (p.altDeg > 0) current.push(new THREE.Vector3(...altAzToVec3(p.altDeg, p.azDeg, DOME_R)));
      else if (current.length >= 2) { segs.push(current); current = []; }
      else current = [];
    }
    if (current.length >= 2) segs.push(current);
    return segs;
  }, [points]);

  // Per-segment drawn-point counts, animated from 0 → full.
  const counts = useRef<number[]>(segments.map(() => 0));
  useEffect(() => {
    counts.current = segments.map(() => 0);
    startRef.current = performance.now();
  }, [segments]);

  useFrame(() => {
    const elapsed = (performance.now() - startRef.current) / 1000;
    const t = Math.min(1, elapsed / 0.6); // 0.6s draw
    const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
    counts.current = segments.map((seg) => Math.max(2, Math.round(eased * seg.length)));
  });

  if (segments.length === 0) return null;

  return (
    <group>
      {segments.map((seg, i) => (
        <Line
          key={i}
          ref={(el) => { if (el) (linesRef.current ??= {})[i] = el; }}
          points={seg.slice(0, counts.current[i] || 2)}
          color={COLOR}
          lineWidth={1.6}
          transparent
          opacity={0.85}
        />
      ))}
    </group>
  );
}
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: compiles.

- [ ] **Step 3: Commit**

```bash
git add components/scene/Trajectory.tsx
git commit -m "feat: animated glowing cyan trajectory line"
```

---

## Task 6: Deep-sky objects data + sprites

**Files:** Create `data/dso.json`, `lib/dsoTexture.ts`, `components/scene/DeepSkyObjects.tsx`; modify `hooks/useSky.ts`.

- [ ] **Step 1: Create the DSO dataset**

Create `data/dso.json`:
```json
[
  { "id": "M31",  "name": "Andromeda Galaxy",   "type": "spiral",   "raDeg": 10.6847,  "decDeg": 41.2691, "sizeArcmin": 190, "fact": "The Andromeda Galaxy is the closest large galaxy to the Milky Way and on a collision course with us — the two will merge in ~4.5 billion years." },
  { "id": "LMC",  "name": "Large Magellanic Cloud", "type": "irregular", "raDeg": 80.8942, "decDeg": -69.7561, "sizeArcmin": 645, "fact": "A satellite galaxy of the Milky Way, visible to the naked eye in the southern sky. Host to the 1987A supernova." },
  { "id": "SMC",  "name": "Small Magellanic Cloud", "type": "irregular", "raDeg": 13.1583, "decDeg": -72.8003, "sizeArcmin": 320, "fact": "The smaller companion of the LMC; together they were used by mariners as a crude clock and compass." },
  { "id": "M42",  "name": "Orion Nebula",       "type": "nebula",   "raDeg": 83.8221,  "decDeg": -5.3911, "sizeArcmin": 85, "fact": "The Orion Nebula is a stellar nursery ~1,344 ly away — one of the few where newborn stars can be seen forming." },
  { "id": "M45",  "name": "Pleiades",           "type": "cluster",  "raDeg": 56.7500,  "decDeg": 24.1167, "sizeArcmin": 110, "fact": "The Pleiades (Seven Sisters) is an open cluster of hot blue stars wrapped in reflection nebulosity — actually hundreds of stars, not seven." },
  { "id": "M44",  "name": "Beehive Cluster",    "type": "cluster",  "raDeg": 130.0250, "decDeg": 19.6700, "sizeArcmin": 95, "fact": "The Beehive (Praesepe) is one of the nearest open clusters to Earth, ~577 ly away, known since antiquity." },
  { "id": "M13",  "name": "Hercules Cluster",   "type": "globular", "raDeg": 250.4235, "decDeg": 36.4603, "sizeArcmin": 20, "fact": "A globular cluster of several hundred thousand stars, ~22,000 ly away, packed into a ball 150 ly across." },
  { "id": "M57",  "name": "Ring Nebula",        "type": "nebula",   "raDeg": 283.3962, "decDeg": 33.0292, "sizeArcmin": 1.4, "fact": "The Ring Nebula is the dying shell of a Sun-like star; its central white dwarf is visible at the centre." },
  { "id": "M81",  "name": "Bode's Galaxy",      "type": "spiral",   "raDeg": 148.8883, "decDeg": 69.0653, "sizeArcmin": 26, "fact": "A grand-design spiral galaxy ~12 million ly away, interacting with its neighbour M82." },
  { "id": "M51",  "name": "Whirlpool Galaxy",   "type": "spiral",   "raDeg": 202.4696, "decDeg": 47.1953, "sizeArcmin": 11, "fact": "The Whirlpool is a face-on spiral whose sweeping arms were the first evidence that galaxies rotate." },
  { "id": "M22",  "name": "Sagittarius Cluster","type": "globular", "raDeg": 279.0996, "decDeg": -23.9049, "sizeArcmin": 32, "fact": "One of the brightest globular clusters, visible to the naked eye near the galactic centre." },
  { "id": "NGC869","name": "Double Cluster",    "type": "cluster",  "raDeg": 34.7425,  "decDeg": 57.1490, "sizeArcmin": 29, "fact": "A pair of neighbouring open clusters in Perseus, a stunning binocular target." }
]
```

- [ ] **Step 2: Create procedural DSO textures**

Create `lib/dsoTexture.ts`:
```ts
import * as THREE from 'three';

const cache = new Map<string, THREE.Texture>();

/**
 * Procedural canvas texture for a deep-sky object by type: spiral/elliptical
 * galaxy, nebula glow, or star cluster. License-free, no external assets.
 */
export function dsoTexture(type: string): THREE.Texture {
  if (cache.has(type)) return cache.get(type)!;
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const c = size / 2;
  ctx.clearRect(0, 0, size, size);

  const blob = (color: string, rMax: number, alpha = 0.6) => {
    const g = ctx.createRadialGradient(c, c, 0, c, c, rMax);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = alpha;
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    ctx.globalAlpha = 1;
  };

  switch (type) {
    case 'spiral': {
      blob('rgba(220,225,255,0.9)', c * 0.95, 0.5);
      // faint arms
      ctx.save();
      ctx.translate(c, c);
      for (let a = 0; a < 4; a++) {
        ctx.rotate((Math.PI / 2));
        ctx.strokeStyle = 'rgba(180,200,255,0.18)';
        ctx.lineWidth = 10;
        ctx.beginPath();
        for (let r = 6; r < c * 0.9; r += 2) {
          const ang = r * 0.05;
          ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
        }
        ctx.stroke();
      }
      ctx.restore();
      break;
    }
    case 'globular':
      blob('rgba(255,245,220,0.95)', c * 0.5, 0.8);
      // sprinkle stars
      for (let i = 0; i < 180; i++) {
        const r = Math.random() * c * 0.85;
        const th = Math.random() * Math.PI * 2;
        ctx.fillStyle = `rgba(255,250,235,${Math.random() * 0.7})`;
        ctx.fillRect(c + Math.cos(th) * r, c + Math.sin(th) * r, 1.5, 1.5);
      }
      break;
    case 'cluster':
      for (let i = 0; i < 90; i++) {
        const r = Math.random() * c * 0.85;
        const th = Math.random() * Math.PI * 2;
        const a = 0.4 + Math.random() * 0.6;
        const g = ctx.createRadialGradient(c + Math.cos(th) * r, c + Math.sin(th) * r, 0, c + Math.cos(th) * r, c + Math.sin(th) * r, 6);
        g.addColorStop(0, `rgba(220,230,255,${a})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, size, size);
      }
      break;
    case 'nebula': {
      blob('rgba(255,120,150,0.5)', c * 0.9, 0.55);
      blob('rgba(120,180,255,0.45)', c * 0.7, 0.5);
      blob('rgba(255,240,200,0.6)', c * 0.35, 0.7);
      break;
    }
    default: // elliptical
      blob('rgba(255,240,220,0.9)', c * 0.7, 0.7);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  tex.colorSpace = THREE.SRGBColorSpace;
  cache.set(type, tex);
  return tex;
}
```

- [ ] **Step 3: Create the DeepSkyObjects component**

Create `components/scene/DeepSkyObjects.tsx`:
```tsx
'use client';

import { useMemo } from 'react';
import { Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { altAzToVec3 } from '@/lib/dome';
import { raDecToAltAz } from '@/lib/ephemeris';
import { dsoTexture } from '@/lib/dsoTexture';
import type { ObserverLocation } from '@/types';

const DOME_R = 5;

export interface DsoData {
  id: string;
  name: string;
  type: string;
  raDeg: number;
  decDeg: number;
  sizeArcmin: number;
  fact: string;
}

export interface ProjectedDso {
  id: string;
  name: string;
  type: string;
  fact: string;
  altDeg: number;
  azDeg: number;
  scale: number;
}

/**
 * Deep-sky object sprites (galaxies, nebulae, clusters) projected onto the dome.
 * Each is a billboard sprite sized by apparent angular size, additive-blended.
 */
export function DeepSkyObjects({
  dsos,
  observer,
  dateMs,
}: {
  dsos: DsoData[];
  observer: ObserverLocation;
  dateMs: number;
}) {
  const projected = useMemo(() => {
    const date = new Date(dateMs);
    return dsos
      .map((d) => {
        const { altDeg, azDeg } = raDecToAltAz(d.raDeg, d.decDeg, observer, date);
        // Render scale: apparent size → dome size. Large objects (LMC ~645')
        // are capped so they don't cover the sky; small ones (Ring ~1.4') floor.
        const scale = Math.min(1.6, Math.max(0.18, Math.sqrt(d.sizeArcmin) * 0.05));
        return { ...d, altDeg, azDeg, scale };
      })
      .filter((d) => d.altDeg > 0); // only above horizon
  }, [dsos, observer, dateMs]);

  return (
    <group>
      {projected.map((d) => (
        <Billboard key={d.id} position={altAzToVec3(d.altDeg, d.azDeg, DOME_R)}>
          <mesh scale={d.scale}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial
              map={dsoTexture(d.type)}
              transparent
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
              side={THREE.DoubleSide}
              opacity={0.85}
            />
          </mesh>
        </Billboard>
      ))}
    </group>
  );
}
```

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: compiles. Fix any TS errors.

- [ ] **Step 5: Commit**

```bash
git add data/dso.json lib/dsoTexture.ts components/scene/DeepSkyObjects.tsx
git commit -m "feat: deep-sky object sprites (galaxies, nebulae, clusters)"
```

---

## Task 7: Wire satellites-as-objects, trajectories, DSOs into SkyPlanetarium

**Files:** Modify `components/scene/SkyPlanetarium.tsx`, `hooks/useSky.ts`.

This is the integration task — most issues surface here, so the build step is the gate.

- [ ] **Step 1: Expose `tleById` + `DSOS` from useSky**

In `hooks/useSky.ts`:

1. Add imports near the top (after the existing `data/*` imports):
```ts
import dsoData from '@/data/dso.json';
import type { DsoData } from '@/components/scene/DeepSkyObjects';
```

2. After `const ART = constellationArtData as ArtSource[];` add:
```ts
export const DSOS = dsoData as DsoData[];
```

3. Add `tleById` to the `SkyData` interface (after `art: ProjectedArt[];`):
```ts
  tleById: Map<number, SatelliteTLE>;
```

4. Add to the `EMPTY` object:
```ts
  tleById: new Map(),
```

5. In **both** `setData((prev) => ({ ...prev, ... }))` calls (the stars recompute one and the main `recompute` one), add:
```ts
        tleById: new Map(tlesRef.current.map((t) => [t.noradId, t])),
```

- [ ] **Step 2: Add imports + trajectory computation in SkyPlanetarium**

In `components/scene/SkyPlanetarium.tsx`, add these imports at the top (after the existing scene imports):
```ts
import { Trajectory } from './Trajectory';
import { DeepSkyObjects } from './DeepSkyObjects';
import { bodyTrajectory, satTrajectory, type TrajectoryPoint } from '@/lib/trajectory';
import { DSOS } from '@/hooks/useSky';
import { effectiveEpochMs } from '@/lib/time';
import { useZenith } from '@/store/useZenith';
```

Inside the `SkyPlanetarium` component, before the `return (`, add observer/time lookup + trajectory memo:
```tsx
  const observer = useZenith((s) => s.observer);
  const dateMs = effectiveEpochMs(useZenith((s) => s.time));
  const trajectoryPts = useMemo<TrajectoryPoint[]>(() => {
    if (!selectionId || !observer) return [];
    if (selectionId.startsWith('sat:')) {
      const norad = Number(selectionId.slice(4));
      const tle = data.tleById.get(norad);
      return tle ? satTrajectory(tle, observer, new Date(dateMs)) : [];
    }
    if (selectionId.startsWith('planet:') || selectionId === 'sun' || selectionId === 'moon') {
      return bodyTrajectory(selectionId, observer, new Date(dateMs));
    }
    return [];
  }, [selectionId, observer, dateMs, data.tleById]);
```

- [ ] **Step 3: Simplify the satellite block to dot-default + model-on-click**

Replace the existing satellite rendering block (`{layers.satellites && sats.map(...)}`) with:
```tsx
      {layers.satellites &&
        sats.map((s) => {
          const isISS = s.name.includes('ISS');
          const glbUrl = isISS ? '/models/iss.glb' : '/models/hubble.glb';
          const id = satId(s.noradId);
          const selected = selectionId === id;
          return (
            <group key={id} position={altAzToVec3(s.elevationDeg, s.azDeg, DOME_R)}>
              {selected ? (
                <SatModel iss={isISS} glbUrl={glbUrl} onClick={(e) => { e.stopPropagation(); onSelect(null); }} />
              ) : (
                <Billboard>
                  <mesh onClick={(e) => { e.stopPropagation(); onSelect(id); }}>
                    <circleGeometry args={[0.07, 18]} />
                    <meshBasicMaterial color="#cfd6e0" />
                  </mesh>
                </Billboard>
              )}
            </group>
          );
        })}
```

- [ ] **Step 4: Mount DSOs + trajectory in JSX**

Inside the returned `<group>`, after the satellite block, add:
```tsx
      {layers.stars && observer && (
        <DeepSkyObjects dsos={DSOS} observer={observer} dateMs={dateMs} />
      )}
      {trajectoryPts.length > 0 && <Trajectory points={trajectoryPts} />}
```

- [ ] **Step 5: Build + fix errors**

Run: `npm run build`
Expected: compiles. Fix any TS/import errors that surface.

- [ ] **Step 6: Commit**

```bash
git add components/scene/SkyPlanetarium.tsx hooks/useSky.ts
git commit -m "feat: satellites-as-objects on click, animated trajectories, deep-sky objects"
```

---

## Task 8: Facts data

**Files:** Create `data/facts.ts`.

- [ ] **Step 1: Create the facts module**

Create `data/facts.ts`:
```ts
// data/facts.ts — curated interesting facts keyed by object id/name.
// Falls back to undefined; the panel generates a generic line when absent.

export const FACTS: Record<string, string> = {
  // Sun & Moon
  sun: 'The Sun accounts for 99.86% of all the mass in the Solar System — you could fit 1.3 million Earths inside it.',
  moon: 'The Moon is slowly drifting away from Earth at about 3.8 cm per year; in ~600 million years total solar eclipses will be impossible.',
  // Planets
  'planet:mercury': 'Mercury\'s day (176 Earth days) is longer than its year (88 Earth days) — and despite being closest to the Sun, it is not the hottest planet.',
  'planet:venus': 'Venus spins backwards and so slowly that a single day-night cycle lasts 117 Earth days. Its surface is hot enough to melt lead.',
  'planet:mars': 'Mars hosts Olympus Mons, the tallest volcano in the Solar System — nearly three times the height of Everest.',
  'planet:jupiter': 'Jupiter\'s Great Red Spot is a storm wider than Earth that has been raging for at least 350 years.',
  'planet:saturn': 'Saturn is so low-density that it would float in water — if you could find a bathtub big enough.',
  'planet:uranus': 'Uranus rotates on its side, tipped 98°, likely after a colossal ancient collision.',
  'planet:neptune': 'Neptune has the fastest winds in the Solar System, reaching 2,100 km/h — supersonic on Earth.',
  // Satellites
  'sat:25544': 'The ISS orbits Earth at ~28,000 km/h, circling the planet every 90 minutes — its crew sees 16 sunrises a day.',
  'sat:20580': 'The Hubble Space Telescope has made over 1.5 million observations since 1990; its images reach back to within 500 million years of the Big Bang.',
  // Bright stars
  'star:HR323': 'Sirius is a binary star; its faint companion Sirius B was the first white dwarf ever discovered, in 1844.',
};
```

- [ ] **Step 2: Commit**

```bash
git add data/facts.ts
git commit -m "feat: curated celestial facts"
```

> NOTE: verify the star HR ids against `data/bsc5.json` for the famous stars (Sirius = HR 323? confirm in Step 1). If the id differs, correct before committing. The fact for `sat:20580` assumes Hubble's NORAD id; confirm at runtime.

---

## Task 9: Drag-up DetailPanel

**Files:** Create `components/ui/DetailPanel.tsx`; modify `app/page.tsx`.

- [ ] **Step 1: Create the DetailPanel**

Create `components/ui/DetailPanel.tsx`:
```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import type { FocusInfo } from '@/components/scene/SkyPlanetarium';
import { FACTS } from '@/data/facts';

/**
 * Two-state info panel: collapsed mini-card by default, drag-up (or chevron)
 * expands it into a larger panel with the curated fact + data table.
 */
export function DetailPanel({ info }: { info: FocusInfo | null }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const dragStartY = useRef<number | null>(null);

  // Reset to collapsed when the focused object changes.
  useEffect(() => {
    setExpanded(false);
  }, [info?.id]);

  // Animate expand/collapse.
  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    gsap.to(el, {
      height: expanded ? 'auto' : 'auto',
      opacity: 1,
      duration: 0.4,
      ease: 'power3.out',
    });
  }, [expanded]);

  if (!info) return null;

  const fact = info.id ? FACTS[info.id] : undefined;

  const onPointerDown = (e: React.PointerEvent) => {
    dragStartY.current = e.clientY;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (dragStartY.current == null) return;
    const dy = dragStartY.current - e.clientY; // up = positive
    if (dy > 40 && !expanded) setExpanded(true);
    if (dy < -40 && expanded) setExpanded(false);
  };
  const onPointerUp = () => { dragStartY.current = null; };

  return (
    <div
      ref={panelRef}
      className="pointer-events-auto absolute bottom-10 left-6 z-30 max-w-[min(90vw,440px)] overflow-hidden border border-[var(--border-visible)] bg-[var(--surface)]/95 backdrop-blur-sm sm:left-8"
      style={{ borderRadius: 4 }}
    >
      {/* Drag handle / chevron */}
      <div
        className="flex cursor-grab items-center justify-center py-2 active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <div className="h-1 w-10 rounded-full bg-[var(--border-visible)]" />
      </div>

      <div className="px-5 pb-4">
        <div className="font-sans text-2xl font-medium leading-tight text-[var(--interactive)] sm:text-3xl">
          {info.name}
        </div>
        <div className="mt-1 font-mono text-[12px] text-[var(--text-secondary)]">{info.subtitle}</div>
        {info.blurb && (
          <div className="mt-2 font-mono text-[11px] leading-relaxed text-[var(--text-disabled)]">{info.blurb}</div>
        )}

        {expanded && (
          <>
            {fact && (
              <div className="mt-3 border-t border-[var(--border)] pt-3">
                <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">Did you know</div>
                <div className="mt-1 font-sans text-[13px] leading-relaxed text-[var(--text-primary)]">{fact}</div>
              </div>
            )}
            <div className="mt-3 flex items-center gap-2 font-mono text-[10px] text-[var(--text-disabled)]">
              <span>▲ drag down to collapse</span>
            </div>
          </>
        )}
        {!expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="mt-3 font-mono text-[10px] uppercase tracking-wider text-[var(--text-secondary)] hover:text-white"
          >
            ▲ More info
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Replace the mini-card in page.tsx**

In `app/page.tsx`, replace the `{focusInfo && (...)}` block (lines 211-221) with:
```tsx
          <DetailPanel info={focusInfo} />
```
And add the import at the top:
```ts
import { DetailPanel } from '@/components/ui/DetailPanel';
```

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: compiles.

- [ ] **Step 4: Commit**

```bash
git add components/ui/DetailPanel.tsx app/page.tsx
git commit -m "feat: drag-up detail panel with curated facts"
```

---

## Task 10: Final verification

- [ ] **Step 1: Full build**

Run: `npm run build`
Expected: compiles, all routes generate.

- [ ] **Step 2: Run all tests**

Run: `npm test`
Expected: all pass (starSize, trajectory, existing starColor, maptiler).

- [ ] **Step 3: Manual visual check (user-side)**

`npm run dev` → pick a location → sky view. Confirm:
- Sky shows ~640 named stars as round glowing points; no faint dot field.
- Constellation art is subtle, only appears when reticle is on a constellation.
- DSO sprites (Andromeda, Orion Nebula, Pleiades…) visible as faint objects.
- Click ISS/Hubble → dot becomes 3D model + cyan trajectory draws in.
- Click a planet/Sun/Moon → cyan arc trajectory draws in.
- Drag up the bottom-left card → expands with a fact; drag down collapses.
- Stars enlarge + brighten on hover.

---

## Self-Review notes

**Spec coverage:** All 5 sections mapped — §1 art (Task 1), §2 stars (Tasks 2-3), §3 sats/trajectory (Tasks 4-5-7), §4 DSOs (Task 6-7), §5 panel/facts (Tasks 8-9). ✓

**Implementation-time decisions flagged (not blockers):**
- Star `planeGeometry` orientation: if stars look edge-on, add per-instance `.lookAt(0,0,0)` in `applyInstance`.
- `tleById` exposure is required for satellite trajectory lookup; added in Task 7 Step 5.
- Star HR ids and Hubble NORAD id in `data/facts.ts` must be verified against live data at runtime.
