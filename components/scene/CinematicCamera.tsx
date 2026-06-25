'use client';

import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { revealSheet, revealReady, subscribeProgress, startStudio } from '@/lib/cinematic/theatre';

const SEQ_LENGTH = 3; // seconds — matches revealState.json
const SAFETY_MS = 4200; // force-finish guard if the sequence never resolves

// Fly-in keyframes: start well outside the celestial sphere (radius 5) looking
// in, end at the centre exactly where the interactive sky camera lives.
const START_DIST = 14;
const END_DIST = 0.1;
const START_Y = 2.6;
const START_FOV = 52;
const END_FOV = 70;

/**
 * Plays the Theatre reveal while `active`, dollying the camera from outside the
 * sphere to its centre, then calls `onDone` so the parent can hand control to
 * OrbitControls. Pure read of the Theatre-animated `progress` scalar each frame.
 */
export function CinematicCamera({ active, onDone }: { active: boolean; onDone: () => void }) {
  const camera = useThree((s) => s.camera);
  const finished = useRef(false);
  const progress = useRef(0);

  useEffect(() => {
    if (!active) return;
    finished.current = false;
    progress.current = 0;
    let cancelled = false;

    startStudio();
    const unsubscribe = subscribeProgress((p) => {
      progress.current = p;
    });
    const finish = () => {
      if (cancelled || finished.current) return;
      finished.current = true;
      onDone();
    };
    const safety = setTimeout(finish, SAFETY_MS);

    revealReady.then(() => {
      if (cancelled) return;
      const seq = revealSheet.sequence;
      seq.position = 0;
      seq.play({ range: [0, SEQ_LENGTH], rate: 1 }).then(finish);
    });

    return () => {
      cancelled = true;
      clearTimeout(safety);
      unsubscribe();
      try {
        revealSheet.sequence.pause();
      } catch {
        /* sequence may not be initialised yet */
      }
    };
  }, [active, onDone]);

  useFrame(() => {
    if (!active || finished.current) return;
    const p = THREE.MathUtils.clamp(progress.current, 0, 1);
    const dist = THREE.MathUtils.lerp(START_DIST, END_DIST, p);
    const y = THREE.MathUtils.lerp(START_Y, 0, p);
    camera.position.set(0, y, dist);
    camera.lookAt(0, 0, 0);
    const persp = camera as THREE.PerspectiveCamera;
    persp.fov = THREE.MathUtils.lerp(START_FOV, END_FOV, p);
    persp.updateProjectionMatrix();
  });

  return null;
}
