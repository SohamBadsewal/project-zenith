'use client';

// THROWAWAY Phase-0 spike. Verifies the raycast-hit → lat/long transform lands
// on the correct place visually, while the globe auto-rotates. Delete once the
// real Globe (Phase 2) is built. Not linked from anywhere.

import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, useTexture } from '@react-three/drei';
import { useRef, useState } from 'react';
import * as THREE from 'three';
import {
  pickLocation,
  latLonToUnitVector,
  formatLatLon,
  type Vec3,
} from '@/lib/geo';

interface Pick {
  latDeg: number;
  lonDeg: number;
  local: Vec3;
}

// Reference cities — dots placed via latLonToUnitVector. If each dot sits on the
// right country, the texture orientation + forward transform are both correct.
const REF_CITIES: Array<{ name: string; lat: number; lon: number }> = [
  { name: 'London', lat: 51.5074, lon: -0.1278 },
  { name: 'Mumbai', lat: 19.076, lon: 72.8777 },
  { name: 'New York', lat: 40.7128, lon: -74.006 },
  { name: 'Sydney', lat: -33.8688, lon: 151.2093 },
  { name: 'Nairobi', lat: -1.2921, lon: 36.8219 },
];

function Globe({ onPick }: { onPick: (p: Pick) => void }) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const [paused, setPaused] = useState(true);
  const texture = useTexture('/textures/earth_day.jpg', (t) => {
    (t as THREE.Texture).colorSpace = THREE.SRGBColorSpace;
  });
  const [pinLocal, setPinLocal] = useState<THREE.Vector3 | null>(null);

  useFrame((_, delta) => {
    if (!paused && groupRef.current) groupRef.current.rotation.y += delta * 0.15;
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const mesh = meshRef.current;
    if (!mesh) return;
    // Cancel the mesh's live world transform to get the point in LOCAL space —
    // this is what makes the pick correct even mid-rotation.
    const local = e.point.clone().applyMatrix4(mesh.matrixWorld.clone().invert());
    const { latDeg, lonDeg } = pickLocation(local);
    setPinLocal(local.clone().normalize());
    onPick({ latDeg, lonDeg, local: { x: local.x, y: local.y, z: local.z } });
  };

  return (
    <group ref={groupRef}>
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerDown={() => setPaused(true)}
      >
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial map={texture} metalness={0} roughness={1} />
      </mesh>
      {REF_CITIES.map((c) => {
        const v = latLonToUnitVector(c.lat, c.lon);
        return (
          <mesh
            key={c.name}
            position={[v.x * 1.015, v.y * 1.015, v.z * 1.015]}
          >
            <sphereGeometry args={[0.015, 12, 12]} />
            <meshBasicMaterial color="#5b9bf6" />
          </mesh>
        );
      })}
      {pinLocal && (
        <mesh position={pinLocal.clone().multiplyScalar(1.02)}>
          <sphereGeometry args={[0.02, 16, 16]} />
          <meshBasicMaterial color="#ff2b2b" />
        </mesh>
      )}
    </group>
  );
}

export default function SpikePage() {
  const [pick, setPick] = useState<Pick | null>(null);

  return (
    <div className="relative h-screen w-screen bg-black">
      <Canvas camera={{ position: [0, 0, 3], fov: 45 }}>
        <ambientLight intensity={2.2} />
        <directionalLight position={[0, 1, 4]} intensity={1} />
        <Globe onPick={setPick} />
        <OrbitControls enablePan={false} minDistance={1.5} maxDistance={6} />
      </Canvas>

      <div className="pointer-events-none absolute left-4 top-4 font-mono text-xs text-zinc-300">
        <div className="text-zinc-500">PHASE-0 RAYCAST SPIKE</div>
        <div className="mt-1 text-zinc-400">click the globe — pin should land on that exact place</div>
      </div>

      <div className="absolute bottom-4 left-4 font-mono text-sm text-emerald-400">
        {pick ? (
          <>
            <div>{formatLatLon(pick.latDeg, pick.lonDeg)}</div>
            <div className="mt-1 text-[11px] text-zinc-500">
              local ({pick.local.x.toFixed(3)}, {pick.local.y.toFixed(3)},{' '}
              {pick.local.z.toFixed(3)})
            </div>
          </>
        ) : (
          <span className="text-zinc-600">[ NO SELECTION ]</span>
        )}
      </div>
    </div>
  );
}
