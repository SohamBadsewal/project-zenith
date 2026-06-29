'use client';

import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { pickLocation, latLonToUnitVector } from '@/lib/geo';
import { useZenith } from '@/store/useZenith';

const GLOBE_RADIUS = 1;

// Classic Fresnel atmosphere rim (spectacle layer — glow is allowed here).
const atmosphereVertex = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const atmosphereFragment = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    float intensity = pow(0.62 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.4);
    gl_FragColor = vec4(0.32, 0.6, 1.0, 1.0) * intensity;
  }
`;

export function Globe() {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const autoRotate = useRef(true);

  const pending = useZenith((s) => s.pending);
  const observer = useZenith((s) => s.observer);
  const compareObserver = useZenith((s) => s.compareObserver);
  const pick = useZenith((s) => s.pickLocation);

  const dayMap = useTexture('/textures/earth_day.jpg', (t) => {
    (t as THREE.Texture).colorSpace = THREE.SRGBColorSpace;
  });

  const atmosphereMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: atmosphereVertex,
        fragmentShader: atmosphereFragment,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
      }),
    [],
  );

  const camera = useThree((s) => s.camera);

  useEffect(() => {
    if (!pending || pending.source !== 'search') return;
    const g = groupRef.current;
    if (!g) return;
    autoRotate.current = false;
    const v = latLonToUnitVector(pending.latDeg, pending.lonDeg);
    const localDir = new THREE.Vector3(v.x, v.y, v.z).normalize();
    const camDir = camera.position.clone().normalize();
    const from = g.quaternion.clone();
    const to = new THREE.Quaternion().setFromUnitVectors(localDir, camDir);
    const proxy = { t: 0 };
    const tween = gsap.to(proxy, {
      t: 1,
      duration: 1.5,
      ease: 'power3.inOut',
      onUpdate: () => g.quaternion.slerpQuaternions(from, to, proxy.t),
    });
    return () => {
      tween.kill();
    };
  }, [pending, camera]);

  useFrame((_, delta) => {
    if (autoRotate.current && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.06;
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const mesh = meshRef.current;
    if (!mesh) return;
    const local = e.point.clone().applyMatrix4(mesh.matrixWorld.clone().invert());
    const { latDeg, lonDeg } = pickLocation(local);
    pick({ latDeg, lonDeg, elevationM: 0, source: 'globe' });
  };

  const pinA = useMemo(() => {
    if (!observer) return null;
    const v = latLonToUnitVector(observer.latDeg, observer.lonDeg);
    return new THREE.Vector3(v.x, v.y, v.z);
  }, [observer]);

  const pinB = useMemo(() => {
    if (!compareObserver) return null;
    const v = latLonToUnitVector(compareObserver.latDeg, compareObserver.lonDeg);
    return new THREE.Vector3(v.x, v.y, v.z);
  }, [compareObserver]);

  const pinPending = useMemo(() => {
    if (!pending) return null;
    const v = latLonToUnitVector(pending.latDeg, pending.lonDeg);
    return new THREE.Vector3(v.x, v.y, v.z);
  }, [pending]);

  return (
    <group ref={groupRef}>
      <mesh
        ref={meshRef}
        onPointerDown={() => {
          autoRotate.current = false;
        }}
        onClick={handleClick}
      >
        <sphereGeometry args={[GLOBE_RADIUS, 96, 96]} />
        <meshStandardMaterial map={dayMap} metalness={0.05} roughness={0.95} />
      </mesh>

      {/* atmosphere shell */}
      <mesh scale={1.018} material={atmosphereMaterial}>
        <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
      </mesh>

      {pinA && <Pin pos={pinA} color="#4a9eff" />}
      {pinB && <Pin pos={pinB} color="#10b981" />}
      {pinPending && <Pin pos={pinPending} color="#d71921" />}
    </group>
  );
}

function Pin({ pos, color }: { pos: THREE.Vector3; color: string }) {
  return (
    <group position={pos.clone().multiplyScalar(1.001)}>
      <mesh position={pos.clone().multiplyScalar(0.03)}>
        <sphereGeometry args={[0.025, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {/* thin stalk */}
      <mesh
        position={pos.clone().multiplyScalar(0.015)}
        quaternion={new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          pos.clone().normalize(),
        )}
      >
        <cylinderGeometry args={[0.002, 0.002, 0.06, 6]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
}
