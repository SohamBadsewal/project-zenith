'use client';

import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { altAzToVec3 } from '@/lib/dome';
import { raDecToAltAz } from '@/lib/ephemeris';
import { milkyWayTexture } from '@/lib/milkyWayTexture';
import type { ObserverLocation } from '@/types';

// Galactic north pole (J2000 equatorial)
const GNP_RA = 192.859508;
const GNP_DEC = 27.128336;
// Galactic centre (J2000 equatorial)
const GC_RA = 266.405;
const GC_DEC = -28.936;

/**
 * Faint Milky Way band draped on the inside of a sphere slightly smaller than
 * the star dome (radius 4.95 vs dome 5.0). Uses an inverted-normal sphere so
 * the observer standing at the origin sees the textured inner surface.
 *
 * Orientation: the sphere's UV maps galactic longitude (U=0 → galactic centre)
 * and latitude (V=0 → galactic north pole) onto the local horizontal frame by
 * computing the galactic north pole + galactic centre directions in alt/az for
 * the current observer and time, then building a rotation matrix.
 */
export function MilkyWay({ observer, dateMs }: { observer: ObserverLocation; dateMs: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const tex = useMemo(() => milkyWayTexture(), []);

  // Rotation that maps galactic coords onto the current local horizontal frame.
  // Recomputes when observer location or time changes (cheap: 2 trig lookups).
  const rotation = useMemo<[number, number, number]>(() => {
    const date = new Date(dateMs);

    const gnp = raDecToAltAz(GNP_RA, GNP_DEC, observer, date);
    const gc  = raDecToAltAz(GC_RA,  GC_DEC,  observer, date);

    // Directions in dome 3-space
    const ry = new THREE.Vector3(...altAzToVec3(gnp.altDeg, gnp.azDeg, 1)).normalize();
    const gcVec = new THREE.Vector3(...altAzToVec3(gc.altDeg, gc.azDeg, 1)).normalize();

    // Three.js SphereGeometry: north pole (+Y) maps to V=0, equatorial point at
    // U=0 maps to –X.  We want  R·(+Y) = gnpDir  and  R·(–X) = gcDir, so the
    // first column (R·e_x) = –gcDir, orthogonalised against ry.
    const rxRaw = gcVec.clone().negate();
    rxRaw.addScaledVector(ry, -rxRaw.dot(ry)); // Gram-Schmidt
    const rx = rxRaw.normalize();
    const rz = rx.clone().cross(ry).normalize();

    const m = new THREE.Matrix4().makeBasis(rx, ry, rz);
    const e = new THREE.Euler().setFromRotationMatrix(m);
    return [e.x, e.y, e.z];
  }, [observer, dateMs]);

  return (
    <mesh
      ref={meshRef}
      rotation={rotation}
      renderOrder={-10}
    >
      <sphereGeometry args={[4.95, 64, 32]} />
      <meshBasicMaterial
        map={tex}
        side={THREE.BackSide}
        transparent
        opacity={0.07}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        depthTest={false}
        toneMapped={false}
      />
    </mesh>
  );
}
