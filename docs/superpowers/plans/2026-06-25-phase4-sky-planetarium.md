# Phase 4 — Sky Planetarium Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace `SkyDome.tsx`'s `THREE.Points` star rendering with an `InstancedMesh`-based `SkyPlanetarium` that supports per-instance color (spectral type), BVH-accelerated raycast picking, and a clean component structure for Phase 5's GLB satellites + UI overlays.

**Architecture:** New `SkyPlanetarium.tsx` consumes the **exact same `SkyData` interface** from `hooks/useSky.ts` — the data layer is untouched. Stars become a single `THREE.InstancedMesh` (2851 instances) with per-instance matrix (position via `altAzToVec3`) and per-instance color (from B-V index). `three-mesh-bvh` provides O(log n) click-detection on sub-pixel points. Constellations, bodies, satellites port directly from SkyDome (they already use `altAzToVec3`).

**Tech Stack:** three.js 0.184 InstancedMesh · three-mesh-bvh · @react-three/drei (Line, Billboard, Text) · @react-three/fiber 9.

**Spec ref:** `docs/superpowers/specs/2026-06-25-zenith-pivot-design.md` §4.3.

**Parallel-safe with Phase 1:** This plan touches ONLY `components/scene/` and adds `three-mesh-bvh` to `package.json`. It does NOT touch `lib/`, `hooks/`, `types/`, or `app/api/` — zero file overlap with Phase 1.

---

## Context for the implementer

**The existing `SkyDome.tsx` is already a 3D celestial sphere** (radius `DOME_R = 5`), not a flat chart — it was converted in commit `87a262e`. The camera sits at the origin looking outward. Every celestial object is positioned via `altAzToVec3(altDeg, azDeg, DOME_R)` from `lib/dome.ts` (E/W-corrected, tested).

**What changes:** Stars move from `THREE.Points` (two `<points>` batches: bright + dim) to a single `THREE.InstancedMesh` with per-instance color. This unlocks: (a) per-star spectral coloring, (b) raycast picking on individual stars (impossible with `Points`), (c) a slight scale-up on the picked star.

**What does NOT change:** `hooks/useSky.ts`, `lib/dome.ts`, `lib/ephemeris.ts`, `lib/satellites.ts`, the data bundles, all 21 tests. The `SkyData` interface is consumed as-is.

**The `SkyData` interface** (from `hooks/useSky.ts`, do not modify):
```typescript
interface SkyData {
  bodies: CelestialObject[];        // sun, moon, planets (have altDeg, azDeg, magnitude, kind)
  stars: CelestialObject[];         // 2851 Hipparcos stars (have altDeg, azDeg, magnitude)
  satellites: SatelliteState[];     // live SGP4 sats (have elevationDeg, azDeg, noradId, name)
  constellations: ProjectedConstellation[];  // paths of [altDeg, azDeg]
  zenithObjectId: string | null;
  countAboveHorizon: number;
  dataMode: 'live' | 'offline' | 'mixed';
  issOrbit: IssOrbitPoint[];        // [{altDeg, azDeg, minsFromNow}]
}
```

---

## File Structure

| File | Responsibility |
|------|----------------|
| `components/scene/InstancedStars.tsx` | Single InstancedMesh of 2851 stars, per-instance color + matrix, BVH raycast |
| `components/scene/SkyPlanetarium.tsx` | New top-level sky renderer (replaces SkyDome); composes InstancedStars + constellations + bodies + satellites |
| `components/scene/SkyDome.tsx` | **Deleted** in the final task (after SkyPlanetarium is wired in) |

---

## Task 1: Install three-mesh-bvh

**Files:**
- Modify: `package.json`, `package-lock.json`

- [ ] **Step 1: Install**

```bash
npm install three-mesh-bvh
```

- [ ] **Step 2: Verify it resolves**

```bash
node -e "require('three-mesh-bvh'); console.log('three-mesh-bvh OK')"
```

Expected output: `three-mesh-bvh OK`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: add three-mesh-bvh for star raycast acceleration"
```

---

## Task 2: InstancedStars component (TDD for the color math)

**Files:**
- Create: `components/scene/InstancedStars.tsx`
- Create: `lib/starColor.test.ts` (test the B-V → color math in isolation)
- Create: `lib/starColor.ts` (the pure B-V → RGB function)

This task splits the color math into a pure, testable function because the InstancedMesh setup itself can't be unit-tested without a WebGL context.

- [ ] **Step 1: Write the failing test for B-V → color**

Create `lib/starColor.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { bvToRgb } from './starColor';

describe('bvToRgb — B-V color index to RGB', () => {
  it('returns blue-white for hot stars (B-V < 0)', () => {
    const [r, g, b] = bvToRgb(-0.3);
    expect(b).toBeGreaterThan(r); // blue dominant
    expect(g).toBeGreaterThan(r * 0.9);
  });

  it('returns white for A-type stars (B-V ≈ 0)', () => {
    const [r, g, b] = bvToRgb(0.0);
    expect(Math.abs(r - g)).toBeLessThan(0.1);
    expect(Math.abs(g - b)).toBeLessThan(0.1);
  });

  it('returns yellow for Sun-like stars (B-V ≈ 0.65)', () => {
    const [r, g, b] = bvToRgb(0.65);
    expect(r).toBeGreaterThan(b); // red dominant over blue
    expect(g).toBeGreaterThan(b * 0.9);
  });

  it('returns red-orange for cool stars (B-V > 1.4)', () => {
    const [r, g, b] = bvToRgb(1.5);
    expect(r).toBeGreaterThan(0.8);
    expect(b).toBeLessThan(0.4);
  });

  it('clamps out-of-range B-V', () => {
    const cold = bvToRgb(99);
    const [r] = cold;
    expect(r).toBeGreaterThan(0.8); // still red, not NaN
    const hot = bvToRgb(-99);
    expect(hot.every((c) => Number.isFinite(c))).toBe(true);
  });

  it('falls back to white when B-V is undefined', () => {
    const [r, g, b] = bvToRgb(undefined);
    expect(r).toBeCloseTo(1);
    expect(g).toBeCloseTo(1);
    expect(b).toBeCloseTo(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run lib/starColor.test.ts
```

Expected: FAIL — `Cannot find module './starColor'`.

- [ ] **Step 3: Implement the B-V → color function**

Create `lib/starColor.ts`:

```typescript
// lib/starColor.ts — B-V color index → approximate RGB for star rendering.
// B-V (B minus V magnitude) encodes stellar temperature: negative = hot/blue,
// ~0.65 = Sun-like yellow, >1.4 = cool red. This is a simplified interpolation
// over the standard stellar classification color curve (not physically exact,
// but visually convincing for a planetarium).

/** B-V color index → [r, g, b] each 0..1. Pure function, no three.js dep. */
export function bvToRgb(bv?: number): [number, number, number] {
  if (bv == null || !Number.isFinite(bv)) return [1, 1, 1];
  const t = Math.max(-0.4, Math.min(2.0, bv)); // clamp to stellar range

  // Piecewise interpolation across key B-V anchors (Osterbrock table).
  if (t < 0.0) return lerp([0.6, 0.7, 1.0], [0.85, 0.9, 1.0], (t + 0.4) / 0.4);
  if (t < 0.4) return lerp([0.85, 0.9, 1.0], [1.0, 1.0, 1.0], t / 0.4);
  if (t < 0.8) return lerp([1.0, 1.0, 1.0], [1.0, 0.95, 0.8], (t - 0.4) / 0.4);
  if (t < 1.4) return lerp([1.0, 0.95, 0.8], [1.0, 0.75, 0.5], (t - 0.8) / 0.6);
  return lerp([1.0, 0.75, 0.5], [1.0, 0.55, 0.35], Math.min(1, (t - 1.4) / 0.6));
}

function lerp(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}
```

- [ ] **Step 4: Run test to verify pass**

```bash
npx vitest run lib/starColor.test.ts
```

Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/starColor.ts lib/starColor.test.ts
git commit -m "feat: bvToRgb — B-V color index to RGB for star coloring (6 tests)"
```

- [ ] **Step 6: Implement InstancedStars.tsx**

Create `components/scene/InstancedStars.tsx`:

```typescript
'use client';

import { useMemo, useRef, useEffect } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';
import { altAzToVec3 } from '@/lib/dome';
import { bvToRgb } from '@/lib/starColor';
import type { CelestialObject } from '@/types';

// Enable BVH on InstancedMesh (one-time prototype extension).
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

const DOME_R = 5;
const STAR_SIZE = 0.035; // instance scale — sub-pixel-ish, BVH makes them pickable

const _matrix = new THREE.Matrix4();
const _color = new THREE.Color();

/**
 * Renders all above-horizon stars as a single InstancedMesh with per-instance
 * position (from altAzToVec3), color (from B-V index), and scale (from magnitude).
 * BVH on the geometry enables O(log n) raycast picking of individual stars.
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

  // Only above-horizon stars are rendered.
  const visibleStars = useMemo(() => stars.filter((s) => s.aboveHorizon), [stars]);

  const count = visibleStars.length;

  // Build the instance matrices + colors once per data change.
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    visibleStars.forEach((s, i) => {
      const [x, y, z] = altAzToVec3(s.altDeg, s.azDeg, DOME_R);
      // Brighter stars (lower magnitude) are slightly larger.
      const mag = s.magnitude ?? 6;
      const scale = STAR_SIZE * (1 + Math.max(0, 2.5 - mag) * 0.4);
      _matrix.makeScale(scale, scale, scale).setPosition(x, y, z);
      mesh.setMatrixAt(i, _matrix);

      const [r, g, b] = bvToRgb((s as { bv?: number }).bv);
      _color.setRGB(r, g, b);
      mesh.setColorAt(i, _color);
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
    mesh.geometry.computeBoundsTree(); // build BVH for raycast
  }, [visibleStars]);

  // Pulse the selected star slightly.
  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh || !selectionId) return;
    const idx = visibleStars.findIndex((s) => s.id === selectionId);
    if (idx < 0) return;
    const s = visibleStars[idx];
    const [x, y, z] = altAzToVec3(s.altDeg, s.azDeg, DOME_R);
    const pulse = STAR_SIZE * 2.5 * (1 + Math.sin(Date.now() / 200) * 0.15);
    _matrix.makeScale(pulse, pulse, pulse).setPosition(x, y, z);
    mesh.setMatrixAt(idx, _matrix);
    mesh.instanceMatrix.needsUpdate = true;
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const id = e.instanceId != null ? visibleStars[e.instanceId]?.id ?? null : null;
    onSelect(id === selectionId ? null : id);
  };

  if (!visible) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, count]}
      onClick={handleClick}
      frustumCulled={false}
    >
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}
```

- [ ] **Step 7: Verify type-check**

```bash
npx tsc --noEmit
```

Expected: exit 0.

- [ ] **Step 8: Commit**

```bash
git add components/scene/InstancedStars.tsx
git commit -m "feat: InstancedStars — 2851-star InstancedMesh with BVH raycast + spectral color"
```

---

## Task 3: SkyPlanetarium main component

**Files:**
- Create: `components/scene/SkyPlanetarium.tsx`

This composes InstancedStars + ports the constellation/body/satellite rendering from SkyDome (they already use `altAzToVec3`, so they port with minimal change). The component accepts the same props as SkyDome so `app/page.tsx` can swap one for the other.

- [ ] **Step 1: Create SkyPlanetarium.tsx**

Port the constellation lines, cardinal marks, zenith marker, bodies (billboards), satellites (billboards), and ISS orbit track from `SkyDome.tsx`. Replace the two `<points>` star batches with `<InstancedStars>`. Keep the `Layers` interface, `BODY_COLOR`, `Tooltip`, `Cardinal`, `IssOrbitTrack` helpers as-is (copy from SkyDome).

The full component (copy the helpers from SkyDome.tsx lines 13–26, 224–322; replace the `<points>` blocks at lines 98–113 with `<InstancedStars>`):

```typescript
'use client';

import { useMemo, useState } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { Billboard, Html, Line, Text } from '@react-three/drei';
import { altAzToVec3, horizonRing, altitudeRing } from '@/lib/dome';
import { satId, type SkyData, type IssOrbitPoint } from '@/hooks/useSky';
import type { CelestialObject, SatelliteState } from '@/types';
import { InstancedStars } from './InstancedStars';

const DOME_R = 5;

export interface Layers {
  stars: boolean;
  constellations: boolean;
  planets: boolean;
  satellites: boolean;
  labels: boolean;
}

const BODY_COLOR: Record<string, string> = {
  sun: '#ffd27f',
  moon: '#e8e8e8',
  planet: '#d4a843',
  star: '#ffffff',
};

export function SkyPlanetarium({
  data,
  layers,
  selectionId,
  onSelect,
}: {
  data: SkyData;
  layers: Layers;
  selectionId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const [hoverId, setHoverId] = useState<string | null>(null);
  const starSelection = selectionId?.startsWith('star:') ? selectionId : null;

  const rings = useMemo(
    () => ({
      horizon: horizonRing(DOME_R),
      alt30: altitudeRing(30, DOME_R),
      alt60: altitudeRing(60, DOME_R),
    }),
    [],
  );

  const enter = (id: string) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHoverId(id);
    document.body.style.cursor = 'pointer';
  };
  const leave = (id: string) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHoverId((cur) => (cur === id ? null : cur));
    document.body.style.cursor = '';
  };

  return (
    <group>
      <Line points={rings.horizon} color="#3a3a3a" lineWidth={1.5} />
      <Line points={rings.alt30} color="#1f1f1f" lineWidth={1} />
      <Line points={rings.alt60} color="#1f1f1f" lineWidth={1} />

      <Cardinal label="N" alt={3} az={0} />
      <Cardinal label="E" alt={3} az={90} />
      <Cardinal label="S" alt={3} az={180} />
      <Cardinal label="W" alt={3} az={270} />

      <Billboard position={altAzToVec3(90, 0, DOME_R)}>
        <Line points={zenithCircle} color="#d71921" lineWidth={1.5} />
        <Text position={[0, -0.4, 0]} fontSize={0.18} color="#d71921" anchorX="center">
          ZENITH
        </Text>
      </Billboard>

      {/* Stars — InstancedMesh with BVH picking (replaces SkyDome's Points) */}
      <InstancedStars
        stars={data.stars}
        visible={layers.stars}
        selectionId={starSelection}
        onSelect={onSelect}
      />

      {/* constellation lines (ported from SkyDome, unchanged) */}
      {layers.constellations &&
        data.constellations.flatMap((c, ci) =>
          c.paths.map((path, i) => {
            const pts: [number, number, number][] = [];
            for (const [alt, az] of path) {
              if (alt <= 0) {
                if (pts.length >= 2) return null;
                pts.length = 0;
                continue;
              }
              pts.push(altAzToVec3(alt, az, DOME_R));
            }
            if (pts.length < 2) return null;
            return (
              <Line key={`${c.id}-${ci}-${i}`} points={pts} color="#5b9bf6" lineWidth={0.8} transparent opacity={0.5} />
            );
          }),
        )}

      {/* sun / moon / planets (ported from SkyDome) */}
      {layers.planets &&
        data.bodies
          .filter((b) => b.aboveHorizon)
          .map((b) => {
            const selected = selectionId === b.id;
            const hovered = hoverId === b.id;
            return (
              <Billboard key={b.id} position={altAzToVec3(b.altDeg, b.azDeg, DOME_R)}>
                <mesh
                  scale={hovered ? 1.4 : 1}
                  onClick={(e) => { e.stopPropagation(); onSelect(selected ? null : b.id); }}
                  onPointerOver={enter(b.id)}
                  onPointerOut={leave(b.id)}
                >
                  <circleGeometry args={[b.kind === 'sun' || b.kind === 'moon' ? 0.16 : 0.1, 24]} />
                  <meshBasicMaterial color={selected ? '#d71921' : hovered ? '#ffffff' : BODY_COLOR[b.kind]} />
                </mesh>
                {layers.labels && !hovered && (
                  <Text position={[0, 0.28, 0]} fontSize={0.16} color="#999999" anchorX="center">{b.name}</Text>
                )}
                {hovered && <Tooltip title={b.name} lines={bodyLines(b)} />}
              </Billboard>
            );
          })}

      {/* ISS orbit track (ported) */}
      {layers.satellites && data.issOrbit.length >= 2 && <IssOrbitTrack points={data.issOrbit} />}

      {/* satellites (ported — GLB LOD swap is Phase 5) */}
      {layers.satellites &&
        data.satellites
          .filter((s) => s.aboveHorizon)
          .map((s) => {
            const isISS = s.name.includes('ISS');
            const id = satId(s.noradId);
            const selected = selectionId === id;
            const hovered = hoverId === id;
            return (
              <Billboard key={id} position={altAzToVec3(s.elevationDeg, s.azDeg, DOME_R)}>
                <mesh
                  scale={hovered ? 1.5 : 1}
                  onClick={(e) => { e.stopPropagation(); onSelect(selected ? null : id); }}
                  onPointerOver={enter(id)}
                  onPointerOut={leave(id)}
                >
                  <circleGeometry args={[isISS ? 0.12 : 0.05, 16]} />
                  <meshBasicMaterial color={selected ? '#d71921' : hovered ? '#aef0c0' : '#4a9e5c'} />
                </mesh>
                {layers.labels && isISS && !hovered && (
                  <Text position={[0, 0.26, 0]} fontSize={0.16} color="#4a9e5c" anchorX="center">ISS</Text>
                )}
                {hovered && <Tooltip title={s.name} lines={satLines(s)} />}
              </Billboard>
            );
          })}
    </group>
  );
}

// ── Helpers (copied from SkyDome.tsx — identical) ─────────────────────

const zenithCircle: [number, number, number][] = (() => {
  const pts: [number, number, number][] = [];
  for (let i = 0; i <= 32; i++) {
    const a = (i / 32) * Math.PI * 2;
    pts.push([Math.cos(a) * 0.14, Math.sin(a) * 0.14, 0]);
  }
  return pts;
})();

const KIND_LABEL: Record<string, string> = {
  sun: 'STAR · OUR SUN',
  moon: 'MOON',
  planet: 'PLANET',
  star: 'STAR',
};

function bodyLines(b: CelestialObject): string[] {
  const lines = [`${KIND_LABEL[b.kind] ?? 'BODY'} · ALT ${Math.round(b.altDeg)}° · AZ ${Math.round(b.azDeg)}°`];
  if (b.kind === 'moon' && b.phase != null) lines.push(`ILLUMINATED ${Math.round(b.phase * 100)}%`);
  else if (b.distanceAu != null) lines.push(`${b.distanceAu.toFixed(2)} AU from Earth`);
  else if (b.magnitude != null) lines.push(`MAG ${b.magnitude.toFixed(1)}`);
  return lines;
}

function satLines(s: SatelliteState): string[] {
  const lines = [`SATELLITE · ALT ${Math.round(s.elevationDeg)}° · AZ ${Math.round(s.azDeg)}°`];
  const parts: string[] = [];
  if (s.velocityKmS != null) parts.push(`${s.velocityKmS.toFixed(2)} km/s`);
  parts.push(`${Math.round(s.altKm)} km up`);
  lines.push(parts.join(' · '));
  return lines;
}

function Tooltip({ title, lines }: { title: string; lines: string[] }) {
  return (
    <Html position={[0, 0.32, 0]} center style={{ pointerEvents: 'none', userSelect: 'none' }}>
      <div style={{
        transform: 'translateY(-100%)', whiteSpace: 'nowrap',
        border: '1px solid var(--border-visible, #333)',
        background: 'var(--surface, rgba(10,10,10,0.92))',
        padding: '6px 10px', fontFamily: 'var(--font-mono, ui-monospace, monospace)', lineHeight: 1.4,
      }}>
        <div style={{ color: 'var(--text-primary, #fff)', fontSize: 13, fontWeight: 500 }}>{title}</div>
        {lines.map((l, i) => (
          <div key={i} style={{ color: 'var(--text-secondary, #999)', fontSize: 11 }}>{l}</div>
        ))}
      </div>
    </Html>
  );
}

function Cardinal({ label, alt, az }: { label: string; alt: number; az: number }) {
  return (
    <Billboard position={altAzToVec3(alt, az, DOME_R)}>
      <Text fontSize={0.26} color="#999999" anchorX="center" anchorY="middle">{label}</Text>
    </Billboard>
  );
}

function IssOrbitTrack({ points }: { points: IssOrbitPoint[] }) {
  const segments = useMemo(() => {
    const segs: Array<[number, number, number][]> = [];
    let current: Array<[number, number, number]> = [];
    for (const p of points) {
      if (p.altDeg > 0) {
        current.push(altAzToVec3(p.altDeg, p.azDeg, DOME_R));
      } else if (current.length >= 2) {
        segs.push(current);
        current = [];
      } else {
        current = [];
      }
    }
    if (current.length >= 2) segs.push(current);
    return segs;
  }, [points]);

  if (segments.length === 0) return null;
  return (
    <>
      {segments.map((seg, i) => (
        <Line key={i} points={seg} color="#4a9e5c" lineWidth={1} transparent opacity={0.35} dashed dashSize={0.15} gapSize={0.1} />
      ))}
    </>
  );
}
```

- [ ] **Step 2: Verify type-check**

```bash
npx tsc --noEmit
```

Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add components/scene/SkyPlanetarium.tsx
git commit -m "feat: SkyPlanetarium — 3D celestial sphere with InstancedStars (replaces SkyDome)"
```

---

## Task 4: Wire SkyPlanetarium into app/page.tsx, delete SkyDome.tsx

**Files:**
- Modify: `app/page.tsx` (swap `SkyDome` → `SkyPlanetarium`)
- Delete: `components/scene/SkyDome.tsx`

- [ ] **Step 1: Read app/page.tsx to find the SkyDome usage**

```bash
# Find the import and usage:
grep -n "SkyDome" app/page.tsx
```

- [ ] **Step 2: Swap the import and usage**

In `app/page.tsx`, replace:
```typescript
import { SkyDome } from '@/components/scene/SkyDome';
```
with:
```typescript
import { SkyPlanetarium } from '@/components/scene/SkyPlanetarium';
```

And in the JSX, replace `<SkyDome ... />` with `<SkyPlanetarium ... />`. The props are identical (`data`, `layers`, `selectionId`, `onSelect`).

- [ ] **Step 3: Delete SkyDome.tsx**

```bash
git rm components/scene/SkyDome.tsx
```

- [ ] **Step 4: Verify type-check + build**

```bash
npx tsc --noEmit && npm run build
```

Expected: exit 0, build succeeds.

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx
git commit -m "refactor: wire SkyPlanetarium, remove SkyDome (InstancedMesh stars live)"
```

---

## Task 5: Final verification

- [ ] **Step 1: Full test suite**

```bash
npm test
```

Expected: all tests pass (existing 21 + new 6 starColor = 27).

- [ ] **Step 2: Verify no SkyDome references remain**

```bash
grep -r "SkyDome" --include="*.ts" --include="*.tsx" . | grep -v node_modules | grep -v .next
```

Expected: no output (all references gone).

---

## Self-Review (completed)

**1. Spec coverage:**
- §4.3 InstancedMesh stars → Task 2 (InstancedStars) ✓
- §4.3 three-mesh-bvh picking → Task 2 (BVH in InstancedStars) ✓
- §4.3 constellation lines → Task 3 (ported from SkyDome) ✓
- §4.3 bodies/satellites → Task 3 (ported; GLB swap deferred to Phase 5 per spec) ✓
- §4.3 horizon rings → Task 3 (ported from SkyDome, uses existing horizonRing/altitudeRing) ✓
- §6 delete SkyDome.tsx → Task 4 ✓

**2. Placeholder scan:** None. All code blocks complete. Star color math is tested. GLB LOD swap is explicitly deferred to Phase 5 (not a placeholder — it's a documented scope boundary).

**3. Type consistency:** `Layers` interface matches SkyDome's exactly. `SkyData` consumed unchanged from `hooks/useSky.ts`. `InstancedStars` props (`stars`, `visible`, `selectionId`, `onSelect`) match usage in SkyPlanetarium. `bvToRgb` signature `(bv?: number) => [number, number, number]` consistent between `starColor.ts` and `starColor.test.ts`.

**4. Parallel safety:** Touches only `components/scene/`, `lib/starColor.ts`, `lib/starColor.test.ts`, `app/page.tsx`, `package.json`. Zero overlap with Phase 1 (`lib/maptiler.*`, `types/index.ts`, `app/api/*`).
