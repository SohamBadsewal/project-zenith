'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { circlePointTexture } from '@/lib/pointTexture';

/** Procedural background starfield — magnitude-varied points with slow parallax. */
export function Starfield({ count = 3500, radius = 90 }: { count?: number; radius?: number }) {
  const ref = useRef<THREE.Points>(null);

  const { positions, sizes } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      // uniform on a sphere shell
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const r = radius * (0.8 + Math.random() * 0.2);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      sizes[i] = Math.random() < 0.09 ? 1.8 + Math.random() * 1.4 : 0.6 + Math.random() * 0.9;
    }
    return { positions, sizes };
  }, [count, radius]);

  const tex = useMemo(() => circlePointTexture(), []);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.005;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
      <pointsMaterial
        map={tex}
        color="#eaf0ff"
        size={0.24}
        sizeAttenuation
        transparent
        opacity={1.0}
        depthWrite={false}
      />
    </points>
  );
}
