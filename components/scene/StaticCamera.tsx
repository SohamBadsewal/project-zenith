'use client';

import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { altAzToVec3 } from '@/lib/dome';

export function StaticCamera() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useEffect(() => {
    camera.position.set(0, 0, 0);
    const [x, y, z] = altAzToVec3(45, 180, 5);
    camera.lookAt(x, y, z);
    camera.fov = 55;
    camera.updateProjectionMatrix();
  }, [camera]);
  return null;
}
