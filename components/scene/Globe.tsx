'use client';

import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
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

  // Pin reflects the confirmed observer, else the pending pick.
  const marked = observer ?? pending;
  const pinPos = useMemo(() => {
    if (!marked) return null;
    const v = latLonToUnitVector(marked.latDeg, marked.lonDeg);
    return new THREE.Vector3(v.x, v.y, v.z);
  }, [marked]);

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

      {pinPos && (
        <group position={pinPos.clone().multiplyScalar(1.001)}>
          <mesh position={pinPos.clone().multiplyScalar(0.03)}>
            <sphereGeometry args={[0.02, 16, 16]} />
            <meshBasicMaterial color="#d71921" />
          </mesh>
          {/* thin stalk */}
          <mesh
            position={pinPos.clone().multiplyScalar(0.015)}
            quaternion={new THREE.Quaternion().setFromUnitVectors(
              new THREE.Vector3(0, 1, 0),
              pinPos.clone().normalize(),
            )}
          >
            <cylinderGeometry args={[0.002, 0.002, 0.06, 6]} />
            <meshBasicMaterial color="#d71921" />
          </mesh>
        </group>
      )}
    </group>
  );
}
