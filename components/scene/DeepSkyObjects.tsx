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
