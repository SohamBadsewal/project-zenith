'use client';

import { Suspense, Component, useRef, type ReactNode } from 'react';
import { useTexture } from '@react-three/drei';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { CelestialObject } from '@/types';

const TEX: Record<string, string> = {
  'planet:mars': '/textures/planets/mars.jpg',
  'planet:jupiter': '/textures/planets/jupiter.jpg',
  'planet:saturn': '/textures/planets/saturn.jpg',
  'planet:mercury': '/textures/planets/mercury.jpg',
  'planet:venus': '/textures/planets/venus.jpg',
  'planet:uranus': '/textures/planets/uranus.jpg',
  'planet:neptune': '/textures/planets/neptune.jpg',
  moon: '/textures/planets/moon.jpg',
};

const COLOR: Record<string, string> = {
  'planet:mars': '#c1440e',
  'planet:jupiter': '#d8ca9d',
  'planet:saturn': '#e3dab0',
  'planet:mercury': '#9c8d83',
  'planet:venus': '#e6c073',
  'planet:uranus': '#aee3e8',
  'planet:neptune': '#3e66cc',
  moon: '#cfcfcf',
  sun: '#ffd27f',
};

const RADIUS: Record<string, number> = { sun: 0.22, moon: 0.18 };
const _v = new THREE.Vector3();

class AssetBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function TexturedSphere({ url, radius }: { url: string; radius: number }) {
  const map = useTexture(url);
  return (
    <mesh>
      <sphereGeometry args={[radius, 48, 48]} />
      <meshStandardMaterial map={map} roughness={1} metalness={0} />
    </mesh>
  );
}

function PlainSphere({ radius, color, emissive }: { radius: number; color: string; emissive?: boolean }) {
  return (
    <mesh>
      <sphereGeometry args={[radius, 32, 32]} />
      <meshStandardMaterial
        color={color}
        roughness={0.9}
        metalness={0}
        emissive={emissive ? color : '#000000'}
        emissiveIntensity={emissive ? 1.1 : 0}
      />
    </mesh>
  );
}

function SaturnRing({ radius }: { radius: number }) {
  return (
    <mesh rotation={[-1.15, 0.18, 0]}>
      <ringGeometry args={[radius * 1.35, radius * 2.3, 64]} />
      <meshStandardMaterial color="#cdbb88" side={THREE.DoubleSide} transparent opacity={0.75} roughness={0.8} />
    </mesh>
  );
}

export function PlanetModel({
  body,
  focused,
  selected,
  onClick,
}: {
  body: CelestialObject;
  focused: boolean;
  selected: boolean;
  onClick: (e: ThreeEvent<MouseEvent>) => void;
}) {
  const ref = useRef<THREE.Group>(null);
  const radius = RADIUS[body.kind === 'sun' ? 'sun' : body.kind === 'moon' ? 'moon' : body.id] ?? 0.13;
  const url = TEX[body.id];
  const color = COLOR[body.id] ?? COLOR[body.kind] ?? '#cccccc';
  const isSun = body.kind === 'sun';
  const fallback = <PlainSphere radius={radius} color={color} emissive={isSun} />;

  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    g.rotation.y += dt * 0.12;
    const t = focused ? 2.1 : selected ? 1.6 : 1;
    g.scale.lerp(_v.setScalar(t), 0.18);
  });

  return (
    <group ref={ref} onClick={onClick}>
      {isSun || !url ? (
        fallback
      ) : (
        <AssetBoundary fallback={fallback}>
          <Suspense fallback={fallback}>
            <TexturedSphere url={url} radius={radius} />
          </Suspense>
        </AssetBoundary>
      )}
      {body.id === 'planet:saturn' && <SaturnRing radius={radius} />}
    </group>
  );
}
