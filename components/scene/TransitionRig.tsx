'use client';

import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Phase } from '@/store/useZenith';

const GLOBE_POS = new THREE.Vector3(0, 0, 3);
const DESCENT_POS = new THREE.Vector3(0, 0, 1.45);
const SKY_POS = new THREE.Vector3(0, 0, 0.1);
const ORIGIN = new THREE.Vector3(0, 0, 0);
const GLOBE_FOV = 45;
const DESCENT_FOV = 60;
const SKY_FOV = 70;

export function TransitionRig({ phase, tRef }: { phase: Phase; tRef: { current: number } }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const start = useRef({ pos: new THREE.Vector3(), fov: GLOBE_FOV });

  useEffect(() => {
    if (phase === 'descent') {
      start.current.pos.copy(camera.position);
      start.current.fov = camera.fov;
      return;
    }
    if (phase === 'sky') {
      camera.position.copy(SKY_POS);
      camera.fov = SKY_FOV;
    } else {
      camera.position.copy(GLOBE_POS);
      camera.fov = GLOBE_FOV;
    }
    camera.lookAt(ORIGIN);
    camera.updateProjectionMatrix();
  }, [phase, camera]);

  useFrame(() => {
    if (phase !== 'descent') return;
    const t = THREE.MathUtils.clamp(tRef.current, 0, 1);
    camera.position.lerpVectors(start.current.pos, DESCENT_POS, t);
    camera.fov = THREE.MathUtils.lerp(start.current.fov, DESCENT_FOV, t);
    camera.lookAt(ORIGIN);
    camera.updateProjectionMatrix();
  });

  return null;
}
