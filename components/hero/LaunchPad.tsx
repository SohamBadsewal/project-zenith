'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useZenith } from '@/store/useZenith';

function PlatformLight({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.PointLight>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.intensity = 1.2 + Math.sin(t * 2 + position[0] * 3) * 0.3;
  });
  return <pointLight ref={ref} position={position} color="#fff8e0" intensity={1.2} distance={4} decay={2} />;
}

export function LaunchPad() {
  const ref = useRef<THREE.Group>(null);

  const edgeGlowMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        uniforms: {
          uTime: { value: 0 },
          uIntensity: { value: 0 },
          uColor: { value: new THREE.Color('#4a9eff') },
        },
        vertexShader: `
          varying vec2 vUv;
          void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
        `,
        fragmentShader: `
          uniform float uTime; uniform float uIntensity; uniform vec3 uColor; varying vec2 vUv;
          void main() {
            float d = length(vUv - 0.5) * 2.0;
            float ring = smoothstep(0.95, 0.7, d) * smoothstep(0.3, 0.5, d);
            float pulse = 0.6 + 0.4 * sin(uTime * 2.0);
            gl_FragColor = vec4(uColor, ring * uIntensity * pulse * 0.8);
          }
        `,
      }),
    [],
  );

  useFrame((state) => {
    if (!ref.current) return;
    const launch = useZenith.getState().launch;
    const visible = launch !== 'idle';
    ref.current.visible = visible;
    if (!visible) return;
    edgeGlowMat.uniforms.uTime.value = state.clock.elapsedTime;
    const tension = useZenith.getState().tension;
    let target = 0.4;
    if (launch === 'dragging') target = 0.6 + tension * 0.4;
    else if (launch === 'launched') target = 1.0;
    edgeGlowMat.uniforms.uIntensity.value = THREE.MathUtils.lerp(edgeGlowMat.uniforms.uIntensity.value, target, 0.08);
  });

  return (
    <group ref={ref} position={[0, -3.05, 0]} visible={false}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <boxGeometry args={[8, 8, 0.3]} />
        <meshStandardMaterial color="#d0d0d0" metalness={0.4} roughness={0.55} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.16]}>
        <boxGeometry args={[8.4, 8.4, 0.12]} />
        <meshStandardMaterial color="#e0e0e0" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.23]} material={edgeGlowMat}>
        <ringGeometry args={[3.2, 4.2, 48]} />
      </mesh>
      <PlatformLight position={[3.2, 0.3, 3.2]} />
      <PlatformLight position={[-3.2, 0.3, 3.2]} />
      <PlatformLight position={[3.2, 0.3, -3.2]} />
      <PlatformLight position={[-3.2, 0.3, -3.2]} />
    </group>
  );
}
