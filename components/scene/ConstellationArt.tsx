'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { altAzToVec3 } from '@/lib/dome';
import type { ProjectedArt } from '@/hooks/useSky';

const DOME_R = 5;
const SEG = 14;
// Subtle art that appears only when the center reticle is on the constellation.
// LOAD = cone of mounted art (45°); SHOW = reticle proximity gate (12°).
const LOAD = Math.cos((45 * Math.PI) / 180);
const SHOW = Math.cos((12 * Math.PI) / 180);
const MAX_OPACITY = 0.35;

function invert3(m: number[][]): number[][] {
  const [a, b, c] = m[0];
  const [d, e, f] = m[1];
  const [g, h, i] = m[2];
  const A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g;
  const det = a * A + b * B + c * C;
  const inv = 1 / det;
  return [
    [A * inv, -(b * i - c * h) * inv, (b * f - c * e) * inv],
    [B * inv, (a * i - c * g) * inv, -(a * f - c * d) * inv],
    [C * inv, -(a * h - b * g) * inv, (a * e - b * d) * inv],
  ];
}

function buildGeometry(art: ProjectedArt): THREE.BufferGeometry {
  const an = art.anchors;
  const M = invert3([
    [1, an[0].px, an[0].py],
    [1, an[1].px, an[1].py],
    [1, an[2].px, an[2].py],
  ]);
  const V = an.map((a) => altAzToVec3(a.altDeg, a.azDeg, 1));
  const co = (k: number) => [
    M[0][0] * V[0][k] + M[0][1] * V[1][k] + M[0][2] * V[2][k],
    M[1][0] * V[0][k] + M[1][1] * V[1][k] + M[1][2] * V[2][k],
    M[2][0] * V[0][k] + M[2][1] * V[1][k] + M[2][2] * V[2][k],
  ];
  const [ax, bx, cx] = co(0), [ay, by, cy] = co(1), [az, bz, cz] = co(2);

  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const v = new THREE.Vector3();
  for (let j = 0; j <= SEG; j++) {
    for (let i = 0; i <= SEG; i++) {
      const u = i / SEG, t = j / SEG;
      const px = u * art.w, py = t * art.h;
      v.set(ax + px * bx + py * cx, ay + px * by + py * cy, az + px * bz + py * cz).normalize().multiplyScalar(DOME_R);
      pos.push(v.x, v.y, v.z);
      uv.push(u, 1 - t);
    }
  }
  for (let j = 0; j < SEG; j++) {
    for (let i = 0; i < SEG; i++) {
      const p0 = j * (SEG + 1) + i, p1 = p0 + 1, p2 = p0 + SEG + 1, p3 = p2 + 1;
      idx.push(p0, p2, p1, p1, p2, p3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

function centroidOf(art: ProjectedArt): THREE.Vector3 {
  const c = new THREE.Vector3();
  for (const a of art.anchors) {
    const [x, y, z] = altAzToVec3(a.altDeg, a.azDeg, 1);
    c.add(new THREE.Vector3(x, y, z));
  }
  return c.normalize();
}

function ArtMesh({ art, dir }: { art: ProjectedArt; dir: THREE.Vector3 }) {
  const tex = useTexture(art.file);
  const geo = useMemo(() => buildGeometry(art), [art]);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const camera = useThree((s) => s.camera);
  const fwd = useRef(new THREE.Vector3());

  useEffect(() => {
    tex.colorSpace = THREE.SRGBColorSpace;
  }, [tex]);

  useFrame(() => {
    if (!mat.current) return;
    camera.getWorldDirection(fwd.current);
    const target = dir.dot(fwd.current) > SHOW ? MAX_OPACITY : 0;
    mat.current.opacity = THREE.MathUtils.lerp(mat.current.opacity, target, 0.1);
  });

  return (
    <mesh geometry={geo}>
      <meshBasicMaterial
        ref={mat}
        map={tex}
        transparent
        opacity={0}
        depthWrite={false}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </mesh>
  );
}

export function ConstellationArt({ art }: { art: ProjectedArt[] }) {
  const camera = useThree((s) => s.camera);
  const fwd = useRef(new THREE.Vector3());
  const [activeIds, setActiveIds] = useState<string[]>([]);

  const items = useMemo(
    () => art.map((a) => ({ art: a, dir: centroidOf(a) })),
    [art],
  );

  useFrame(() => {
    camera.getWorldDirection(fwd.current);
    const near = items
      .map((it) => ({ id: it.art.id, d: it.dir.dot(fwd.current) }))
      .filter((x) => x.d > LOAD)
      .sort((a, b) => b.d - a.d)
      .map((x) => x.id);
    if (near.length !== activeIds.length || near.some((id, i) => id !== activeIds[i])) setActiveIds(near);
  });

  return (
    <group>
      {items
        .filter((it) => activeIds.includes(it.art.id))
        .map((it) => (
          <Suspense key={it.art.id} fallback={null}>
            <ArtMesh art={it.art} dir={it.dir} />
          </Suspense>
        ))}
    </group>
  );
}
