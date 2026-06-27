'use client';

import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useZenith, type Phase } from '@/store/useZenith';

const GLOBE_POS = new THREE.Vector3(0, 0, 3);
const GLOBE_FAR = new THREE.Vector3(0, 0.35, 9); // arrival start — Earth small, far in space
const DESCENT_POS = new THREE.Vector3(0, 0, 1.45);
const SKY_POS = new THREE.Vector3(0, 0, 0.1);
const ORIGIN = new THREE.Vector3(0, 0, 0);
const GLOBE_FOV = 45;
const GLOBE_ARRIVE_FOV = 38; // slightly tele at distance; widens as we approach
const DESCENT_FOV = 60;
const SKY_FOV = 70;
const ARRIVE_MS = 2200;

export function TransitionRig({ phase, tRef }: { phase: Phase; tRef: { current: number } }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const start = useRef({ pos: new THREE.Vector3(), fov: GLOBE_FOV });
  const arrive = useRef({ t0: 0, active: false });
  const globeIntro = useZenith((s) => s.globeIntro);
  const finishGlobeIntro = useZenith((s) => s.finishGlobeIntro);

  useEffect(() => {
    if (phase === 'launch' || phase === 'warp') return;
    if (phase === 'descent') {
      start.current.pos.copy(camera.position);
      start.current.fov = camera.fov;
      return;
    }
    if (phase === 'sky') {
      camera.position.copy(SKY_POS);
      camera.fov = SKY_FOV;
    } else if (phase === 'globe' && globeIntro) {
      // Cinematic arrival: ease down out of space toward the Earth.
      camera.position.copy(GLOBE_FAR);
      camera.fov = GLOBE_ARRIVE_FOV;
      arrive.current.t0 = performance.now();
      arrive.current.active = true;
    } else {
      camera.position.copy(GLOBE_POS);
      camera.fov = GLOBE_FOV;
    }
    camera.lookAt(ORIGIN);
    camera.updateProjectionMatrix();
  }, [phase, camera, globeIntro]);

  useFrame(() => {
    if (phase === 'descent') {
      const t = THREE.MathUtils.clamp(tRef.current, 0, 1);
      camera.position.lerpVectors(start.current.pos, DESCENT_POS, t);
      camera.fov = THREE.MathUtils.lerp(start.current.fov, DESCENT_FOV, t);
      camera.lookAt(ORIGIN);
      camera.updateProjectionMatrix();
      return;
    }
    if (phase === 'globe' && arrive.current.active) {
      const raw = THREE.MathUtils.clamp((performance.now() - arrive.current.t0) / ARRIVE_MS, 0, 1);
      const e = 1 - Math.pow(1 - raw, 3); // ease-out cubic: rushes in, settles softly
      camera.position.lerpVectors(GLOBE_FAR, GLOBE_POS, e);
      camera.fov = THREE.MathUtils.lerp(GLOBE_ARRIVE_FOV, GLOBE_FOV, e);
      camera.lookAt(ORIGIN);
      camera.updateProjectionMatrix();
      if (raw >= 1) {
        arrive.current.active = false;
        finishGlobeIntro();
      }
    }
  });

  return null;
}
