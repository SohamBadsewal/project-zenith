'use client';

import { Suspense, useMemo, useRef, Component, type ReactNode } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';

const PANEL = '#16306b';
const BODY = '#d4d8de';
const TRUSS = '#9aa0a6';
const GOLD = '#caa24a';

class GltfBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function GltfModel({ url }: { url: string }) {
  const { scene } = useGLTF(url, '/draco/');
  const obj = useMemo(() => {
    const c = scene.clone(true);
    const box = new THREE.Box3().setFromObject(c);
    const size = box.getSize(new THREE.Vector3());
    const max = Math.max(size.x, size.y, size.z) || 1;
    c.scale.multiplyScalar(2 / max);
    box.setFromObject(c);
    c.position.sub(box.getCenter(new THREE.Vector3()));
    return c;
  }, [scene]);
  return <primitive object={obj} />;
}

const _v = new THREE.Vector3();

export function SatModel({
  iss,
  glbUrl,
  selected = false,
  onClick,
  onDoubleClick,
}: {
  iss: boolean;
  glbUrl?: string;
  selected?: boolean;
  onClick: (e: ThreeEvent<MouseEvent>) => void;
  onDoubleClick?: (e: ThreeEvent<MouseEvent>) => void;
}) {
  const ref = useRef<THREE.Group>(null);
  // The GLB is normalised to ~2 units; these factors keep the whole craft a
  // readable size in the dome and let it grow when you settle on it.
  const base = glbUrl ? 0.32 : 0.42;
  const target = selected ? base * 1.8 : base;
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    g.rotation.y += dt * (selected ? 0.3 : 0.5); // always rotating; calmer when inspected
    g.scale.lerp(_v.setScalar(target), 0.12);
  });
  const proc = iss ? <IssBody /> : <GenericSat />;
  return (
    <group ref={ref} scale={base} onClick={onClick} onDoubleClick={onDoubleClick}>
      {glbUrl ? (
        <GltfBoundary fallback={proc}>
          <Suspense fallback={proc}>
            <GltfModel url={glbUrl} />
          </Suspense>
        </GltfBoundary>
      ) : (
        proc
      )}
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
        <mesh key={`${x}-${z}`} position={[x, 0, z]}>
          <boxGeometry args={[0.62, 0.01, 0.3]} />
          <meshStandardMaterial
            color={PANEL}
            metalness={0.5}
            roughness={0.25}
            emissive={PANEL}
            emissiveIntensity={0.25}
          />
        </mesh>
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
