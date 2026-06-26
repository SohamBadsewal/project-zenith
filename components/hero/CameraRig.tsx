'use client';

import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { useZenith } from '@/store/useZenith';

const IDLE_POS: [number, number, number] = [0, 4.5, 22];
const POPPED_POS: [number, number, number] = [12, 14, 18];
const LOOK_TARGET = new THREE.Vector3(0, 2, 0);
const MAGNIFY_DURATION = 2.5;

export function CameraRig() {
  const { camera } = useThree();
  const lookAt = useRef(new THREE.Vector3(0, 2, 0));
  const launch = useZenith((s) => s.launch);
  const tension = useZenith((s) => s.tension);
  const launchedAt = useZenith((s) => s.launchedAt);
  const prev = useRef<string>('idle');

  useEffect(() => {
    camera.position.set(...IDLE_POS);
    camera.lookAt(LOOK_TARGET);
  }, [camera]);

  useEffect(() => {
    if (launch === 'magnifying' && prev.current === 'idle') {
      gsap.killTweensOf(camera.position);
      gsap.killTweensOf(lookAt.current);
      gsap.to(camera.position, { x: POPPED_POS[0], y: POPPED_POS[1], z: POPPED_POS[2], duration: MAGNIFY_DURATION, ease: 'power3.inOut' });
      gsap.to(lookAt.current, { x: 0, y: 4, z: 0, duration: MAGNIFY_DURATION * 0.85, ease: 'power2.inOut' });
    }
    prev.current = launch;
  }, [launch, camera]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (launch === 'idle') {
      camera.position.x = IDLE_POS[0] + Math.sin(t * 0.15) * 0.3;
      camera.position.y = IDLE_POS[1] + Math.sin(t * 0.2) * 0.15;
    } else if (launch === 'dragging') {
      const j = tension;
      camera.position.x = POPPED_POS[0] + Math.sin(t * 55) * j * 0.045;
      camera.position.y = POPPED_POS[1] + Math.cos(t * 42) * j * 0.03;
      lookAt.current.x = Math.cos(t * 38) * j * 0.04;
      lookAt.current.y = 4 + Math.sin(t * 60) * j * 0.02;
    } else if (launch === 'launched') {
      const e = (performance.now() - launchedAt) / 1000;
      const decay = Math.max(0, 1 - e / 2.5);
      camera.position.x = POPPED_POS[0] + Math.sin(t * 70) * 0.04 * decay;
      camera.position.y = POPPED_POS[1] + Math.sin(t * 50) * 0.02 * decay;
      lookAt.current.y = THREE.MathUtils.lerp(lookAt.current.y, 4 + e * 25, 0.04);
    }
    camera.lookAt(lookAt.current);
  });

  return null;
}
