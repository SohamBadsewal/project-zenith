'use client';

import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { altAzToVec3 } from '@/lib/dome';
import type { ProjectedConstellation } from '@/hooks/useSky';

const DOME_R = 5;
const NEAR = Math.cos((22 * Math.PI) / 180);
const MAX_OPACITY = 0.6;

type Item = {
  id: string;
  dir: THREE.Vector3;
  segs: [number, number, number][][];
};

function buildItems(constellations: ProjectedConstellation[]): Item[] {
  return constellations.map((c) => {
    const dir = new THREE.Vector3();
    const segs: [number, number, number][][] = [];
    for (const path of c.paths) {
      const pts: [number, number, number][] = [];
      for (const [alt, az] of path) {
        pts.push(altAzToVec3(alt, az, DOME_R));
        const [ux, uy, uz] = altAzToVec3(alt, az, 1);
        dir.add(new THREE.Vector3(ux, uy, uz));
      }
      if (pts.length >= 2) segs.push(pts);
    }
    dir.normalize();
    return { id: c.id, dir, segs };
  });
}

export function Constellations({ constellations }: { constellations: ProjectedConstellation[] }) {
  const items = useMemo(() => buildItems(constellations), [constellations]);
  const groups = useRef<(THREE.Group | null)[]>([]);
  const camera = useThree((s) => s.camera);
  const fwd = useRef(new THREE.Vector3());

  useFrame(() => {
    camera.getWorldDirection(fwd.current);
    items.forEach((it, i) => {
      const g = groups.current[i];
      if (!g) return;
      const target = it.dir.dot(fwd.current) > NEAR ? MAX_OPACITY : 0;
      g.traverse((o) => {
        const m = (o as THREE.Mesh).material as THREE.Material | undefined;
        if (m && 'opacity' in m) m.opacity = THREE.MathUtils.lerp(m.opacity, target, 0.12);
      });
    });
  });

  return (
    <group>
      {items.map((it, i) => (
        <group key={`${it.id}-${i}`} ref={(el) => { groups.current[i] = el; }}>
          {it.segs.map((pts, j) => (
            <Line key={j} points={pts} color="#5b9bf6" lineWidth={0.9} transparent opacity={0} />
          ))}
        </group>
      ))}
    </group>
  );
}
