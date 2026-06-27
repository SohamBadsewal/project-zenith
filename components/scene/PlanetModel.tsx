'use client';

import { Suspense, Component, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useTexture, Billboard } from '@react-three/drei';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { CelestialObject } from '@/types';
import { sunSurfaceTexture, sunGlowTexture } from '@/lib/sunTexture';

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

function TexturedSphere({ url, radius, color }: { url: string; radius: number; color: string }) {
  const map = useTexture(url);
  const { gl } = useThree();

  useEffect(() => {
    if (map) {
      map.anisotropy = Math.min(gl.capabilities.getMaxAnisotropy(), 16);
      map.minFilter = THREE.LinearMipmapLinearFilter;
      map.magFilter = THREE.LinearFilter;
      map.needsUpdate = true;
    }
  }, [map, gl]);

  return (
    <mesh>
      <sphereGeometry args={[radius, 48, 48]} />
      <meshStandardMaterial
        map={map}
        roughness={0.4}
        metalness={0.1}
        emissive={color}
        emissiveIntensity={0.18}
      />
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

/** High-quality procedural Sun: granulated photosphere (emissive, so it blooms)
 *  wrapped in a soft additive corona that always faces the camera. */
function SunSphere({ radius }: { radius: number }) {
  const surface = useMemo(() => sunSurfaceTexture(), []);
  const glow = useMemo(() => sunGlowTexture(), []);
  const surfRef = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (surfRef.current) surfRef.current.rotation.y += dt * 0.04;
  });
  return (
    <group>
      <mesh ref={surfRef}>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshStandardMaterial
          map={surface}
          emissive={'#ffffff'}
          emissiveMap={surface}
          emissiveIntensity={1.5}
          toneMapped={false}
          roughness={1}
          metalness={0}
        />
      </mesh>
      <Billboard>
        <sprite scale={[radius * 6, radius * 6, 1]}>
          <spriteMaterial
            map={glow}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            opacity={0.9}
          />
        </sprite>
      </Billboard>
    </group>
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
  const radius = RADIUS[body.kind === 'sun' ? 'sun' : body.kind === 'moon' ? 'moon' : body.id] ?? 0.12;
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
      {isSun ? (
        <AssetBoundary fallback={fallback}>
          <SunSphere radius={radius} />
        </AssetBoundary>
      ) : !url ? (
        fallback
      ) : (
        <AssetBoundary fallback={fallback}>
          <Suspense fallback={fallback}>
            <TexturedSphere url={url} radius={radius} color={color} />
          </Suspense>
        </AssetBoundary>
      )}
      {body.id === 'planet:saturn' && <SaturnRing radius={radius} />}
    </group>
  );
}
