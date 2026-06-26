'use client';

import { Stars, Sparkles } from '@react-three/drei';

export function EnvironmentRig() {
  return (
    <>
      <ambientLight intensity={0.18} color="#8ea8cc" />
      <directionalLight
        position={[20, 35, 15]}
        intensity={3.8}
        color="#fff6e8"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={1}
        shadow-camera-far={120}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
      />
      <directionalLight position={[-14, 6, -10]} intensity={0.4} color="#7a9bff" />
      <hemisphereLight intensity={0.15} groundColor="#0a0d18" color="#1a2444" />
      <Stars radius={220} depth={80} count={8000} factor={4.5} saturation={0} fade speed={0.5} />
      <Sparkles count={150} scale={[70, 70, 70]} size={2.2} speed={0.15} color="#cfe0ff" opacity={0.45} />
    </>
  );
}
