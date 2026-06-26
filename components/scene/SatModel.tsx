'use client';

import { useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';

const PANEL = '#16306b';
const BODY = '#d4d8de';
const TRUSS = '#9aa0a6';
const GOLD = '#caa24a';

export function SatModel({
  iss,
  onClick,
}: {
  iss: boolean;
  onClick: (e: ThreeEvent<MouseEvent>) => void;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.45;
  });
  return (
    <group ref={ref} scale={iss ? 0.85 : 0.5} onClick={onClick}>
      {iss ? <IssBody /> : <GenericSat />}
    </group>
  );
}

function IssBody() {
  const wings: [number, number][] = [
    [-0.78, -0.34],
    [-0.78, 0.34],
    [0.78, -0.34],
    [0.78, 0.34],
  ];
  return (
    <group>
      <mesh>
        <boxGeometry args={[1.9, 0.05, 0.05]} />
        <meshStandardMaterial color={TRUSS} metalness={0.7} roughness={0.35} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.13, 0.13, 0.78, 14]} />
        <meshStandardMaterial color={BODY} metalness={0.35} roughness={0.55} />
      </mesh>
      <mesh position={[0.26, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.5, 14]} />
        <meshStandardMaterial color={BODY} metalness={0.35} roughness={0.55} />
      </mesh>
      <mesh position={[-0.26, 0.18, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.36, 12]} />
        <meshStandardMaterial color={GOLD} metalness={0.6} roughness={0.4} />
      </mesh>
      {wings.map(([x, z]) => (
        <group key={`${x}-${z}`} position={[x, 0, z]}>
          <mesh>
            <boxGeometry args={[0.62, 0.01, 0.3]} />
            <meshStandardMaterial
              color={PANEL}
              metalness={0.5}
              roughness={0.25}
              emissive={PANEL}
              emissiveIntensity={0.25}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function GenericSat() {
  return (
    <group>
      <mesh>
        <boxGeometry args={[0.34, 0.34, 0.46]} />
        <meshStandardMaterial color={BODY} metalness={0.45} roughness={0.5} />
      </mesh>
      {[-0.5, 0.5].map((x) => (
        <mesh key={x} position={[x, 0, 0]}>
          <boxGeometry args={[0.55, 0.01, 0.32]} />
          <meshStandardMaterial
            color={PANEL}
            metalness={0.5}
            roughness={0.25}
            emissive={PANEL}
            emissiveIntensity={0.2}
          />
        </mesh>
      ))}
    </group>
  );
}
