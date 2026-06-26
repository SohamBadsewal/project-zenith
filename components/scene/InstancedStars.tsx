'use client';

import { useMemo, useRef, useEffect } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';
import { altAzToVec3 } from '@/lib/dome';
import { bvToRgb } from '@/lib/starColor';
import type { CelestialObject } from '@/types';

// Enable BVH on three.js geometries/meshes (one-time prototype extension).
// The prototype-patch is the documented three-mesh-bvh usage; the type decls
// declare computeBoundsTree→MeshBVH but the export returns GeometryBVH (a
// superset-compat type). The cast silences that version skew — runtime-correct.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const patchBVH = () => {
  (THREE.BufferGeometry.prototype as any).computeBoundsTree = computeBoundsTree;
  (THREE.BufferGeometry.prototype as any).disposeBoundsTree = disposeBoundsTree;
  THREE.Mesh.prototype.raycast = acceleratedRaycast;
};
patchBVH();

const DOME_R = 5;
const STAR_SIZE = 0.035; // instance scale; BVH makes even sub-pixel stars pickable

const _matrix = new THREE.Matrix4();
const _color = new THREE.Color();

/**
 * All above-horizon stars as a single InstancedMesh: per-instance position
 * (from altAzToVec3), color (from B-V via bvToRgb), and scale (from magnitude).
 * BVH on the geometry gives O(log n) raycast picking of individual stars —
 * impossible with THREE.Points, which is why SkyDome's stars weren't clickable.
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

  const visibleStars = useMemo(() => stars, [stars]);
  const count = visibleStars.length;

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    visibleStars.forEach((s, i) => {
      const [x, y, z] = altAzToVec3(s.altDeg, s.azDeg, DOME_R);
      const mag = s.magnitude ?? 6;
      const scale = STAR_SIZE * Math.max(0.35, (6 - mag) / 3);
      _matrix.makeScale(scale, scale, scale).setPosition(x, y, z);
      mesh.setMatrixAt(i, _matrix);

      const [r, g, b] = bvToRgb(s.bv);
      _color.setRGB(r, g, b);
      mesh.setColorAt(i, _color);
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
    mesh.geometry.computeBoundsTree(); // build BVH for raycast
  }, [visibleStars]);

  // Pulse the selected star slightly so the click is visible.
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
    const id = e.instanceId != null ? (visibleStars[e.instanceId]?.id ?? null) : null;
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
