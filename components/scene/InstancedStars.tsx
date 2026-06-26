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
const _pos = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _scale = new THREE.Vector3();
const _dummy = new THREE.Object3D();

/**
 * Above-horizon stars as one InstancedMesh of round, soft-glowing sprites
 * (bright core + halo), sized by magnitude. Each plane instance faces the
 * origin (where the camera sits) so the radial glow always reads as a round
 * point. BVH gives O(log n) raycast picking.
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

  /** Set instance matrix (position + billboard rotation + scale) and color. */
  const applyInstance = (i: number, scaleMul = 1, brightMul = 1) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const s = visibleStars[i];
    const [x, y, z] = altAzToVec3(s.altDeg, s.azDeg, DOME_R);
    const sc = baseScales.current[i] * scaleMul;

    // Billboard: orient the plane to face the origin (camera sits there).
    _pos.set(x, y, z);
    _dummy.position.copy(_pos);
    _dummy.lookAt(0, 0, 0);
    _dummy.updateMatrix();
    _dummy.scale.set(sc, sc, sc);
    _dummy.updateMatrix();
    mesh.setMatrixAt(i, _dummy.matrix);

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

    let dirty = false;

    // Selected star pulses.
    if (selectionId) {
      const idx = visibleStars.findIndex((s) => s.id === selectionId);
      if (idx >= 0) {
        const pulse = 1 + Math.sin(Date.now() / 200) * 0.15;
        applyInstance(idx, 2.5 * pulse, 1.4);
        dirty = true;
      }
    }

    // Hovered star enlarges + brightens.
    const h = hoveredRef.current;
    if (h != null && h >= 0 && h < count && visibleStars[h]?.id !== selectionId) {
      applyInstance(h, 2.5, 1.5);
      dirty = true;
    }

    if (dirty) {
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
