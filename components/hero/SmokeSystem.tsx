'use client';

import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useZenith } from '@/store/useZenith';
import { smokeVertex, smokeFragment } from './smoke';

const COUNT = 1400;

function makeSprite() {
  const s = 64;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.35, 'rgba(255,255,255,0.75)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, s, s);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

export function SmokeSystem({ position = [0, -0.5, 0] }: { position?: [number, number, number] }) {
  const { gl } = useThree();
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const sprite = useMemo(makeSprite, []);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(COUNT * 3);
    const seed = new Float32Array(COUNT);
    const speed = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      seed[i] = Math.random();
      speed[i] = Math.random();
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    g.setAttribute('aSpeed', new THREE.BufferAttribute(speed, 1));
    return g;
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uTension: { value: 0 },
      uBurst: { value: 0 },
      uSize: { value: 7.0 },
      uPixelRatio: { value: Math.min(gl.getPixelRatio(), 2) },
      uSprite: { value: sprite },
      uHot: { value: new THREE.Color('#ffd27a') },
      uCold: { value: new THREE.Color('#6a6f7a') },
    }),
    [sprite, gl],
  );

  const burstRef = useRef(0);

  useFrame((_, dt) => {
    const launch = useZenith.getState().launch;
    const tension = useZenith.getState().tension;
    uniforms.uTime.value += dt;
    let target = 0;
    if (launch === 'armed') target = 0.05;
    else if (launch === 'dragging') target = 0.12 + tension * 0.55;
    else if (launch === 'launched') target = 1.0;
    burstRef.current = THREE.MathUtils.lerp(burstRef.current, target, dt * (launch === 'launched' ? 4 : 3));
    uniforms.uTension.value = tension;
    uniforms.uBurst.value = burstRef.current;
  });

  return (
    <points position={position} geometry={geo} frustumCulled={false}>
      <shaderMaterial
        ref={matRef}
        vertexShader={smokeVertex}
        fragmentShader={smokeFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.NormalBlending}
      />
    </points>
  );
}
